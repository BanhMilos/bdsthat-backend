import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { projectService } from '../services/projectService';

const getProjectsSchema = z.object({
  page: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().optional(),
});

const getRelativeProjectsSchema = z.object({
  projectId: z.coerce.number().int().min(1),
});

export const projectController = {
  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const params = getProjectsSchema.parse(req.query);
      const result = await projectService.getProjects(params);

      res.json({
        result: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.params.id);

      if (isNaN(projectId)) {
        return res.status(400).json({
          result: 'failed',
          reason: 'Invalid project ID',
        });
      }

      const project = await projectService.getProjectById(projectId);

      if (!project) {
        return res.status(404).json({
          result: 'failed',
          reason: 'Project not found',
        });
      }

      res.json({
        result: 'success',
        project,
      });
    } catch (error) {
      next(error);
    }
  },

  async getRelativeProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = getRelativeProjectsSchema.parse(req.query);

      const projects = await projectService.getRelativeProjects(projectId);

      res.json({
        result: 'success',
        projects,
        total: projects.length,
      });
    } catch (error) {
      next(error);
    }
  },
};
