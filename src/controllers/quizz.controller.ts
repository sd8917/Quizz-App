import { Request, Response, NextFunction } from "express";
import { QuizService } from "../services/quiz.service";
import { sendSuccess, sendCreated, sendForbidden } from '../utils/helper';
import { channelService } from '../services/channelService';

export class QuizController {
  private quizService = new QuizService();

  // ✅ Admin/Creator bulk create
  adminBulkCreateQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { channelId } = req.params;
      const adminId = user.id;
      const questions = await this.quizService.adminBulkCreate(
        channelId,
        adminId,
        req.body.questions
      );
      sendCreated(res, questions, 'Questions created successfully');
      return;
    } catch (err) {
      return next(err);
    }
  };

  // ✅ Admin/Creator create single question
  adminCreateQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { channelId } = req.params;
      const adminId = user.id;
      const question = await this.quizService.adminCreateQuestion(channelId, adminId, req.body);
      sendCreated(res, question, 'Question created successfully');
      return;
    } catch (err) {
      return next(err);
    }
  };

  // ✅ User fetch quiz (hide answers)
  getChannelQuestionsForUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelId } = req.params;
      const userId = req.user!.id;

      // Check if user is member of channel
      const channel = await channelService.getChannel(channelId, userId, false);

      const isMember = channel.members.some(m => ((m.user._id.toString() === userId) || req.user?.roles?.includes("admin") ));
  
      if (!isMember) {
        return sendForbidden(res, 'You must be a member of this channel to view questions');
      }
      
      const questions = await this.quizService.getChannelQuestionsForUser(channelId);
      sendSuccess(res, questions, 'Questions retrieved successfully');
    } catch (err) {
      next(err);
    }
  };  // ✅ User submits quiz
  submitQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelId } = req.params;
      const userAnswers = req.body.answers; // [{ questionId, selectedOption }]
      const result = await this.quizService.submitTest(channelId, userAnswers);
      sendSuccess(res, result, 'Quiz submitted successfully');
    } catch (err) {
      next(err);
    }
  };
}
