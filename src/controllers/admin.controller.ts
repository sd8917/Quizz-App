import { Request, Response, NextFunction } from 'express';
import adminService from '../services/admin.service';
import { sendSuccess } from '../utils/helper';

export class AdminController {
  async getSystemStats(req: Request, res: Response, next: NextFunction) {
    // mark unused param as referenced to satisfy TS no-unused-parameter checks
    void req;
    try {
      const stats = await adminService.getSystemStats();
      return sendSuccess(res, stats, 'Admin stats retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }
}

export default new AdminController();
