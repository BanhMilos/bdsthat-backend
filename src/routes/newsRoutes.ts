import { Router, Request, Response } from 'express';
import {
  getCategoriesController,
  getNewsListController,
  getNewsDetailController,
  addCommentController,
  getRelatedListingsController,
} from '../controllers/newsController';
import { authenticate, optionalAuth } from '../middleware/auth';

const newsRouter = Router();

/**
 * Admin news categories - GET /api/v1/admin/news/category/
 * No authentication required
 */
newsRouter.get('/admin/news/category/', getCategoriesController);

/**
 * Frontend routes - all with /api/v1/fe/news prefix
 */

/**
 * GET /api/v1/fe/news/ - List news with filters
 * Bearer auth required
 */
newsRouter.get('/fe/news/', authenticate, getNewsListController);

/**
 * GET /api/v1/fe/news/:id - News details
 * No authentication required
 */
newsRouter.get('/fe/news/:id', getNewsDetailController);

/**
 * POST /api/v1/fe/news/:id/comment - Add comment
 * Bearer auth required
 */
newsRouter.post('/fe/news/:id/comment', authenticate, addCommentController);

/**
 * GET /api/v1/fe/news/:id/related - Related listings
 * No authentication required
 */
newsRouter.get('/fe/news/:id/related', getRelatedListingsController);

export default newsRouter;
