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

// Protected Bull Board UI
app.use('/admin/queues', (req, res, next) => {
  const adminUser = config.admin.user;
  const adminPass = config.admin.password;

  if (!adminPass) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Admin"');
    return res.status(401).send('Admin authentication credentials required.');
  }

  return basicAuth({
    users: { [adminUser]: adminPass },
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
