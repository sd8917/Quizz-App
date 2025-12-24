

import { sendChannelInviteEmail } from '../utils/mailer';
import ProfileRepo from '../repositories/profileRepo';
import redis from '../config/redis';
import logger from '../utils/logger';
import { IUser } from '../types/user.types';

export class ProfileService {

  /**
   * Formats a user object by attaching activity-related information.
   *
   * @param {Object} user - The user data object
   */

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
    const cacheKey = `profile:${userId}`;
    const start = Date.now();
    let fromCache = false;
    let result;
    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          fromCache = true;
          result = JSON.parse(cached);
        }
      }
      if (!result) {
        const user = await ProfileRepo.getUserProfile(userId);
        if (!user) throw new Error('User not found');
        result = this.formatUserWithActivity(user);
        if (redis) {
          await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600); // cache for 1 hour
        }
      }
    } finally {
      const elapsed = Date.now() - start;
      if (fromCache) {
        logger.info(`[ProfileService] Cache HIT for userId=${userId} (${elapsed}ms)`);
      } else {
        logger.info(`[ProfileService] Cache MISS for userId=${userId} (${elapsed}ms)`);
      }
    }
    return result;
  }

  async updateProfile(userId: string, data: Partial<IUser>) {
    // Load user so that pre-save hooks (password hashing) run when updating password
    const user = await ProfileRepo.getUserById(userId);
    if (!user) throw new Error('User not found');

    if (data.username) user.username = data.username;
    if (data.email) user.email = data.email;
    if ((data as any).password) user.password = (data as any).password;

    await user.save();
    sendChannelInviteEmail(user.email, "Password change successful");
    // Invalidate cache
    const cacheKey = `profile:${userId}`;
    if (redis) {
      await redis.del(cacheKey);
    }
    const updatedUser = await ProfileRepo.getUserProfile(userId);
    if (!updatedUser) throw new Error('User not found after update');
    return this.formatUserWithActivity(updatedUser);
  }

  // Admin / super actions
  async getAllUsers(isActive?: boolean) {
    const filter: any = {};
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }
    const users = await ProfileRepo.findAll(filter);
    return users.map(user => this.formatUserWithActivity(user));
  }

  async updateUserRoles(targetUserId: string, roles: string[]) {
    const user = await ProfileRepo.getUserById(targetUserId);
    if (!user) throw new Error('User not found');
    user.roles = roles;
    await user.save();
    // Invalidate cache
    const cacheKey = `profile:${targetUserId}`;
    if (redis) {
      await redis.del(cacheKey);
    }
    const updatedUser = await ProfileRepo.getUserProfile(targetUserId);
    if (!updatedUser) throw new Error('User not found after update');
    return this.formatUserWithActivity(updatedUser);
  }

  async updateUserStatus(targetUserId: string, isActive: boolean) {
    const user = await ProfileRepo.getUserById(targetUserId);
    if (!user) throw new Error('User not found');
    user.isActive = isActive;
    await user.save();
    // Invalidate cache
    const cacheKey = `profile:${targetUserId}`;
    if (redis) {
      await redis.del(cacheKey);
    }
    const updatedUser = await ProfileRepo.getUserProfile(targetUserId);
    if (!updatedUser) throw new Error('User not found after update');
    return this.formatUserWithActivity(updatedUser);
  }
}

export default new ProfileService();
