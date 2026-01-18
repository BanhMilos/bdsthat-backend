import { Router } from 'express';
import { getTopProvincesController } from '../controllers/dashboardController';

const router = Router();

// Public route - no authentication required
router.get('/top-provinces', getTopProvincesController);

export default router;
