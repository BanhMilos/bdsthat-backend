import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as listingController from '../controllers/listingController';

const router = Router();

// Protected routes - MUST come before /:id to avoid route conflicts
router.post('/create', authenticate, listingController.createListingController);
router.post('/push', authenticate, listingController.pushListingController); // Fixed: was /:id/push
router.post('/recreate', authenticate, listingController.recreateListingController); // Fixed: was /:id/recreate
router.post('/generate-ai-listing', authenticate, listingController.generateListingWithAIController); // Fixed: was /generate-ai
router.get('/my', authenticate, listingController.getMyListingsController); // Fixed: was /my/listings
router.get('/relative-listings', authenticate, listingController.getRelatedListingsController); // Fixed: was /:id/related, now with auth
router.get('/seller/:userId', authenticate, listingController.getUserListingsController); // Fixed: was /user/:userId, now with auth

// Dynamic ID routes - MUST come after specific paths
router.put('/:id', authenticate, listingController.updateListingController);
router.delete('/:id', authenticate, listingController.deleteListingController);

// Public routes - general listing endpoints
router.get('/', listingController.listListingsController);
router.get('/:id', optionalAuth, listingController.getListingController);

export default router;
