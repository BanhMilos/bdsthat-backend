import { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error('Unhandled error:', err instanceof Error ? err.message : String(err));
  return res.status(500).json({ error: 'Internal server error' });
}
