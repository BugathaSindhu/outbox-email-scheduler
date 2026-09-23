import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { campaignRepository } from '../repositories/campaign.repository';

export class CampaignController {
  async getCampaigns(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const campaigns = await campaignRepository.findByUserId(userId);
    return res.json({ campaigns });
  }

  async getCampaignById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const campaign = await campaignRepository.findById(id);

    if (!campaign || campaign.userId !== req.user.id) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.json({ campaign });
  }
}

export const campaignController = new CampaignController();
