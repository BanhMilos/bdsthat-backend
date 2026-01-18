import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as favoriteController from '../controllers/favoriteController';

const router = Router();

// All routes require authentication
router.post('/like-listing', authenticate, favoriteController.likeListingController);
router.post('/unlike-listing', authenticate, favoriteController.unlikeListingController);
router.get('/my-favorites', authenticate, favoriteController.getMyFavoritesController);
router.get('/check/:listingId', authenticate, favoriteController.checkFavoriteController);

export default router;
