import { Request, Response } from 'express';
import ProfileService from '../services/profile.service';

export class ProfileController {
  private profileService = ProfileService;

  getMe = async (req: Request, res: Response) => {
    try {
      const userId = req.user._id || req.user.id;
      const data = await this.profileService.getProfile(userId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  updateMe = async (req: Request, res: Response) => {
    try {
      const userId = req.user._id || req.user.id;
      const updates = req.body;
      const data = await this.profileService.updateProfile(userId, updates);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  // Super admin routes
  listUsers = async (_req: Request, res: Response) => {
    try {
      const data = await this.profileService.getAllUsers();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  updateUserRoles = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { roles } = req.body;
      const data = await this.profileService.updateUserRoles(userId, roles);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };
}

export const profileController = new ProfileController();
