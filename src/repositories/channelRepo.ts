import { Channel, IChannel } from '../models/channel.model';
import mongoose from 'mongoose';
import User from '../models/user.model';
import { sendChannelInviteEmail } from '../utils/mailer';
import { IUserDocument } from 'src/types';

export const channelRepo = {
  /**
   * Create a new channel
   */
  async createChannel(data: Partial<IChannel>): Promise<IChannel> {
    const channel = new Channel(data);
    return await channel.save();
  },

  /**
   * Get channel by ID
   */
  async getChannelById(channelId: string): Promise<IChannel | null> {
    return Channel.findById(channelId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .exec();
  },

  /**
   * Get channels owned by a specific user
   */
  async getChannelsByOwner(ownerId: string): Promise<IChannel[]> {
    return Channel.find({ owner: ownerId, isArchived: false })
      .sort({ createdAt: -1 })
      .exec();
  },

  /**
   * Get all channels where user is an admin (owner or admin role)
   */
  async getChannelsByUser(user: IUserDocument): Promise<IChannel[]> {
    const userId = user._id;

    // check if user is admin then return complete list
    const isAdmin = user.roles.includes('admin');
    if(isAdmin){
      return Channel.find({ isArchived: false })
        .sort({ createdAt: -1 })
        .populate('owner', 'username email')
        .populate('members.user', 'username email')
        .exec();
    }
    return Channel.find({
      $or: [
        { owner: userId },
        { 'members': { $elemMatch: { user: userId } } }
      ],
      isArchived: false
    })
      .sort({ createdAt: -1 })
      .populate('owner', 'username email')
      .populate('members.user', 'username email')
      .exec();
  },

  /**
   * Add member to a channel
   */
  async addMember(
    channelId: string,
    userId: mongoose.Types.ObjectId,
    role: 'admin' | 'team' | 'viewer' = 'team'
  ): Promise<IChannel | null> {
    // Find the channel and add the member
    const channel = await Channel.findByIdAndUpdate(
      channelId,
      { $push: { members: { user: userId, role } } },
      { new: true }
    ).exec();

    // If the channel was found and the member was added
    if (channel) {
      // Find the user to get their email
      const user = await User.findById(userId).exec();
      // If the user exists, send them an email about the channel addition
      if (user) {
        sendChannelInviteEmail(user.email, channel.name);
      }
    }

    return channel;
  },

  /**
   * Remove a member from the channel
   */
  async removeMember(channelId: string, userId: mongoose.Types.ObjectId): Promise<IChannel | null> {
    return Channel.findByIdAndUpdate(
      channelId,
      { $pull: { members: { user: userId } } },
      { new: true }
    ).exec();
  },

  /**
   * Update channel details (name, description)
   */
  async updateChannel(
    channelId: string,
    updates: { name?: string; description?: string; maxAttempts?: number }
  ): Promise<IChannel | null> {
    return Channel.findByIdAndUpdate(
      channelId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .exec();
  },

  /**
   * Archive a channel
   */
  async archiveChannel(channelId: string): Promise<IChannel | null> {
    return Channel.findByIdAndUpdate(
      channelId,
      { isArchived: true, archivedAt: new Date() },
      { new: true }
    ).exec();
  },

  /**
   * Find all channels older than given days (for worker cleanup)
   */
  async findOldChannels(daysOld: number): Promise<IChannel[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    return Channel.find({ createdAt: { $lt: cutoff }, isArchived: false }).exec();
  },

  /**
   * Delete archived channels permanently
   */
  async deleteArchivedChannels(): Promise<number> {
    const res = await Channel.deleteMany({ isArchived: true }).exec();
    return res.deletedCount || 0;
  },

  /**
   * Delete a specific channel by ID
   * This will trigger cascade delete for all associated questions
   */
  async deleteChannelById(channelId: string): Promise<boolean> {
    const result = await Channel.findByIdAndDelete(channelId).exec();
    return result !== null;
  },
};
