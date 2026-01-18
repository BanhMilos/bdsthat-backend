import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';
import * as mediaController from '../controllers/mediaController';

const router = Router();

// Protected routes
router.get('/:id', authenticate, mediaController.getMediaController);
router.post('/upload', authenticate, uploadMultiple, mediaController.uploadMediaController);
router.put('/:id', authenticate, mediaController.updateMediaController);
router.delete('/:id', authenticate, mediaController.deleteMediaController);
router.post('/delete', authenticate, mediaController.deleteMultipleMediaController);

export default router;
