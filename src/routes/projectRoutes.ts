import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { projectController } from '../controllers/projectController';

const router = Router();

// Get relative/related projects (must come before /:id) - requires auth per Postman
router.get('/relative-projects', authenticate, projectController.getRelativeProjects);

// List projects with pagination and search - requires auth per Postman
router.get('/', authenticate, projectController.getProjects);

// Get project details by ID - requires auth per Postman
router.get('/:id', authenticate, projectController.getProjectById);

export default router;
