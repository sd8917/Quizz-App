import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

/**
 * Middleware to check if user has premium access
 * Must be used after protect middleware
 */
export const requirePremium = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw new ApiError(401, 'Authentication required');
    }

    // Check premium status using the model method
    const hasPremium = user.checkPremiumStatus ? user.checkPremiumStatus() : user.isPremium;

    if (!hasPremium) {
      throw new ApiError(403, 'Premium subscription required. Upgrade to access this feature.');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check premium status and attach to request
 * This doesn't block non-premium users, just adds premium info
 */
export const checkPremium = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (user) {
      const hasPremium = user.checkPremiumStatus ? user.checkPremiumStatus() : user.isPremium;
      (req as any).isPremiumUser = hasPremium;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default requirePremium;
