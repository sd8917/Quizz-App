import { QuizRepository } from "../repositories/quizRepo";
import { AttemptRepository } from "../repositories/attempRepo";
import { ObjectId } from "mongoose";

export class AttemptService {
  private quizRepo = new QuizRepository();
  private attemptRepo = new AttemptRepository();

  async submitQuizAttempt(userId: string, channelId: string, userAnswers: any[]) {
   // Prevent resubmission
    const existingAttempt = await this.attemptRepo.findAttemptByUserAndChannel(userId, channelId);
    if (existingAttempt) {
      throw new Error("You have already submitted this quiz.");
    }

    // 2. Fetch correct questions from DB
    const ids = userAnswers.map(a => a.questionId);
    const questions = await this.quizRepo.getQuestionsByIds(ids);

    let score = 0;
    let total = 0;
    const detailedAnswers = questions.map(q => {
      const submitted = userAnswers.find(a => a.questionId === (q._id as ObjectId).toString());
      const correct = q.options.find(o => o.isCorrect);
      const isCorrect = submitted?.selectedOption === correct?.text;

      if (isCorrect) score += q.marks;
      total += q.marks;

      return {
        questionId: q._id,
        selectedOption: submitted?.selectedOption,
        isCorrect
      };
    });

    const percentage = (score / total) * 100;

    // 3. Store attempt
    const attempt = await this.attemptRepo.createAttempt({
      userId,
      channelId,
      score,
      total,
      percentage,
      answers: detailedAnswers,
      submittedAt: new Date()
    });

    return attempt;
  }

  async getUserAttempts(userId: string) {
    return this.attemptRepo.getUserAttempts(userId);
  }

  async getLeaderboard(channelId: string) {
    return this.attemptRepo.getChannelLeaderboard(channelId);
  }
}
