import { Request, Response, NextFunction } from 'express';
import supportService from '../services/support.service';
import { sendSuccess, sendBadRequest } from '../utils/helper';

class SupportController {
  async sendSupportMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return sendBadRequest(res, 'Missing required fields: name, email, subject, message');
      }

      // Basic validation
      if (typeof name !== 'string' || typeof email !== 'string' || typeof subject !== 'string' || typeof message !== 'string') {
        return sendBadRequest(res, 'Invalid field types');
      }

      // Enqueue the message for background sending
      supportService.enqueue({ name, email, subject, message });

      return sendSuccess(res, null, 'Support message received. Our team will contact you shortly.', 202);
    } catch (err) {
      return next(err);
    }
  }
}

export default new SupportController();
