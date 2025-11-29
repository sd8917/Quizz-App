import { Request, Response, NextFunction } from 'express';
import { sendForbidden } from '../utils/helper';

// Middleware to require that the authenticated user is an admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: any = (req as any).user;
    if (!user) {
      return sendForbidden(res, 'Access forbidden: not authenticated');
    }

    // Support both `roles: string[]` and `role: string` shapes
    const roles = user.roles || (user.role ? [user.role] : []);
    const isAdmin = Array.isArray(roles) && roles.includes('admin');

    if (!isAdmin) {
      return sendForbidden(res, 'Access forbidden: admin only');
    }

    return next();
  } catch (err) {
    return next(err as any);
  }
};

export default requireAdmin;
