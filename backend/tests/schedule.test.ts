import request from 'supertest';
import app from '../src/app';
import { redisConnection } from '../src/config/redis';

describe('Health & Auth API Endpoints', () => {
  afterAll(async () => {
    try {
      await redisConnection.quit();
    } catch {
      // Ignore disconnect error in offline test environment
    }
  });

  it('GET /api/health should return health status object', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status === 200 || res.status === 503).toBe(true);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('services');
  });

  it('POST /api/emails/schedule should reject requests without auth header', async () => {
    const res = await request(app)
      .post('/api/emails/schedule')
      .send({ recipients: [] });

    expect(res.status).toBe(401);
  });
});
