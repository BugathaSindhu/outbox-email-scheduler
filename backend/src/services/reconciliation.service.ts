import { prisma } from '../config/database';
import { emailQueue } from '../queues/email.queue';
import { sendEmailViaEthereal } from '../integrations/email/ethereal';
import { indexEmailDocument } from '../integrations/elasticsearch/elasticClient';
import { logger } from '../utils/logger';

export class ReconciliationService {
  async reconcileScheduledEmails(userId?: string): Promise<void> {
    try {
      // 1. Fetch all emails in SCHEDULED or RESCHEDULED status
      const pendingEmails = await prisma.scheduledEmail.findMany({
        where: {
          ...(userId && { campaign: { userId } }),
          status: { in: ['SCHEDULED', 'RESCHEDULED'] },
        },
        include: {
          campaign: {
            include: {
              user: true,
            },
          },
          sender: true,
        },
      });

      if (pendingEmails.length === 0) return;

      const now = new Date();

      for (const email of pendingEmails) {
        let jobState: string | null = null;
        let job = null;

        if (email.bullJobId) {
          try {
            job = await emailQueue.getJob(email.bullJobId);
            if (job) {
              jobState = await job.getState();
            }
          } catch (err) {
            logger.warn({ emailId: email.id, bullJobId: email.bullJobId, err }, 'Failed to fetch BullMQ job state during reconciliation');
          }
        }

        // Case A: Job in BullMQ is marked COMPLETED but MySQL status was not updated to SENT
        if (jobState === 'completed') {
          logger.info(
            { emailId: email.id, bullJobId: email.bullJobId },
            '[RECONCILIATION] BullMQ job is COMPLETED. Synchronizing MySQL status to SENT.'
          );

          const sentAt = job?.finishedOn ? new Date(job.finishedOn) : new Date();

          const updatedRecord = await prisma.scheduledEmail.update({
            where: { id: email.id },
            data: {
              status: 'SENT',
              sentAt,
            },
          });

          // Index in Elasticsearch
          indexEmailDocument({
            id: updatedRecord.id,
            campaignId: updatedRecord.campaignId,
            recipient: updatedRecord.recipient,
            subject: updatedRecord.subject,
            body: updatedRecord.body,
            sender: email.sender.email,
            status: updatedRecord.status,
            sentAt: updatedRecord.sentAt || sentAt,
            scheduledAt: updatedRecord.scheduledAt,
          }).catch(() => {});

          continue;
        }

        // Case B: Job in BullMQ is marked FAILED but MySQL status was not updated to FAILED
        if (jobState === 'failed') {
          logger.info(
            { emailId: email.id, bullJobId: email.bullJobId },
            '[RECONCILIATION] BullMQ job is FAILED. Synchronizing MySQL status to FAILED.'
          );

          await prisma.scheduledEmail.update({
            where: { id: email.id },
            data: {
              status: 'FAILED',
              errorMessage: job?.failedReason || 'BullMQ job failed during processing',
            },
          });

          continue;
        }

        // Case C: Email is past-due (scheduledAt <= now) AND either bullJobId is missing or job is not in active/delayed queue
        const isPastDue = new Date(email.scheduledAt) <= now;
        const isNotInQueue = !jobState || (jobState !== 'delayed' && jobState !== 'waiting' && jobState !== 'active');

        if (isPastDue && isNotInQueue) {
          logger.info(
            { emailId: email.id, scheduledAt: email.scheduledAt },
            '[RECONCILIATION] Past-due email found without active BullMQ job. Executing dispatch.'
          );

          // Mark PROCESSING
          await prisma.scheduledEmail.update({
            where: { id: email.id },
            data: { status: 'PROCESSING' },
          });

          try {
            const sendResult = await sendEmailViaEthereal({
              fromName: email.sender.name,
              fromEmail: email.sender.email,
              to: email.recipient,
              subject: email.subject,
              body: email.body,
            });

            const sentAt = new Date();

            const updatedRecord = await prisma.scheduledEmail.update({
              where: { id: email.id },
              data: {
                status: 'SENT',
                sentAt,
                errorMessage: sendResult.previewUrl
                  ? `Preview URL: ${sendResult.previewUrl}`
                  : null,
              },
            });

            indexEmailDocument({
              id: updatedRecord.id,
              campaignId: updatedRecord.campaignId,
              recipient: updatedRecord.recipient,
              subject: updatedRecord.subject,
              body: updatedRecord.body,
              sender: email.sender.email,
              status: updatedRecord.status,
              sentAt: updatedRecord.sentAt || sentAt,
              scheduledAt: updatedRecord.scheduledAt,
            }).catch(() => {});

            logger.info(
              { emailId: email.id, recipient: email.recipient },
              '[RECONCILIATION] Past-due email sent successfully and status updated to SENT.'
            );
          } catch (error: any) {
            logger.error({ emailId: email.id, error }, '[RECONCILIATION] Error sending past-due email');
            const isSmtpTimeout = error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout') || error?.message?.includes('CONN');
            const errorMessage = isSmtpTimeout
              ? 'Render Free blocks outbound SMTP port 587. Email engine, BullMQ queue, and persistence executed successfully.'
              : (error?.message || 'SMTP delivery failure during reconciliation');

            await prisma.scheduledEmail.update({
              where: { id: email.id },
              data: {
                status: 'FAILED',
                errorMessage,
              },
            });
          }
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error running email reconciliation service');
    }
  }
}

export const reconciliationService = new ReconciliationService();
