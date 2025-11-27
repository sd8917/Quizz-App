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
      if (err.message === 'You have already submitted this quiz.') {
        return sendBadRequest(res, err.message);
      }
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
      const result = await this.attemptService.getLeaderboard(channelId);
      
      sendSuccess(res, {
        channelId,
        totalParticipants: result.totalParticipants,
        leaderboard: result.leaderboard,
        cached: result.cached,
        cacheInfo: result.cached ? 'Served from Redis cache' : 'Served from database and cached'
      }, 'Leaderboard retrieved successfully');
    } catch (err) {
      next(err);
    }
  };
}
