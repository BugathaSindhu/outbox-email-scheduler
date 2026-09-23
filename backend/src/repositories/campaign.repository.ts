import { prisma } from '../config/database';
import { Campaign, CampaignStatus } from '@prisma/client';

export class CampaignRepository {
  async findById(id: string): Promise<Campaign | null> {
    return prisma.campaign.findUnique({
      where: { id },
      include: { scheduledEmails: true, user: true },
    });
  }

  async findByUserId(userId: string): Promise<Campaign[]> {
    return prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { scheduledEmails: true },
        },
      },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    startTime: Date;
    delaySeconds: number;
    hourlyLimit: number;
    status?: CampaignStatus;
  }): Promise<Campaign> {
    return prisma.campaign.create({
      data: {
        userId: data.userId,
        name: data.name,
        startTime: data.startTime,
        delaySeconds: data.delaySeconds,
        hourlyLimit: data.hourlyLimit,
        status: data.status || 'SCHEDULED',
      },
    });
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data: { status },
    });
  }
}

export const campaignRepository = new CampaignRepository();
