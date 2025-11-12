import { Request, Response } from "express";
import { AttemptService } from "../services/attempt.service";

export class AttemptController {
  private attemptService = new AttemptService();

  submitQuizAttempt = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { channelId } = req.params;
      const { answers } = req.body;
      const result = await this.attemptService.submitQuizAttempt(userId, channelId, answers);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  getUserAttempts = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const data = await this.attemptService.getUserAttempts(userId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  getLeaderboard = async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const data = await this.attemptService.getLeaderboard(channelId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };
}
