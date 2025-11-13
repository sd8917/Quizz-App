import { Attempt } from "../models/attempt.model";

export class AttemptRepository {
    
  async createAttempt(data: any) {
    return Attempt.create(data);
  }

  /**
   * Find if a user has already attempted a specific channel quiz.
   * Used to prevent multiple submissions.
   */
  async findAttemptByUserAndChannel(userId: string, channelId: string) {
    return Attempt.findOne({ userId, channelId });
  }

  async findByUserAndChannel(userId: string, channelId: string) {
    return Attempt.findOne({ userId, channelId });
  }

  async getUserAttempts(userId: string) {
    return Attempt.find({ userId }).populate("channelId", "name");
  }

  async getChannelLeaderboard(channelId: string) {
    const res = Attempt.find({ channelId })
      .populate("userId", "name email")
      .sort({ percentage: -1 })
      .limit(20);
    return res
  }
}
