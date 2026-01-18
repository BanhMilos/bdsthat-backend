import { Request, Response } from 'express';
import { NewsService } from '../services/newsService';
import { AuthRequest } from '../middleware/auth';

/**
 * Get news categories
 */
export const getCategoriesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await NewsService.getCategories();

    res.json({
      result: 'success',
      categories,
    });
  } catch (error) {
    console.error('Error in getCategoriesController:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to fetch categories',
    });
  }
};

/**
 * Get news list with filters
 */
export const getNewsListController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      categoryId,
      orderBy,
      q,
      fromDate,
      toDate,
      tags,
      page = '0',
      limit = '10',
    } = req.query;

    const filters = {
      categoryId: categoryId as string | undefined,
      orderBy: orderBy as string | undefined,
      q: q as string | undefined,
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
      tags: tags as string | undefined,
      page: parseInt(page as string) || 0,
      limit: parseInt(limit as string) || 10,
    };

    const result = await NewsService.getNews(filters);

    res.json({
      result: 'success',
      news: result.news,
      total: result.total,
      count: result.count,
    });
  } catch (error) {
    console.error('Error in getNewsListController:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to fetch news',
    });
  }
};

/**
 * Get news details by ID
 */
export const getNewsDetailController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const news = await NewsService.getNewsById(BigInt(id));

    if (!news) {
      res.status(404).json({
        result: 'failed',
        reason: 'News not found',
      });
      return;
    }

    res.json({
      result: 'success',
      news,
    });
  } catch (error) {
    console.error('Error in getNewsDetailController:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to fetch news details',
    });
  }
};

/**
 * Add comment to news
 */
export const addCommentController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        result: 'failed',
        reason: 'Unauthorized',
      });
      return;
    }

    if (!content || content.trim() === '') {
      res.status(400).json({
        result: 'failed',
        reason: 'Content is required',
      });
      return;
    }

    const comment = await NewsService.addComment(
      BigInt(id),
      userId,
      content
    );

    res.json({
      result: 'success',
      comment,
    });
  } catch (error) {
    console.error('Error in addCommentController:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to add comment',
    });
  }
};

/**
 * Get related listings
 */
export const getRelatedListingsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '0', limit = '100' } = req.query;

    const result = await NewsService.getRelatedListings(
      BigInt(id),
      parseInt(page as string) || 0,
      parseInt(limit as string) || 100
    );

    res.json({
      result: 'success',
      listings: result.listings,
      total: result.total,
      count: result.count,
    });
  } catch (error) {
    console.error('Error in getRelatedListingsController:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to fetch related listings',
    });
  }
};
