# Logs API Quick Reference

## Base URL
```
/api/logs
```

## Authentication Required
All endpoints require:
- **Header**: `Authorization: Bearer <admin_token>`
- **Role**: `admin`

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs/files` | List all log files |
| GET | `/api/logs` | Get logs with filters |
| GET | `/api/logs/errors` | Get recent errors |
| GET | `/api/logs/stats` | Get statistics |
| DELETE | `/api/logs/:fileName` | Clear logs |

---

## Quick Examples

### 1. View Recent Errors (Most Common)
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/logs/errors?limit=50
```

### 2. Search for Specific Issue
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/logs?search=database&level=error"
```

### 3. Check Server Health
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/logs/stats
```

### 4. View Today's Logs
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/logs?startDate=2025-11-16T00:00:00Z&pageSize=100"
```

### 5. Clear Old Logs
```bash
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/logs/combined
```

---

## Query Parameters Cheat Sheet

### `/api/logs` Parameters

```
?file=combined           # Log file (combined, error)
&page=1                  # Page number
&pageSize=50             # Results per page (1-500)
&level=error             # Filter by level (error, warn, info, debug)
&search=keyword          # Search in messages
&startDate=2025-11-15    # From date (ISO 8601)
&endDate=2025-11-16      # To date (ISO 8601)
```

### `/api/logs/errors` Parameters

```
?limit=100               # Number of errors (1-1000)
```

---

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": { ... },
  "timestamp": "2025-11-16T10:00:00.000Z"
}
```

---

## Log Entry Structure

```json
{
  "timestamp": "2025-11-16T10:30:45.123Z",
  "level": "error",
  "message": "Error message here",
  "service": "blog-api",
  "stack": "Error stack trace..."
}
```

---

## Common Use Cases

### Debug Production Error
```bash
# 1. Check recent errors
GET /api/logs/errors?limit=20

# 2. Search for specific error
GET /api/logs?search=<error_keyword>&level=error

# 3. View full context
GET /api/logs?startDate=<when_error_occurred>&pageSize=100
```

### Monitor System Health
```bash
# Get overview
GET /api/logs/stats

# Check error rate
GET /api/logs/errors?limit=200
```

### Clean Up Logs
```bash
# Clear combined logs
DELETE /api/logs/combined

# Clear error logs
DELETE /api/logs/error
```

---

## Testing Workflow

1. **Login as Admin**
   ```bash
   POST /api/login
   { "email": "admin@example.com", "password": "..." }
   ```

2. **Get Token from Response**
   ```json
   { "data": { "accessToken": "eyJhbGc..." } }
   ```

3. **Use Token in Logs Requests**
   ```bash
   curl -H "Authorization: Bearer eyJhbGc..." \
     http://localhost:3000/api/logs/stats
   ```

---

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Success |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | No/invalid token |
| 403 | Forbidden | Not admin |
| 404 | Not Found | Log file not found |
| 500 | Server Error | Internal error |

---

## PowerShell Quick Start

```powershell
# Set token
$token = "your_admin_token"
$headers = @{ "Authorization" = "Bearer $token" }
$base = "http://localhost:3000/api/logs"

# Get stats
Invoke-RestMethod -Uri "$base/stats" -Headers $headers

# Get errors
Invoke-RestMethod -Uri "$base/errors?limit=50" -Headers $headers

# Search logs
Invoke-RestMethod -Uri "$base?search=database&level=error" -Headers $headers
```

---

## JavaScript Quick Start

```javascript
const token = 'your_admin_token';
const headers = { 'Authorization': `Bearer ${token}` };

// Get recent errors
const errors = await fetch('http://localhost:3000/api/logs/errors?limit=50', 
  { headers }
).then(r => r.json());

// Get stats
const stats = await fetch('http://localhost:3000/api/logs/stats', 
  { headers }
).then(r => r.json());

// Search logs
const logs = await fetch('http://localhost:3000/api/logs?search=error&pageSize=20', 
  { headers }
).then(r => r.json());
```

---

## Tips

✅ Use `pageSize=20` for quick scans  
✅ Use `level=error` to focus on issues  
✅ Combine `search` + `level` for targeted debugging  
✅ Check `/stats` regularly for monitoring  
✅ Clear old logs monthly to save space  
✅ Use date filters for specific time periods  
✅ Export logs with high `pageSize` (up to 500)
