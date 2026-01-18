import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
});

export async function sendVerificationEmail(params: {
  to: string;
  verificationLink: string;
  otpCode: string;
}) {
  const { to, verificationLink, otpCode } = params;
  const appName = process.env.APP_NAME || 'BDSThat';
  const emailFrom = process.env.EMAIL_FROM || 'noreply@example.com';

  const html = `
    <h2>Verify Your Email</h2>
    <p>Welcome! Please verify your email address using one of the methods below:</p>
    <p><a href="${verificationLink}" style="padding:10px 20px;background:#007bff;color:white;text-decoration:none;border-radius:5px;display:inline-block;">Verify Email</a></p>
    <p><strong>Or use this OTP:</strong> <code style="font-size:18px;letter-spacing:2px;">${otpCode}</code></p>
    <p style="color:#666;font-size:12px;">This OTP expires in 10 minutes.</p>
  `;

  await transport.sendMail({
    from: `${appName} <${emailFrom}>`,
    to,
    subject: `Verify your ${appName} email`,
    html,
    text: `Verify your email: ${verificationLink}\nOTP: ${otpCode}`,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetLink: string;
}) {
  const { to, resetLink } = params;
  const appName = process.env.APP_NAME || 'BDSThat';
  const emailFrom = process.env.EMAIL_FROM || 'noreply@example.com';

  const html = `
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your ${appName} password. Click the button below to proceed:</p>
    <p><a href="${resetLink}" style="padding:10px 20px;background:#dc3545;color:white;text-decoration:none;border-radius:5px;display:inline-block;">Reset Password</a></p>
    <p style="color:#666;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `;

  await transport.sendMail({
    from: `${appName} <${emailFrom}>`,
    to,
    subject: `Reset your ${appName} password`,
    html,
    text: `Reset your password: ${resetLink}`,
  });
}
