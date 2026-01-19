import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { addMinutes, addHours } from 'date-fns';
import prisma from '../utils/prisma';
import { generateOtp, hashOtp, verifyOtp as verifyOtpHash } from '../utils/otp';
import { generateVerificationToken } from '../utils/token';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer';
import { AppError } from '../middleware/errorHandler';

const jwtSecret = process.env.JWT_SECRET || 'change-me';
const otpExpiryMinutes = process.env.OTP_EXP_MINUTES
  ? Number(process.env.OTP_EXP_MINUTES)
  : 10;

export async function register(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = generateVerificationToken();
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const otpExpiresAt = addMinutes(new Date(), otpExpiryMinutes);

  const user = await prisma.user.create({
    data: { 
      email, 
      passwordHash, 
      token: verificationToken, 
      expirationDate: otpExpiresAt,
      resetPasswordOTP: otpHash,
      resetPasswordOTPExpirationDate: otpExpiresAt,
    },
  });

  const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${verificationToken}`;
  sendVerificationEmail({ to: user.email, verificationLink, otpCode: otp }).catch(() => {
    // Email delivery is non-blocking; log silently in production
  });
}

export async function verifyEmailByToken(token: string) {
  const user = await prisma.user.findFirst({ where: { token } });
  if (!user) throw new AppError('Invalid token', 400);

  await prisma.user.update({
    where: { userId: user.userId },
    data: { token: null, expirationDate: null },
  });
}

export async function verifyEmailByOtp(email: string, otp: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.resetPasswordOTP) throw new AppError('Invalid OTP', 400);
  if (user.resetPasswordOTPExpirationDate && user.resetPasswordOTPExpirationDate < new Date()) {
    throw new AppError('OTP expired', 400);
  }

  const valid = await verifyOtpHash(otp, user.resetPasswordOTP);
  if (!valid) throw new AppError('Invalid OTP', 400);

  await prisma.user.update({
    where: { userId: user.userId },
    data: { token: null, expirationDate: null, resetPasswordOTP: null, resetPasswordOTPExpirationDate: null },
  });
}

export async function login(email?: string, phone?: string, password?: string) {
  if (!email && !phone) {
    throw new AppError('Email or phone is required', 400);
  }

  if (!password) {
    throw new AppError('Password is required', 400);
  }

  const where: any = {};
  if (email) {
    where.email = email;
  } else if (phone) {
    where.phone = phone;
  }

  const user = await prisma.user.findFirst({ where });
  
  if (!user) throw new AppError('Invalid credentials', 401);

  const match = await bcrypt.compare(password, user.passwordHash);
  
  if (!match) throw new AppError('Invalid credentials', 401);

  // Generate JWT token
  const token = jwt.sign({ sub: user.userId.toString(), email: user.email }, jwtSecret, { expiresIn: '24h' });

  // Return user object with token
  return {
    userId: user.userId,
    email: user.email,
    fullname: user.fullname,
    avatar: user.avatar,
    phone: user.phone,
    address: user.address,
    token,
    resetPasswordOTP: user.resetPasswordOTP,
    resetPasswordOTPExpirationDate: user.resetPasswordOTPExpirationDate,
    expirationDate: user.expirationDate,
    idCardNumber: user.idCardNumber,
    idCardType: user.idCardType,
    idCardPlaceIfIssue: user.idCardPlaceIfIssue,
    idCardIssueDate: user.idCardIssueDate,
    primaryRole: user.primaryRole,
    status: user.status,
    ekycVerified: user.ekycVerified,
    lastActive: user.lastActive,
    agentCertificate: user.agentCertificate,
    agentStatus: user.agentStatus,
    idCardDocuments: user.idCardDocuments,
    balance: user.balance,
    lifetimeBalance: user.lifetimeBalance,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('User not found', 404);

  const resetToken = generateVerificationToken();
  const resetExpiresAt = addHours(new Date(), 1);

  await prisma.user.update({
    where: { userId: user.userId },
    data: { resetPasswordOTP: resetToken, resetPasswordOTPExpirationDate: resetExpiresAt },
  });

  const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
  sendPasswordResetEmail({ to: user.email, resetLink }).catch(() => {
    // Email delivery is non-blocking
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({ where: { resetPasswordOTP: token } });
  if (!user) throw new AppError('Invalid or expired reset token', 400);

  if (user.resetPasswordOTPExpirationDate && user.resetPasswordOTPExpirationDate < new Date()) {
    throw new AppError('Reset token expired', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { userId: user.userId },
    data: { passwordHash, resetPasswordOTP: null, resetPasswordOTPExpirationDate: null },
  });
}

export async function changePassword(email: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('User not found', 404);

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) throw new AppError('Current password is incorrect', 401);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { userId: user.userId },
    data: { passwordHash },
  });
}

export async function getUserProfile(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      email: true,
      phone: true,
      fullname: true,
      ekycVerified: true,
      primaryRole: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function updateUserProfile(userId: bigint, data: { fullname?: string; ekycVerified?: number }) {
  const user = await prisma.user.update({
    where: { userId },
    data,
    select: {
      userId: true,
      email: true,
      phone: true,
      fullname: true,
      ekycVerified: true,
      primaryRole: true,
      status: true,
    },
  });

  return user;
}

export async function logoutUser(userId: bigint) {
  // In a stateless JWT system, logout is typically handled client-side by removing the token
  // However, we can log the event or invalidate refresh tokens if needed
  // For now, we'll just verify the user exists
  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) throw new AppError('User not found', 404);
  
  return { message: 'Logged out successfully' };
}

export async function updateDevice(userId: bigint, deviceData: { platform: string; platformToken: string; uuid: string }) {
  // Check if device already exists
  const existingDevice = await prisma.device.findFirst({
    where: { userId, uuid: deviceData.uuid },
  });

  if (existingDevice) {
    // Update existing device
    const device = await prisma.device.update({
      where: { deviceId: existingDevice.deviceId },
      data: {
        platform: deviceData.platform,
        platformToken: deviceData.platformToken,
      },
    });
    return device;
  } else {
    // Create new device
    const device = await prisma.device.create({
      data: {
        userId,
        platform: deviceData.platform,
        platformToken: deviceData.platformToken,
        uuid: deviceData.uuid,
      },
    });
    return device;
  }
}

export async function searchUsers(filters: { primaryRole?: string; q?: string; page?: number; limit?: number }) {
  const { primaryRole, q, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    status: 'ACTIVE',
  };

  if (primaryRole) {
    where.primaryRole = primaryRole;
  }

  if (q) {
    where.OR = [
      { fullname: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        userId: true,
        email: true,
        phone: true,
        fullname: true,
        primaryRole: true,
        ekycVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}

export async function deleteUserAccount(userId: bigint, password: string) {
  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) throw new AppError('User not found', 404);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new AppError('Invalid password', 401);

  // Soft delete by updating status
  await prisma.user.update({
    where: { userId },
    data: { status: 'DELETED' },
  });

  return { message: 'Account deleted successfully' };
}

export async function requestPhoneUpdate(userId: bigint, phone: string) {
  // Check if phone is already in use
  const existingUser = await prisma.user.findFirst({ where: { phone } });
  if (existingUser && existingUser.userId !== userId) {
    throw new AppError('Phone number already in use', 409);
  }

  // Generate OTP for verification
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const otpExpiresAt = addMinutes(new Date(), otpExpiryMinutes);

  // Update user with pending phone change
  await prisma.user.update({
    where: { userId },
    data: {
      resetPasswordOTP: otpHash,
      resetPasswordOTPExpirationDate: otpExpiresAt,
    },
  });

  // TODO: Send OTP to new phone number via SMS
  // For now, return OTP in development mode
  return { message: 'OTP sent to phone number', otp: process.env.NODE_ENV === 'development' ? otp : undefined };
}

export async function requestEmailUpdate(userId: bigint, email: string) {
  // Check if email is already in use
  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (existingUser && existingUser.userId !== userId) {
    throw new AppError('Email already in use', 409);
  }

  // Generate OTP for verification
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const otpExpiresAt = addMinutes(new Date(), otpExpiryMinutes);

  // Update user with pending email change
  await prisma.user.update({
    where: { userId },
    data: {
      resetPasswordOTP: otpHash,
      resetPasswordOTPExpirationDate: otpExpiresAt,
    },
  });

  // Send OTP to new email
  sendVerificationEmail({ to: email, verificationLink: '', otpCode: otp }).catch(() => {
    // Email delivery is non-blocking
  });

  return { message: 'OTP sent to email address' };
}

export async function getWalletTransactions(userId: bigint, filters: { status?: string; from?: string; to?: string; page?: number; limit?: number }) {
  const { status, from, to, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = { userId };

  if (status) {
    where.status = status;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return { transactions, total, page, limit };
}

export async function resendOtp(contact: { phone?: string; email?: string }) {
  const { phone, email } = contact;
  
  if (!phone && !email) {
    throw new AppError('Phone or email is required', 400);
  }

  const where: any = {};
  if (phone) where.phone = phone;
  if (email) where.email = email;

  const user = await prisma.user.findFirst({ where });
  if (!user) throw new AppError('User not found', 404);

  // Generate new OTP
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const otpExpiresAt = addMinutes(new Date(), otpExpiryMinutes);

  await prisma.user.update({
    where: { userId: user.userId },
    data: {
      resetPasswordOTP: otpHash,
      resetPasswordOTPExpirationDate: otpExpiresAt,
    },
  });

  // Send OTP via email or SMS
  if (email) {
    sendVerificationEmail({ to: email, verificationLink: '', otpCode: otp }).catch(() => {});
  }
  // TODO: Send SMS if phone is provided

  return { message: 'OTP sent successfully', otp: process.env.NODE_ENV === 'development' ? otp : undefined };
}
