import { Request, Response, NextFunction } from 'express';
import adminService from '../services/admin.service';
import { sendSuccess, sendBadRequest, sendNotFound } from '../utils/helper';

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

  async getRoleRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;
      
      // Validate status if provided
      if (status && !['pending', 'approved', 'rejected'].includes(status as string)) {
        return sendBadRequest(res, 'Invalid status. Must be one of: pending, approved, rejected');
      }
      
      const requests = await adminService.getRoleRequests(status as 'pending' | 'approved' | 'rejected' | undefined);
      return sendSuccess(res, requests, 'Role requests retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async approveRoleRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const { reviewNotes } = req.body;
      const adminId = req.user!._id || (req.user as any).id;
      
      if (!requestId) {
        return sendBadRequest(res, 'Request ID is required');
      }
      
      const request = await adminService.approveRoleRequest(requestId, adminId, reviewNotes);
      return sendSuccess(res, request, 'Role request approved successfully');
    } catch (err: any) {
      if (err.message === 'Role request not found') {
        return sendNotFound(res, err.message);
      }
      return next(err);
    }
  }

  async rejectRoleRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const { reviewNotes } = req.body;
      const adminId = req.user!._id || (req.user as any).id;
      
      if (!requestId) {
        return sendBadRequest(res, 'Request ID is required');
      }
      
      const request = await adminService.rejectRoleRequest(requestId, adminId, reviewNotes);
      return sendSuccess(res, request, 'Role request rejected successfully');
    } catch (err: any) {
      if (err.message === 'Role request not found') {
        return sendNotFound(res, err.message);
      }
      return next(err);
    }
  }
}

export default new AdminController();
