// src/workers/email.worker.ts
import { Worker, QueueScheduler } from 'bullmq';
import { sendMailWithRetry } from '../utils/mailer';

const connection = { connectionString: process.env.REDIS_URL || 'redis://127.0.0.1:6379' };

// ensure stalled jobs are reprocessed
new QueueScheduler('emails', { connection });

const worker = new Worker('emails', async job => {
  if (job.name === 'welcome') {
    const { to, username } = job.data;
    // Reuse your sendMailWithRetry helper from mailer
    const mailOptions = {/* build options: to, subject, html/text from template */};
    // you already export sendMailWithRetry — use it to keep retry logic consistent
    await sendMailWithRetry(mailOptions);
    return { ok: true };
  }

  // handle other job types similarly
}, {
  connection,
  concurrency: Number(process.env.EMAIL_WORKER_CONCURRENCY || 5),
});

// optional logging
worker.on('completed', job => console.log('Job completed', job.id));
worker.on('failed', (job, err) => console.error('Job failed', job.id, err));