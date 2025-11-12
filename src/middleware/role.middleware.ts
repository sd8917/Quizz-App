import { Request, Response, NextFunction } from 'express';

// Middleware to authorize based on user roles
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.roles) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const hasRole = user.roles.some((r: string) => allowedRoles.includes(r));
      if (!hasRole) {
        return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
      }

      return next();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
};

export default authorizeRoles;
