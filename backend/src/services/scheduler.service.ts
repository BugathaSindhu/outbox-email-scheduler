import { campaignRepository } from '../repositories/campaign.repository';
import { emailRepository } from '../repositories/email.repository';
import { senderRepository } from '../repositories/sender.repository';
import { emailQueue } from '../queues/email.queue';
import { generateIdempotencyKey } from '../utils/idempotency';
import { logger } from '../utils/logger';
import { Campaign, ScheduledEmail } from '@prisma/client';

export interface ScheduleCampaignInput {
  userId: string;
  name?: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime?: Date | string;
  delaySeconds?: number;
  hourlyLimit?: number;
  senderId?: string;
}

export interface ScheduleCampaignResult {
  campaign: Campaign;
  scheduledEmails: ScheduledEmail[];
  count: number;
}

export class SchedulerService {
  async scheduleCampaign(input: ScheduleCampaignInput): Promise<ScheduleCampaignResult> {
    const { userId, subject, body, recipients } = input;

    // 1. Resolve Sender
    let senderId = input.senderId;
    if (!senderId) {
      const existingSenders = await senderRepository.findByUserId(userId);
      if (existingSenders.length > 0) {
        senderId = existingSenders[0].id;
      } else {
        const userSenders = await senderRepository.create({
          userId,
          name: 'Default Sender',
          email: 'sender@outboxlabs.io',
        });
        senderId = userSenders.id;
      }
    }

    // 2. Validate and clean recipients
    const validRecipients = Array.from(
      new Set(
        recipients
          .map((r) => r.trim().toLowerCase())
          .filter((r) => r.length > 0 && r.includes('@'))
      )
    );

    if (validRecipients.length === 0) {
      throw new Error('No valid email recipients provided');
    }

    const campaignName = input.name || `Campaign: ${subject.slice(0, 30)}`;
    const startTimeDate = input.startTime ? new Date(input.startTime) : new Date();
    const delaySeconds = input.delaySeconds !== undefined ? input.delaySeconds : 2;
    const hourlyLimit = input.hourlyLimit !== undefined ? input.hourlyLimit : 100;

    // 3. Create Campaign in MySQL
    const campaign = await campaignRepository.create({
      userId,
      name: campaignName,
      startTime: startTimeDate,
      delaySeconds,
      hourlyLimit,
      status: 'SCHEDULED',
    });

    const scheduledEmails: ScheduledEmail[] = [];
    const baseTimeMs = startTimeDate.getTime();

    // 4. Create ScheduledEmail records & BullMQ jobs
    for (let i = 0; i < validRecipients.length; i++) {
      const recipient = validRecipients[i];
      const scheduledAt = new Date(baseTimeMs + i * delaySeconds * 1000);
      const idempotencyKey = generateIdempotencyKey(campaign.id, recipient, i);

      // Save record in MySQL first (source of truth)
      const emailRecord = (
        await emailRepository.createMany([
          {
            campaignId: campaign.id,
            senderId: senderId!,
            recipient,
            subject,
            body,
            scheduledAt,
            idempotencyKey,
          },
        ])
      )[0];

      // Calculate initial delay for BullMQ job
      const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());

      // Queue BullMQ delayed job
      const job = await emailQueue.add(
        'send-email',
        {
          scheduledEmailId: emailRecord.id,
          campaignId: campaign.id,
          recipient,
          senderId: senderId!,
          idempotencyKey,
        },
        { delay: delayMs }
      );

      // Save bullJobId back to database
      const updatedEmail = await emailRepository.updateStatus(
        emailRecord.id,
        'SCHEDULED',
        { bullJobId: job.id }
      );

      scheduledEmails.push(updatedEmail);
    }

    logger.info(
      { campaignId: campaign.id, count: scheduledEmails.length },
      'Successfully scheduled campaign and enqueued BullMQ jobs'
    );

    return {
      campaign,
      scheduledEmails,
      count: scheduledEmails.length,
    };
  }
}

export const schedulerService = new SchedulerService();
