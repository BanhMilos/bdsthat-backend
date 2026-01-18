import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import {
  login,
  register,
  verifyEmailByOtp,
  verifyEmailByToken,
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
