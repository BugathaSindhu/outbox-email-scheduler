import { prisma } from '../config/database';
import { Sender } from '@prisma/client';

export class SenderRepository {
  async findById(id: string): Promise<Sender | null> {
    return prisma.sender.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Sender[]> {
    return prisma.sender.findMany({ where: { userId } });
  }

  async create(data: {
    userId: string;
    name: string;
    email: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
  }): Promise<Sender> {
    return prisma.sender.create({
      data: {
        userId: data.userId,
        name: data.name,
        email: data.email,
        smtpHost: data.smtpHost || 'smtp.ethereal.email',
        smtpPort: data.smtpPort || 587,
        smtpUser: data.smtpUser || '',
        smtpPassword: data.smtpPassword || '',
      },
    });
  }
}

export const senderRepository = new SenderRepository();
