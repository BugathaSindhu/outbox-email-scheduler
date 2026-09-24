import { Router } from 'express';
import passport from 'passport';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { config } from '../config/env';
import { z } from 'zod';

const router = Router();

const demoLoginSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
  }),
});

router.post('/demo-login', validateRequest(demoLoginSchema), (req, res, next) =>
  authController.demoLogin(req, res).catch(next)
);

router.get('/me', authenticateToken, (req, res, next) =>
  authController.getMe(req, res).catch(next)
);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.frontendUrl}/login?error=auth_failed`,
  }),
  (req, res, next) => authController.googleCallback(req, res).catch(next)
);

router.post('/logout', (req, res, next) =>
  authController.logout(req, res).catch(next)
);

export default router;
