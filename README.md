# triviaverse.site API

A scalable backend for a quiz collaboration platform — enabling teams to create channels, invite members, add and approve questions, and manage archives.
Built with Node.js, Express, MongoDB, and Redis.
Supports millions of users, background workers, and S3 cold storage archiving.

## 🏗️ High-Level Architecture


```
                           ┌──────────────────────────────┐
                           │        Admin UI (RBAC)       │
                           └──────────────┬───────────────┘
                                          │
                                          ▼
                   ┌──────────────────────────────┐
                   │    Nginx / Load Balancer│
                   └──────────────────────────────┘
                                │
      ┌─────────────────────────┴─────────────────────────┐
      │                                                   │
┌───────────────┐                                ┌────────────────┐
│ Auth Service  │                                │ Channel Service│
│ (JWT + Redis) │                                │ CRUD + Invite  │
└───────────────┘                                └────────────────┘
      │                                                   │
      ▼                                                   ▼
┌────────────────────────────┐                ┌────────────────────────┐
│ Question Service           │                │ Leaderboard Service    │
│ Pending → Approved flow    │                │ Cached in Redis        │
└────────────────────────────┘                └────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│ MongoDB Atlas (Sharded)                                    │
│  • Users, Channels, Questions, Scores                      │
│  • TTL indexes for auto expiry                             │
└────────────────────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│ Redis (Cache + Queue + Rate Limit + Refresh Tokens)         │
└────────────────────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│ BullMQ Workers + AWS S3 (Archival, Notification, Cleanup)  │
└────────────────────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────────────────┐
│Monitoring: PM2 Monitor | Serverlogs admin dashboard        │
└────────────────────────────────────────────────────────────┘

```
##  📦Folder structure

```
quiz-backend/
├── src/
│   ├── models/      --> Databse schema
│   ├── controllers/ --> 
│   ├── routes/      --->
│   ├── middleware/  --> Pre request checks
|   ├── repository/  --> DB operation handling
│   ├── services/   --> Logics
│   │    ├── auth/
│   │    ├── channel/
│   │    └── worker/
│   ├── jobs/
│   │    ├── archive.job.ts
│   │    ├── leaderboard.job.ts
│   └── utils/
│
├── config/
│   ├── db.ts
│   ├── redis.ts
│   ├── s3.ts
│   └── bullmq.ts
│
└── README.md


```

## ENV STRUCTURE
```
PORT=8000
MONGODB_URI=XXX
JWT_SECRET=XXX
NODE_ENV=XXX
EMAIL_PASS=XXX
EMAIL_USER=XXX
REFRESH_TOKEN_EXPIRY=XXX
ACCESS_TOKEN_EXPIRY=XXX
SUPPORT_EMAIL=XXXX
WEBSITE_URL=xxxx
GEMINI_API_KEY=xxxxx

```


## ⚙️ Tech Stack

- API Framework	               Express.js
- Database	                   MongoDB Atlas (Sharded)
- ORM/ODM	                   Mongoose
- Caching / Queue	           Redis + BullMQ
- File Storage	               AWS S3 + Glacier
- Authentication	           JWT (Access: 5min, Refresh: 30 days)
- Authorization                Role-Based Access Control (RBAC)
- Rate Limiting                express-rate-limit (IP-based throttling)
- CI/CD	                       GitHub Actions / GitLab CI
- Deployment 	               Will think over it.
- Monitoring	               Prometheus, Grafana, Sentry, ELK Stack

## 🛡️ Rate Limiting

The API implements IP-based rate limiting using `express-rate-limit` to protect against abuse and DDoS attacks:

**Rate Limit Tiers:**

1. **Authentication Endpoints** (Login/Register)
   - 5 requests per 15 minutes per IP
   - Prevents brute force attacks
   - Routes: `/api/login`, `/api/register`

2. **Token Refresh Endpoint**
   - 20 requests per 15 minutes per IP
   - More lenient since tokens expire frequently
   - Route: `/api/refresh`

3. **General API Endpoints**
   - 100 requests per 15 minutes per IP
   - Applied to all `/api/*` routes
   - Excludes health check endpoints

4. **Sensitive Operations** (Role Management)
   - 10 requests per 1 hour per IP
   - Extra protection for admin operations
   - Route: `/api/v1/profile/user/:userId/roles`

**Rate Limit Headers:**
When rate limited, responses include:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Time when limit resets (Unix timestamp)

**Error Response (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again after 15 minutes"
}
```

## 🔑 Token-Based Authentication

The system uses a dual-token approach for enhanced security:

**Access Token (JWT)**
- Short-lived: 3 day expiry
- Used for API authentication (Bearer token in Authorization header)
- Contains user ID ,role information and active/inactive status
- Stateless verification using JWT secret

**Refresh Token**
- Long-lived: 30 days expiry
- Stored in MongoDB with user reference
- Used to obtain new access tokens when they expire
- Can be revoked (logout, security breach)
- Automatic cleanup via TTL index after expiration

**Security Features:**
- Access tokens expire quickly to minimize exposure if compromised
- Refresh tokens stored in database allow server-side revocation
- Single logout revokes one refresh token
- Logout-all revokes all user's refresh tokens (useful for security incidents)
- MongoDB TTL index auto-deletes expired refresh tokens

## 🔐 Role-Based Access Control (RBAC)

The system implements a three-tier role hierarchy:

**user** (default role)
- Can take/submit quizzes
- Can view their own attempts and scores
- Can view channels they are invited to
- Can view leaderboard channel wise(Invited)
- Can view the submitted quiz dashboard

**creator**
- All user permissions, plus:
- Can create channels
- Can create quiz questions (single or bulk)
- Can invite users to channels
- Intended for quiz creators and content managers
- Can view leaderboard channel wise(Invited)
- Anlaytical dashboard for user/channel/quizzed.

**admin**
- All creator permissions, plus:
- Can delete any channel
- Can view all users in the system
- Can manage user roles (assign/remove user, creator, or admin roles)
- Full system access for administrative tasks

` Role assignment `: New users are assigned the 'user' role by default. Admins can promote users to 'creator' or 'admin' via the channel management API.

## 🧩 Data Models (MongoDB + Mongoose)

# User
```
{
  _id: ObjectId,
  username: String,
  email: { type: String, unique: true },
  password: String (hashed),
  roles: ["user", "creator", "admin"],
  createdAt: Date,
  isActive: Boolean,
  isPremium: Boolean,
  premiumExpiresAt: Boolean,
  lastLoginAt: Date,
  lastActiveAt: Date
}
```

# Channel
```
{
  "_id":         ObjectId,
  "name":        String,
  "description": String,
  "owner":       ObjectId,
  "members": [
    {
      "user": ObjectId,
      "role": ["user", "creator", "admin"],
    }
  ],
  "createdAt": "2025-11-27T10:00Z",
  "status": "active"
}

```

# Question
```
{
  _id: ObjectId,
  channelId: ObjectId,
  createdBy: ObjectId,
  text: String,
  choices: [{ text: String, correct: Boolean }],
  meta: { difficulty: String, tags: [String] },
  status: "pending"|"approved"|"deleted"|"archived",
  createdAt: Date,
  approvedBy: ObjectId,
  approvedAt: Date,
  deletedBy: ObjectId,
  deletedAt: Date
}


```

### Indexes

- email → unique

- channelId, status → compound index for efficient filtering

- createdAt → TTL index for old records (if needed)

- meta.tags → multikey index for search/filtering


Features:
- TypeScript configuration
- Express server with middleware
- MongoDB models for User and Post (Mongoose)
- JWT authentication
- Routes for auth and posts

Getting started

1. Copy `.env` and set values.
2. Install dependencies: `npm install`
3. Run in development: `npm run dev`
4. Build: `npm run build`
5. Start production: `npm start`

Tests:

- Run tests: `npm test`

## API Reference (v1)

For version create folder by version name.

All routes are mounted under `/api/{routeName}`. Authentication is JWT-based — protected routes require a valid token in the `Authorization: Bearer <token>` header.

Note: route files are registered automatically from `src/routes/v1` and mounted using their filename (for example `auth.routes.ts` => `/api/`).

Endpoints (summary)

- Auth
  - POST /api/register — Register a new user (public)
  - POST /api/login — Login and receive JWT tokens (public)
  - POST /api/refresh — Refresh access token using refresh token (public)
  - POST /api/logout — Logout and revoke refresh token (public)
  - POST /api/logout-all — Logout from all devices (protected)- Channels (all protected)
  - POST /api/channel/ — Create a channel (creator/admin only)
  - GET /api/channel/ — List channels for current user
  - GET /api/channel/:channelId — Get channel details
  - POST /api/channel/:channelId/invite — Invite a user to a channel (creator/admin only)
  - DELETE /api/channel/:channelId — Delete a channel (admin only)

- Quiz (protected)
  - POST /api/quiz/channel/:channelId — Create a question in a channel (creator/admin only)
  - POST /api/quiz/channel/:channelId/bulk — Bulk create questions (creator/admin only)
  - GET /api/quiz/channel/:channelId/questions — Get questions for a channel (all authenticated users)
  - POST /api/quiz/channel/:channelId/submit — Submit a quiz (all authenticated users)

- Attempts (protected)
  - POST /api//attempt/channel/:channelId/submit — Submit quiz attempt (service prevents duplicate attempts by default)
  - GET /api/attempt/user — Get attempts for current user
  - GET /api/attempt/channel/:channelId/leaderboard — Get leaderboard for a channel (top 20 by percentage)

- Profile (protected)
  - GET /api/profile/ — Get current user profile
  - PUT /api/profile/ — Update current user profile (username, email, password)
  - GET /api/profile/users — List all users (admin only)
  - PUT /api/profile/user/:userId/roles — Update user roles (admin only)Notes about attempts & leaderboard
- Current behavior: the service checks for an existing attempt document for the (userId, channelId) pair and rejects a second submission with an error "You have already submitted this quiz.". If you want multiple attempts per user, the check in `AttemptService.submitQuizAttempt` must be adjusted (remove the guard, allow upserts, or store history and aggregate best scores in leaderboard).
- The leaderboard endpoint currently returns attempt documents sorted by `percentage` descending and limited to 20. If multiple attempts per user are allowed the leaderboard may show the same user multiple times; consider using an aggregation to group by `userId` and pick the best score.

If you'd like, I can add a short example request/response for each endpoint or generate an OpenAPI spec (swagger) from the routes.

## Request / Response Examples

All protected endpoints require the header:

Authorization: Bearer <accessToken>

**Authentication Flow:**
1. Login/Register returns both `accessToken` (3 day expiry) and `refreshToken` (30 days expiry)
2. Use `accessToken` for all API requests in the Authorization header
3. When `accessToken` expires (401 error), use `refreshToken` to get a new `accessToken`
4. Store `refreshToken` securely (httpOnly cookie recommended in production)
5. On logout, send `refreshToken` to revoke it from the database

## Role Management Notes:
- Only admins can view all users and manage roles
- Valid roles: `user`, `creator`, `admin`
- Role hierarchy: user < creator < admin
- Creators can create channels, questions, and invite users; users can only take tests; admins have full system access

## 📊 Logs API (Admin Only)

The application includes a comprehensive logs management API for debugging and monitoring. See [LOGS_API_DOCUMENTATION.md](./LOGS_API_DOCUMENTATION.md) for full details.

**Quick Overview:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/logs/files` | GET | List all log files |
| `/api/logs` | GET | Get logs with filters |
| `/api/logs/errors` | GET | Get recent errors |
| `/api/logs/stats` | GET | Get statistics |
| `/api/logs/:fileName` | DELETE | Clear logs |

**Example: Get Recent Errors**
```bash
GET /api/logs/errors?limit=50
Authorization: Bearer <admin-token>
```

**Example Response:**
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
        "message": "Database connection failed",
        "service": "blog-api",
        "stack": "Error: Database connection failed..."
      }
    ],
    "total": 50
  },
  "timestamp": "2025-11-16T10:31:00.000Z"
}
```

**Features:**
- ✅ Admin-only access
- ✅ Pagination and filtering
- ✅ Search logs by keyword
- ✅ Filter by log level (error, warn, info, debug)
- ✅ Date range filtering
- ✅ View statistics and server health
- ✅ Clear old logs
- ✅ Easy-to-debug format

**Quick Reference:**
- View errors: `GET /api/logs/errors?limit=50`
- Search logs: `GET /api/logs?search=database&level=error`
- Get stats: `GET /api/logs/stats`
- Clear logs: `DELETE /api/logs/combined`

See [LOGS_API_QUICK_REFERENCE.md](./LOGS_API_QUICK_REFERENCE.md) for quick examples.

## 📚 API Documentation (Swagger)

The API includes **complete interactive Swagger/OpenAPI 3.0 documentation** publicly accessible for easy testing and integration.

### Quick Access

**Access Swagger UI:**
```
http://localhost:3000/api-docs
```

**Features:**

✅ **Interactive API documentation**  
✅ **Publicly accessible**  
✅ **Try it out functionality**  
✅ **Complete request/response examples**  
✅ **All endpoints documented**  
✅ **JWT authentication support**  
✅ **Organized by tags**  
✅ **OpenAPI 3.0 specification**  

### Getting Started

1. **Start server:**
   ```bash
   npm run dev
   ```

2. **Open Swagger UI:**
   ```
   http://localhost:3000/api-docs
   ```

3. **Test endpoints:**
   - Click any endpoint
   - Click "Try it out"
   - Fill in parameters
   - Click "Execute"

### Authentication in Swagger

**For Protected Endpoints:**

1. **Login or Register** to get a JWT token
2. Click the **"Authorize" button** 🔓 (top right)
3. Enter: `Bearer <your_access_token>`
4. Click **"Authorize"**
5. Now test all protected endpoints!

### Example Usage

```bash
# 1. Access documentation
open http://localhost:3000/api-docs

# 2. Use POST /api/register or POST /api/login
# 3. Copy the accessToken from response
# 4. Click "Authorize" button in Swagger
# 5. Enter: Bearer <your_token>
# 6. Test protected endpoints using "Try it out"
```

### Available Documentation

- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/api-docs.json`
- **Complete Guide**: [SWAGGER_DOCUMENTATION.md](./SWAGGER_DOCUMENTATION.md)

### Documented Endpoints

- 🔐 **Authentication** - Register, login, token refresh, logout
- 👤 **Profile** - User profile and role management
- 📊 **Logs** - Server logs and monitoring (Admin only)
- 💚 **Health** - System health checks
- 📝 **Channels** - Channel management
- 🎯 **Quizzes** - Quiz operations
- 🏆 **Attempts** - Quiz attempts and scoring

For complete documentation details, see [SWAGGER_DOCUMENTATION.md](./SWAGGER_DOCUMENTATION.md).

## 📝 API Response Format

All API responses follow a standardized format. See [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md) for complete documentation.

**Standard Response Structure:**
```json
{
  "success": boolean,
  "statusCode": number,
  "message": string,
  "data": any,
  "error": {
    "code": string,
    "details": any
  },
  "timestamp": string
}
```

**Available HTTP Status Codes:**
- `200 OK`, `201 CREATED`, `204 NO CONTENT`
- `400 BAD REQUEST`, `401 UNAUTHORIZED`, `403 FORBIDDEN`
- `404 NOT FOUND`, `409 CONFLICT`, `422 UNPROCESSABLE ENTITY`
- `429 TOO MANY REQUESTS`, `500 INTERNAL SERVER ERROR`

Notes:
- The `authorizeRoles('admin')` middleware gatekeeps the admin endpoints. To assign the first admin user, either create the user directly in the database with `role: 'admin'` or temporarily set a user's role via the database.
