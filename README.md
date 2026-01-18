# BDSTHAT Backend - Real Estate Platform API

A comprehensive backend API for a real estate marketplace platform built with Node.js, Express, TypeScript, Prisma, and PostgreSQL (Neon).

## ✅ Implemented Features - Phase 1 Complete!

### 🏠 Property & Listing Management (29 Endpoints)

#### Authentication System
- ✅ User registration (email/phone)
- ✅ Email/OTP verification  
- ✅ JWT authentication
- ✅ Password reset/change

#### Property Management (6 endpoints)
- ✅ CRUD operations with ownership validation
- ✅ Advanced filtering (type, bedrooms, area, location)
- ✅ My properties dashboard

#### Listing Management (11 endpoints)
- ✅ Create/manage real estate listings
- ✅ **Priority system** (normal 0, silver 1, gold 2)
- ✅ **Push to top** with credit management
- ✅ **Recreate expired listings**
- ✅ Related listings algorithm
- ✅ AI-generated titles & descriptions
- ✅ View counting
- ✅ User public profiles

#### Media Management (5 endpoints)
- ✅ Multiple file uploads (max 20 files, 50MB each)
- ✅ Bulk delete operations
- ✅ Media ordering

#### Document Management (4 endpoints)
- ✅ PDF/DOCX uploads
- ✅ Legal document categorization

#### Favorites System (3 endpoints)
- ✅ Like/unlike listings
- ✅ My favorites with full details

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+ with TypeScript 5.9
- **Framework**: Express.js
- **ORM**: Prisma 6.19.2
- **Database**: PostgreSQL (Neon hosted)
- **Auth**: JWT + bcryptjs
- **File Upload**: Multer
- **Validation**: Zod
- **Email**: Nodemailer
- **Dev Tools**: ts-node-dev with hot reload

## Requirements

- Node.js 18+
- PostgreSQL database
- SMTP server for emails
- npm or yarn

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

**Forgot Password**
```
POST /auth/forgot-password
{
  "email": "user@example.com"
}
```

Sends email with password reset link.

**Reset Password**
```
POST /auth/reset-password
{
  "token": "<reset_token_from_email>",
  "password": "newpassword"
}
```

**Change Password**
```
POST /auth/change-password
{
  "email": "user@example.com",
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
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

