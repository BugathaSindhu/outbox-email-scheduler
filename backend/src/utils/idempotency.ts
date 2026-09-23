import crypto from 'crypto';

export const generateIdempotencyKey = (
  campaignId: string,
  recipient: string,
  index: number
): string => {
  const rawString = `${campaignId}:${recipient.trim().toLowerCase()}:${index}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
};
