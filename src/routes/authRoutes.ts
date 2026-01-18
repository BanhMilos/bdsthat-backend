import { Router } from 'express';
import {
  loginController,
  registerController,
  verifyOtpController,
  verifyTokenController,
  verifyTokenGetController,
} from '../controllers/authController';

const router = Router();

router.post('/register', registerController);
router.get('/verify', verifyTokenGetController);
router.post('/verify', verifyTokenController);
router.post('/verify-otp', verifyOtpController);
router.post('/login', loginController);

export default router;
