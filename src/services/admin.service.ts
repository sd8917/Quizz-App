import User from '../models/user.model';
import { Question } from '../models/quiz.model';
import { Attempt } from '../models/attempt.model';
import { Channel } from '../models/channel.model';
import { RoleRequest } from '../models/roleRequest.model';

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

  // Get all role requests with optional status filter and pagination
  async getRoleRequests(status?: 'pending' | 'approved' | 'rejected', page: number = 1, limit: number = 50) {
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const [requests, total] = await Promise.all([
      RoleRequest.find(filter)
        .populate('userId', 'username email')
        .populate('reviewedBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      RoleRequest.countDocuments(filter).exec()
    ]);
    
    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Approve a role request
  async approveRoleRequest(requestId: string, adminId: string, reviewNotes?: string) {
    const request = await RoleRequest.findById(requestId).populate('userId');
    if (!request) throw new Error('Role request not found');
    
    if (request.status !== 'pending') {
      throw new Error('This request has already been processed');
    }
    
    // Update the request status
    request.status = 'approved';
    request.reviewedBy = adminId as any;
    request.reviewedAt = new Date();
    if (reviewNotes) request.reviewNotes = reviewNotes;
    await request.save();
    
    // Update user role using the populated userId
    const user = request.userId as any;
    if (!user) throw new Error('User not found');
    
    // Fetch the user document to update roles
    const userDoc = await User.findById(user._id);
    if (!userDoc) throw new Error('User not found');
    
    // Add creator role if not already present
    if (!userDoc.roles.includes('creator')) {
      userDoc.roles.push('creator');
      await userDoc.save();
    }
    
    return request;
  }

  // Reject a role request
  async rejectRoleRequest(requestId: string, adminId: string, reviewNotes?: string) {
    const request = await RoleRequest.findById(requestId);
    if (!request) throw new Error('Role request not found');
    
    if (request.status !== 'pending') {
      throw new Error('This request has already been processed');
    }
    
    request.status = 'rejected';
    request.reviewedBy = adminId as any;
    request.reviewedAt = new Date();
    if (reviewNotes) request.reviewNotes = reviewNotes;
    await request.save();
    
    return request;
  }
}

export default new AdminService();
