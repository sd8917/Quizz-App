import { Request, Response, NextFunction } from 'express';
import aiService from '../services/ai.service';
import { sendSuccess, sendBadRequest } from '../utils/helper';

export class AIController {
  /**
   * Generate questions using AI for premium users
   */
  async generateQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;

      const { topic, difficulty, numberOfQuestions, marks } = req.body;

      // Validate required fields
      if (!topic) {
        return sendBadRequest(res, 'Topic is required');
      }

      if (!difficulty) {
        return sendBadRequest(res, 'Difficulty level is required (easy, medium, or hard)');
      }

      if (!numberOfQuestions || numberOfQuestions < 1 || numberOfQuestions > 20) {
        return sendBadRequest(res, 'Number of questions must be between 1 and 20');
      }

      // Generate questions
      const questions = await aiService.generateQuestions({
        topic: topic.trim(),
        difficulty,
        numberOfQuestions: parseInt(numberOfQuestions),
        marks: marks || 1
      });

      const response = {
        questions,
        metadata: {
          topic,
          difficulty,
          totalQuestions: questions.length,
          totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
          generatedAt: new Date(),
          generatedBy: user.username
        }
      };

      sendSuccess(res, response, 'Questions generated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Validate if a topic is appropriate for question generation
   */
  async validateTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const { topic } = req.body;

      if (!topic) {
        return sendBadRequest(res, 'Topic is required');
      }

      const isValid = await aiService.validateTopic(topic.trim());

      sendSuccess(res, { 
        topic, 
        isValid,
        message: isValid ? 'Topic is appropriate' : 'Topic may not be suitable for quiz generation'
      }, 'Topic validation completed');
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AIController();
