import { sendChannelInviteEmail } from '../utils/mailer';
import User from '../models/user.model';
import { IUser } from '../types/user.types';

export class ProfileService {
  // Helper to format user with activity information
  private formatUserWithActivity(user: IUser) {
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      lastActiveAt: user.lastActiveAt,
      activeStatus: user.getActiveStatus(),
      isOnline: user.isOnline()
    };
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new Error('User not found');
    return this.formatUserWithActivity(user);
  }

  async updateProfile(userId: string, data: Partial<IUser>) {
    // Load user so that pre-save hooks (password hashing) run when updating password
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (data.username) user.username = data.username;
    if (data.email) user.email = data.email;
    if ((data as any).password) user.password = (data as any).password;

    await user.save();
    sendChannelInviteEmail(user.email, "Password change successful");
    const updatedUser = await User.findById(userId).select('-password');
    if (!updatedUser) throw new Error('User not found after update');
    return this.formatUserWithActivity(updatedUser);
  }

  // Admin / super actions
  async getAllUsers(isActive?: boolean) {
    const filter: any = {};
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }
    const users = await User.find(filter).select('-password');
    return users.map(user => this.formatUserWithActivity(user));
  }

  async updateUserRoles(targetUserId: string, roles: string[]) {
    const user = await User.findById(targetUserId);
    if (!user) throw new Error('User not found');
    user.roles = roles;
    await user.save();
    const updatedUser = await User.findById(targetUserId).select('-password');
    if (!updatedUser) throw new Error('User not found after update');
    return this.formatUserWithActivity(updatedUser);
  }

  async updateUserStatus(targetUserId: string, isActive: boolean) {
    const user = await User.findById(targetUserId);
    if (!user) throw new Error('User not found');
    user.isActive = isActive;
    await user.save();
    const updatedUser = await User.findById(targetUserId).select('-password');
    if (!updatedUser) throw new Error('User not found after update');
    return this.formatUserWithActivity(updatedUser);
  }
}

export default new ProfileService();
