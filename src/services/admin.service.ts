import User from '../models/user.model';
import { Question } from '../models/quiz.model';
import { Attempt } from '../models/attempt.model';
import { Channel } from '../models/channel.model';

export class AdminService {
  // Returns basic system statistics for admins
  async getSystemStats() {
    // Total users
    const totalUsers = await User.countDocuments({}).exec();

    // Total quizzes/questions
    const totalChannels = await Channel.countDocuments({}).exec();
    const totalQuizzes = await Question.countDocuments({}).exec();

    // Active users today (lastActiveAt >= start of today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const activeToday = await User.countDocuments({ lastActiveAt: { $gte: startOfToday } }).exec();

    // Completion rate: attempts with submittedAt / total attempts
    const totalAttempts = await Attempt.countDocuments({}).exec();
    const submittedAttempts = await Attempt.countDocuments({ submittedAt: { $exists: true, $ne: null } }).exec();
    const completionRate = totalAttempts === 0 ? 0 : Math.round((submittedAttempts / totalAttempts) * 10000) / 100; // two decimals

    return {
      totalUsers,
      totalChannels,
      totalQuizzes,
      activeToday,
      totalAttempts,
      submittedAttempts,
      completionRate
    };
  }
}

export default new AdminService();
