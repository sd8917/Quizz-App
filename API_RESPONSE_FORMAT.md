# API Response Format

This document describes the standardized response format for all API endpoints in the Quizz-App.

## Standard Response Structure

All API responses follow this consistent structure:

```typescript
{
  "success": boolean,
  "statusCode": number,
  "message": string,
  "data": any | null,           // Optional: Present on success
  "error": {                     // Optional: Present on error
    "code": string,
    "details": any
  },
  "timestamp": string,           // ISO 8601 format
  "path": string                 // Optional: Request path (in error responses)
}
```

## HTTP Status Codes

### Success Codes (2xx)
- **200 OK** - Request succeeded
- **201 CREATED** - Resource created successfully
- **202 ACCEPTED** - Request accepted for processing
- **204 NO CONTENT** - Request succeeded with no content to return

### Client Error Codes (4xx)
- **400 BAD REQUEST** - Invalid request syntax or parameters
- **401 UNAUTHORIZED** - Authentication required or failed
- **403 FORBIDDEN** - Authenticated but insufficient permissions
- **404 NOT FOUND** - Resource not found
- **409 CONFLICT** - Resource conflict (e.g., duplicate entry)
- **422 UNPROCESSABLE ENTITY** - Validation error
- **429 TOO MANY REQUESTS** - Rate limit exceeded

### Server Error Codes (5xx)
- **500 INTERNAL SERVER ERROR** - Server error
- **503 SERVICE UNAVAILABLE** - Service temporarily unavailable

## Response Examples

### Success Response (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64abc123def456",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-15T10:30:45.123Z"
}
```

### Created Response (201)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64abc123def456",
      "username": "janedoe",
      "email": "jane@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-15T10:31:20.456Z"
}
```

### Validation Error Response (422)

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  },
  "timestamp": "2025-11-15T10:32:10.789Z",
  "path": "/api/v1/auth/register"
}
```

### Authentication Error Response (401)

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": {
    "code": "UNAUTHORIZED"
  },
  "timestamp": "2025-11-15T10:33:05.234Z",
  "path": "/api/v1/auth/login"
}
```

### Not Found Error Response (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Quiz not found",
  "error": {
    "code": "NOT_FOUND"
  },
  "timestamp": "2025-11-15T10:34:15.567Z",
  "path": "/api/v1/quiz/64xyz789abc123"
}
```

### Conflict Error Response (409)

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Duplicate value for field(s): email",
  "error": {
    "code": "DUPLICATE_KEY",
    "details": {
      "email": "john@example.com"
    }
  },
  "timestamp": "2025-11-15T10:35:20.890Z",
  "path": "/api/v1/auth/register"
}
```

### Internal Server Error Response (500)

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "error": {
    "code": "INTERNAL_ERROR"
  },
  "timestamp": "2025-11-15T10:36:30.123Z",
  "path": "/api/v1/quiz/create"
}
```

### Development Mode Error (500)

In development mode, errors include stack traces:

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Database connection failed",
  "error": {
    "code": "INTERNAL_ERROR",
    "details": {
      "stack": "Error: Database connection failed\n    at /app/src/config/database.ts:45:12\n    ..."
    }
  },
  "timestamp": "2025-11-15T10:37:40.456Z",
  "path": "/api/v1/quiz/list"
}
```

## Helper Functions Usage

### In Controllers

```typescript
import { sendSuccess, sendCreated, sendError, HTTP_STATUS } from '../utils/helper';

// Success response
export const getQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quiz = await quizService.findById(req.params.id);
    sendSuccess(res, quiz, 'Quiz retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Created response
export const createQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quiz = await quizService.create(req.body);
    sendCreated(res, quiz, 'Quiz created successfully');
  } catch (error) {
    next(error);
  }
};

// Custom success with different status
export const updateQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quiz = await quizService.update(req.params.id, req.body);
    sendSuccess(res, quiz, 'Quiz updated successfully', HTTP_STATUS.ACCEPTED);
  } catch (error) {
    next(error);
  }
};

// No content response
export const deleteQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await quizService.delete(req.params.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
};
```

### Error Responses

```typescript
import { 
  sendValidationError, 
  sendUnauthorized, 
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendBadRequest 
} from '../utils/helper';

// Validation error
if (!req.body.email) {
  return sendValidationError(res, 'Email is required');
}

// Unauthorized
if (!token) {
  return sendUnauthorized(res, 'Authentication token required');
}

// Forbidden
if (user.role !== 'admin') {
  return sendForbidden(res, 'Admin access required');
}

// Not found
if (!quiz) {
  return sendNotFound(res, 'Quiz not found');
}

// Conflict
if (existingUser) {
  return sendConflict(res, 'User already exists');
}

// Bad request
if (isNaN(page) || page < 1) {
  return sendBadRequest(res, 'Invalid page number', { page });
}
```

## Available Helper Functions

| Function | Status Code | Use Case |
|----------|-------------|----------|
| `sendSuccess(res, data, message?, statusCode?)` | 200 (default) | General success response |
| `sendCreated(res, data, message?)` | 201 | Resource creation |
| `sendNoContent(res)` | 204 | Successful deletion/no content |
| `sendError(res, message, statusCode?, code?, details?)` | Custom | Custom error response |
| `sendValidationError(res, message?, details?)` | 422 | Validation failures |
| `sendUnauthorized(res, message?)` | 401 | Authentication errors |
| `sendForbidden(res, message?)` | 403 | Authorization errors |
| `sendNotFound(res, message?)` | 404 | Resource not found |
| `sendConflict(res, message?)` | 409 | Resource conflicts |
| `sendBadRequest(res, message?, details?)` | 400 | Invalid requests |

## Best Practices

1. **Always use helper functions** - Don't manually construct response objects
2. **Consistent messages** - Use clear, descriptive messages for users
3. **Include relevant data** - Return necessary data for client operations
4. **Proper status codes** - Use appropriate HTTP status codes for each scenario
5. **Error details in development** - Include stack traces only in dev environment
6. **Meaningful error codes** - Use descriptive error codes for client-side handling
7. **Timestamp all responses** - ISO 8601 format for consistency
8. **Path in error responses** - Include request path to help debugging

## Error Handling Flow

```
Request → Controller → Service
                ↓
         Error occurs
                ↓
         throw Error
                ↓
    Error Middleware
                ↓
  Standard Format Applied
                ↓
    Response to Client
```

The error handler middleware automatically formats all errors into the standard response structure, so controllers only need to throw errors or call `next(error)`.
