import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

const isTls = config.redisUrl.startsWith('rediss://');

export const redisConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
  lazyConnect: process.env.NODE_ENV === 'test',
  retryStrategy: process.env.NODE_ENV === 'test' ? () => null : (times) => Math.min(times * 100, 3000),
});

redisConnection.on('connect', () => {
  logger.info(`Connected to Redis (${isTls ? 'TLS rediss://' : 'standard redis://'})`);
});

redisConnection.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.error({ err }, 'Redis connection error');
  }
});
