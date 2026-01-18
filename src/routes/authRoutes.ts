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
} from '../controllers/authController';

const router = Router();

router.post('/register', registerController);
router.get('/verify', verifyTokenGetController);
router.post('/verify', verifyTokenController);
router.post('/verify-otp', verifyOtpController);
router.post('/login', loginController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);
router.post('/change-password', changePasswordController);

export default router;
