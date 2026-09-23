import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { config } from '../config/env';

export class AuthController {
  async demoLogin(req: Request, res: Response) {
    const { email, name } = req.body;
    const result = await authService.demoLogin(email, name);
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
    return res.redirect(`${config.frontendUrl}/login?token=${token}`);
  }

  async logout(req: Request, res: Response) {
    return res.json({ message: 'Successfully logged out' });
  }
}

export const authController = new AuthController();
