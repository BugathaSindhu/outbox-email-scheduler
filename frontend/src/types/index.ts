export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  slackAccessToken?: string;
  slackChannelId?: string;
  createdAt: string;
}

export interface Sender {
  id: string;
  name: string;
  email: string;
}

export interface Campaign {
  id: string;
  name: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  _count?: {
    scheduledEmails: number;
  };
}

export interface ScheduledEmail {
  id: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string | null;
  status: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RESCHEDULED';
  errorMessage?: string | null;
  idempotencyKey: string;
  createdAt: string;
  campaign?: Campaign;
  sender?: Sender;
}

export interface SlackStatus {
  connected: boolean;
  channelId?: string | null;
}
