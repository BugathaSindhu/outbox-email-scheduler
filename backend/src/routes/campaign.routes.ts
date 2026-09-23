import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', (req, res, next) =>
  campaignController.getCampaigns(req, res).catch(next)
);

router.get('/:id', (req, res, next) =>
  campaignController.getCampaignById(req, res).catch(next)
);

export default router;
