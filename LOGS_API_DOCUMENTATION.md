# Server Logs API Documentation

## Overview

Admin-only API endpoints for viewing, filtering, and managing server logs. All endpoints require authentication and admin role.

## Authentication

All endpoints require:
- **Authorization Header**: `Bearer <admin_access_token>`
- **User Role**: `admin`

---

## Endpoints

### 1. Get Log Files List

Get a list of all available log files with metadata.

**Endpoint:** `GET /api/logs/files`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Log files retrieved successfully",
  "data": {
    "files": [
      {
        "name": "error.log",
        "path": "error",
        "size": 245680,
        "sizeFormatted": "239.92 KB",
        "modifiedAt": "2025-11-16T10:30:45.123Z",
        "type": "error"
      },
      {
        "name": "combined.log",
        "path": "combined",
        "size": 1048576,
        "sizeFormatted": "1 MB",
        "modifiedAt": "2025-11-16T10:30:45.123Z",
        "type": "combined"
      }
    ]
  },
  "timestamp": "2025-11-16T10:31:00.000Z"
}
```

---

### 2. Get Logs with Filtering

Retrieve logs with pagination, filtering, and search capabilities.

**Endpoint:** `GET /api/logs`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | string | `combined` | Log file name (combined, error) |
| `page` | number | `1` | Page number |
| `pageSize` | number | `50` | Items per page (1-500) |
| `level` | string | - | Filter by log level (error, info, warn, debug) |
| `search` | string | - | Search in log messages |
| `startDate` | string | - | Filter from date (ISO 8601) |
| `endDate` | string | - | Filter to date (ISO 8601) |

**Example Requests:**

```bash
# Get all combined logs (default)
GET /api/logs

# Get error logs only
GET /api/logs?file=error&page=1&pageSize=50

# Filter by log level
GET /api/logs?level=error

# Search logs
GET /api/logs?search=database

# Date range filter
GET /api/logs?startDate=2025-11-15T00:00:00Z&endDate=2025-11-16T23:59:59Z

# Combined filters
GET /api/logs?file=error&level=error&search=connection&page=1&pageSize=20
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logs retrieved successfully",
  "data": {
    "logs": [
      {
        "timestamp": "2025-11-16T10:30:45.123Z",
        "level": "error",
        "message": "Database connection failed",
        "service": "blog-api",
        "stack": "Error: Database connection failed\n    at /app/src/config/database.ts:45:12"
      },
      {
        "timestamp": "2025-11-16T10:25:30.456Z",
        "level": "info",
        "message": "Server started on port 3000",
        "service": "blog-api"
      }
    ],
    "total": 245,
    "page": 1,
    "pageSize": 50,
    "totalPages": 5,
    "file": "combined"
  },
  "timestamp": "2025-11-16T10:31:00.000Z"
}
```

---

### 3. Get Recent Errors

Get the most recent error logs (quick access).

**Endpoint:** `GET /api/logs/errors`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | `100` | Number of errors to retrieve (1-1000) |

**Example Request:**
```bash
GET /api/logs/errors?limit=50
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recent errors retrieved successfully",
  "data": {
    "errors": [
      {
        "timestamp": "2025-11-16T10:30:45.123Z",
        "level": "error",
        "message": "Failed to connect to MongoDB",
        "service": "blog-api",
        "stack": "MongoNetworkError: failed to connect to server..."
      },
      {
        "timestamp": "2025-11-16T10:28:20.456Z",
        "level": "error",
        "message": "User not found",
        "service": "blog-api"
      }
    ],
    "total": 50
  },
  "timestamp": "2025-11-16T10:31:00.000Z"
}
```

---

### 4. Get Log Statistics

Get comprehensive statistics about server logs and health.

**Endpoint:** `GET /api/logs/stats`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Log statistics retrieved successfully",
  "data": {
    "totalFiles": 2,
    "files": [
      {
        "name": "error.log",
        "size": "239.92 KB",
        "modifiedAt": "2025-11-16T10:30:45.123Z"
      },
      {
        "name": "combined.log",
        "size": "1 MB",
        "modifiedAt": "2025-11-16T10:30:45.123Z"
      }
    ],
    "recentErrors": {
      "total": 150,
      "byLevel": {
        "error": 120,
        "warn": 30
      },
      "oldestTimestamp": "2025-11-15T08:00:00.000Z",
      "newestTimestamp": "2025-11-16T10:30:45.123Z"
    },
    "serverUptime": 86400.5,
    "memoryUsage": {
      "rss": 52428800,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576,
      "arrayBuffers": 524288
    }
  },
  "timestamp": "2025-11-16T10:31:00.000Z"
}
```

---

### 5. Clear Logs

Clear all logs from a specific log file (admin only).

**Endpoint:** `DELETE /api/logs/:fileName`

**Parameters:**
- `fileName`: `combined` or `error`

**Example Request:**
```bash
DELETE /api/logs/error
DELETE /api/logs/combined
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logs cleared from error.log",
  "data": null,
  "timestamp": "2025-11-16T10:35:00.000Z"
}
```

**Error Response (Invalid File):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid file name",
  "error": {
    "code": "BAD_REQUEST",
    "details": {
      "provided": "test",
      "allowed": ["combined", "error"]
    }
  },
  "timestamp": "2025-11-16T10:35:00.000Z"
}
```

---

## Complete Testing Examples

### cURL Examples

```bash
# 1. Get log files
curl -X GET http://localhost:3000/api/logs/files \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 2. Get combined logs with pagination
curl -X GET "http://localhost:3000/api/logs?file=combined&page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 3. Get error logs only
curl -X GET "http://localhost:3000/api/logs?file=error&level=error" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 4. Search logs
curl -X GET "http://localhost:3000/api/logs?search=database&pageSize=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 5. Get recent errors
curl -X GET "http://localhost:3000/api/logs/errors?limit=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 6. Get statistics
curl -X GET http://localhost:3000/api/logs/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 7. Clear error logs
curl -X DELETE http://localhost:3000/api/logs/error \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### PowerShell Examples

```powershell
$token = "YOUR_ADMIN_TOKEN"
$headers = @{ "Authorization" = "Bearer $token" }

# Get log files
Invoke-RestMethod -Uri "http://localhost:3000/api/logs/files" -Headers $headers

# Get filtered logs
Invoke-RestMethod -Uri "http://localhost:3000/api/logs?file=error&level=error&page=1&pageSize=20" -Headers $headers

# Get recent errors
Invoke-RestMethod -Uri "http://localhost:3000/api/logs/errors?limit=50" -Headers $headers

# Get statistics
Invoke-RestMethod -Uri "http://localhost:3000/api/logs/stats" -Headers $headers

# Clear logs
Invoke-RestMethod -Uri "http://localhost:3000/api/logs/error" -Method Delete -Headers $headers
```

### JavaScript/Fetch Examples

```javascript
const ADMIN_TOKEN = 'your_admin_token_here';
const BASE_URL = 'http://localhost:3000/api/logs';

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`
};

// Get log files
async function getLogFiles() {
  const response = await fetch(`${BASE_URL}/files`, { headers });
  return await response.json();
}

// Get logs with filters
async function getLogs(options = {}) {
  const params = new URLSearchParams({
    file: options.file || 'combined',
    page: options.page || 1,
    pageSize: options.pageSize || 50,
    ...(options.level && { level: options.level }),
    ...(options.search && { search: options.search }),
  });
  
  const response = await fetch(`${BASE_URL}?${params}`, { headers });
  return await response.json();
}

// Get recent errors
async function getRecentErrors(limit = 100) {
  const response = await fetch(`${BASE_URL}/errors?limit=${limit}`, { headers });
  return await response.json();
}

// Get statistics
async function getStats() {
  const response = await fetch(`${BASE_URL}/stats`, { headers });
  return await response.json();
}

// Clear logs
async function clearLogs(fileName) {
  const response = await fetch(`${BASE_URL}/${fileName}`, {
    method: 'DELETE',
    headers
  });
  return await response.json();
}

// Usage examples
const files = await getLogFiles();
const errors = await getLogs({ file: 'error', level: 'error', page: 1 });
const recent = await getRecentErrors(50);
const stats = await getStats();
await clearLogs('error');
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Not authorized, no token",
  "error": {
    "code": "UNAUTHORIZED"
  },
  "timestamp": "2025-11-16T10:31:00.000Z"
}
```

### 403 Forbidden (Non-Admin User)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Forbidden: insufficient role",
  "error": {
    "code": "FORBIDDEN"
  },
  "timestamp": "2025-11-16T10:31:00.000Z"
}
```

### 404 Not Found (Invalid Log File)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Log file 'test.log' not found",
  "error": {
    "code": "NOT_FOUND"
  },
  "timestamp": "2025-11-16T10:31:00.000Z"
}
```

### 400 Bad Request (Invalid Parameters)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Page size must be between 1 and 500",
  "error": {
    "code": "BAD_REQUEST",
    "details": {
      "pageSize": "1000"
    }
  },
  "timestamp": "2025-11-16T10:31:00.000Z"
}
```

---

## Log Entry Format

Each log entry contains:

```typescript
{
  timestamp: string;      // ISO 8601 format
  level: string;          // error, warn, info, debug
  message: string;        // Log message
  service?: string;       // Service name (e.g., "blog-api")
  stack?: string;         // Error stack trace (for errors)
  [key: string]: any;     // Additional custom fields
}
```

---

## Use Cases

### 1. Debug Production Issues
```bash
# Search for specific error
GET /api/logs?search=database&level=error&pageSize=100
```

### 2. Monitor Error Trends
```bash
# Get statistics and recent errors
GET /api/logs/stats
GET /api/logs/errors?limit=200
```

### 3. Audit User Actions
```bash
# Search for user-related logs
GET /api/logs?search=userId:64abc123&startDate=2025-11-15T00:00:00Z
```

### 4. Clear Old Logs
```bash
# Clear combined logs (keep errors)
DELETE /api/logs/combined
```

### 5. Export Logs for Analysis
```bash
# Get all logs without pagination (use high pageSize)
GET /api/logs?pageSize=500&page=1
```

---

## Best Practices

1. **Regular Monitoring**: Check `/api/logs/stats` daily for error trends
2. **Search Efficiently**: Use specific search terms and date ranges
3. **Pagination**: Use reasonable page sizes (50-100) for better performance
4. **Log Rotation**: Clear old logs periodically using DELETE endpoints
5. **Error Analysis**: Use `/api/logs/errors` for quick error overview
6. **Date Filtering**: Use `startDate` and `endDate` for targeted debugging

---

## Security Notes

- ✅ All endpoints require admin authentication
- ✅ Only admin users can access logs
- ✅ Logs may contain sensitive information - handle carefully
- ✅ Clear logs regularly to prevent disk space issues
- ✅ Audit admin access to logs endpoints
