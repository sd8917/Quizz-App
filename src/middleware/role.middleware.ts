import { Request, Response, NextFunction } from 'express';
import { sendForbidden } from '../utils/helper';

// Middleware to authorize based on user roles
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.roles) {
        return sendForbidden(res, 'Access forbidden');
      }

      const hasRole = user.roles.some((r: string) => allowedRoles.includes(r));
      if (!hasRole) {
        return sendForbidden(res, 'Access forbidden: insufficient role');
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export default authorizeRoles;
