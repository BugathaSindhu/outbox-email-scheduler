import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { schedulerService } from '../services/scheduler.service';
import { emailRepository } from '../repositories/email.repository';
import { reconciliationService } from '../services/reconciliation.service';
import { searchEmailDocuments } from '../integrations/elasticsearch/elasticClient';
import { logger } from '../utils/logger';

export class EmailController {
  async scheduleEmails(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { recipients, subject, body, startTime, delaySeconds, hourlyLimit, senderId, name } = req.body;

    const result = await schedulerService.scheduleCampaign({
      userId,
      name,
      recipients,
      subject,
      body,
      startTime,
      delaySeconds,
      hourlyLimit,
      senderId,
    });

    return res.status(201).json({
      message: 'Campaign scheduled successfully',
      campaignId: result.campaign.id,
      scheduledCount: result.count,
      campaign: result.campaign,
      scheduledEmails: result.scheduledEmails,
    });
  }

  async getScheduled(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    // Synchronize any completed BullMQ jobs or past-due dispatches before returning scheduled queue
    await reconciliationService.reconcileScheduledEmails(userId);
    const emails = await emailRepository.findScheduled(userId);
    return res.json({ scheduledEmails: emails });
  }

  async getSent(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const emails = await emailRepository.findSent(userId);
    return res.json({ sentEmails: emails });
  }

  async searchEmails(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.json({ results: [], source: 'elasticsearch' });
    }

    try {
      // Primary: Search Elasticsearch
      const elasticResults = await searchEmailDocuments(query);
      return res.json({ results: elasticResults, source: 'elasticsearch' });
    } catch (error) {
      logger.warn({ error, query }, 'Elasticsearch failed. Falling back to MySQL LIKE query.');
      // Fallback: Search MySQL DB
      const dbResults = await emailRepository.searchLike(query, userId);
      return res.json({ results: dbResults, source: 'mysql' });
    }
  }
}

export const emailController = new EmailController();
