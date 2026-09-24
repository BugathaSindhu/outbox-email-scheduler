import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

export interface EmailJobData {
  scheduledEmailId: string;
  campaignId: string;
  recipient: string;
  senderId: string;
  idempotencyKey: string;
}

export const EMAIL_QUEUE_NAME = 'emailQueue';

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue) as any],
  serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Outbox Queue Dashboard',
      miscLinks: [
        { text: '← Back to Outbox Dashboard', url: 'https://outbox-email-scheduler-omega.vercel.app/dashboard' },
      ],
    },
  },
});
