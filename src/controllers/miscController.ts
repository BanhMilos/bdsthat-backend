import { Request, Response } from 'express';
import * as miscService from '../services/miscService';

// Get provinces
export const getProvincesController = async (req: Request, res: Response) => {
  try {
    const { isOldArea } = req.query;
    
    let isOldAreaFlag: boolean | undefined;
    if (isOldArea !== undefined && isOldArea !== '') {
      isOldAreaFlag = isOldArea === 'true' || isOldArea === '1';
    }

    const provinces = await miscService.getProvinces(isOldAreaFlag);

    res.json({
      result: 'success',
      provinces,
    });
  } catch (error) {
    console.error('Error in getProvincesController:', error);
    res.status(500).json({
      result: 'error',
      message: error instanceof Error ? error.message : 'Failed to get provinces',
    });
  }
};

// Get sub-areas
export const getSubAreasController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isOldArea } = req.query;

    let isOldAreaFlag: boolean | undefined;
    if (isOldArea !== undefined && isOldArea !== '') {
      isOldAreaFlag = isOldArea === 'true' || isOldArea === '1';
    }

    const areas = await miscService.getSubAreas(BigInt(id), isOldAreaFlag);

    res.json({
      result: 'success',
      areas,
    });
  } catch (error) {
    console.error('Error in getSubAreasController:', error);
    res.status(500).json({
      result: 'error',
      message: error instanceof Error ? error.message : 'Failed to get sub-areas',
    });
  }
};

// Get FAQs
export const getFAQsController = async (req: Request, res: Response) => {
  try {
    const { category, q, page, limit } = req.query;

    const filters = {
      category: category as string,
      q: q as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const result = await miscService.getFAQs(filters);

    res.json({
      result: 'success',
      ...result,
    });
  } catch (error) {
    console.error('Error in getFAQsController:', error);
    res.status(500).json({
      result: 'error',
      message: error instanceof Error ? error.message : 'Failed to get FAQs',
    });
  }
};

// Upload files
export const uploadFilesController = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        result: 'error',
        message: 'No files uploaded',
      });
    }

    // Build file URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedFiles = files.map((file) => {
      // Extract folder from path (images, videos, documents, others)
      const relativePath = file.path.replace(/\\/g, '/');
      const uploadsIndex = relativePath.indexOf('/uploads/');
      const urlPath = uploadsIndex !== -1 ? relativePath.substring(uploadsIndex) : `/uploads/${file.filename}`;

      return {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `${baseUrl}${urlPath}`,
        path: urlPath,
      };
    });

    res.json({
      result: 'success',
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Error in uploadFilesController:', error);
    res.status(500).json({
      result: 'error',
      message: error instanceof Error ? error.message : 'Failed to upload files',
    });
  }
};

// Get app configs
export const getConfigsController = async (req: Request, res: Response) => {
  try {
    const configs = await miscService.getConfigs();

    res.json({
      result: 'success',
      configs,
    });
  } catch (error) {
    console.error('Error in getConfigsController:', error);
    res.status(500).json({
      result: 'error',
      message: error instanceof Error ? error.message : 'Failed to get configs',
    });
  }
};
