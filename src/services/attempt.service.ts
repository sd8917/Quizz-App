import { QuizRepository } from "../repositories/quizRepo";
import { AttemptRepository } from "../repositories/attempRepo";
import mongoose, { ObjectId } from "mongoose";
import { Attempt } from "../models/attempt.model";
import { LeaderboardCache, LeaderboardEntry } from "./cache.service";
import logger from "../utils/logger";

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

    // 4. Invalidate leaderboard cache after new submission
    await LeaderboardCache.invalidateChannelLeaderboard(channelId);
    logger.info(`🗑️  Invalidated leaderboard cache for channel: ${channelId}`);

    return attempt;
  }

  async getUserAttempts(userId: string) {
    return this.attemptRepo.getUserAttempts(userId);
  }

  
async getLeaderboard(channelId: string) {
  // Try to get from cache first
  const cachedLeaderboard = await LeaderboardCache.getChannelLeaderboard(channelId, 20, 0);
  
  if (cachedLeaderboard) {
    logger.info(`✅ Serving leaderboard from cache for channel: ${channelId}`);
    const cachedCount = await LeaderboardCache.getChannelParticipantCount(channelId);
    return {
      leaderboard: cachedLeaderboard,
      totalParticipants: cachedCount || cachedLeaderboard.length,
      cached: true
    };
  }

  // Cache miss - fetch from database
  logger.info(`💾 Cache miss - fetching leaderboard from DB for channel: ${channelId}`);
  
  const channelObjectId = new mongoose.Types.ObjectId(channelId);
  const leaderboard = await Attempt.aggregate([
    { $match: { channelId: channelObjectId } },
    { $group: {
        _id: "$userId",
        bestPercentage: { $max: "$percentage" },
        totalAttempts: { $sum: 1 },
        lastAttemptId: { $first: "$_id" }
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
        score: "$bestPercentage",
        totalAttempts: 1
      }
    }
  ]);

  // Cache the result
  const entries: LeaderboardEntry[] = leaderboard.map((entry, index) => ({
    userId: entry.userId.toString(),
    username: entry.username,
    email: entry.email,
    score: entry.score,
    totalAttempts: entry.totalAttempts,
    rank: index + 1
  }));

  await LeaderboardCache.cacheChannelLeaderboard(channelId, entries);

  return {
    leaderboard: entries,
    totalParticipants: entries.length,
    cached: false
  };
}

  /**
   * Get user's rank in a specific channel
   */
  async getUserRank(userId: string, channelId: string): Promise<number | null> {
    // Try cache first
    const cachedRank = await LeaderboardCache.getUserRank(channelId, userId);
    if (cachedRank !== null) {
      return cachedRank;
    }

    // Fallback to DB query
    const channelObjectId = new mongoose.Types.ObjectId(channelId);
    const allScores = await Attempt.aggregate([
      { $match: { channelId: channelObjectId } },
      { $group: {
          _id: "$userId",
          bestPercentage: { $max: "$percentage" }
        }
      },
      { $sort: { bestPercentage: -1 } }
    ]);

    const userIndex = allScores.findIndex(s => s._id.toString() === userId);
    return userIndex !== -1 ? userIndex + 1 : null;
  }
}

