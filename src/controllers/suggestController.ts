import { Response } from 'express';
import { SuggestService } from '../services/suggestService';
import { AuthRequest } from '../middleware/auth';

/**
 * Search suggestions endpoint
 */
export const searchSuggestionsController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      res.status(400).json({
        result: 'failed',
        reason: 'keyword parameter is required',
      });
      return;
    }

    const suggestions = await SuggestService.searchSuggestions(keyword);

    res.json({
      result: 'success',
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('Error in searchSuggestionsController:', error);
    res.status(500).json({
      result: 'failed',
      reason: 'Failed to fetch suggestions',
    });
  }
};
