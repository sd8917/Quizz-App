import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import logger from './utils/logger';

const PORT = process.env.PORT || 8000;

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis (non-blocking - app continues if Redis fails)
    await connectRedis();
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        
        try {
          await disconnectRedis();
          logger.info('✅ Redis connection closed');
        } catch (error) {
          logger.error('❌ Error closing Redis:', error);
        }
        
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('❌ Unable to start the server:', error);
    process.exit(1);
  }
};

start();