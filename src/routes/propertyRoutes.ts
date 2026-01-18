import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as propertyController from '../controllers/propertyController';

const router = Router();

// Protected routes (must come before /:id to avoid route conflicts)
router.get('/my', authenticate, propertyController.getMyPropertiesController);
router.post('/create', authenticate, propertyController.createPropertyController);
router.put('/:id', authenticate, propertyController.updatePropertyController);
router.delete('/:id', authenticate, propertyController.deletePropertyController);
router.get('/', authenticate, propertyController.listPropertiesController);
router.get('/:id', authenticate, propertyController.getPropertyController);

export default router;
