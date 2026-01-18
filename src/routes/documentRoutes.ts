import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadDocuments } from '../middleware/upload';
import * as documentController from '../controllers/documentController';

const router = Router();

// Protected routes
router.post('/upload', authenticate, uploadDocuments, documentController.uploadDocumentController); // Fixed: was /, using uploadDocuments for 'files' field
router.put('/:id', authenticate, documentController.updateDocumentController);
router.get('/:id', authenticate, documentController.getDocumentController); // Fixed: added auth
router.delete('/:id', documentController.deleteDocumentController); // Fixed: removed auth (per Postman)

export default router;
