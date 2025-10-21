import { Router, RequestHandler } from 'express';
import { GenerationController } from '../controllers/generation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

// FIX: Replace 'as any' with 'as RequestHandler' by importing RequestHandler from express.
router.post('/', upload.single('image') as unknown as RequestHandler, GenerationController.create);
router.get('/recent', GenerationController.getRecent);
router.get('/:id', GenerationController.getById);

export default router;
