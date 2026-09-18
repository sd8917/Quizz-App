import { Worker, Job } from 'bullmq';
import redis from '../config/redis';
import logger from '../utils/logger';
import { 
  _sendChannelInviteEmail, 
  _sendWelcomeEmail, 
  _sendPasswordResetEmail, 
  _sendSupportEmail 
} from '../utils/mailer';

const worker = new Worker(
  'email-queue',
  async (job: Job) => {
    logger.info(`Processing email job ${job.id} of type ${job.name}`);
    try {
      switch (job.name) {
        case 'channel-invite':
          await _sendChannelInviteEmail(job.data.to, job.data.channelName, job.data.inviterName);
          break;
        case 'welcome':
          await _sendWelcomeEmail(job.data.to, job.data.username);
          break;
        case 'password-reset':
          await _sendPasswordResetEmail(job.data.to, job.data.username, job.data.resetUrl);
          break;
        case 'support':
          await _sendSupportEmail(job.data.fromName, job.data.fromEmail, job.data.subjectLine, job.data.messageBody);
          break;
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
      logger.info(`Successfully processed email job ${job.id}`);
    } catch (error) {
      logger.error(`Failed to process email job ${job.id}:`, error);
      throw error;
    }
  },
  { connection: redis as any }
);

worker.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} failed with error ${err.message}`);
});

export default worker;
