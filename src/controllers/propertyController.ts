import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import * as propertyService from '../services/propertyService';

const createPropertySchema = z.object({
  address: z.string().min(1, 'Address is required'),
  title: z.string().min(1, 'Title is required'),
  propertyType: z.string().min(1, 'Property type is required'),
  description: z.string().optional(),
  projectId: z.string().optional().transform(val => val ? BigInt(val) : undefined),
  buildingId: z.string().optional().transform(val => val ? BigInt(val) : undefined),
  subdivisionId: z.string().optional().transform(val => val ? BigInt(val) : undefined),
  floor: z.number().optional(),
  unit: z.string().optional(),
  width: z.number().optional(),
  length: z.number().optional(),
  floors: z.number().optional(),
  floorArea: z.number().optional(),
  buildingArea: z.number().optional(),
  landArea: z.number().optional(),
  bedrooms: z.number().optional(),
  toilets: z.number().optional(),
  direction: z.string().optional(),
  legalDocumentType: z.string().optional(),
  legalDocumentNumber: z.string().optional(),
  legalStatus: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  furniture: z.string().optional(),
  streetWidth: z.number().optional(),
  usageStatus: z.string().optional(),
  areaPId: z.number().optional(),
  areaWId: z.number().optional(),
  oldAreaPId: z.number().optional(),
  oldAreaDId: z.number().optional(),
  oldAreaWId: z.number().optional(),
  authorizedUserId: z.string().optional().transform(val => val ? BigInt(val) : undefined),
  authorizedAgentId: z.string().optional().transform(val => val ? BigInt(val) : undefined),
});

const updatePropertySchema = createPropertySchema.partial();

const listPropertiesSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  propertyType: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  bedrooms: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  minArea: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxArea: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  areaPId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  areaWId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  status: z.string().optional(),
});

export const createPropertyController = async (req: AuthRequest, res: Response) => {
  try {
    const validated = createPropertySchema.parse(req.body);

    const property = await propertyService.createProperty({
      ...validated,
      userId: req.userId!,
    });

    res.status(201).json({
      success: true,
      data: property,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create property',
    });
  }
};

export const listPropertiesController = async (req: Request, res: Response) => {
  try {
    const validated = listPropertiesSchema.parse(req.query);

    const result = await propertyService.listProperties(validated);

    res.json({
      success: true,
      data: result.properties,
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

    console.error('List properties error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch properties',
    });
  }
};

export const getPropertyController = async (req: Request, res: Response) => {
  try {
    const propertyId = BigInt(req.params.id);

    const property = await propertyService.getPropertyById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (error: any) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property',
    });
  }
};

export const updatePropertyController = async (req: AuthRequest, res: Response) => {
  try {
    const propertyId = BigInt(req.params.id);
    const validated = updatePropertySchema.parse(req.body);

    const property = await propertyService.updateProperty(
      propertyId,
      req.userId!,
      validated
    );

    res.json({
      success: true,
      data: property,
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

    if (error.message === 'Not authorized to update this property') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update property',
    });
  }
};

export const deletePropertyController = async (req: AuthRequest, res: Response) => {
  try {
    const propertyId = BigInt(req.params.id);

    const result = await propertyService.deleteProperty(propertyId, req.userId!);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (error.message === 'Property not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === 'Not authorized to delete this property') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('Cannot delete property')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete property',
    });
  }
};

export const getMyPropertiesController = async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      status: req.query.status as string | undefined,
    };

    const result = await propertyService.getMyProperties(req.userId!, filters);

    res.json({
      success: true,
      data: result.properties,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Get my properties error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch properties',
    });
  }
};
