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