import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import * as documentService from '../services/documentService';

const uploadDocumentSchema = z.object({
  propertyId: z.string().optional().transform(val => val ? BigInt(val) : undefined),
  projectId: z.string().optional().transform(val => val ? BigInt(val) : undefined),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['PDF', 'DOCX', 'IMAGE', 'OTHER']).optional(),
  legalType: z.enum(['SO_HONG', 'HDMB', 'OTHER']).optional(),
});

export const uploadDocumentController = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const validated = uploadDocumentSchema.parse(req.body);

    const document = await documentService.uploadDocument({
      userId: req.userId!,
      file,
      ...validated,
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
    });
  }
};

export const getDocumentController = async (req: Request, res: Response) => {
  try {
    const documentId = BigInt(req.params.id);

    const document = await documentService.getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document',
    });
  }
};

export const updateDocumentController = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = BigInt(req.params.id);
    const { title, description, type, legalType } = req.body;

    const document = await documentService.updateDocument(
      documentId,
      req.userId!,
      { title, description, type, legalType }
    );

    res.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    if (error.message === 'Document not found') {
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

    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update document',
    });
  }
};

export const deleteDocumentController = async (req: Request, res: Response) => {
  try {
    const documentId = BigInt(req.params.id);

    const result = await documentService.deleteDocument(documentId);

    res.json({
      result: 'success',
      reason: result.message,
    });
  } catch (error: any) {
    if (error.message === 'Document not found') {
      return res.status(404).json({
        result: 'failed',
        reason: error.message,
      });
    }

    console.error('Delete document error:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to delete document',
    });
  }
};
