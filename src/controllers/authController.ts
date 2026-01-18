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
} from '../services/authService';
import { AppError } from '../middleware/errorHandler';

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const changePasswordSchema = z.object({
  email: z.string().email('Invalid email'),
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.parse(req.body);
    await register(parsed.email, parsed.password);
    res.status(201).json({ message: 'Registration successful. Check your email to verify.' });
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
    res.json({ message: 'Email verified' });
  } catch (err) {
    next(err);
  }
}

export async function verifyTokenController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = verifyTokenSchema.parse(req.body);
    await verifyEmailByToken(parsed.token);
    res.json({ message: 'Email verified' });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = verifyOtpSchema.parse(req.body);
    await verifyEmailByOtp(parsed.email, parsed.otp);
    res.json({ message: 'Email verified' });
  } catch (err) {
    next(err);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.parse(req.body);
    const token = await login(parsed.email, parsed.password);
    res.json({ token });
  } catch (err) {
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
