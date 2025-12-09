# Global Tests Feature - Visual Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Application                       │
│                     (Web/Mobile Frontend)                        │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │ Admin User                         │ Regular User
             │                                    │
             ▼                                    ▼
┌────────────────────────┐          ┌────────────────────────────┐
│  POST /api/channel/    │          │ GET /api/channel/global    │
│  { isGlobal: true }    │          │                            │
│  (Admin Only)          │          │ Browse Public Quizzes      │
└────────────┬───────────┘          └────────────┬───────────────┘
             │                                    │
             │                                    ▼
             │                      ┌────────────────────────────┐
             │                      │ GET /api/quiz/channel/     │
             │                      │ :channelId/questions       │
             │                      │                            │
             │                      │ (No membership required    │
             │                      │  for global channels)      │
             │                      └────────────┬───────────────┘
             │                                    │
             ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes Layer                          │
│   /api/channel/* - Channel management routes                    │
│   /api/quiz/*    - Quiz operations routes                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Controller Layer                            │
│   channelController: createChannel, listGlobalChannels          │
│   quizController:    getChannelQuestionsForUser                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
│   channelService:                                               │
│   - createChannel(name, desc, isGlobal)                         │
│   - listGlobalChannels()                                        │
│   - getChannel() with global access check                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Repository Layer                             │
│   channelRepo:                                                  │
│   - createChannel(data)                                         │
│   - getGlobalChannels()                                         │
│   - getChannelById(id)                                          │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB Database                            │
│   Channel Collection:                                           │
│   {                                                             │
│     _id, name, description, owner,                              │
│     members[], isArchived,                                      │
│     isGlobal: true/false  ← NEW FIELD                           │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Creating a Global Channel (Admin)

```
Admin → POST /api/channel/ {isGlobal: true}
         ↓
    Auth Middleware (verify JWT + admin role)
         ↓
    Channel Controller (validate isGlobal permission)
         ↓
    Channel Service (createChannel with isGlobal flag)
         ↓
    Channel Repository (save to DB)
         ↓
    MongoDB (insert with isGlobal: true)
         ↓
    Response ← 201 Created with channel data
```

### Browsing Global Channels (Any User)

```
User → GET /api/channel/global
        ↓
   Auth Middleware (verify JWT)
        ↓
   Channel Controller (listGlobalChannels)
        ↓
   Channel Service (query global channels + enrich)
        ↓
   Channel Repository (find {isGlobal: true})
        ↓
   MongoDB (query channels)
        ↓
   Response ← 200 OK with list of global channels
```

### Taking a Global Quiz (Any User)

```
User → GET /api/quiz/channel/:id/questions
        ↓
   Auth Middleware (verify JWT)
        ↓
   Quiz Controller (getChannelQuestionsForUser)
        ↓
   Check: isMember OR isGlobal? ← NEW LOGIC
        ↓                    ↓
     NO (403)             YES
                           ↓
                   Quiz Service (fetch questions)
                           ↓
                   Response ← 200 OK with questions

User → POST /api/quiz/channel/:id/submit {answers}
        ↓
   Auth Middleware (verify JWT + user role)
        ↓
   Quiz Controller (submitQuiz)
        ↓
   Quiz Service (evaluate + save attempt)
        ↓
   Response ← 201 Created with score
```

## Access Control Matrix

| Action | Private Channel | Global Channel |
|--------|----------------|----------------|
| Create Channel | Admin/Creator | Admin Only |
| View Channel Details | Owner/Member | Anyone Auth |
| View Questions | Owner/Member | Anyone Auth |
| Submit Quiz | Owner/Member | Anyone Auth |
| Add Questions | Admin/Creator/Owner | Admin/Creator/Owner |
| Delete Channel | Admin/Owner | Admin/Owner |

## Component Interaction

```
┌──────────────┐
│   Routes     │  Define endpoints and middleware
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controllers  │  Handle HTTP requests/responses
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Services    │  Business logic and orchestration
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Repositories │  Data access layer
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Models     │  MongoDB schema definitions
└──────────────┘
```

## Security Layers

```
Request
   │
   ├─→ Rate Limiting (express-rate-limit)
   │
   ├─→ Authentication (JWT verification)
   │
   ├─→ Role Authorization (admin/creator/user)
   │
   ├─→ Business Rules (isGlobal check for channel creation)
   │
   └─→ Data Validation (express-validator)
         │
         ▼
      Process Request
```

## Database Schema

```sql
-- Before (conceptual)
Channel {
  _id: ObjectId
  name: String
  description: String
  owner: ObjectId
  members: [{ user: ObjectId, role: String }]
  isArchived: Boolean
  createdAt: Date
  updatedAt: Date
}

-- After (with Global feature)
Channel {
  _id: ObjectId
  name: String
  description: String
  owner: ObjectId
  members: [{ user: ObjectId, role: String }]
  isArchived: Boolean
  isGlobal: Boolean        ← NEW FIELD (default: false)
  createdAt: Date
  updatedAt: Date
}
```

## User Journey

### Admin Creating Global Quiz

1. Login as admin → JWT token received
2. POST /api/channel/ with isGlobal: true
3. Add questions via POST /api/quiz/channel/:id
4. Quiz is now publicly accessible

### User Taking Global Quiz

1. Login as user → JWT token received
2. GET /api/channel/global → See all public quizzes
3. Select quiz → GET /api/quiz/channel/:id/questions
4. Answer questions
5. POST /api/quiz/channel/:id/submit → Get score
6. View results

## Key Files Changed

```
src/
├── models/
│   └── channel.model.ts           (+ isGlobal field)
├── repositories/
│   └── channelRepo.ts             (+ getGlobalChannels method)
├── services/
│   └── channelService.ts          (+ listGlobalChannels, updated createChannel)
├── controllers/
│   ├── channel.controller.ts      (+ listGlobalChannels, updated createChannel)
│   └── quizz.controller.ts        (updated access check)
├── routes/
│   └── v1/
│       └── channel.routes.ts      (+ GET /global route)
└── __tests__/
    └── global-channels.test.ts    (new test suite)

docs/
├── GLOBAL_CHANNELS_GUIDE.md       (API documentation)
├── IMPLEMENTATION_SUMMARY.md      (technical summary)
└── VISUAL_FLOW.md                 (this file)
```

## Success Criteria

✅ Admins can create global channels  
✅ Regular users can browse global channels  
✅ Users can take global quizzes without membership  
✅ Private channels remain private  
✅ All existing functionality preserved  
✅ Zero security vulnerabilities  
✅ Comprehensive tests added  
✅ Complete documentation provided  

---

**Status**: Implementation Complete ✨
