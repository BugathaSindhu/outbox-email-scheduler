import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const sanitizeSecret = (val?: string): string => {
  if (!val) return '';
  let str = String(val).trim();
  if (str.includes('=')) {
    const parts = str.split('=');
    if (parts[0].match(/^[A-Z0-9_]+$/i)) {
      str = parts.slice(1).join('=').trim();
    }
  }
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
};

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-outbox-jwt-key-2026',

  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  databaseUrl: sanitizeSecret(process.env.DATABASE_URL) || 'mysql://root:password@localhost:3306/outbox',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',

  ethereal: {
    host: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.ETHEREAL_PORT || '587', 10),
    user: process.env.ETHEREAL_USER || '',
    password: process.env.ETHEREAL_PASSWORD || '',
  },

  google: {
    clientId: sanitizeSecret(process.env.GOOGLE_CLIENT_ID),
    clientSecret: sanitizeSecret(process.env.GOOGLE_CLIENT_SECRET),
    callbackUrl: sanitizeSecret(process.env.GOOGLE_CALLBACK_URL) || (process.env.NODE_ENV === 'production' ? `${process.env.FRONTEND_URL || 'https://outbox-email-scheduler-omega.vercel.app'}/api/auth/google/callback` : 'http://localhost:5000/api/auth/google/callback'),
  },

  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/callback',
  },

  admin: {
    user: sanitizeSecret(process.env.ADMIN_DASHBOARD_USER || process.env.ADMIN_USERNAME) || 'admin',
    password: sanitizeSecret(process.env.ADMIN_DASHBOARD_PASSWORD || process.env.ADMIN_PASSWORD),
  },

  enableDemoLogin: process.env.ENABLE_DEMO_LOGIN !== undefined ? process.env.ENABLE_DEMO_LOGIN === 'true' : process.env.NODE_ENV !== 'production',

  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    defaultEmailDelaySeconds: parseInt(process.env.DEFAULT_EMAIL_DELAY_SECONDS || '2', 10),
    defaultHourlyLimit: parseInt(process.env.DEFAULT_HOURLY_LIMIT || '100', 10),
  },
};
