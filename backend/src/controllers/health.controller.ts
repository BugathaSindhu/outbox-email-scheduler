import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { redisConnection } from '../config/redis';
import { elasticClient } from '../integrations/elasticsearch/elasticClient';

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ]);
};

export class HealthController {
  async getHealth(req: Request, res: Response) {
    let dbStatus = 'ok';
    let redisStatus = 'ok';
    let elasticStatus = 'ok';

    try {
      await withTimeout(prisma.$queryRaw`SELECT 1`, 1500);
    } catch {
      dbStatus = 'down';
    }

    try {
      if (redisConnection.status === 'ready') {
        await withTimeout(redisConnection.ping(), 1500);
      } else {
        redisStatus = 'down';
      }
    } catch {
      redisStatus = 'down';
    }

    try {
      await withTimeout(elasticClient.ping(), 1500);
    } catch {
      elasticStatus = 'degraded';
    }

    const healthy = dbStatus === 'ok' && redisStatus === 'ok';

    return res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        elasticsearch: elasticStatus,
      },
    });
  }
}

export const healthController = new HealthController();
