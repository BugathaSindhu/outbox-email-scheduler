import { generateIdempotencyKey } from '../src/utils/idempotency';

describe('Idempotency Key Utility', () => {
  it('should generate consistent deterministic idempotency keys for same input', () => {
    const key1 = generateIdempotencyKey('camp_123', 'user@example.com', 0);
    const key2 = generateIdempotencyKey('camp_123', 'user@example.com', 0);

    expect(key1).toBe(key2);
    expect(key1).toHaveLength(32);
  });

  it('should generate different keys for different recipients or indices', () => {
    const key1 = generateIdempotencyKey('camp_123', 'user1@example.com', 0);
    const key2 = generateIdempotencyKey('camp_123', 'user2@example.com', 0);
    const key3 = generateIdempotencyKey('camp_123', 'user1@example.com', 1);

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
  });
});
