import express from 'express';
import cors from 'cors';
import passport from 'passport';
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

// Middleware
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
configureGoogleOAuth();
app.use(passport.initialize());

// Bull Board UI
app.use('/admin/queues', serverAdapter.getRouter());

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);

// Error Handler
app.use(errorHandler);

export default app;
