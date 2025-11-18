import { Request, Response, NextFunction } from 'express';
import { sendUnauthorized, sendForbidden } from '../utils/helper';

/**
 * Middleware to validate API key for Swagger documentation access
 * Add API_DOC_KEY to your .env file
 */
export const validateSwaggerApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validApiKey = process.env.API_DOC_KEY || 'your-secret-api-key-here';

  if (!apiKey) {
    return sendUnauthorized(res, 'API key is required. Provide x-api-key header or apiKey query parameter');
  }

  if (apiKey !== validApiKey) {
    return sendForbidden(res, 'Invalid API key');
  }

  next();
};
