import { Request, Response, NextFunction } from 'express';
import adminService from '../services/admin.service';
import { sendSuccess } from '../utils/helper';

export class AdminController {
  async getSystemStats(req_: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getSystemStats();
      return sendSuccess(res, stats, 'Admin stats retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }
}

export default new AdminController();
