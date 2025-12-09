import { Request, Response, NextFunction } from "express";
import { AttemptService } from "../services/attempt.service";
import { sendSuccess, sendCreated, sendBadRequest } from '../utils/helper';

export class AttemptController {
  private attemptService = new AttemptService();

  submitQuizAttempt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { channelId } = req.params;
      const { answers } = req.body;
      const result = await this.attemptService.submitQuizAttempt(userId, channelId, answers);
      sendCreated(res, result, 'Quiz attempt submitted successfully');
    } catch (err: any) {
      // ApiError will be handled by the global error handler
      next(err);
    }
  };

  getUserAttempts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const attempts = await this.attemptService.getUserAttempts(userId);
      sendSuccess(res, attempts, 'User attempts retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelId } = req.params;
      const leaderboard = await this.attemptService.getLeaderboard(channelId);
      sendSuccess(res, {
        channelId,
        totalParticipants: leaderboard.length,
        leaderboard
      }, 'Leaderboard retrieved successfully');
    } catch (err) {
      next(err);
    }
  };
}
