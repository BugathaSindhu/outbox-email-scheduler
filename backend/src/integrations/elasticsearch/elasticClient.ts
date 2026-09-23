import { Client } from '@elastic/elasticsearch';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

const auth = process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
  ? { username: process.env.ELASTICSEARCH_USERNAME, password: process.env.ELASTICSEARCH_PASSWORD }
  : process.env.ELASTICSEARCH_API_KEY
  ? { apiKey: process.env.ELASTICSEARCH_API_KEY }
  : undefined;

export const elasticClient = new Client({
  node: config.elasticsearchUrl,
  auth,
  maxRetries: 3,
  requestTimeout: 10000,
});

const INDEX_NAME = 'emails';

export const initElasticsearch = async (): Promise<void> => {
  try {
    const exists = await elasticClient.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await elasticClient.indices.create({
        index: INDEX_NAME,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            campaignId: { type: 'keyword' },
            recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            subject: { type: 'text' },
            body: { type: 'text' },
            sender: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            status: { type: 'keyword' },
            sentAt: { type: 'date' },
            scheduledAt: { type: 'date' },
          },
        },
      });
      logger.info(`Elasticsearch index '${INDEX_NAME}' created`);
    } else {
      logger.info(`Elasticsearch index '${INDEX_NAME}' already exists`);
    }
  } catch (error) {
    logger.warn({ error }, 'Elasticsearch initialization failed (will degrade gracefully)');
  }
};

export interface EmailDocument {
  id: string;
  campaignId: string;
  recipient: string;
  subject: string;
  body: string;
  sender: string;
  status: string;
  sentAt?: string | Date;
  scheduledAt: string | Date;
}

export const indexEmailDocument = async (doc: EmailDocument): Promise<void> => {
  try {
    await elasticClient.index({
      index: INDEX_NAME,
      id: doc.id,
      refresh: 'wait_for',
      document: {
        ...doc,
        sentAt: doc.sentAt ? new Date(doc.sentAt).toISOString() : undefined,
        scheduledAt: new Date(doc.scheduledAt).toISOString(),
      },
    });
    logger.debug({ emailId: doc.id }, 'Indexed email document in Elasticsearch');
  } catch (error) {
    logger.warn({ error, emailId: doc.id }, 'Failed to index email document in Elasticsearch');
  }
};

export const searchEmailDocuments = async (query: string): Promise<EmailDocument[]> => {
  try {
    const response = await elasticClient.search({
      index: INDEX_NAME,
      query: {
        multi_match: {
          query,
          fields: ['recipient^3', 'subject^2', 'body', 'sender'],
          fuzziness: 'AUTO',
        },
      },
    });

    return response.hits.hits.map((hit: any) => hit._source as EmailDocument);
  } catch (error) {
    logger.warn({ error, query }, 'Elasticsearch search query failed');
    throw error;
  }
};
