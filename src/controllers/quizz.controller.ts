import { Request, Response } from "express";
import { QuizService } from "../services/quiz.service";

export class QuizController {
  private quizService = new QuizService();

  // ✅ Admin/Creator bulk create
  adminBulkCreateQuestions = async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      // Only creator or admin can create questions
      if (!user.roles || (!user.roles.includes('creator') && !user.roles.includes('admin'))) {
        return res.status(403).json({ success: false, message: 'Only creators and admins can create questions' });
      }
      const { channelId } = req.params;
      const adminId = user.id;
      const questions = await this.quizService.adminBulkCreate(
        channelId,
        adminId,
        req.body.questions
      );
      return res.status(201).json({ success: true, data: questions });
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message
      });
    }
  };

  // ✅ Admin/Creator create single question
  adminCreateQuestion = async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      // Only creator or admin can create questions
      if (!user.roles || (!user.roles.includes('creator') && !user.roles.includes('admin'))) {
        return res.status(403).json({ success: false, message: 'Only creators and admins can create questions' });
      }
      const { channelId } = req.params;
      const adminId = user.id;
      const question = await this.quizService.adminCreateQuestion(channelId, adminId, req.body);
      return res.status(201).json({ success: true, data: question });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  };

  // ✅ User fetch quiz (hide answers)
  getChannelQuestionsForUser = async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const questions = await this.quizService.getChannelQuestionsForUser(channelId);
      res.json({ success: true, data: questions });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  // ✅ User submits quiz
  submitQuiz = async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const userAnswers = req.body.answers; // [{ questionId, selectedOption }]
      const result = await this.quizService.submitTest(channelId, userAnswers);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };
}
