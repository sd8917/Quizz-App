import { sendChannelInviteEmail } from '../utils/mailer';
import User from '../models/user.model';
import { IUser } from '../types/user.types';

export class ProfileService {
  async getProfile(userId: string) {
    return User.findById(userId).select('-password');
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
    return User.findById(userId).select('-password');
  }

  // Admin / super actions
  async getAllUsers() {
    return User.find().select('-password');
  }

  async updateUserRoles(targetUserId: string, roles: string[]) {
    const user = await User.findById(targetUserId);
    if (!user) throw new Error('User not found');
    user.roles = roles;
    await user.save();
    return User.findById(targetUserId).select('-password');
  }
}

export default new ProfileService();
