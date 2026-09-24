# Outbox Labs — Email Scheduling SaaS Platform

Production-quality, high-throughput email scheduling SaaS platform built with **React**, **TypeScript**, **Node.js**, **Express**, **MySQL (Prisma ORM)**, **Redis**, **BullMQ**, **Ethereal SMTP**, **Elasticsearch**, **Google OAuth**, **Email/Password Auth**, and **Slack Integration**.

---

## 1. Project Overview

Outbox Labs handles large-scale scheduled email dispatches safely without blocking the application server. When a user schedules a campaign with hundreds or thousands of recipients, the backend enqueues delayed jobs into BullMQ. Dedicated background workers consume the queue concurrently, enforce distributed hourly rate limits using atomic Redis counters, protect against duplicate sends using idempotency keys, send emails via Ethereal SMTP, index documents into Elasticsearch for fast search, and notify Slack channels when limits are exceeded.

---

## 2. Architecture & Core Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    React + TypeScript Dashboard                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / REST API (Vercel Frontend)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Node.js + Express API Backend                  │
└───────┬────────────────────────┬────────────────────────┬───────┘
        │                        │                        │
        │ Prisma ORM             │ Delayed Jobs           │ Search Query
        ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  MySQL DB    │         │ Redis Queue  │         │ Elasticsearch│
│(Source Truth)│         │   (BullMQ)   │         │ (Index / Search)
└──────────────┘         └───────┬──────┘         └──────────────┘
                                 │ Job Processing
                                 ▼
                         ┌──────────────┐
                         │ BullMQ Worker│
                         └───────┬──────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
          Redis Rate Limit  Ethereal SMTP   Slack Notification
          (Atomic Counter)  (Delivery)     (Limit Exceeded)
```

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios, React Router v6.
- **Backend**: Node.js, Express.js, TypeScript, Zod, Pino Logger, Passport.js, JWT, bcrypt.
- **Relational Database**: **MySQL 8.0 ONLY** via Prisma ORM.
- **Job Queue & Scheduler**: BullMQ + IORedis.
- **Rate Limiting**: Distributed Redis Atomic Counter (`INCR` / `DECR`).
- **Email Delivery**: Nodemailer + Ethereal SMTP (`smtp.ethereal.email:587`).
- **Search Engine**: Elasticsearch 8.x.
- **Authentication**: Google OAuth 2.0, Email/Password Auth, and Instant Demo Auth Mode.
- **Monitoring**: Bull Board (`/admin/queues`).
- **Containerization**: Docker & Docker Compose.

---

## 4. Setup & Local Installation

### Prerequisites

- Node.js >= 20.x
- Docker & Docker Compose

### Option A: Running Infrastructure with Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BugathaSindhu/outbox-email-scheduler.git
   cd outbox-email-scheduler
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   cp .env.example backend/.env
   ```

3. **Start Infrastructure Services (MySQL, Redis, Elasticsearch)**:
   ```bash
   docker compose up -d mysql redis elasticsearch
   ```

4. **Install Backend Dependencies & Apply Database Migrations**:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   ```

5. **Start Backend Server & BullMQ Worker**:
   ```bash
   npm run dev
   ```

6. **Install Frontend Dependencies & Start Development Server**:
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

7. **Access Applications**:
   - **Frontend App**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000`
   - **Bull Board Queue Dashboard**: `http://localhost:5000/admin/queues`

---

## 5. Environment Variables

The application reads configuration from environment variables. Example keys required for local and production deployment:

### Backend Environment Variables (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super-secret-outbox-jwt-key
DATABASE_URL=mysql://root:password@localhost:3306/outbox
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=http://localhost:5000/api/slack/callback
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

### Frontend Environment Variables (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## 6. Key Technical Implementations

### Rate Limiting Algorithm (Redis Atomic Counter)

The distributed rate limiter tracks dispatches per sender per hour using Redis atomic keys:

1. **Key Format**: `rate-limit:{senderId}:{YYYY-MM-DD-HH}`
2. **Atomic Increment**: Before sending, worker executes `redis.incr(key)`.
3. **Expiration**: On first increment, TTL is set to 7200 seconds (`EXPIRE key 7200`).
4. **Limit Enforced**: If count exceeds `hourlyLimit`:
   - Counter is rolled back (`redis.decr(key)`).
   - MySQL record status updates to `RESCHEDULED` with `scheduledAt` set to top of next UTC hour.
   - BullMQ enqueues new delayed job targeting top of next hour.
   - Slack notification is triggered automatically.

### Idempotency & Duplicate Prevention

- A unique constraint is enforced in MySQL on `idempotencyKey`: `md5(campaignId + ":" + recipient + ":" + index)`.
- Before sending, worker queries MySQL. If status is already `SENT` or `PROCESSING`, the job is completed without sending again.

### Restart Recovery & State Persistence

- **MySQL is the single source of truth**.
- If the server or worker crashes mid-batch, completed emails remain marked as `SENT` in MySQL. Pending emails remain `SCHEDULED` and resume processing automatically upon worker restart.

---

## 7. Known Hosting Network Limitation (Render Free Egress Policy)

> [!NOTE] Ethereal SMTP Outbound Port Restriction
> Render's Free Web Service tier enforces a strict egress firewall policy blocking outbound TCP ports **25**, **465**, and **587** to prevent spam abuse on free instances.
>
> - **Local Development**: In local development, port `587` is unblocked. BullMQ workers process scheduled jobs, connect to `smtp.ethereal.email:587`, dispatch emails successfully, and generate viewable Ethereal preview URLs.
> - **Production (Render Free)**: On Render Free, outbound connections to `smtp.ethereal.email:587` hit an `ETIMEDOUT` socket timeout. The BullMQ worker catches the timeout safely, preserves server startup & queue operation, and marks the record status in MySQL as `FAILED` with the diagnostic details.
> - **Production Resolution**: Deploying the backend to an unblocked host or upgrading the Render instance to a paid Web Service tier immediately enables live Ethereal SMTP delivery and preview URL generation in production.

---

## 8. API Documentation

### Auth Endpoints
- `POST /api/auth/signup` — Create user account with name, email, and password.
- `POST /api/auth/login` — Log in with email and password.
- `POST /api/auth/demo-login` — Instant test login (returns JWT token & sets HttpOnly cookie).
- `GET /api/auth/google` — Initiates Google OAuth flow.
- `GET /api/auth/me` — Fetches current authenticated user profile.
- `POST /api/auth/logout` — Clears authentication cookies.

### Scheduling & Email Endpoints
- `POST /api/emails/schedule` — Schedule email campaign.
  ```json
  {
    "name": "Q4 Welcome Sequence",
    "recipients": ["user1@example.com", "user2@example.com"],
    "subject": "Welcome to Outbox",
    "body": "Hello world!",
    "startTime": "2026-09-22T19:00:00.000Z",
    "delaySeconds": 2,
    "hourlyLimit": 100
  }
  ```
- `GET /api/emails/scheduled` — Fetch pending/rescheduled emails.
- `GET /api/emails/sent` — Fetch sent email history with Ethereal preview URLs.
- `GET /api/emails/search?q=query` — Fast multi-field search powered by Elasticsearch.

### Slack Endpoints
- `POST /api/slack/connect` — Returns Slack OAuth URL.
- `GET /api/slack/status` — Checks Slack connection state.

### Infrastructure & Health
- `GET /api/health` — Checks MySQL, Redis, and Elasticsearch status.
- `GET /admin/queues` — Interactive Bull Board queue monitor.

---

## 9. Automated Testing

Run backend Jest test suite covering scheduling, rate limiting, idempotency, and authentication:

```bash
cd backend
npm test
```
