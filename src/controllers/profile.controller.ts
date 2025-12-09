import { Request, Response } from 'express';
import ProfileService from '../services/profile.service';
import { sendSuccess, sendBadRequest, sendNotFound } from '../utils/helper';

export class ProfileController {
  private profileService = ProfileService;

  getMe = async (req: Request, res: Response) => {
    try {
      const userId = req.user!._id || (req.user as any).id;
      const data = await this.profileService.getProfile(userId);
      sendSuccess(res, data, 'Profile retrieved successfully');
    } catch (err: any) {
      sendBadRequest(res, err.message);
    }
  };

  updateMe = async (req: Request, res: Response) => {
    try {
      const userId = req.user!._id || (req.user as any).id;
      const updates = req.body;
      const data = await this.profileService.updateProfile(userId, updates);
      sendSuccess(res, data, 'Profile updated successfully');
    } catch (err: any) {
      sendBadRequest(res, err.message);
    }
  };

  // Super admin routes
  listUsers = async (req: Request, res: Response) => {
    try {
      const { isActive } = req.query;
      
      // Parse isActive query parameter
      let isActiveFilter: boolean | undefined;
      if (isActive !== undefined) {
        if (isActive === 'true') isActiveFilter = true;
        else if (isActive === 'false') isActiveFilter = false;
        else {
          return sendBadRequest(res, 'isActive must be "true" or "false"');
        }
      }
      
      const data = await this.profileService.getAllUsers(isActiveFilter);
      sendSuccess(res, data, 'Users retrieved successfully');
    } catch (err: any) {
      sendBadRequest(res, err.message);
    }
  };

  updateUserRoles = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Validate input
      if (!userId) {
        return sendBadRequest(res, 'User ID is required');
      }

      if (!role) {
        return sendBadRequest(res, 'Role is required', { 
          allowedRoles: ['user', 'creator', 'admin'] 
        });
      }

      // Validate role value
      const validRoles = ['user', 'creator', 'admin'];
      if (!validRoles.includes(role)) {
        return sendBadRequest(res, 'Invalid role specified', { 
          provided: role,
          allowedRoles: validRoles 
        });
      }

      const data = await this.profileService.updateUserRoles(userId, role);
      
      if (!data) {
        return sendNotFound(res, 'User not found');
      }

      sendSuccess(res, data, 'User role updated successfully');
    } catch (err: any) {
      sendBadRequest(res, err.message);
    }
  };

  toggleUserStatus = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      // Validate input
      if (!userId) {
        return sendBadRequest(res, 'User ID is required');
      }

      if (isActive === undefined || typeof isActive !== 'boolean') {
        return sendBadRequest(res, 'isActive field is required and must be a boolean', {
          expected: 'boolean (true or false)'
        });
      }

      const data = await this.profileService.updateUserStatus(userId, isActive);
      
      if (!data) {
        return sendNotFound(res, 'User not found');
      }

      const action = isActive ? 'activated' : 'deactivated';
      sendSuccess(res, data, `User ${action} successfully`);
    } catch (err: any) {
      sendBadRequest(res, err.message);
    }
  };

  requestCreatorRole = async (req: Request, res: Response) => {
    try {
      const userId = req.user!._id || (req.user as any).id;
      const { reason } = req.body;
      
      const roleRequest = await this.profileService.requestCreatorRole(userId, reason);
      sendSuccess(res, roleRequest, 'Creator role request submitted successfully. An admin will review your request.');
    } catch (err: any) {
      sendBadRequest(res, err.message);
    }
  };
}

export const profileController = new ProfileController();
