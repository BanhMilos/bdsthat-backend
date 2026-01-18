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

export async function login(email: string, password: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email } });
  console.log('Login attempt for:', email);
  console.log('User found:', !!user);
  console.log('User ID:', user?.userId);
  console.log('Has passwordHash:', !!user?.passwordHash);
  console.log('Password hash (first 30 chars):', user?.passwordHash?.substring(0, 30));
  
  if (!user) throw new AppError('Invalid credentials', 401);

  const match = await bcrypt.compare(password, user.passwordHash);
  console.log('Password match:', match);
  
  if (!match) throw new AppError('Invalid credentials', 401);

  console.log('About to create JWT token...');
  const token = jwt.sign({ sub: user.userId.toString(), email: user.email }, jwtSecret, { expiresIn: '1h' });
  console.log('JWT token created successfully');
  return token;
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
