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