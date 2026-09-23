import axios from 'axios';
import { logger } from '../../utils/logger';

export const sendSlackNotification = async (
  accessToken: string | null,
  channelId: string | null,
  message: string,
  webhookUrl?: string | null
): Promise<void> => {
  if (!accessToken && !webhookUrl) {
    logger.info({ message }, 'Slack not connected for user. Skipping notification.');
    return;
  }

  // 1. Primary Strategy: Post via Incoming Webhook URL (Bypasses all channel membership errors)
  if (webhookUrl && webhookUrl.startsWith('https://hooks.slack.com/')) {
    try {
      await axios.post(webhookUrl, {
        text: message,
      });
      logger.info('Slack notification sent successfully via Incoming Webhook URL');
      return;
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Failed to post via Slack Incoming Webhook URL. Falling back to chat.postMessage.');
    }
  }

  // 2. Secondary Strategy: Post via Web API chat.postMessage
  if (accessToken) {
    const channelsToTry = [channelId, 'C0C3RHKTYRF', '#new-channel', '#general'].filter(Boolean) as string[];

    for (const channel of channelsToTry) {
      try {
        const postRes = await axios.post(
          'https://slack.com/api/chat.postMessage',
          {
            channel,
            text: message,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (postRes.data.ok) {
          logger.info({ channel }, `Slack notification sent successfully to ${channel}`);
          return;
        }

        // If error is 'not_in_channel', attempt auto-joining and retrying
        if (postRes.data.error === 'not_in_channel') {
          logger.info({ channel }, 'Bot not in channel. Attempting conversations.join...');
          try {
            await axios.post(
              'https://slack.com/api/conversations.join',
              { channel },
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            const retryRes = await axios.post(
              'https://slack.com/api/chat.postMessage',
              { channel, text: message },
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (retryRes.data.ok) {
              logger.info({ channel }, `Slack notification sent after joining ${channel}`);
              return;
            }
          } catch (joinErr: any) {
            logger.warn({ joinErr: joinErr.message, channel }, 'Could not join channel');
          }
        }
      } catch (err: any) {
        logger.warn({ err: err.message, channel }, 'Error attempting to post to channel');
      }
    }

    logger.warn({ channelId }, 'Slack notification failed across all channel targets');
  }
};
