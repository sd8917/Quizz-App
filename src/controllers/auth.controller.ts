import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ValidationError as AppValidationError, AuthenticationError as AppAuthError } from '../utils/errors';

// Initialize auth service
const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    };

    const user = await authService.register(userData);
    res.status(201).json(user);
  } catch (error: any) {
    // Let centralized handler format Mongoose validation errors
    if (error && error.name === 'ValidationError') {
      return next(error);
    }

    // Map known service errors to App errors so middleware returns proper codes
    if (error && error.message === 'User already exists') {
      return next(new AppValidationError(error.message));
    }

    return next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const credentials = {
      email: req.body.email,
      password: req.body.password,
    };

    const user = await authService.login(credentials);
    res.json(user);
  } catch (error: any) {
    if (error && error.message === 'Invalid credentials') {
      return next(new AppAuthError(error.message));
    }

    return next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppAuthError('Refresh token is required'));
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error: any) {
    if (error && (error.message === 'Invalid refresh token' || error.message === 'Refresh token expired')) {
      return next(new AppAuthError(error.message));
    }

    return next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppValidationError('Refresh token is required'));
    }

    await authService.logout(refreshToken);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    return next(error);
  }
};

export const logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return next(new AppAuthError('User not authenticated'));
    }

    await authService.logoutAll(userId);
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error: any) {
    return next(error);
  }
};