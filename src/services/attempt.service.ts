import { QuizRepository } from "../repositories/quizRepo";
import { AttemptRepository } from "../repositories/attempRepo";
import { channelRepo } from "../repositories/channelRepo";
import mongoose, { ObjectId } from "mongoose";
import { Attempt } from "../models/attempt.model";
import { ApiError } from "../utils/apiError";

export class AttemptService {
  private quizRepo = new QuizRepository();
  private attemptRepo = new AttemptRepository();

  async submitQuizAttempt(userId: string, channelId: string, userAnswers: any[]) {
   // Fetch channel to get maxAttempts setting
    const channel = await channelRepo.getChannelById(channelId);
    if (!channel) {
      throw new ApiError(404, "Channel not found.");
    }

    const maxAttempts = channel.maxAttempts || 1;

    // Count existing attempts
    const attemptCount = await this.attemptRepo.countAttemptsByUserAndChannel(userId, channelId);
    
    if (attemptCount >= maxAttempts) {
      throw new ApiError(400, `Maximum attempts (${maxAttempts}) reached for this quiz.`);
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
  const channelObjectId = new mongoose.Types.ObjectId(channelId);
  return Attempt.aggregate([
    { $match: { channelId: channelObjectId } },
    { $group: {
        _id: "$userId",
        bestPercentage: { $max: "$percentage" },
        lastAttemptId: { $first: "$_id" } // or store a doc for reference
      }
    },
    { $sort: { bestPercentage: -1 } },
    { $limit: 20 },
    { $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $project: {
        userId: "$_id",
        username: "$user.username",
        email: "$user.email",
        bestPercentage: 1
      }
    }
  ]);
}
}
