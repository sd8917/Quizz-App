import { Worker } from 'bullmq';
/* QueueScheduler is not exported in the installed bullmq typings; require it at runtime to avoid the TypeScript error */
const QueueScheduler = require('bullmq').QueueScheduler;
import { getRedisConnectionOptions } from '../utils/redis';
import { sendMailWithRetry } from '../utils/mailer';
import { getWelcomeEmailTemplate } from '../utils/emailTemplate';

const redisOpts = getRedisConnectionOptions();
const connection: any = {
  host: redisOpts.host,
  port: redisOpts.port,
};
if (redisOpts.username) connection.username = redisOpts.username;
if (redisOpts.password) connection.password = redisOpts.password;

// Ensure stalled jobs are recovered
new QueueScheduler('emails', { connection });

const worker = new Worker('emails', async (job) => {
  if (job.name === 'welcome' || job.name === 'default') {
    const { to, username } = job.data as { to: string; username: string };
    const { html, subject } = getWelcomeEmailTemplate(username, {
      websiteUrl: process.env.WEBSITE_URL || 'http://localhost:8000/api',
      companyName: 'Triviaverse',
    });

    const mailOptions = {
      from: `"Triviaverse" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: `Welcome to Triviaverse, ${username}! Visit ${process.env.WEBSITE_URL || 'http://localhost:8000/api'} to get started.`,
    };

    // use the central retry helper
    const result = await sendMailWithRetry(mailOptions);
    if (!result.ok) {
      throw result.error || new Error('Failed to send welcome email');
    }
    return { ok: true };
  }

  // Unknown job type
  return { ok: false, reason: 'unknown job' };
}, { connection, concurrency: Number(process.env.EMAIL_WORKER_CONCURRENCY || 5) });

worker.on('completed', (job) => {
  console.log('Email job completed', job.id, job.name);
});

worker.on('failed', (job, err) => {
  console.error('Email job failed', job?.id, job?.name, err && err.message);
});

console.log('Email worker started with Redis at', redisOpts.host + ':' + redisOpts.port);
