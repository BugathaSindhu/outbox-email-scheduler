import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { User } from '@prisma/client';

export class AuthService {
  generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  async demoLogin(email: string = 'demo@outboxlabs.io', name: string = 'Demo User'): Promise<{ user: User; token: string; senderId: string }> {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser',
        },
      });
    }

    // Ensure user has at least one default Sender
    let sender = await prisma.sender.findFirst({ where: { userId: user.id } });
    if (!sender) {
      sender = await prisma.sender.create({
        data: {
          userId: user.id,
          name: `${user.name} (Ethereal)`,
          email: user.email,
          smtpHost: config.ethereal.host,
          smtpPort: config.ethereal.port,
          smtpUser: config.ethereal.user || '',
          smtpPassword: config.ethereal.password || '',
        },
      });
    }

    const token = this.generateToken(user);
    return { user, token, senderId: sender.id };
  }

  verifyToken(token: string): any {
    return jwt.verify(token, config.jwtSecret);
  }
}

export const authService = new AuthService();
