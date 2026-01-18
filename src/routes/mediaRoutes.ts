import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';
import * as mediaController from '../controllers/mediaController';

const router = Router();

// Public routes
router.get('/:id', mediaController.getMediaController);

// Protected routes
router.post('/', authenticate, uploadMultiple, mediaController.uploadMediaController);
router.put('/:id', authenticate, mediaController.updateMediaController);
router.delete('/:id', authenticate, mediaController.deleteMediaController);
router.post('/delete-multiple', authenticate, mediaController.deleteMultipleMediaController);

export default router;
