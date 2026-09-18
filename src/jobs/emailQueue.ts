import { Queue } from 'bullmq';
import redis from '../config/redis';

export const emailQueue = new Queue('email-queue', { 
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5s, then 10s, then 20s between retries
    },
    removeOnComplete: true, // Clean up successful jobs to save memory
    removeOnFail: {
      count: 1000, // Keep last 1000 failed jobs (acts as a Dead Letter Queue)
    }
  }
});
