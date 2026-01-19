import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import {
  login,
  register,
  verifyEmailByOtp,
  verifyEmailByToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  updateDevice,
  searchUsers,
  deleteUserAccount,
  requestPhoneUpdate,
  requestEmailUpdate,
  getWalletTransactions,
  resendOtp,
} from '../services/authService';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
});

const verifyTokenSchema = z.object({ token: z.string().min(1, 'Token required') });

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const changePasswordSchema = z.object({
  email: z.string().email('Invalid email'),
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.parse(req.body);
    await register(parsed.email, parsed.password);
    res.status(201).json({ result: "success", message: 'Registration successful. Check your email to verify.' });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

export async function verifyTokenGetController(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.query.token as string;
    if (!token) throw new AppError('Token required', 400);
    await verifyEmailByToken(token);
    res.json({ result: "success", message: 'Email verified' });
  } catch (err) {
    next(err);
  }
}

export async function verifyTokenController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = verifyTokenSchema.parse(req.body);
    await verifyEmailByToken(parsed.token);
    res.json({ result: "success", message: 'Email verified' });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = verifyOtpSchema.parse(req.body);
    await verifyEmailByOtp(parsed.email, parsed.otp);
    res.json({ result: "success", message: 'Email verified' });
  } catch (err) {
    next(err);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.parse(req.body);
    const user = await login(parsed.email || undefined, parsed.phone || undefined, parsed.password);
    res.json({
      result: 'success',
      user,
    });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    if (err instanceof AppError) return next(err);
    return next(new AppError('Invalid credentials', 401));
  }
}

export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = forgotPasswordSchema.parse(req.body);
    await forgotPassword(parsed.email);
    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = resetPasswordSchema.parse(req.body);
    await resetPassword(parsed.token, parsed.password);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

export async function changePasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = changePasswordSchema.parse(req.body);
    await changePassword(parsed.email, parsed.currentPassword, parsed.newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

// GET /profile - Get user profile
export async function getProfileController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const user = await getUserProfile(req.userId);
    res.json({
      result: 'success',
      reason: 'Profile retrieved successfully',
      user,
    });
  } catch (err) {
    next(err);
  }
}

// POST /update-profile - Update user profile
const updateProfileSchema = z.object({
  fullname: z.string().optional(),
  ekycVerified: z.number().int().optional(),
});

export async function updateProfileController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const parsed = updateProfileSchema.parse(req.body);
    const user = await updateUserProfile(req.userId, parsed);
    
    res.json({
      result: 'success',
      reason: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

// POST /logout - Logout user
export async function logoutController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return next(new AppError('Unauthorized', 401));
    }

    await logoutUser(req.userId);
    res.json({
      result: 'success',
      reason: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

// POST /upload-certificate - Upload broker certificate
export async function uploadCertificateController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!req.file) {
      return next(new AppError('Certificate file is required', 400));
    }

    // TODO: Save certificate to user profile
    // For now, return success with file info
    res.json({
      result: 'success',
      reason: 'Certificate uploaded successfully',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /update-device - Update device information
const updateDeviceSchema = z.object({
  platform: z.string(),
  platformToken: z.string(),
  uuid: z.string(),
});

export async function updateDeviceController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const parsed = updateDeviceSchema.parse(req.body);
    const device = await updateDevice(req.userId, parsed);
    
    res.json({
      result: 'success',
      reason: 'Device updated successfully',
      device,
    });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

// GET /search - Search users/brokers
const searchSchema = z.object({
  primaryRole: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function searchUsersController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const parsed = searchSchema.parse(req.query);
    const result = await searchUsers(parsed);
    
    res.json({
      result: 'success',
      reason: 'Users retrieved successfully',
      users: result.users,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

// POST /delete-account - Delete user account
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export async function deleteAccountController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const parsed = deleteAccountSchema.parse(req.body);
    await deleteUserAccount(req.userId, parsed.password);
    
    res.json({
      result: 'success',
      reason: 'Account deleted successfully',
    });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

// POST /update-phone - Request phone update
const updatePhoneSchema = z.object({
  phone: z.string().min(1, 'Phone is required'),
});

export async function updatePhoneController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const parsed = updatePhoneSchema.parse(req.body);
    const result = await requestPhoneUpdate(req.userId, parsed.phone);
    
    res.json({
      result: 'success',
      reason: result.message,
      otp: result.otp,
    });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

// POST /update-email - Request email update
const updateEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function updateEmailController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const parsed = updateEmailSchema.parse(req.body);
    const result = await requestEmailUpdate(req.userId, parsed.email);
    
    res.json({
      result: 'success',
      reason: result.message,
    });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

// GET /wallet-transactions - Get wallet transaction history
const walletTransactionsSchema = z.object({
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function getWalletTransactionsController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return next(new AppError('Unauthorized', 401));
    }

    const parsed = walletTransactionsSchema.parse(req.query);
    const result = await getWalletTransactions(req.userId, parsed);
    
    res.json({
      result: 'success',
      reason: 'Wallet transactions retrieved successfully',
      transactions: result.transactions,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

// POST /resend-otp - Resend OTP
const resendOtpSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
}).refine(data => data.phone || data.email, {
  message: 'Either phone or email is required',
});

export async function resendOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = resendOtpSchema.parse(req.body);
    const result = await resendOtp(parsed);
    
    res.json({
      result: 'success',
      reason: result.message,
      otp: result.otp,
    });
  } catch (err) {
    if (err instanceof ZodError) return next(new AppError(err.errors[0].message, 400));
    next(err);
  }
}

