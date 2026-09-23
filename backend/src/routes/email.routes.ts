import { Router } from 'express';
import { emailController } from '../controllers/email.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const scheduleEmailSchema = z.object({
  body: z.object({
    recipients: z.array(z.string().email('Invalid email address format')).min(1, 'At least one recipient email is required'),
    subject: z.string().min(1, 'Subject is required'),
    body: z.string().min(1, 'Email body is required'),
    name: z.string().optional(),
    startTime: z.string().or(z.date()).optional(),
    delaySeconds: z.number().min(0).optional(),
    hourlyLimit: z.number().min(1).optional(),
    senderId: z.string().optional(),
  }),
});

router.use(authenticateToken);

router.post(
  '/schedule',
  validateRequest(scheduleEmailSchema),
  (req, res, next) => emailController.scheduleEmails(req, res).catch(next)
);

router.get('/scheduled', (req, res, next) =>
  emailController.getScheduled(req, res).catch(next)
);

router.get('/sent', (req, res, next) =>
  emailController.getSent(req, res).catch(next)
);

router.get('/search', (req, res, next) =>
  emailController.searchEmails(req, res).catch(next)
);

export default router;
