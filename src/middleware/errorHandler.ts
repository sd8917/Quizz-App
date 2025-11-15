import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';
import { ApiResponse, HTTP_STATUS } from '../utils/helper';

export default function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const now = new Date().toISOString();
  
  // Mongoose validation error
  if (err && err.name === 'ValidationError' && err.errors) {
    const errors: Record<string, string> = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });

    const response: ApiResponse = {
      success: false,
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors,
      },
      timestamp: now,
      path: req.path,
    };

    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
  }

  // Mongo duplicate key error (11000)
  if (err && (err.code === 11000 || err.code === 11001)) {
    const keyValues = err.keyValue || {};
    const fields = Object.keys(keyValues);
    
    const response: ApiResponse = {
      success: false,
      statusCode: HTTP_STATUS.CONFLICT,
      message: `Duplicate value for field(s): ${fields.join(', ')}`,
      error: {
        code: 'DUPLICATE_KEY',
        details: keyValues,
      },
      timestamp: now,
      path: req.path,
    };

    return res.status(HTTP_STATUS.CONFLICT).json(response);
  }

  // App-specific errors
  if (err instanceof AppError || err instanceof ApiError) {
    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    const response: ApiResponse = {
      success: false,
      statusCode,
      message: err.message,
      error: {
        code: err.name || 'APPLICATION_ERROR',
      },
      timestamp: now,
      path: req.path,
    };

    if (process.env.NODE_ENV === 'development') {
      response.error!.details = {
        stack: err.stack,
      };
    }

    return res.status(statusCode).json(response);
  }

  // Fallback: log all server errors with Winston
  logger.error(`[${now}] Server Error:`, err);
  
  const response: ApiResponse = {
    success: false,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    error: {
      code: 'INTERNAL_ERROR',
    },
    timestamp: now,
    path: req.path,
  };

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.error!.details = {
      stack: err.stack,
    };
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
}
