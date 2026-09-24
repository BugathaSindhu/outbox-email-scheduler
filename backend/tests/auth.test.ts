import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { redisConnection } from '../src/config/redis';

describe('Email/Password Auth Integration Tests', () => {
  const testEmail = `test_user_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  const testName = 'Test User';
  let authCookie: string;

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { startsWith: 'test_user_' } },
      });
      await redisConnection.quit();
    } catch {
      // Ignore disconnect error in test teardown
    }
  });

  it('should reject signup with short password (< 8 chars)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: testName,
        email: testEmail,
        password: 'short',
      });

    expect(res.status).toBe(400);
  });

  it('should successfully sign up a new user and return safe user without passwordHash', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: testName,
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();

    const cookies = res.headers['set-cookie'] as unknown as string[];
    authCookie = cookies.find((c: string) => c.startsWith('outbox_token=')) || '';
    expect(authCookie).toContain('outbox_token=');
  });

  it('should reject duplicate email signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: testName,
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already exists');
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('should successfully log in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.passwordHash).toBeUndefined();

    const cookies = res.headers['set-cookie'] as unknown as string[];
    authCookie = cookies.find((c: string) => c.startsWith('outbox_token=')) || '';
    expect(authCookie).toContain('outbox_token=');
  });

  it('should return current user for GET /api/auth/me using HttpOnly cookie', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('should clear authentication on logout', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();

    // Verify /api/auth/me fails after logout without cookie
    const meRes = await request(app).get('/api/auth/me');
    expect(meRes.status).toBe(401);
  });
});
