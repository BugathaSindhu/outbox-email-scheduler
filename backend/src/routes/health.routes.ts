import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

router.get('/health', (req, res, next) =>
  healthController.getHealth(req, res).catch(next)
);

export default router;
