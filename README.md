# Outbox — Production Email Scheduling Platform

Production-grade, high-throughput email scheduling SaaS platform built with **React**, **TypeScript**, **Node.js**, **Express**, **MySQL (Prisma ORM)**, **Redis**, **BullMQ**, **Ethereal SMTP**, **Elasticsearch**, **Google OAuth**, **Email/Password Auth**, and **Slack Integration**.

---

## 1. How to Run Backend & Infrastructure

The backend comprises an Express API server, Prisma ORM targeting MySQL, Redis for BullMQ queue management and atomic rate limiting, dedicated BullMQ queue workers, and Elasticsearch for fast log queries.

### Prerequisites
- **Node.js**: v18.x or >= v20.x
- **Docker & Docker Compose** (for running MySQL, Redis, and Elasticsearch locally)

### Step-by-Step Instructions

1. **Navigate to Backend Directory & Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` in the `backend` directory:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and optional Ethereal credentials are set. See Section 3 for the complete reference).*

3. **Start Local Infrastructure (MySQL, Redis, Elasticsearch)**:
   From the project root:
   ```bash
   docker compose up -d mysql redis elasticsearch
   ```

4. **Initialize & Push Database Schema (Prisma)**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Backend Server & BullMQ Worker**:
   - **Development Mode** (Runs Express API and BullMQ worker concurrently with hot reload):
     ```bash
     npm run dev
     ```
   - **Production Build & Execution**:
     ```bash
     npm run build
     npm start
     ```

6. **Verify Backend Health & Queue Monitor**:
   - **Health Endpoint**: `http://localhost:5000/api/health`
   - **Bull Board Queue Dashboard**: `http://localhost:5000/admin/queues`

---

## 2. How to Run Frontend

The frontend is built with React 18, Vite, TypeScript, and Tailwind CSS following the Stitch Outbox Dark Navy visual specification.

1. **Navigate to Frontend Directory & Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment Variables**:
   Create `.env` in `frontend/`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The frontend application will start at `http://localhost:3000` (or `http://localhost:5173`).

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 3. How to Set Up Ethereal Email & Environment Variables

Outbox uses **Nodemailer** paired with **Ethereal SMTP** (`smtp.ethereal.email`) for safe email dispatches. Ethereal captures outgoing emails without sending real messages to live recipients, generating viewable web preview URLs for testing and verification.

### Ethereal Setup Options

1. **Option A: Auto-Creation (Zero Configuration)**:
   - If `ETHEREAL_USER` and `ETHEREAL_PASS` are left empty in `backend/.env`, Nodemailer automatically creates a test account on backend server startup:
     ```
     No Ethereal credentials found in env. Auto-creating test account...
     Ethereal test account created successfully: user@ethereal.email
     ```
2. **Option B: Manual Ethereal Credentials**:
   - Visit [ethereal.email](https://ethereal.email) and click **Create Ethereal Account**.
   - Copy the generated SMTP username and password into `backend/.env`:
     ```env
     ETHEREAL_USER=your_ethereal_username@ethereal.email
     ETHEREAL_PASS=your_ethereal_password
     ```

### Complete Environment Variables Reference

#### Backend Environment Variables (`backend/.env`)
```env
# Server Config
PORT=5000
NODE_ENV=development
JWT_SECRET=super-secret-outbox-jwt-key-2026

ADMIN_DASHBOARD_USER=admin
ADMIN_DASHBOARD_PASSWORD=Sindhu@2005

# URLs
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Databases
DATABASE_URL="mysql://avnadmin:AVNS_4fcd_Np1ZrdIteuTc_k@outbox-mysql-bugathasindhu-89ec.f.aivencloud.com:16896/defaultdb?ssl-mode=REQUIRED"
REDIS_URL="rediss://default:gQAAAAAABH8HAAIgcDIyMzdjNzQwNmYzYTk0Yzk1YTRmMDE0M2NjM2ZkNThjMQ@thankful-chipmunk-294663.upstash.io:6379"

# Elasticsearch
ELASTICSEARCH_URL=https://my-elasticsearch-project-d1f0a3.es.asia-south1.gcp.elastic.cloud:443
ELASTICSEARCH_API_KEY=LXBOQXo2QUJVaGpRd1pUY0l5SjE6U3kxLXR5QVQ0djRYeE52NDNzTGVqQQ==

# Nodemailer / Ethereal SMTP
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=
ETHEREAL_PASSWORD=

# Google OAuth
GOOGLE_CLIENT_ID=362372395714-q71rq44bom4tmjd36ir0s01b3f0ul1ip.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Slack OAuth
SLACK_CLIENT_ID=12127587352321.12134218221377
SLACK_CLIENT_SECRET=a86a7c10f23d8a8db5ca757c561a024e
SLACK_REDIRECT_URI=http://localhost:5000/api/slack/callback

# Worker Configuration
WORKER_CONCURRENCY=5
DEFAULT_EMAIL_DELAY_SECONDS=2
DEFAULT_HOURLY_LIMIT=100
```

#### Frontend Environment Variables (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    React + TypeScript Dashboard                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / REST API
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

### How Scheduling Works
1. **API Schedule Request**: When a user submits a campaign on the Compose page, `POST /api/emails/schedule` accepts:
   - Recipient list, subject, body, target `startTime` (ISO string), `delaySeconds` (min delay between individual sends), and `hourlyLimit`.
2. **DB Record & Job Creation**:
   - A `Campaign` record and individual `ScheduledEmail` rows are created in MySQL with initial status `SCHEDULED`.
   - Each email is assigned a unique `idempotencyKey` (`md5(campaignId + ":" + recipient + ":" + index)`).
   - For each recipient, a delayed BullMQ job is enqueued with a calculated delay:
     $$\text{delayMs} = \max(0, \text{startTime.getTime()} - \text{now}) + (i \times \text{delaySeconds} \times 1000)$$
3. **BullMQ Execution**:
   - Dedicated BullMQ workers listen to the queue and execute dispatches asynchronously when delayed timers expire.

### How Persistence on Restart is Handled
- **MySQL as Single Source of Truth**: All campaign metadata and email statuses (`SCHEDULED`, `PROCESSING`, `SENT`, `FAILED`, `RESCHEDULED`) are saved synchronously to MySQL.
- **Worker Crash Recovery & Reconciliation Service**:
  - On backend server startup, `ReconciliationService` scans MySQL for past-due emails marked `SCHEDULED` or `RESCHEDULED`.
  - It checks whether an active job already exists in BullMQ for each record.
  - If no active job exists (e.g. server crashed while job was pending), the service automatically re-enqueues a delayed BullMQ job targeting immediate execution.
  - Completed dispatches (`SENT`) remain permanently stored in MySQL.

### How Rate Limiting & Concurrency are Implemented
1. **Distributed Rate Limiting (Redis Atomic Counters)**:
   - Rate limits are scoped per sender per hour using Redis keys: `rate-limit:{senderId}:{YYYY-MM-DD-HH}`.
   - Before dispatching an email, the BullMQ worker executes an atomic `INCR` command in Redis.
   - The key TTL is automatically set to 7200 seconds (`EXPIRE`).
   - If the counter exceeds `hourlyLimit`:
     - The counter is rolled back using `DECR`.
     - The email status in MySQL is updated to `RESCHEDULED`.
     - The scheduled time is set to the top of the next UTC hour.
     - A new delayed BullMQ job targeting the top of the next hour is enqueued.
     - A Slack alert is posted via webhook if Slack is connected.
2. **Worker Concurrency Control**:
   - BullMQ workers operate with explicit concurrency settings (`concurrency: 5`), processing jobs asynchronously without blocking Express API handlers or main thread loops.

---

## 5. List of Features Implemented

### Backend Features
- **Queue & Scheduler Engine**: BullMQ delayed job processing backed by Redis state durability.
- **Persistence & Recovery**: MySQL database schema via Prisma ORM with startup reconciliation service for crash recovery.
- **Distributed Rate Limiting**: Redis atomic counter (`INCR`/`DECR`) hourly limits with automatic rollover to top of next hour.
- **Concurrency**: Controlled worker concurrency (`concurrency: 5`) for non-blocking asynchronous email processing.
- **Idempotency Control**: Unique MD5 idempotency keys preventing duplicate email sends.
- **SMTP Email Delivery**: Nodemailer integration with Ethereal SMTP auto-creation and preview URL tracking.
- **Telemetry & Search**: Elasticsearch integration indexing sent dispatches for sub-second full text recipient/subject queries.
- **Slack Alerting**: OAuth 2.0 Slack integration posting instant notifications when hourly rate limits are exceeded.
- **Authentication**: Dual Google OAuth 2.0 and Email/Password authentication with HttpOnly JWT session cookies.
- **Queue Monitor**: Integrated Bull Board interface (`/admin/queues`) with basic auth protection.

### Frontend Features
- **Design System**: Complete implementation of Outbox Dark Navy design spec (`Stitch UI`) built with Tailwind CSS.
- **Authentication Pages**:
  - **Login Page**: Split-panel design supporting Email + Password, Google OAuth, and Instant Demo login.
  - **Signup Page**: Registration form with password validation and OAuth support.
- **Dashboard Page**:
  - Summary stats cards (Scheduled, Sent, Failed, Active Senders).
  - Controls bar with live search input, Status filter (`Scheduled`, `Processing`, `Sent`, `Failed`), and Date filter (`Today`, `Tomorrow`, `Upcoming`).
  - View switcher tabs (`Scheduled Queue`, `Sent History`, `Search Results`).
- **Compose Email Page**:
  - Drag-and-drop CSV file uploader (`papaparse`) with email validation and recipient count preview.
  - Manual recipient fallback input.
  - Rich text formatting editor toolbar.
  - Sticky Email Summary card calculating real-time dispatch parameters.
  - Dispatch controls for start time, minimum delay, and hourly rate limits.
- **Data Tables & Modals**:
  - Interactive tables with hover states, uppercase headers, and status badges.
  - Detail inspection modal displaying full email headers, body content, and clickable Ethereal SMTP web preview links.
- **Sidebar & Shell Navigation**:
  - Fixed sidebar (`w-60`) with dynamic counter badges for pending, sent, and failed dispatches.
  - Direct links to Compose, Dashboard, Slack integration toggle, and external Bull Board dashboard.

---

## 6. Automated Testing

Run the backend Jest test suite covering scheduling, rate limiting, idempotency, and authentication:

```bash
cd backend
npm test
```
