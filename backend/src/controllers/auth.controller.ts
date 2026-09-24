import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { config } from '../config/env';

export class AuthController {
  private setAuthCookie(res: Response, token: string) {
    const isProd = config.nodeEnv === 'production';
    res.cookie('outbox_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  async signup(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const result = await authService.signup(name, email, password);
      this.setAuthCookie(res, result.token);
      return res.status(201).json({
        message: 'Signup successful',
        user: result.user,
        token: result.token,
        senderId: result.senderId,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      return res.status(status).json({ error: error.message || 'Signup failed' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      this.setAuthCookie(res, result.token);
      return res.json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
        senderId: result.senderId,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      return res.status(status).json({ error: error.message || 'Login failed' });
    }
  }

  async demoLogin(req: Request, res: Response) {
    if (!config.enableDemoLogin) {
      return res.status(403).json({ error: 'Demo login is disabled in this environment' });
    }

    const { email, name } = req.body;
    const result = await authService.demoLogin(email, name);
    this.setAuthCookie(res, result.token);

    return res.json({
      message: 'Demo login successful',
      user: result.user,
      token: result.token,
      senderId: result.senderId,
    });
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const safeUser = authService.sanitizeUser(req.user);
    return res.json({
      user: safeUser,
    });
  }

  async googleCallback(req: Request, res: Response) {
    const user = req.user as any;
    if (!user) {
      return res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
    }

    const token = authService.generateToken(user);
    this.setAuthCookie(res, token);

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
