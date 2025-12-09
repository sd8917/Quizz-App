import { Request, Response, NextFunction } from 'express';
import { channelService } from '../services/channelService';
import { 
  sendSuccess, 
  sendCreated, 
  sendBadRequest
} from '../utils/helper';

export const channelController = {
  async createChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const ownerId = user._id || (user as any).id;
      const { name, description } = req.body;
      
      if (!name) {
        return sendBadRequest(res, 'Channel name is required');
      }
      
      const channel = await channelService.createChannel(ownerId, name, description);
      sendCreated(res, channel, 'Channel created successfully');
      return;
    } catch (err) {
      return next(err);
    }
  },

  async getChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const userId = req.user!._id || (req.user as any).id;
      const channel = await channelService.getChannelWithMetadata(channelId, userId);
      
      const data = {
        channel,
        userRole: channel.owner.toString() === userId ? 'owner' : 
                  channel.members.find(m => m.user.toString() === userId)?.role || 'none'
      };
      
      sendSuccess(res, data, 'Channel retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async inviteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const inviterId = user._id || (user as any).id;
      const { channelId } = req.params;
      const { email, role } = req.body;
      
      // Validate email is provided
      if (!email) {
        return sendBadRequest(res, 'Email address is required');
      }
      
      const updated = await channelService.inviteUserByEmail(channelId, inviterId, email, role);
      sendSuccess(res, updated, 'User invited successfully');
      return;
    } catch (err) {
      return next(err);
    }
  },

  async deleteChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { channelId } = req.params;
      const deleted = await channelService.deleteChannel(channelId, user);
      sendSuccess(res, { deleted }, 'Channel and all associated questions deleted successfully');
      return;
    } catch (err) {
      return next(err);
    }
  },

  async listUserChannels(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { channelId } = req.query;
      const channels = await channelService.listUserChannels(user, channelId as string | undefined);
      sendSuccess(res, channels, 'Channels retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const userId = req.user!._id || (req.user as any).id;
      const { name, description } = req.body;

      // Validate at least one field is provided
      if (!name && !description) {
        return sendBadRequest(res, 'Please provide at least one field to update (name or description)');
      }

      const updates: { name?: string; description?: string } = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;

      const updatedChannel = await channelService.updateChannel(channelId, userId, updates);
      sendSuccess(res, updatedChannel, 'Channel updated successfully');
      return;
    } catch (err) {
      return next(err);
    }
  },

  // async archiveOldChannels(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { days } = req.query;
  //     const count = await channelService.archiveOldChannels(Number(days) || 90);
  //     sendSuccess(res, { archived: count }, 'Old channels archived successfully');
  //   } catch (err) {
  //     next(err);
  //   }
  // },
};
