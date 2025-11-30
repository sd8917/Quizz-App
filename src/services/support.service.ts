import { sendSupportEmail } from '../utils/mailer';

// Simple in-memory queue with retries and concurrency control
type SupportMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
  attempts?: number;
};

class SupportService {
  private queue: SupportMessage[] = [];
  private processing = false;
  private concurrency = 2;
  private active = 0;

  enqueue(payload: SupportMessage) {
    payload.attempts = 0;
    this.queue.push(payload);
    this.process();
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.active < this.concurrency) {
      const item = this.queue.shift()!;
      this.active++;
      this.sendWithRetry(item)
        .catch(err => console.error('Support email failed after retries:', err))
        .finally(() => { this.active--; });
    }

    this.processing = false;
  }

  private async sendWithRetry(item: SupportMessage) {
    const maxAttempts = 5;
    const baseDelay = 1000; // 1s
    while ((item.attempts || 0) < maxAttempts) {
      try {
        await this.sendNow(item);
        return;
      } catch (err) {
        item.attempts = (item.attempts || 0) + 1;
        const delay = baseDelay * Math.pow(2, item.attempts - 1);
        console.warn(`Support email send failed (attempt ${item.attempts}). Retrying in ${delay}ms.`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw new Error('Exceeded max send attempts');
  }

  private async sendNow(item: SupportMessage) {
    // Use project's mailer which applies templates and transporter
    await sendSupportEmail(item.name, item.email, item.subject, item.message);
  }
}

export default new SupportService();
