import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { investorController } from '../controllers/investorController';

const router = Router();

// List investors with pagination and search (requires auth per Postman)
router.get('/', authenticate, investorController.getInvestors);

// Get investor details by ID (public - no auth in Postman)
router.get('/:id', investorController.getInvestorById);

export default router;
