import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Strict rate limit for authentication endpoints (login, register)
// Prevents brute force attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
});

// Moderate rate limit for token refresh endpoint
// More lenient since tokens expire frequently
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 refresh requests per windowMs
  message: {
    success: false,
    message: 'Too many token refresh requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
// Applied to all API routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1500, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/';
  },
});

// Strict rate limit for sensitive operations (role changes, deletions)
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per hour
  message: {
    success: false,
    message: 'Too many sensitive operations, please try again after 1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
