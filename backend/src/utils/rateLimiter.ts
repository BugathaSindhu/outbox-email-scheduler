import { redisConnection } from '../config/redis';
import { logger } from './logger';

export interface RateLimitResult {
  allowed: boolean;
  currentCount?: number;
  rescheduleTime?: Date;
}

export const checkAndIncrementHourlyRateLimit = async (
  senderId: string,
  hourlyLimit: number
): Promise<RateLimitResult> => {
  const now = new Date();
  const dateHourStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`;
  const key = `rate-limit:${senderId}:${dateHourStr}`;

  try {
    const currentCount = await redisConnection.incr(key);

    if (currentCount === 1) {
      // Set 2 hours TTL on new key
      await redisConnection.expire(key, 7200);
    }

    if (currentCount > hourlyLimit) {
      // Limit exceeded: rollback counter increment
      await redisConnection.decr(key);

      // Calculate start of next UTC hour
      const nextHour = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours() + 1,
          0,
          0,
          0
        )
      );

      logger.warn(
        { senderId, hourlyLimit, currentCount: currentCount - 1, nextHour },
        'Hourly rate limit reached for sender. Rescheduling job.'
      );

      return {
        allowed: false,
        rescheduleTime: nextHour,
      };
    }

    return {
      allowed: true,
      currentCount,
    };
  } catch (error) {
    logger.error({ error, senderId }, 'Error checking Redis rate limit, failing open');
    return { allowed: true };
  }
};
