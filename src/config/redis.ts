import Redis from 'ioredis';
import logger from '../utils/logger';

let redis: Redis | null = null;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (err) => {
    logger.error('Redis connection error:', err.message);
    redis = null;
  });

} catch (error) {
  logger.error('Redis initialization failed:', error.message);
  redis = null;
}

export default redis;
