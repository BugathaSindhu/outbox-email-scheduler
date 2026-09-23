import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { slackService } from '../services/slack.service';

export class SlackController {
  async connect(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const authUrl = slackService.getAuthUrl(userId);
    return res.json({ url: authUrl });
  }

  async callback(req: Request, res: Response) {
    const { code, state } = req.query;

    if (code && state) {
      await slackService.handleCallback(code as string, state as string);
    }

    return res.send(`
      <html>
        <body>
          <h2>Slack connection complete!</h2>
          <p>You can close this window and return to your Outbox dashboard.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage('slack_connected', '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  }

  async disconnect(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    await slackService.disconnect(userId);
    return res.json({ message: 'Slack disconnected successfully' });
  }

  async getStatus(req: AuthenticatedRequest, res: Response) {
    const user = req.user;
    return res.json({
      connected: Boolean(user.slackAccessToken),
      channelId: user.slackChannelId || null,
    });
  }
}

export const slackController = new SlackController();
