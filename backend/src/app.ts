import express from 'express';
import cors from 'cors';
import passport from 'passport';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import basicAuth from 'express-basic-auth';
import { config } from './config/env';
import { configureGoogleOAuth } from './integrations/google/googleOAuth';
import { serverAdapter } from './queues/email.queue';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import campaignRoutes from './routes/campaign.routes';
import emailRoutes from './routes/email.routes';
import slackRoutes from './routes/slack.routes';
import healthRoutes from './routes/health.routes';

const app = express();

// Security Headers & Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
configureGoogleOAuth();
app.use(passport.initialize());

const OUTBOX_BULL_BOARD_THEME = `<style id="outbox-bull-board-theme">
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  :root {
    --menu-width: 250px !important;
    --header-height: 64px !important;
    --completed: #137333 !important;
    --active: #1a73e8 !important;
    --waiting: #b06000 !important;
    --failed: #c5221f !important;
    --delayed: #7e22ce !important;
    --paused: #5f6368 !important;
  }

  body {
    background-color: #f8fafc !important;
    color: #0b1c30 !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  }

  /* Outbox Brand Header Overrides */
  .Qp5xkm {
    background-color: #0b1c30 !important;
    border-bottom: 1px solid rgba(115, 118, 134, 0.3) !important;
    height: 64px !important;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
  }

  .Qp5xkm > .KmtwbG {
    background-color: #0b1c30 !important;
    border-bottom: none !important;
    box-shadow: none !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 1.15rem !important;
    letter-spacing: -0.02em !important;
    width: 250px !important;
    padding-left: 1.25rem !important;
  }

  /* Left Sidebar Overrides */
  .KM3iIV {
    background: #0b1c30 !important;
    border-right: 1px solid rgba(115, 118, 134, 0.2) !important;
    box-shadow: none !important;
    top: 64px !important;
    width: 250px !important;
  }

  .KM3iIV ._SQRTj {
    color: #94a3b8 !important;
    font-size: 0.75rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    font-weight: 600 !important;
    padding: 0.75rem 1.25rem 0.25rem !important;
  }

  .xQ9Bfk a {
    color: #cbd5e1 !important;
    font-weight: 500 !important;
    font-size: 0.9rem !important;
    border-left: 3px solid transparent !important;
    padding: 0.75rem 1.25rem !important;
    transition: all 0.15s ease !important;
  }

  .xQ9Bfk a:hover {
    background-color: rgba(255, 255, 255, 0.06) !important;
    color: #ffffff !important;
  }

  .xQ9Bfk a.xIyUVd {
    background-color: #2563eb !important;
    color: #ffffff !important;
    border-left-color: #60a5fa !important;
    font-weight: 600 !important;
    border-radius: 6px !important;
    margin: 0.25rem 0.75rem !important;
    padding: 0.6rem 1rem !important;
  }

  /* Main View Area */
  main {
    padding-left: 250px !important;
    background-color: #f8fafc !important;
    min-height: calc(100vh - 64px) !important;
  }

  main > div {
    padding: 1.5rem 2rem !important;
  }

  /* Input fields */
  .NaAPYH.NaAPYH {
    background-color: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    color: #0b1c30 !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  }

  .NaAPYH.NaAPYH:focus, .NaAPYH.NaAPYH:active {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
  }

  /* Cards & Containers */
  .xk3VMI {
    background-color: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04) !important;
  }

  /* Action Buttons */
  .AisLsJ {
    border-radius: 8px !important;
    font-weight: 500 !important;
    font-size: 0.875rem !important;
    transition: all 0.15s ease !important;
  }

  .AisLsJ.cdc4_x {
    background-color: #2563eb !important;
    color: #ffffff !important;
  }

  .AisLsJ.cdc4_x:hover {
    background-color: #004ac6 !important;
  }

  /* Status Badges */
  span[class*="completed"], span[class*="Completed"] {
    background-color: #e6f4ea !important;
    color: #137333 !important;
    font-weight: 600 !important;
  }

  span[class*="active"], span[class*="Active"] {
    background-color: #e8f0fe !important;
    color: #1a73e8 !important;
    font-weight: 600 !important;
  }

  span[class*="waiting"], span[class*="Waiting"] {
    background-color: #fef7e0 !important;
    color: #b06000 !important;
    font-weight: 600 !important;
  }

  span[class*="failed"], span[class*="Failed"] {
    background-color: #fce8e6 !important;
    color: #c5221f !important;
    font-weight: 600 !important;
  }

  span[class*="delayed"], span[class*="Delayed"] {
    background-color: #f3e8ff !important;
    color: #7e22ce !important;
    font-weight: 600 !important;
  }

  /* JSON / Log Viewers */
  pre, code, .hljs {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    background-color: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 8px !important;
    color: #0f172a !important;
  }
</style>`;

// Protected & Styled Bull Board UI
app.use('/admin/queues', (req, res, next) => {
  const adminUser = config.admin.user;
  const adminPass = config.admin.password;

  if (!adminPass) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Admin"');
    return res.status(401).send('Admin authentication credentials required.');
  }

  const originalSend = res.send;
  res.send = function (body?: any): any {
    if (typeof body === 'string' && body.includes('<!doctype html>')) {
      body = body.replace('</head>', `${OUTBOX_BULL_BOARD_THEME}</head>`);
    }
    return originalSend.call(this, body);
  };

  return basicAuth({
    authorizer: (username: string, password: string) => {
      const cleanUser = username ? username.trim() : '';
      const cleanPass = password ? password.trim() : '';
      const userMatches = basicAuth.safeCompare(cleanUser, adminUser);
      const passMatches = basicAuth.safeCompare(cleanPass, adminPass);
      return userMatches && passMatches;
    },
    challenge: true,
    realm: 'Bull Board Admin',
  })(req, res, next);
}, serverAdapter.getRouter());

// Google Search Console Site Verification Root Route
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="google-site-verification" content="CgxReVpHm4D0qQl7THZ_z8s8R5xgdS3C1jCTgtb3YfI" />
    <title>Outbox Backend API Service</title>
</head>
<body>
    <h1>Outbox Backend API Service</h1>
    <p>Status: Active</p>
</body>
</html>`);
});

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);

// Error Handler
app.use(errorHandler);

export default app;
