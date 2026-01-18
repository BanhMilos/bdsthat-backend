import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import * as listingService from '../services/listingService';

const createListingSchema = z.object({
  propertyId: z.string().transform(val => BigInt(val)),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  listingType: z.enum(['FOR_SALE', 'FOR_RENT']),
  priority: z.number().optional(),
  currency: z.string().optional(),
  expirationDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

const updateListingSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  listingType: z.enum(['FOR_SALE', 'FOR_RENT']).optional(),
  status: z.string().optional(),
  priority: z.number().optional(),
  currency: z.string().optional(),
  expirationDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

const listListingsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  listingType: z.string().optional(),
  propertyType: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  bedrooms: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  minArea: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxArea: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  areaPId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  areaWId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  priority: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  isFeatured: z.string().optional().transform(val => val === 'true'),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const createListingController = async (req: AuthRequest, res: Response) => {
  try {
    const validated = createListingSchema.parse(req.body);

    const listing = await listingService.createListing({
      ...validated,
      userId: req.userId!,
    });

    res.status(201).json({
      success: true,
      data: listing,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error.message === 'Property not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('Not authorized') || error.message.includes('must be approved')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Create listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create listing',
    });
  }
};

export const listListingsController = async (req: Request, res: Response) => {
  try {
    const validated = listListingsSchema.parse(req.query);

    const result = await listingService.listListings(validated);

    res.json({
      success: true,
      data: result.listings,
      pagination: result.pagination,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('List listings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listings',
    });
  }
};

export const getListingController = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = BigInt(req.params.id);

    const listing = await listingService.getListingById(listingId, req.userId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found',
      });
    }

    res.json({
      success: true,
      data: listing,
    });
  } catch (error: any) {
    console.error('Get listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listing',
    });
  }
};

export const updateListingController = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = BigInt(req.params.id);
    const validated = updateListingSchema.parse(req.body);

    const listing = await listingService.updateListing(
      listingId,
      req.userId!,
      validated
    );

    res.json({
      success: true,
      data: listing,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error.message === 'Listing not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('Not authorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Update listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update listing',
    });
  }
};

export const deleteListingController = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = BigInt(req.params.id);

    const result = await listingService.deleteListing(listingId, req.userId!);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (error.message === 'Listing not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('Not authorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Delete listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete listing',
    });
  }
};

export const pushListingController = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId } = req.body;
    
    if (!listingId) {
      return res.status(400).json({
        result: 'failed',
        reason: 'listingId is required',
      });
    }

    const listing = await listingService.pushListing(BigInt(listingId), req.userId!);

    res.json({
      result: 'success',
      reason: 'Listing pushed to top successfully',
      listing,
    });
  } catch (error: any) {
    if (error.message === 'Listing not found') {
      return res.status(404).json({
        result: 'failed',
        reason: error.message,
      });
    }

    if (error.message.includes('Not authorized') || error.message.includes('Only active') || error.message.includes('No push credits')) {
      return res.status(403).json({
        result: 'failed',
        reason: error.message,
      });
    }

    console.error('Push listing error:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to push listing',
    });
  }
};

export const recreateListingController = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, ...listingData } = req.body;
    
    if (!listingId) {
      return res.status(400).json({
        result: 'failed',
        reason: 'listingId is required',
      });
    }

    const newListing = await listingService.recreateListing(BigInt(listingId), req.userId!, listingData);

    res.status(201).json({
      result: 'success',
      reason: 'Listing recreated successfully',
      listing: newListing,
    });
  } catch (error: any) {
    if (error.message === 'Listing not found') {
      return res.status(404).json({
        result: 'failed',
        reason: error.message,
      });
    }

    if (error.message.includes('Not authorized')) {
      return res.status(403).json({
        result: 'failed',
        reason: error.message,
      });
    }

    console.error('Recreate listing error:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to recreate listing',
    });
  }
};

export const getMyListingsController = async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      status: req.query.status as string | undefined,
    };

    const result = await listingService.getMyListings(req.userId!, filters);

    res.json({
      success: true,
      data: result.listings,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Get my listings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listings',
    });
  }
};

export const getRelatedListingsController = async (req: Request, res: Response) => {
  try {
    const { listingId, page, limit } = req.query;
    
    if (!listingId) {
      return res.status(400).json({
        result: 'failed',
        reason: 'listingId is required',
      });
    }

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 5;

    const listings = await listingService.getRelatedListings(BigInt(listingId as string), limitNum);

    res.json({
      result: 'success',
      reason: 'Related listings retrieved successfully',
      listings,
      total: listings.length,
    });
  } catch (error: any) {
    console.error('Get related listings error:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to fetch related listings',
    });
  }
};

export const generateListingWithAIController = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'propertyId is required',
      });
    }

    const result = await listingService.generateListingWithAI(BigInt(propertyId), req.userId!);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'Property not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('Not authorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Generate listing with AI error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate listing',
    });
  }
};

export const getUserListingsController = async (req: Request, res: Response) => {
  try {
    const userId = BigInt(req.params.userId);
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await listingService.getUserListings(userId, filters);

    res.json({
      success: true,
      data: {
        user: result.user,
        listings: result.listings,
      },
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Get user listings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user listings',
    });
  }
};
