import { channelRepo } from '../repositories/channelRepo';
import { IChannel } from '../models/channel.model';
import  User  from '../models/user.model';
// import { publishArchiveJob } from '../workers/queues';
import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError';
import { IUserDocument } from 'src/types';

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
  async getChannel(channelId: string, userId: string, isMemberCheck: boolean = false): Promise<IChannel> {
    const channel = await channelRepo.getChannelById(channelId);
    if (!channel) throw new ApiError(404, 'Channel not found');

    // Check member access
    const isOwner = channel.owner._id.toString() === userId;
    // Allow access if:
    // 1. User is owner
    // 2. User is a member
    if (!isOwner && isMemberCheck) {
      throw new ApiError(403, 'Access denied - Must be a member or owner of the channel');
    }

    return channel;
  },

  /**
   * Invite a user to a channel by email
   */
  async inviteUserByEmail(channelId: string, inviterId: string, email: string, role: 'team' | 'viewer') {
    // Find user by email
    const invitee = await User.findOne({ email });
    if (!invitee) {
      throw new ApiError(404, 'User with this email is not registered');
    }

    // Check if user is active
    if (!invitee.isActive) {
      throw new ApiError(403, 'Cannot invite inactive user. User account is deactivated.');
    }

    const channel = await channelRepo.getChannelById(channelId);
    if (!channel) throw new ApiError(404, 'Channel not found');

    // Check if inviter has permission (must be owner or admin)
    const isOwner = channel.owner._id.toString() === inviterId.toString();
    const inviterMember = channel.members.find(m => m.user._id.toString() === inviterId.toString());
    const isAdmin = inviterMember && inviterMember.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'Only channel owner or admins can invite users');
    }

    // Check if user is already a member
    const inviteeIdStr = (invitee._id as any).toString();
    const isAlreadyMember = channel.members.some(m => m.user._id.toString() === inviteeIdStr);
    if (isAlreadyMember) {
      throw new ApiError(400, 'User is already a member of this channel');
    }

    return await channelRepo.addMember(channelId, invitee._id as mongoose.Types.ObjectId, role);
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
   * Delete a channel permanently (admin only)
   * This will also delete all questions associated with the channel
   */
  async deleteChannel(channelId: string, user: any) {
    const channel = await channelRepo.getChannelById(channelId);
    // check the channel ownership
    if (!channel) throw new ApiError(404, 'Channel not found');

     // Only owner or admin members can update channel
    const isOwner = channel.owner._id.toString() === user.id;
    const isAdmin = channel.members.some(
      m => m.user._id.toString() === user.id && m.role === 'admin'
    );

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'Only channel owner or admins can update channel details');
    }

    // Delete the channel (cascade will handle questions)
    const deleted = await channelRepo.deleteChannelById(channelId);
    
    if (!deleted) {
      throw new ApiError(500, 'Failed to delete channel');
    }

    return deleted;
  },

  /**
   * List all channels where the user is owner or member
   */
  async listUserChannels(user: IUserDocument) {
    // Find channels where user is owner or member
    return await channelRepo.getChannelsByUser(user);
  },
};
