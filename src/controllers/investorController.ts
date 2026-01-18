import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { investorService } from '../services/investorService';

const getInvestorsSchema = z.object({
  page: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().optional(),
});

export const investorController = {
  async getInvestors(req: Request, res: Response, next: NextFunction) {
    try {
      const params = getInvestorsSchema.parse(req.query);
      const result = await investorService.getInvestors(params);

      res.json({
        result: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getInvestorById(req: Request, res: Response, next: NextFunction) {
    try {
      const investorId = parseInt(req.params.id);

      if (isNaN(investorId)) {
        return res.status(400).json({
          result: 'failed',
          reason: 'Invalid investor ID',
        });
      }

      const investor = await investorService.getInvestorById(investorId);

      if (!investor) {
        return res.status(404).json({
          result: 'failed',
          reason: 'Investor not found',
        });
      }

      res.json({
        result: 'success',
        investor,
      });
    } catch (error) {
      next(error);
    }
  },
};
