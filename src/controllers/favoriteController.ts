import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as favoriteService from '../services/favoriteService';

export const likeListingController = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'listingId is required',
      });
    }

    const favorite = await favoriteService.likeListing(req.userId!, BigInt(listingId));

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Listing added to favorites',
    });
  } catch (error: any) {
    if (error.message === 'Listing already liked') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Like listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add listing to favorites',
    });
  }
};

export const unlikeListingController = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'listingId is required',
      });
    }

    const result = await favoriteService.unlikeListing(req.userId!, BigInt(listingId));

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (error.message === 'Listing not in favorites') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Unlike listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove listing from favorites',
    });
  }
};

export const getMyFavoritesController = async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      type: req.query.type as string | undefined,
    };

    const result = await favoriteService.getMyFavorites(req.userId!, filters);

    res.json({
      success: true,
      data: result.favorites,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Get my favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorites',
    });
  }
};

export const checkFavoriteController = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = BigInt(req.params.listingId);

    const result = await favoriteService.checkFavorite(req.userId!, listingId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check favorite status',
    });
  }
};
