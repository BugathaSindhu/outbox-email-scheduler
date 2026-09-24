import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { config } from '../config/env';

export class AuthController {
  async demoLogin(req: Request, res: Response) {
    if (!config.enableDemoLogin) {
      return res.status(403).json({ error: 'Demo login is disabled in this environment' });
    }

    const { email, name } = req.body;
    const result = await authService.demoLogin(email, name);

    const isProd = config.nodeEnv === 'production';
    res.cookie('outbox_token', result.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      message: 'Demo login successful',
      user: result.user,
      token: result.token,
      senderId: result.senderId,
    });
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    return res.json({
      user: req.user,
    });
  }

  async googleCallback(req: Request, res: Response) {
    const user = req.user as any;
    if (!user) {
      return res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
    }

    const token = authService.generateToken(user);
    const isProd = config.nodeEnv === 'production';
    res.cookie('outbox_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.redirect(`${config.frontendUrl}/login`);
  }

  async logout(req: Request, res: Response) {
    const isProd = config.nodeEnv === 'production';
    res.clearCookie('outbox_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
    return res.json({ message: 'Successfully logged out' });
  }
}

export const authController = new AuthController();
