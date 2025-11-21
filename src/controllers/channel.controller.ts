import { Request, Response, NextFunction } from 'express';
import { channelService } from '../services/channelService';

export const channelController = {
  async createChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      // Only creator or admin can create channels
      if (!user.roles || (!user.roles.includes('creator') && !user.roles.includes('admin'))) {
        return res.status(403).json({ success: false, message: 'Only creators and admins can create channels' });
      }
      const ownerId = user.id;
      const { name, description } = req.body;
      const channel = await channelService.createChannel(ownerId, name, description);
      res.status(201).json(channel);
      return;
    } catch (err) {
      return next(err);
    }
  },

  async getChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const userId = req.user.id;
      const channel = await channelService.getChannel(channelId, userId);
      res.json({
        success: true,
        data: {
          channel,
          userRole: channel.owner.toString() === userId ? 'owner' : 
                    channel.members.find(m => m.user.toString() === userId)?.role || 'none'
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async inviteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      // Only creator or admin can invite users
      if (!user.roles || (!user.roles.includes('creator') && !user.roles.includes('admin'))) {
        return res.status(403).json({ success: false, message: 'Only creators and admins can invite users' });
      }
      const inviterId = user.id;
      const { channelId } = req.params;
      const { email, role } = req.body;
      
      // Validate email is provided
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email address is required' 
        });
      }
      
      const updated = await channelService.inviteUserByEmail(channelId, inviterId, email, role);
      res.status(200).json({
        success: true,
        message: 'User invited successfully',
        data: updated
      });
      return;
    } catch (err) {
      return next(err);
    }
  },

  async deleteChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user.roles || !user.roles.includes('admin')) {
        return res.status(403).json({ success: false, message: 'Only admins can delete channels' });
      }
      const { channelId } = req.params;
      const deletedCount = await channelService.deleteChannel(channelId);
      res.json({ success: true, deleted: deletedCount });
      return;
    } catch (err) {
      return next(err);
    }
  },

  async listUserChannels(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const channels = await channelService.listUserChannels(userId);
      res.json({ channels });
    } catch (err) {
      next(err);
    }
  },

  async updateChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const userId = req.user.id;
      const { name, description } = req.body;

      // Validate at least one field is provided
      if (!name && !description) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one field to update (name or description)'
        });
      }

      const updates: { name?: string; description?: string } = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;

      const updatedChannel = await channelService.updateChannel(channelId, userId, updates);
      
      res.json({
        success: true,
        message: 'Channel updated successfully',
        data: updatedChannel
      });
      return;
    } catch (err) {
      return next(err);
    }
  },

  // async archiveOldChannels(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { days } = req.query;
  //     const count = await channelService.archiveOldChannels(Number(days) || 90);
  //     res.json({ archived: count });
  //   } catch (err) {
  //     next(err);
  //   }
  // },
};
