import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export default function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const now = new Date().toISOString();
  // Mongoose validation error
  if (err && err.name === 'ValidationError' && err.errors) {
    const errors: Record<string, string> = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongo duplicate key error (11000)
  if (err && (err.code === 11000 || err.code === 11001)) {
    const keyValues = err.keyValue || {};
    const fields = Object.keys(keyValues);
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field(s): ${fields.join(', ')}`,
      fields: keyValues,
    });
  }

  // App-specific errors
  if (err instanceof AppError || err instanceof ApiError) {
    const response: any = {
      success: false,
      message: err.message,
    };
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
      response.error = err;
    }
    return res.status(err.statusCode || 500).json(response);
  }

  // Fallback: log all server errors with Winston
  logger.error(`[${now}] Server Error:`, err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}
