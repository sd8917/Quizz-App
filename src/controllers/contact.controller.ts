import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../services/contact.service';
import { ValidationError as AppValidationError } from '../utils/errors';
import { sendSuccess } from '../utils/helper';

const contactService = new ContactService();

/**
 * Send a support request email
 * Only accessible by authenticated users
 */
export const sendSupportRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, message } = req.body;
    const user = req.user;

    // Validate required fields
    if (!email || !message) {
      return next(new AppValidationError('Email and message are required'));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new AppValidationError('Please provide a valid email address'));
    }

    // Validate message length
    if (message.trim().length < 10) {
      return next(new AppValidationError('Message must be at least 10 characters long'));
    }

    if (message.length > 5000) {
      return next(new AppValidationError('Message must not exceed 5000 characters'));
    }

    // Get username from authenticated user
    const username = user?.username || 'Unknown User';

    const result = await contactService.sendSupportRequest({
      email,
      message: message.trim(),
      username,
    });

    sendSuccess(res, null, result.message);
  } catch (error: any) {
    return next(error);
  }
};
