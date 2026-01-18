# BDSThat Backend API

Node.js + Express + TypeScript backend with email-based authentication.

## Features

- Email sign-up with verification via link or OTP
- JWT-based login and session management
- Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- Password hashing with bcryptjs
- Email delivery via Nodemailer
- Input validation with Zod
- TypeScript strict mode
- Jest testing suite

## Requirements

- Node.js 18+
- npm

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Update `.env` with your database and SMTP settings.

### 3. Initialize database
```bash
npx prisma migrate dev --name init
```

### 4. Start development server
```bash
npm run dev
```

Server runs on `http://localhost:3000` with hot reload.

## API Endpoints

### Authentication

**Register User**
```
POST /auth/register
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Verify Email (via Link)**
```
GET /auth/verify?token=<verification_token>
```

**Verify Email (via OTP)**
```
POST /auth/verify-otp
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Login**
```
POST /auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

## Development

```bash
npm test          # Run tests
npm run format    # Format code
npm run lint      # Lint code
npm run prisma:studio  # Open Prisma Studio
```

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Add real SMTP credentials
- [ ] Update `APP_URL` for email links
- [ ] Enable CORS appropriately
- [ ] Add rate limiting
- [ ] Use HTTPS
- [ ] Monitor error logs

## Notes

- JWT tokens expire in 1 hour
- OTP codes expire in 10 minutes (configurable)
- Passwords must be at least 8 characters

