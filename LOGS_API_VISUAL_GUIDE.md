# Logs API Visual Guide

## 🔄 Request Flow

```
┌──────────────┐
│   Client     │
│  (Admin)     │
└──────┬───────┘
       │
       │ 1. GET /api/logs/stats
       │    Authorization: Bearer <admin_token>
       │
       ▼
┌──────────────────┐
│  Rate Limiter    │ ← 100 req/15min
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Auth Middleware │ ← Verify JWT Token
│    (protect)     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Role Middleware │ ← Check admin role
│ (authorizeRoles) │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Logs Controller  │ ← Validate params
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Logs Service    │ ← Business logic
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   File System    │ ← Read logs/error.log
│   (logs/*.log)   │   Read logs/combined.log
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Parse & Filter  │ ← JSON parsing
│                  │   Level filtering
│                  │   Search filtering
│                  │   Date filtering
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Pagination     │ ← Slice results
│                  │   Calculate pages
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Standard Format  │ ← Apply response format
└──────┬───────────┘
       │
       │ 2. Response
       ▼
┌──────────────────┐
│   Client         │
│   (Admin)        │
└──────────────────┘
```

---

## 📊 API Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LOGS API SYSTEM                         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌──────────────────┐   ┌──────────────┐
│   Security    │   │    Controller    │   │   Service    │
│   Layers      │   │    Layer         │   │   Layer      │
└───────────────┘   └──────────────────┘   └──────────────┘
        │                     │                     │
        │                     │                     │
┌───────▼──────┐   ┌─────────▼────────┐   ┌────────▼──────┐
│ Rate Limiter │   │  getLogFiles()   │   │ File Reading  │
│              │   │  getLogs()       │   │ JSON Parsing  │
│ 100/15min    │   │  getRecentErrors │   │ Filtering     │
└──────────────┘   │  getLogStats()   │   │ Pagination    │
                   │  clearLogs()     │   │ Statistics    │
┌──────────────┐   └──────────────────┘   └───────────────┘
│ Auth         │            │                      │
│ Middleware   │            │                      │
│ (JWT Token)  │            │                      │
└──────────────┘            │                      │
                            ▼                      ▼
┌──────────────┐   ┌──────────────────┐   ┌───────────────┐
│ Role Check   │   │  Response Format │   │  Log Files    │
│ (Admin Only) │   │                  │   │               │
└──────────────┘   │  success         │   │ combined.log  │
                   │  statusCode      │   │ error.log     │
                   │  message         │   └───────────────┘
                   │  data            │
                   │  timestamp       │
                   └──────────────────┘
```

---

## 🎯 Feature Map

```
                    ┌─────────────────────┐
                    │    LOGS API         │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
   ┌──────────┐         ┌──────────┐         ┌──────────┐
   │  READ    │         │  FILTER  │         │  MANAGE  │
   └──────────┘         └──────────┘         └──────────┘
         │                     │                     │
    ┌────┴────┐           ┌────┴────┐           ┌────┴────┐
    │         │           │         │           │         │
    ▼         ▼           ▼         ▼           ▼         ▼
┌────────┐ ┌───────┐  ┌──────┐ ┌──────┐   ┌──────┐ ┌──────┐
│ Files  │ │ Logs  │  │Level │ │Search│   │Stats │ │Clear │
│ List   │ │ View  │  │Filter│ │ Text │   │ View │ │ Logs │
└────────┘ └───────┘  └──────┘ └──────┘   └──────┘ └──────┘
    │         │           │         │         │         │
    │         │           ▼         ▼         │         │
    │         │      ┌──────────────────┐    │         │
    │         │      │  Date Range      │    │         │
    │         │      │  Filtering       │    │         │
    │         │      └──────────────────┘    │         │
    │         │                               │         │
    │         └───────────┬───────────────────┘         │
    │                     │                             │
    └─────────────────────┼─────────────────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ PAGINATION   │
                   │ 1-500/page   │
                   └──────────────┘
```

---

## 🔍 Filter Flow Diagram

```
Raw Log File
     │
     ▼
┌─────────────────┐
│  Read File      │
│  Split Lines    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse JSON     │
│  Per Line       │
└────────┬────────┘
         │
         ▼
    All Logs Array
         │
         ├──► Level Filter? ──Yes──► Filter by level
         │                            (error, warn, info)
         │        No
         ▼
         ├──► Search Filter? ─Yes──► Search in message
         │                            & all fields
         │        No
         ▼
         ├──► Date Range? ───Yes──► Filter by timestamp
         │                           (startDate, endDate)
         │        No
         ▼
    Filtered Logs
         │
         ▼
┌─────────────────┐
│  Calculate      │
│  Total & Pages  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Slice Array    │
│  [start:end]    │
└────────┬────────┘
         │
         ▼
    Paginated Logs
         │
         ▼
┌─────────────────┐
│  Format         │
│  Response       │
└────────┬────────┘
         │
         ▼
    JSON Response
```

---

## 📋 Endpoint Visualization

```
/api/logs
    │
    ├── GET /files
    │   └─► Returns: List of log files with metadata
    │       ├─ name
    │       ├─ size
    │       ├─ sizeFormatted
    │       ├─ modifiedAt
    │       └─ type
    │
    ├── GET /
    │   └─► Query Params:
    │       ├─ file=combined|error
    │       ├─ page=1
    │       ├─ pageSize=50
    │       ├─ level=error|warn|info|debug
    │       ├─ search=keyword
    │       ├─ startDate=ISO8601
    │       └─ endDate=ISO8601
    │   └─► Returns: Paginated filtered logs
    │
    ├── GET /errors
    │   └─► Query Params:
    │       └─ limit=100
    │   └─► Returns: Recent error logs only
    │
    ├── GET /stats
    │   └─► No params
    │   └─► Returns:
    │       ├─ totalFiles
    │       ├─ files[]
    │       ├─ recentErrors
    │       │   ├─ total
    │       │   ├─ byLevel
    │       │   ├─ oldestTimestamp
    │       │   └─ newestTimestamp
    │       ├─ serverUptime
    │       └─ memoryUsage
    │
    └── DELETE /:fileName
        └─► Params: fileName (combined|error)
        └─► Returns: Success confirmation
```

---

## 🎨 Response Format Visual

```
Success Response
┌──────────────────────────────────────┐
│ success: true                        │
│ statusCode: 200                      │
│ message: "Logs retrieved"            │
│ data: {                              │
│   logs: [...],                       │
│   total: 245,                        │
│   page: 1,                           │
│   pageSize: 50,                      │
│   totalPages: 5                      │
│ }                                    │
│ timestamp: "2025-11-16T10:30:45Z"    │
└──────────────────────────────────────┘

Error Response
┌──────────────────────────────────────┐
│ success: false                       │
│ statusCode: 404                      │
│ message: "Log file not found"        │
│ error: {                             │
│   code: "NOT_FOUND",                 │
│   details: {...}                     │
│ }                                    │
│ timestamp: "2025-11-16T10:30:45Z"    │
│ path: "/api/logs/test"               │
└──────────────────────────────────────┘
```

---

## 🔐 Security Flow

```
Request
   │
   ▼
┌─────────────────┐
│ Has Bearer      │──No──► 401 Unauthorized
│ Token?          │
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Valid JWT?      │──No──► 401 Token Invalid
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐
│ User Exists?    │──No──► 401 User Not Found
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Has Admin       │──No──► 403 Forbidden
│ Role?           │
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Process         │
│ Request         │
└────────┬────────┘
         │
         ▼
    200 OK
```

---

## 📊 Statistics Dashboard Concept

```
╔════════════════════════════════════════════════════════╗
║               SERVER LOGS DASHBOARD                    ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  📁 Log Files                                          ║
║  ├─ combined.log          1.2 MB    [View] [Clear]   ║
║  └─ error.log             256 KB    [View] [Clear]   ║
║                                                        ║
║  ⚠️ Recent Errors (Last 100)                          ║
║  ├─ Error:   45 entries                               ║
║  ├─ Warn:    30 entries                               ║
║  └─ Total:   75 errors                                ║
║                                                        ║
║  📈 Server Health                                      ║
║  ├─ Uptime:    24h 5m 32s                            ║
║  ├─ Memory:    150 MB / 512 MB                       ║
║  └─ Status:    Healthy ✓                             ║
║                                                        ║
║  🔍 Quick Search                                       ║
║  [Search logs...] [Level: All ▼] [Go]                ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## 🎯 Usage Patterns

### Pattern 1: Error Investigation
```
1. GET /api/logs/errors?limit=20
   └─► See recent errors

2. Find interesting error
   └─► Note the timestamp

3. GET /api/logs?startDate=<timestamp-1h>&endDate=<timestamp>
   └─► View context around error

4. GET /api/logs?search=<error_keyword>&level=error
   └─► Find similar errors
```

### Pattern 2: System Monitoring
```
┌─────────────────┐
│ Every 5 minutes │
└────────┬────────┘
         │
         ▼
   GET /api/logs/stats
         │
         ├──► Check error count
         │    └─► Alert if > threshold
         │
         └──► Check memory usage
              └─► Alert if > 80%
```

### Pattern 3: Log Maintenance
```
Weekly Task
    │
    ├─► GET /api/logs/files
    │   └─► Check file sizes
    │
    ├─► If size > 10MB
    │   └─► Export logs (optional)
    │
    └─► DELETE /api/logs/combined
        └─► Clear old logs
```

---

## 🚀 Quick Start Flow

```
┌──────────────────┐
│ 1. Start Server  │
│    npm run dev   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. Login Admin   │
│    POST /auth    │
│    /login        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. Get Token     │
│    Save access   │
│    Token         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. Test Logs     │
│    GET /logs     │
│    /stats        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. View Results  │
│    Debug away!   │
└──────────────────┘
```

---

## 💡 Tips & Tricks

```
Quick Commands Reference
────────────────────────
🔍 Find database errors
   ?search=database&level=error

📅 Today's logs only
   ?startDate=2025-11-16T00:00:00Z

🚨 Last 50 errors
   /errors?limit=50

📊 System overview
   /stats

🧹 Clear old logs
   DELETE /combined

⚡ Fast scan
   ?pageSize=20&page=1
```
