import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/database';
import { EMAIL_QUEUE_NAME, EmailJobData, emailQueue } from '../queues/email.queue';
import { checkAndIncrementHourlyRateLimit } from '../utils/rateLimiter';
import { sendEmailViaEthereal } from '../integrations/email/ethereal';
import { indexEmailDocument } from '../integrations/elasticsearch/elasticClient';
import { sendSlackNotification } from '../integrations/slack/slackClient';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export const setupEmailWorker = (): Worker<EmailJobData> => {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { scheduledEmailId } = job.data;

      logger.info({ jobId: job.id, scheduledEmailId }, `[EMAIL] Processing emailId=${scheduledEmailId}`);

      // 1. Load email from MySQL (source of truth)
      const emailRecord = await prisma.scheduledEmail.findUnique({
        where: { id: scheduledEmailId },
        include: {
          campaign: {
            include: {
              user: true,
            },
          },
          sender: true,
        },
      });

      if (!emailRecord) {
        logger.warn({ scheduledEmailId }, `[EMAIL] Scheduled emailId=${scheduledEmailId} not found in database. Skipping job.`);
        return;
      }

      // 2. Idempotency Check: Prevent duplicate processing
      if (emailRecord.status === 'SENT') {
        logger.info(
          { scheduledEmailId, idempotencyKey: emailRecord.idempotencyKey },
          `[EMAIL] Email already SENT emailId=${scheduledEmailId}. Skipping to preserve idempotency.`
        );
        return;
      }

      const sender = emailRecord.sender;
      const campaign = emailRecord.campaign;
      const user = campaign.user;

      // 3. Hourly Rate Limit Check via Redis
      const rateLimitResult = await checkAndIncrementHourlyRateLimit(
        sender.id,
        campaign.hourlyLimit
      );

      if (!rateLimitResult.allowed && rateLimitResult.rescheduleTime) {
        const rescheduleAt = rateLimitResult.rescheduleTime;
        const delayMs = Math.max(0, rescheduleAt.getTime() - Date.now());

        logger.info(
          { scheduledEmailId, rescheduleAt, delayMs },
          `[EMAIL] Rate limit reached emailId=${scheduledEmailId} nextAttemptAt=${rescheduleAt.toISOString()}. Rescheduling job.`
        );

        // Update MySQL record to RESCHEDULED
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmailId },
          data: {
            status: 'RESCHEDULED',
            scheduledAt: rescheduleAt,
          },
        });

        // Re-enqueue delayed job in BullMQ using same scheduledEmailId
        const newJob = await emailQueue.add(
          'send-email',
          { ...job.data },
          { delay: delayMs }
        );

        await prisma.scheduledEmail.update({
          where: { id: scheduledEmailId },
          data: { bullJobId: newJob.id },
        });

        // Trigger Slack notification if user has connected Slack
        if (user.slackAccessToken || user.slackWebhookUrl) {
          const alertMessage = `⚠️ Hourly email sending limit reached for sender ${sender.email}. Remaining emails have been rescheduled to ${rescheduleAt.toISOString()}`;
          await sendSlackNotification(user.slackAccessToken, user.slackChannelId, alertMessage, user.slackWebhookUrl);
        }

        return;
      }

      // 4. Mark status as PROCESSING
      await prisma.scheduledEmail.update({
        where: { id: scheduledEmailId },
        data: { status: 'PROCESSING' },
      });

      logger.info({ scheduledEmailId, recipient: emailRecord.recipient }, `[EMAIL] Sending emailId=${scheduledEmailId}`);

      try {
        // 5. Send via Nodemailer Ethereal SMTP
        const sendResult = await sendEmailViaEthereal({
          fromName: sender.name,
          fromEmail: sender.email,
          to: emailRecord.recipient,
          subject: emailRecord.subject,
          body: emailRecord.body,
        });

        const sentAt = new Date();

        logger.info(
          { scheduledEmailId, messageId: sendResult.messageId },
          `[EMAIL] Email sent successfully emailId=${scheduledEmailId}`
        );

        // 6. Update MySQL status to SENT
        const updatedRecord = await prisma.scheduledEmail.update({
          where: { id: scheduledEmailId },
          data: {
            status: 'SENT',
            sentAt,
            errorMessage: sendResult.previewUrl
              ? `Preview URL: ${sendResult.previewUrl}`
              : null,
          },
        });

        logger.info(
          { scheduledEmailId, sentAt },
          `[EMAIL] Database status updated SENT emailId=${scheduledEmailId}`
        );

        // 7. Index in Elasticsearch (Async, non-blocking failure)
        indexEmailDocument({
          id: updatedRecord.id,
          campaignId: updatedRecord.campaignId,
          recipient: updatedRecord.recipient,
          subject: updatedRecord.subject,
          body: updatedRecord.body,
          sender: sender.email,
          status: updatedRecord.status,
          sentAt: updatedRecord.sentAt || sentAt,
          scheduledAt: updatedRecord.scheduledAt,
        }).catch((err) => {
          logger.warn({ err, emailId: scheduledEmailId }, 'Failed to index email document in Elasticsearch');
        });
      } catch (error: any) {
        logger.error({ error, scheduledEmailId }, `[EMAIL] Send failed emailId=${scheduledEmailId}`);

        await prisma.scheduledEmail.update({
          where: { id: scheduledEmailId },
          data: {
            status: 'FAILED',
            errorMessage: error?.message || 'SMTP delivery failure',
          },
        });

        logger.info({ scheduledEmailId }, `[EMAIL] Database status updated FAILED emailId=${scheduledEmailId}`);

        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: config.worker.concurrency,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'BullMQ Worker Job Failed');
  });

  logger.info({ concurrency: config.worker.concurrency }, 'BullMQ Email Worker initialized');

  return worker;
};
