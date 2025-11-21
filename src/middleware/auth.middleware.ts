import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

interface IDecodedToken {
  id: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Track last request time per user to debounce updates (avoid DB write on every request)
const lastUpdateMap = new Map<string, number>();
const UPDATE_INTERVAL = 2 * 60 * 1000; // Update lastActiveAt every 2 minutes max

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ message: 'Not authorized, no token' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as IDecodedToken;
    const user = await User.findById(decoded.id).select('-password');

    console.log("user ", user);

    if (!user) {
      res.status(401).json({ message: 'Not authorized, user not found' });
      return;
    }

    req.user = user;

    // Update lastActiveAt efficiently (debounced to avoid DB write on every request)
    const userId = (user._id as string).toString();
    const now = Date.now();
    const lastUpdate = lastUpdateMap.get(userId) || 0;
    
    if (now - lastUpdate > UPDATE_INTERVAL) {
      // Update asynchronously without blocking the request
      User.findByIdAndUpdate(userId, { lastActiveAt: new Date() }).exec().catch(err => {
        console.error('Failed to update lastActiveAt:', err);
      });
      lastUpdateMap.set(userId, now);
    }

    next();
    return;
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
    return;
  }
};