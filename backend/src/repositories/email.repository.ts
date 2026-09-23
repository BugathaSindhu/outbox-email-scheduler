import { prisma } from '../config/database';
import { ScheduledEmail, ScheduledEmailStatus } from '@prisma/client';

export class EmailRepository {
  async findById(id: string): Promise<ScheduledEmail | null> {
    return prisma.scheduledEmail.findUnique({
      where: { id },
      include: { campaign: true, sender: true },
    });
  }

  async findScheduled(userId: string): Promise<ScheduledEmail[]> {
    return prisma.scheduledEmail.findMany({
      where: {
        campaign: { userId },
        status: { in: ['SCHEDULED', 'RESCHEDULED', 'PROCESSING'] },
      },
      orderBy: { scheduledAt: 'asc' },
      include: { campaign: true, sender: true },
    });
  }

  async findSent(userId: string): Promise<ScheduledEmail[]> {
    return prisma.scheduledEmail.findMany({
      where: {
        campaign: { userId },
        status: { in: ['SENT', 'FAILED'] },
      },
      orderBy: { sentAt: 'desc' },
      include: { campaign: true, sender: true },
    });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<ScheduledEmail | null> {
    return prisma.scheduledEmail.findUnique({
      where: { idempotencyKey },
    });
  }

  async createMany(
    dataArray: {
      campaignId: string;
      senderId: string;
      recipient: string;
      subject: string;
      body: string;
      scheduledAt: Date;
      idempotencyKey: string;
      bullJobId?: string;
    }[]
  ): Promise<ScheduledEmail[]> {
    const created: ScheduledEmail[] = [];
    for (const item of dataArray) {
      const email = await prisma.scheduledEmail.create({
        data: {
          campaignId: item.campaignId,
          senderId: item.senderId,
          recipient: item.recipient,
          subject: item.subject,
          body: item.body,
          scheduledAt: item.scheduledAt,
          idempotencyKey: item.idempotencyKey,
          bullJobId: item.bullJobId,
          status: 'SCHEDULED',
        },
      });
      created.push(email);
    }
    return created;
  }

  async updateStatus(
    id: string,
    status: ScheduledEmailStatus,
    extra?: { sentAt?: Date; errorMessage?: string; bullJobId?: string; scheduledAt?: Date }
  ): Promise<ScheduledEmail> {
    return prisma.scheduledEmail.update({
      where: { id },
      data: {
        status,
        ...(extra?.sentAt && { sentAt: extra.sentAt }),
        ...(extra?.errorMessage !== undefined && { errorMessage: extra.errorMessage }),
        ...(extra?.bullJobId && { bullJobId: extra.bullJobId }),
        ...(extra?.scheduledAt && { scheduledAt: extra.scheduledAt }),
      },
    });
  }

  async searchLike(query: string, userId: string): Promise<ScheduledEmail[]> {
    return prisma.scheduledEmail.findMany({
      where: {
        campaign: { userId },
        OR: [
          { recipient: { contains: query } },
          { subject: { contains: query } },
          { body: { contains: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { campaign: true, sender: true },
    });
  }
}

export const emailRepository = new EmailRepository();
