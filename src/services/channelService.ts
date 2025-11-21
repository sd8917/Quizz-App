import { channelRepo } from '../repositories/channelRepo';
import { IChannel } from '../models/channel.model';
import  User  from '../models/user.model';
// import { publishArchiveJob } from '../workers/queues';
import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError';

export const channelService = {
  /**
   * Create a new channel
   */
  async createChannel(ownerId: string, name: string, description?: string): Promise<IChannel> {
    const owner = await User.findById(ownerId);
    if (!owner) throw new ApiError(404, 'Owner not found');

    const channel = await channelRepo.createChannel({
      name,
      description,
      owner: new mongoose.Types.ObjectId(ownerId),
      members: [{ user: owner._id as mongoose.Types.ObjectId, role: 'creator' }],
    });

    return channel;
  },

  /**
   * Get a channel by ID
   */
  async getChannel(channelId: string, userId: string): Promise<IChannel> {
    const channel = await channelRepo.getChannelById(channelId);
    if (!channel) throw new ApiError(404, 'Channel not found');

    // Check member access
    const isMember = channel.members.some(m => m.user.toString() === userId);
    const isOwner = channel.owner.toString() === userId;

    // Allow access if:
    // 1. User is owner
    // 2. User is a member
    if (!isOwner && !isMember) {
      throw new ApiError(403, 'Access denied - Must be a member or owner of the channel');
    }

    return channel;
  },

  /**
   * Invite a user to a channel
   */
  async inviteUser(channelId: string, inviterId: string, inviteeId: string, role: 'team' | 'viewer') {
    const channel = await channelRepo.getChannelById(channelId);
    if (!channel) throw new ApiError(404, 'Channel not found');

    const inviter = channel.members.find(m => m.user._id.toString() === inviterId);
    
    if (!inviter || inviter.role !== 'admin')
      throw new ApiError(403, 'Only admins can invite users');

    return await channelRepo.addMember(channelId, new mongoose.Types.ObjectId(inviteeId), role);
  },

  /**
   * Update channel details (name, description)
   */
  async updateChannel(
    channelId: string,
    userId: string,
    updates: { name?: string; description?: string }
  ): Promise<IChannel> {
    const channel = await channelRepo.getChannelById(channelId);
    if (!channel) throw new ApiError(404, 'Channel not found');

    // Only owner or admin members can update channel
    const isOwner = channel.owner._id.toString() === userId;
    const isAdmin = channel.members.some(
      m => m.user._id.toString() === userId && m.role === 'admin'
    );

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'Only channel owner or admins can update channel details');
    }

    const updatedChannel = await channelRepo.updateChannel(channelId, updates);
    if (!updatedChannel) throw new ApiError(500, 'Failed to update channel');

    return updatedChannel;
  },

  /**
   * Archive old channels after N days
   */
//   async archiveOldChannels(daysOld: number) {
//     const oldChannels = await channelRepo.findOldChannels(daysOld);
//     for (const ch of oldChannels) {
//       await channelRepo.archiveChannel(ch._id.toString());
//       await publishArchiveJob({ channelId: ch._id.toString() });
//     }
//     return oldChannels.length;
//   },

  /**
   * Delete a channel permanently (super only)
   */
  async deleteChannel(_channelId: string) {
    return await channelRepo.deleteArchivedChannels();
  },

  /**
   * List all channels where the user is owner or member
   */
  async listUserChannels(userId: string) {
    // Find channels where user is owner or member
    return await channelRepo.getChannelsByUser(userId);
  },
};
