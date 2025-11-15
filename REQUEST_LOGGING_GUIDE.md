# Request Logging Guide

## ✅ What Gets Logged Now

All HTTP requests are automatically logged to both the console and log files.

### Logged Information

Each request logs:
- **IP Address** - Client IP
- **Timestamp** - When request was made
- **HTTP Method** - GET, POST, PUT, DELETE, etc.
- **URL Path** - Endpoint accessed
- **Status Code** - Response status (200, 404, 500, etc.)
- **Response Time** - How long the request took
- **User Agent** - Client information

---

## 📊 Log Files

### 1. `logs/combined.log`
Contains **all logs**:
- ✅ HTTP requests (info level)
- ✅ Application logs (info level)
- ✅ Errors (error level)
- ✅ Warnings (warn level)

### 2. `logs/error.log`
Contains **errors only**:
- ✅ Server errors (500)
- ✅ Application errors
- ✅ Database errors
- ✅ Authentication failures

---

## 📝 Log Format Examples

### HTTP Request Log (combined.log)
```json
{
  "message": "::1 - - [16/Nov/2025:10:30:45 +0000] \"GET /api/logs/stats HTTP/1.1\" 200 1234 \"-\" \"Mozilla/5.0\"",
  "level": "info",
  "timestamp": "2025-11-16T10:30:45.123Z",
  "service": "blog-api",
  "type": "http"
}
```

### Application Log (combined.log)
```json
{
  "message": "Root endpoint accessed",
  "level": "info",
  "timestamp": "2025-11-16T10:30:45.123Z",
  "service": "blog-api"
}
```

### Error Log (error.log)
```json
{
  "message": "Database connection failed",
  "level": "error",
  "timestamp": "2025-11-16T10:30:45.123Z",
  "service": "blog-api",
  "stack": "Error: Database connection failed\n    at ..."
}
```

---

## 🔍 What Gets Logged

### Automatically Logged
✅ Every HTTP request (all endpoints)  
✅ Request method and path  
✅ Response status code  
✅ Response time  
✅ User IP address  
✅ User agent  

### Manually Logged (in code)
✅ Application events  
✅ Error occurrences  
✅ Database operations  
✅ Authentication events  

---

## 🧪 Testing the Logging

### 1. Start the Server
```bash
npm run dev
```

### 2. Make Some Requests
```bash
# Health check
curl http://localhost:3000/health

# Root endpoint
curl http://localhost:3000/

# API request
curl http://localhost:3000/api/logs/files \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Check the Logs
```bash
# View combined logs
cat logs/combined.log

# View error logs
cat logs/error.log

# Or use the API
curl http://localhost:3000/api/logs?pageSize=10 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📈 Log Examples by Request Type

### Successful Request
```
Request:  GET /health
Response: 200 OK
Logged:   ::1 - - [16/Nov/2025:10:30:45 +0000] "GET /health HTTP/1.1" 200 245
```

### Failed Request
```
Request:  GET /api/invalid
Response: 404 Not Found
Logged:   ::1 - - [16/Nov/2025:10:30:46 +0000] "GET /api/invalid HTTP/1.1" 404 0
```

### Authentication Error
```
Request:  GET /api/logs/stats (no token)
Response: 401 Unauthorized
Logged:   ::1 - - [16/Nov/2025:10:30:47 +0000] "GET /api/logs/stats HTTP/1.1" 401 156
```

### Server Error
```
Request:  POST /api/quiz/create (invalid data)
Response: 500 Internal Server Error
Logged:   ::1 - - [16/Nov/2025:10:30:48 +0000] "POST /api/quiz/create HTTP/1.1" 500 89
Error:    {"level":"error","message":"Validation failed","timestamp":"..."}
```

---

## 🎯 Morgan Format Breakdown

The `combined` format includes:
```
:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
```

**Example:**
```
::1 - - [16/Nov/2025:10:30:45 +0000] "GET /api/logs/stats HTTP/1.1" 200 1234 "-" "curl/7.68.0"
│   │ │ │                           │   │                  │   │    │    │      │
│   │ │ │                           │   │                  │   │    │    │      └─ User Agent
│   │ │ │                           │   │                  │   │    │    └─ Referrer
│   │ │ │                           │   │                  │   │    └─ Response Size
│   │ │ │                           │   │                  │   └─ Status Code
│   │ │ │                           │   │                  └─ HTTP Version
│   │ │ │                           │   └─ URL Path
│   │ │ │                           └─ HTTP Method
│   │ │ └─ Timestamp
│   │ └─ Remote User (- if none)
│   └─ Separator
└─ Client IP
```

---

## 🔧 Customization

### Change Log Level
Edit `src/utils/logger.ts`:
```typescript
const logger = createLogger({
  level: 'debug', // or 'info', 'warn', 'error'
  // ...
});
```

### Add Custom Logs in Code
```typescript
import logger from '../utils/logger';

// Info log
logger.info('User logged in', { userId: user.id });

// Error log
logger.error('Payment failed', { error: err.message, orderId });

// Warning log
logger.warn('Rate limit approaching', { ip: req.ip });

// Debug log
logger.debug('Cache hit', { key: cacheKey });
```

---

## 📊 View Logs via API

### Get Recent HTTP Requests
```bash
# All requests (combined log)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?file=combined&search=HTTP&pageSize=50"

# Filter by status code
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?search=200&pageSize=20"

# Errors only
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?file=error&pageSize=50"
```

---

## 💡 Tips

1. **Check logs regularly**: Use `/api/logs/stats` to monitor error rates
2. **Search efficiently**: Use the `search` parameter to find specific requests
3. **Filter by time**: Use `startDate` and `endDate` for specific time ranges
4. **Monitor errors**: Check `/api/logs/errors` for recent issues
5. **Clean up**: Use `DELETE /api/logs/combined` to clear old logs

---

## 🎉 Summary

**Yes, all requests are now logged!**

- ✅ Every HTTP request is logged to `logs/combined.log`
- ✅ Errors are logged to `logs/error.log`
- ✅ Logs include method, path, status, IP, and timing
- ✅ Logs are in JSON format for easy parsing
- ✅ Accessible via API at `/api/logs` (admin only)
- ✅ Viewable in real-time in the console

Start the server and make requests - they'll all be logged automatically!
