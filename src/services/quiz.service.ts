import { ObjectId } from "mongoose";
import { QuizRepository } from "../repositories/quizRepo";

export class QuizService {
  private repo = new QuizRepository();

  async adminCreateQuestion(channelId: string, adminId: string, questionData: any) {
    return this.repo.createQuestion({
      ...questionData,
      channelId,
      createdBy: adminId
    });
  }

  async adminBulkCreate(channelId: string, adminId: string, questions: any[]) {
    return this.repo.bulkCreate(channelId, adminId, questions);
  }

  async getChannelQuestionsForUser(channelId: string) {
    return this.repo.getQuestionsForTest(channelId);
  }

  async submitTest(channelId: string, userAnswers: any[]) {
    // 1. Fetch actual questions with correct answers
    const ids = userAnswers.map(a => a.questionId);

    const questions = await this.repo.getQuestionsByIds(ids);

    let score = 0;
    let total = 0;
    const results = questions.map(q => {
      const submitted = userAnswers.find(a => a.questionId === (q._id as ObjectId).toString());
      const correct = q.options.find(o => o.isCorrect);
      const isCorrect = submitted?.selectedOption === correct?.text;

      if (isCorrect) score += q.marks;
      total += q.marks;

      return {
        questionId: q._id,
        isCorrect,
        correctAnswer: correct?.text,
        userAnswer: submitted?.selectedOption
      };
    });

    return {
      total,
      score,
      percentage: ((score / total) * 100).toFixed(2),
      results
    };
  }
}
