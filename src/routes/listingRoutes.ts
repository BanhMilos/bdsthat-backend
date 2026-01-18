import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as listingController from '../controllers/listingController';

const router = Router();

// Protected routes (must come before /:id to avoid route conflicts)
router.get('/my/listings', authenticate, listingController.getMyListingsController);
router.post('/generate-ai', authenticate, listingController.generateListingWithAIController);
router.post('/create', authenticate, listingController.createListingController);
router.put('/:id', authenticate, listingController.updateListingController);
router.delete('/:id', authenticate, listingController.deleteListingController);
router.post('/:id/push', authenticate, listingController.pushListingController);
router.post('/:id/recreate', authenticate, listingController.recreateListingController);

// Public routes
router.get('/', listingController.listListingsController);
router.get('/user/:userId', listingController.getUserListingsController);
router.get('/:id', optionalAuth, listingController.getListingController);
router.get('/:id/related', listingController.getRelatedListingsController);

export default router;
