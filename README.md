# Blog API

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
                   │    API Gateway / Load Balancer│
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
│ Monitoring: Prometheus + Grafana + ELK + Sentry            │
└────────────────────────────────────────────────────────────┘

```
##  📦Folder structure

```
quiz-backend/
├── src/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
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
├── tests/
├── docker-compose.yml
├── Dockerfile
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

```


## ⚙️ Tech Stack

- API Framework	               Express.js
- Database	                   MongoDB Atlas (Sharded)
- ORM/ODM	                   Mongoose
- Caching / Queue	           Redis + BullMQ
- File Storage	               AWS S3 + Glacier
- Authentication	           JWT + Refresh Tokens (Redis-backed)
- CI/CD	                       GitHub Actions / GitLab CI
- Deployment 	               Will think over it.
- Monitoring	               Prometheus, Grafana, Sentry, ELK Stack

## 🧩 Data Models (MongoDB + Mongoose)

# User
```
{
  _id: ObjectId,
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  roles: ["user", "super"],
  createdAt: Date,
  lastLogin: Date
}
```

# Channel
```
{
  _id: ObjectId,
  name: String,
  slug: String,
  owner: ObjectId, // User
  team: [
    { userId: ObjectId, role: "admin"|"member", invitedAt: Date, acceptedAt: Date }
  ],
  createdAt: Date,
  status: "active"|"archived"|"deleted"
}

```

#Question
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

All routes are mounted under `/api/v1/{routeName}`. Authentication is JWT-based — protected routes require a valid token in the `Authorization: Bearer <token>` header.

Note: route files are registered automatically from `src/routes/v1` and mounted using their filename (for example `auth.routes.ts` => `/api/v1/auth`).

Endpoints (summary)

- Auth
      - POST /api/v1/auth/register — Register a new user (public)
      - POST /api/v1/auth/login — Login and receive JWT (public)

- Channels (all protected)
      - POST /api/v1/channel/ — Create a channel
      - GET /api/v1/channel/ — List channels for current user
      - GET /api/v1/channel/:channelId — Get channel details
      - POST /api/v1/channel/:channelId/invite — Invite a user to a channel
      - DELETE /api/v1/channel/:channelId — Delete a channel

- Quiz (protected)
      - POST /api/v1/quiz/channel/:channelId — (ADMIN) Create a question in a channel
      - POST /api/v1/quiz/channel/:channelId/bulk — (ADMIN) Bulk create questions
      - GET /api/v1/quiz/channel/:channelId/questions — Get questions for a channel (user view)
      - POST /api/v1/quiz/channel/:channelId/submit — Submit a quiz (user-facing endpoint used to attempt/submit answers)

- Attempts (protected)
      - POST /api/v1/attempt/channel/:channelId/submit — Submit quiz attempt (service prevents duplicate attempts by default)
      - GET /api/v1/attempt/user — Get attempts for current user
      - GET /api/v1/attempt/channel/:channelId/leaderboard — Get leaderboard for a channel (top 20 by percentage)

Notes about attempts & leaderboard
- Current behavior: the service checks for an existing attempt document for the (userId, channelId) pair and rejects a second submission with an error "You have already submitted this quiz.". If you want multiple attempts per user, the check in `AttemptService.submitQuizAttempt` must be adjusted (remove the guard, allow upserts, or store history and aggregate best scores in leaderboard).
- The leaderboard endpoint currently returns attempt documents sorted by `percentage` descending and limited to 20. If multiple attempts per user are allowed the leaderboard may show the same user multiple times; consider using an aggregation to group by `userId` and pick the best score.

If you'd like, I can add a short example request/response for each endpoint or generate an OpenAPI spec (swagger) from the routes.

## Request / Response Examples

All protected endpoints require the header:

Authorization: Bearer <token>

Auth
- Register

Request
```json
POST /api/v1/auth/register
{
      "name": "Jane Doe",
      "email": "jane@example.com",
      "password": "s3cret123"
}
```

Response
```json
{
      "success": true,
      "data": { "id": "641...", "name": "Jane Doe", "email": "jane@example.com" }
}
```

- Login

Request
```json
POST /api/v1/auth/login
{
      "email": "jane@example.com",
      "password": "s3cret123"
}
```

Response
```json
{
      "success": true,
      "data": { "token": "eyJhbGci...", "expiresIn": 3600 }
}
```

Channels (protected)
- Create channel

Request
```json
POST /api/v1/channel/
{
      "name": "Frontend Team",
      "slug": "frontend-team"
}
```

Response
```json
{
      "success": true,
      "data": { "_id": "642...", "name": "Frontend Team", "slug": "frontend-team" }
}
```

- Invite user

Request
```json
POST /api/v1/channel/:channelId/invite
{
      "email": "coworker@example.com",
      "role": "member"
}
```

Response
```json
{
      "success": true,
      "data": { "invited": true, "email": "coworker@example.com" }
}
```

Quiz (protected)
- Create question (admin)

Request
```json
POST /api/v1/quiz/channel/:channelId
{
      "text": "What is 2+2?",
      "options": [
            { "text": "3", "isCorrect": false },
            { "text": "4", "isCorrect": true }
      ],
      "marks": 1
}
```

Response
```json
{
      "success": true,
      "data": { "_id": "651...", "text": "What is 2+2?", "options": [...], "marks": 1 }
}
```

- Get questions for user

Request
```http
GET /api/v1/quiz/channel/:channelId/questions
Authorization: Bearer <token>
```

Response
```json
{
      "success": true,
      "data": [ { "_id": "651...", "text": "...", "options": [ { "text": "..." } ] } ]
}
```

- Submit quiz (user-facing endpoint that collects answers for a quiz session)

Request
```json
POST /api/v1/quiz/channel/:channelId/submit
{
      "answers": [ { "questionId": "651...", "selectedOption": "4" } ]
}
```

Response
```json
{
      "success": true,
      "data": { "score": 1, "total": 1, "percentage": 100 }
}
```

Attempts (protected)
- Submit attempt

Request
```json
POST /api/v1/attempt/channel/:channelId/submit
{
      "answers": [ { "questionId": "651...", "selectedOption": "A" } ]
}
```

Response (on success)
```json
{
      "success": true,
      "data": {
            "_id": "662...",
            "userId": "610...",
            "channelId": "630...",
            "score": 8,
            "total": 10,
            "percentage": 80,
            "answers": [ { "questionId": "651...", "selectedOption": "A", "isCorrect": true } ],
            "submittedAt": "2025-11-12T..."
      }
}
```

Response (when already submitted)
```json
{
      "success": false,
      "message": "You have already submitted this quiz."
}
```

- Get user attempts

Request
```http
GET /api/v1/attempt/user
Authorization: Bearer <token>
```

Response
```json
{
      "success": true,
      "data": [ { "_id": "662...", "channel": { "_id": "630...", "name": "Frontend Team" }, "score": 8, "percentage": 80 } ]
}
```

- Channel leaderboard

Request
```http
GET /api/v1/attempt/channel/:channelId/leaderboard
Authorization: Bearer <token>
```

Response (current behavior)
```json
{
      "success": true,
      "data": [
            { "userId": "610...", "name": "Alice", "percentage": 95, "score": 19, "total": 20 },
            { "userId": "611...", "name": "Bob", "percentage": 90, "score": 18, "total": 20 }
      ]
}
```

If you want these examples expanded (full request headers, more fields, or an OpenAPI spec), tell me which endpoints to prioritize and I will add them.