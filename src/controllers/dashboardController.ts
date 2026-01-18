import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import dashboardService from '../services/dashboardService';

export const getTopProvincesController = async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query;

    // Parse dates if provided
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (from && typeof from === 'string') {
      fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({
          result: 'failed',
          reason: 'Invalid from date format',
        });
      }
    }

    if (to && typeof to === 'string') {
      toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({
          result: 'failed',
          reason: 'Invalid to date format',
        });
      }
    }

    const data = await dashboardService.getTopProvinces(fromDate, toDate);

    return res.status(200).json({
      result: 'success',
      data,
    });
  } catch (error) {
    console.error('Error in getTopProvincesController:', error);
    return res.status(500).json({
      result: 'failed',
      reason: 'Internal server error',
    });
  }
};
