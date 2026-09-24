import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { userRepository } from '../repositories/user.repository';
import { User } from '@prisma/client';

export class AuthService {
  generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async signup(name: string, email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string; senderId: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      const error: any = new Error('An account with this email already exists.');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
    });

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
    return { user: this.sanitizeUser(user), token, senderId: sender.id };
  }

  async login(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string; senderId: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (!user.passwordHash) {
      const error: any = new Error('This account uses Google Sign-In. Please continue with Google.');
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

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
    return { user: this.sanitizeUser(user), token, senderId: sender.id };
  }

  async demoLogin(email: string = 'demo@outboxlabs.io', name: string = 'Demo User'): Promise<{ user: Omit<User, 'passwordHash'>; token: string; senderId: string }> {
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
    return { user: this.sanitizeUser(user), token, senderId: sender.id };
  }

  verifyToken(token: string): any {
    return jwt.verify(token, config.jwtSecret);
  }
}

export const authService = new AuthService();
