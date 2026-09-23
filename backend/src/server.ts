import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { setupEmailWorker } from './workers/email.worker';
import { initElasticsearch } from './integrations/elasticsearch/elasticClient';
import { reconciliationService } from './services/reconciliation.service';

const PORT = config.port;

const startServer = async () => {
  try {
    // 1. Initialize Elasticsearch index
    await initElasticsearch();

    // 2. Run initial database & BullMQ reconciliation for past-due/completed emails
    await reconciliationService.reconcileScheduledEmails();

    // 3. Initialize BullMQ email worker
    setupEmailWorker();

    // 4. Start Express app server
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Outbox Labs Backend Server running on port ${PORT}`);
      logger.info(`📊 Bull Board available at ${config.backendUrl}/admin/queues`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start backend server');
    process.exit(1);
  }
};

startServer();
