import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as mediaService from '../services/mediaService';

export const uploadMediaController = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const { propertyId, projectId, buildingId, subdivisionId, type } = req.body;

    // Determine media type from files if not specified
    let mediaType = type || 'IMAGE';
    if (!type && files.length > 0) {
      mediaType = files[0].mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    }

    const media = await mediaService.uploadMedia({
      userId: req.userId!,
      files,
      propertyId: propertyId ? BigInt(propertyId) : undefined,
      projectId: projectId ? BigInt(projectId) : undefined,
      buildingId: buildingId ? BigInt(buildingId) : undefined,
      subdivisionId: subdivisionId ? BigInt(subdivisionId) : undefined,
      type: mediaType,
    });

    res.status(201).json({
      success: true,
      data: media,
      message: `${media.length} file(s) uploaded successfully`,
    });
  } catch (error: any) {
    console.error('Upload media error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload media',
    });
  }
};

export const getMediaController = async (req: AuthRequest, res: Response) => {
  try {
    const mediaId = BigInt(req.params.id);

    const media = await mediaService.getMediaById(mediaId);

    if (!media) {
      return res.status(404).json({
        result: 'failed',
        reason: 'Media not found',
      });
    }

    res.json({
      result: 'success',
      data: media,
    });
  } catch (error: any) {
    console.error('Get media error:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to fetch media',
    });
  }
};

export const updateMediaController = async (req: AuthRequest, res: Response) => {
  try {
    const mediaId = BigInt(req.params.id);
    const { order, type } = req.body;

    const media = await mediaService.updateMedia(mediaId, req.userId!, { order, type });

    res.json({
      success: true,
      data: media,
    });
  } catch (error: any) {
    if (error.message === 'Media not found') {
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

    console.error('Update media error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update media',
    });
  }
};

export const deleteMediaController = async (req: AuthRequest, res: Response) => {
  try {
    const mediaId = BigInt(req.params.id);

    const result = await mediaService.deleteMedia(mediaId, req.userId!);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (error.message === 'Media not found') {
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

    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete media',
    });
  }
};

export const deleteMultipleMediaController = async (req: AuthRequest, res: Response) => {
  try {
    const { mediaIds } = req.body;

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'mediaIds array is required',
      });
    }

    const ids = mediaIds.map((id: string) => BigInt(id));

    const result = await mediaService.deleteMultipleMedia(ids, req.userId!);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (error.message.includes('Not authorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('Delete multiple media error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete media files',
    });
  }
};
