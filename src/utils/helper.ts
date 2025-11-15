import { Response } from 'express';

// Role hierarchy: user < creator < admin
// user: can take tests/quizzes
// creator: can create tests, questions, and invite users to channels
// admin: full system access (manage all channels, users, roles)
export const ROLES = {
  USER:     'user',
  CREATOR:  'creator',
  ADMIN:    'admin',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Standard API Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
}

/**
 * Send a successful response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = HTTP_STATUS.OK
): void => {
  const response: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

/**
 * Send a created response (201)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): void => {
  sendSuccess(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * Send a no content response (204)
 */
export const sendNoContent = (res: Response): void => {
  res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errorCode?: string,
  details?: any
): void => {
  const response: ApiResponse = {
    success: false,
    statusCode,
    message,
    error: {
      code: errorCode,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

/**
 * Send a validation error response (422)
 */
export const sendValidationError = (
  res: Response,
  message: string = 'Validation failed',
  details?: any
): void => {
  sendError(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
};

/**
 * Send an unauthorized error response (401)
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized access'
): void => {
  sendError(res, message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
};

/**
 * Send a forbidden error response (403)
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Access forbidden'
): void => {
  sendError(res, message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
};

/**
 * Send a not found error response (404)
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): void => {
  sendError(res, message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
};

/**
 * Send a conflict error response (409)
 */
export const sendConflict = (
  res: Response,
  message: string = 'Resource conflict'
): void => {
  sendError(res, message, HTTP_STATUS.CONFLICT, 'CONFLICT');
};

/**
 * Send a bad request error response (400)
 */
export const sendBadRequest = (
  res: Response,
  message: string = 'Bad request',
  details?: any
): void => {
  sendError(res, message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', details);
};
