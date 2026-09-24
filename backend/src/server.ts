import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { setupEmailWorker } from './workers/email.worker';
import { initElasticsearch } from './integrations/elasticsearch/elasticClient';
import { reconciliationService } from './services/reconciliation.service';

const PORT = config.port;

const startServer = async () => {
  try {
    // 1. Start Express app server IMMEDIATELY so Render detects port binding without delay
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Outbox Labs Backend Server running on port ${PORT}`);
      logger.info(`📊 Bull Board available at ${config.backendUrl}/admin/queues`);
    });

    // 2. Initialize BullMQ email worker
    setupEmailWorker();

    // 3. Initialize Elasticsearch index asynchronously
    initElasticsearch().catch((error) => {
      logger.error({ error }, 'Elasticsearch initialization error');
    });

    // 4. Run background database & BullMQ reconciliation for past-due/completed emails asynchronously
    reconciliationService.reconcileScheduledEmails().catch((error) => {
      logger.error({ error }, 'Background email reconciliation error');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start backend server');
    process.exit(1);
  }
};

startServer();
