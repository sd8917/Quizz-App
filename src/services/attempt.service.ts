import { QuizRepository } from "../repositories/quizRepo";
import { AttemptRepository } from "../repositories/attempRepo";
import mongoose, { ObjectId } from "mongoose";
import { Attempt } from "../models/attempt.model";
import { RuleViolation } from "../models/ruleViolation.model";
import logger from "../utils/logger";
import { sendSupportEmail } from "../utils/mailer";

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

  async handleFullscreenViolation(userId: string, channelId: string, exitCount: number) {
    // Check if exitCount exceeds the threshold (more than 3)
    if (exitCount <= 3) {
      return { message: 'Exit count within allowed limit', exitCount };
    }

    // Create a rule violation record
    const violation = await RuleViolation.create({
      userId,
      channelId,
      reason: `User exited fullscreen mode ${exitCount} times, exceeding the limit of 3.`,
      exitCount,
    });

    // Log the violation
    logger.warn(`Fullscreen violation: User ${userId} in channel ${channelId} exited fullscreen ${exitCount} times`);

    // Send alert email to admin
    try {
      await sendSupportEmail(
        'System Alert',
        process.env.SUPPORT_EMAIL as string, // Assuming admin email
        `Fullscreen Violation Alert`,
        `User ${userId} in channel ${channelId} has exited fullscreen mode ${exitCount} times. Violation recorded.`
      );
    } catch (emailError) {
      logger.error('Failed to send admin alert email:', emailError);
    }

    return {
      message: 'Rule violation recorded and admin alerted',
      violationId: violation._id,
      exitCount,
    };
  }
}
