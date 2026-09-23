import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
});

prisma.$on('query' as never, (e: any) => {
  logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Prisma Query');
});
