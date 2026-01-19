import { Router } from 'express';
import {
  getProvincesController,
  getSubAreasController,
  getFAQsController,
  uploadFilesController,
  getConfigsController,
} from '../controllers/miscController';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

// GET /api/v1/fe/misc/provinces
router.get('/provinces', getProvincesController);

// GET /api/v1/fe/misc/sub-areas/:id
router.get('/sub-areas/:id', getSubAreasController);

// GET /api/v1/fe/misc/faqs
router.get('/faqs', getFAQsController);

// POST /api/v1/fe/misc/upload
router.post('/upload', uploadMultiple, uploadFilesController);

// GET /api/v1/fe/misc/configs
router.get('/configs', getConfigsController);

export default router;
