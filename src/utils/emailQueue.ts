// src/utils/emailQueue.ts
import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from './redis';

const redisOpts = getRedisConnectionOptions();
const connection: any = {
  host: redisOpts.host,
  port: redisOpts.port,
};

if (redisOpts.username) connection.username = redisOpts.username;
if (redisOpts.password) connection.password = redisOpts.password;

export const emailQueue = new Queue('emails', { connection });

export async function enqueueWelcomeEmail(to: string, username: string) {
  await emailQueue.add('welcome', { to, username }, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 500 },
    removeOnComplete: 1000,
    removeOnFail: 1000
  });
}