import { Request, Response, NextFunction } from 'express';
import feedbackService from '../services/feedback.service';
import { sendSuccess, sendBadRequest } from '../utils/helper';

class FeedbackController {
  // POST /api/feedback
  async submitFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, rating, message } = req.body;

      if (!rating || !message) {
        return sendBadRequest(res, 'rating and message are required');
      }

      // Validate rating
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return sendBadRequest(res, 'rating must be an integer between 1 and 5');
      }

      // Limit message length (frontend will limit words, but enforce on backend)
      const maxChars = 2000;
      if (typeof message !== 'string' || message.length > maxChars) {
        return sendBadRequest(res, `message must be a string up to ${maxChars} characters`);
      }

      const saved = await feedbackService.submitFeedback({ name, email, rating: r, message });
      return sendSuccess(res, saved, 'Feedback submitted', 201);
    } catch (err) {
      return next(err);
    }
  }

  // GET /api/feedback?page=1&limit=20  (admin only perhaps)
  async listFeedbacks(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Number(req.query.limit) || 20);
      const data = await feedbackService.listFeedbacks(page, limit);
      return sendSuccess(res, data, 'Feedback list retrieved');
    } catch (err) {
      return next(err);
    }
  }
}

export default new FeedbackController();
