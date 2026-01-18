import { Router } from 'express';
import {
  loginController,
  registerController,
  verifyOtpController,
  verifyTokenController,
  verifyTokenGetController,
  forgotPasswordController,
  resetPasswordController,
  changePasswordController,
  getProfileController,
  updateProfileController,
  logoutController,
  uploadCertificateController,
  updateDeviceController,
  searchUsersController,
  deleteAccountController,
  updatePhoneController,
  updateEmailController,
  getWalletTransactionsController,
  resendOtpController,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Public routes
router.post('/register', registerController);
router.get('/activate', verifyTokenGetController); // Fixed: was /verify
router.post('/activate', verifyTokenController); // Fixed: was /verify
router.post('/activate-otp', verifyOtpController); // Fixed: was /verify-otp
router.post('/login', loginController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);
router.post('/resend-otp', resendOtpController); // NEW

// Protected routes (require authentication)
router.get('/profile', authenticate, getProfileController); // NEW
router.post('/update-profile', authenticate, updateProfileController); // NEW
router.post('/logout', authenticate, logoutController); // NEW
router.post('/upload-certificate', authenticate, upload.single('certificate'), uploadCertificateController); // NEW
router.post('/update-device', authenticate, updateDeviceController); // NEW
router.get('/search', authenticate, searchUsersController); // NEW
router.post('/delete-account', authenticate, deleteAccountController); // NEW
router.post('/update-phone', authenticate, updatePhoneController); // NEW
router.post('/update-email', authenticate, updateEmailController); // NEW
router.get('/wallet-transactions', authenticate, getWalletTransactionsController); // NEW
router.post('/change-password', authenticate, changePasswordController); // Moved to protected

export default router;

