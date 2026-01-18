import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { searchSuggestionsController } from '../controllers/suggestController';

const suggestRouter = Router();

/**
 * GET /api/v1/fe/suggest?keyword=city
 * Search suggestions - Bearer auth required
 */
suggestRouter.get('/', authenticate, searchSuggestionsController);

export default suggestRouter;
