import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { bucketName, validateS3Config } from '../config/s3';
import logger from '../utils/logger';
import LogsService from './logs.service';

export class LogUploadService {
  private static logFiles = ['logs/combined.log', 'logs/error.log'];

  static async uploadLogs(): Promise<void> {
    logger.info('[✅ LogUploadService] Starting log upload to S3');

    // Validate S3 configuration before proceeding
    const configValidation = validateS3Config();
    if (!configValidation.isValid) {
      logger.error('[LogUploadService] S3 configuration validation failed:', configValidation.errors);
      throw new Error(`S3 configuration invalid: ${configValidation.errors.join(', ')}`);
    }

    const uploadPromises = this.logFiles.map((filePath) => {
      return new Promise<void>((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
          logger.warn(`Log file ${filePath} does not exist`);
          resolve();
          return;
        }

        const workerFile = process.env.NODE_ENV == "production" ? '../workers/logUploadWorker.js' : '../workers/logUploadWorker.ts'
        const worker = new Worker(path.join(__dirname, workerFile), {
          workerData: { filePath, bucketName },
        });

        worker.on('message', (message) => {
          if (message.success) {
            logger.info(`[✅ LogUploadService] Successfully uploaded ${filePath} to S3: ${message.data}`);
            // Delete the local file after successful upload
            const fileName = path.basename(filePath, '.log');
            LogsService.clearLogs(fileName).catch((error: any) => {
              logger.error(`❌ Failed to delete local file ${filePath} after upload: ${error.message}`);
            });
          } else {
            logger.error(`❌ [LogUploadService] Failed to upload ${filePath}: ${message.error}`);
          }
          resolve();
        });

        worker.on('error', (error) => {
          logger.error(`❌ Worker error for ${filePath}: ${error.message}`);
          reject(error);
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            logger.error(`❌ Worker stopped with exit code ${code} for ${filePath}`);
          }
        });
      });
    });

    try {
      await Promise.all(uploadPromises);
      logger.info('`[✅ LogUploadService] All log uploads completed');
    } catch (error) {
      logger.error('❌ Error during log uploads:', error);
    }
  }
}
