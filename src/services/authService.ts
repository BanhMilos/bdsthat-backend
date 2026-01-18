import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { addMinutes } from 'date-fns';
import prisma from '../utils/prisma';
import { generateOtp, hashOtp, verifyOtp as verifyOtpHash } from '../utils/otp';
import { generateVerificationToken } from '../utils/token';
import { sendVerificationEmail } from '../utils/mailer';
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
  const verificationOtp = await hashOtp(otp);
  const otpExpiresAt = addMinutes(new Date(), otpExpiryMinutes);

  const user = await prisma.user.create({
    data: { email, passwordHash, verificationToken, verificationOtp, otpExpiresAt },
  });

  const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${verificationToken}`;
  sendVerificationEmail({ to: user.email, verificationLink, otpCode: otp }).catch(() => {
    // Email delivery is non-blocking; log silently in production
  });
}

export async function verifyEmailByToken(token: string) {
  const user = await prisma.user.findFirst({ where: { verificationToken: token } });
  if (!user) throw new AppError('Invalid token', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: { verified: true, verificationToken: null, verificationOtp: null, otpExpiresAt: null },
  });
}

export async function verifyEmailByOtp(email: string, otp: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.verificationOtp) throw new AppError('Invalid OTP', 400);
  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    throw new AppError('OTP expired', 400);
  }

  const valid = await verifyOtpHash(otp, user.verificationOtp);
  if (!valid) throw new AppError('Invalid OTP', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: { verified: true, verificationToken: null, verificationOtp: null, otpExpiresAt: null },
  });
}

export async function login(email: string, password: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid credentials', 401);
  if (!user.verified) throw new AppError('Email not verified', 403);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new AppError('Invalid credentials', 401);

  const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '1h' });
  return token;
}
