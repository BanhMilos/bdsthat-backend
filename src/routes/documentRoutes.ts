import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import * as documentController from '../controllers/documentController';

const router = Router();

// Public routes
router.get('/:id', documentController.getDocumentController);

// Protected routes
router.post('/', authenticate, uploadSingle, documentController.uploadDocumentController);
router.put('/:id', authenticate, documentController.updateDocumentController);
router.delete('/:id', authenticate, documentController.deleteDocumentController);

export default router;
