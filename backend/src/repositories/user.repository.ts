import { prisma } from '../config/database';
import { User } from '@prisma/client';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleId } });
  }

  async create(data: { googleId?: string; name: string; email: string; avatarUrl?: string }): Promise<User> {
    return prisma.user.create({ data });
  }

  async updateSlack(
    id: string,
    slackAccessToken: string | null,
    slackChannelId: string | null,
    slackWebhookUrl?: string | null
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        slackAccessToken,
        slackChannelId,
        ...(slackWebhookUrl !== undefined && { slackWebhookUrl }),
      },
    });
  }
}

export const userRepository = new UserRepository();
