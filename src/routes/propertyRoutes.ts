import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as propertyController from '../controllers/propertyController';

const router = Router();

// Protected routes (must come before /:id to avoid route conflicts)
router.get('/my/properties', authenticate, propertyController.getMyPropertiesController);
router.post('/create', authenticate, propertyController.createPropertyController);
router.put('/:id', authenticate, propertyController.updatePropertyController);
router.delete('/:id', authenticate, propertyController.deletePropertyController);

// Public routes
router.get('/', propertyController.listPropertiesController);
router.get('/:id', propertyController.getPropertyController);

export default router;
