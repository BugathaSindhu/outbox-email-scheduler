import { Router } from 'express';
import { slackController } from '../controllers/slack.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/callback', (req, res, next) =>
  slackController.callback(req, res).catch(next)
);

router.use(authenticateToken);

router.post('/connect', (req, res, next) =>
  slackController.connect(req, res).catch(next)
);

router.post('/disconnect', (req, res, next) =>
  slackController.disconnect(req, res).catch(next)
);

router.get('/status', (req, res, next) =>
  slackController.getStatus(req, res).catch(next)
);

export default router;
