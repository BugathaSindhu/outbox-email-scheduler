import axios from 'axios';
import { config } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

export class SlackService {
  getAuthUrl(state?: string): string {
    const scopes = ['chat:write', 'channels:read', 'incoming-webhook'];
    const params = new URLSearchParams({
      client_id: config.slack.clientId,
      scope: scopes.join(','),
      redirect_uri: config.slack.redirectUri,
      state: state || '',
    });
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, userId: string): Promise<void> {
    if (!config.slack.clientId || !config.slack.clientSecret) {
      logger.warn('Slack client ID or secret missing in environment');
      return;
    }

    try {
      const response = await axios.post(
        'https://slack.com/api/oauth.v2.access',
        new URLSearchParams({
          client_id: config.slack.clientId,
          client_secret: config.slack.clientSecret,
          code,
          redirect_uri: config.slack.redirectUri,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data.ok) {
        const accessToken = response.data.access_token;
        const channelId = response.data.incoming_webhook?.channel_id || null;
        const webhookUrl = response.data.incoming_webhook?.url || null;

        await userRepository.updateSlack(userId, accessToken, channelId, webhookUrl);
        logger.info({ userId, channelId, hasWebhook: Boolean(webhookUrl) }, 'Slack account connected successfully');
      } else {
        logger.error({ data: response.data }, 'Slack OAuth exchange returned non-ok status');
      }
    } catch (error) {
      logger.error({ error }, 'Error in Slack OAuth token exchange');
    }
  }

  async disconnect(userId: string): Promise<void> {
    await userRepository.updateSlack(userId, null, null, null);
    logger.info({ userId }, 'Slack account disconnected');
  }
}

export const slackService = new SlackService();
