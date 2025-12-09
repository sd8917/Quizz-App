# Global Channels/Quizzes Feature

## Overview

The Global Channels feature allows administrators to create public quizzes that can be accessed by any authenticated user without requiring channel membership. This enables broader quiz distribution and public quiz competitions.

## Key Features

- **Admin-only creation**: Only users with the `admin` role can create global channels
- **Public access**: Any authenticated user can view and take quizzes in global channels
- **Search/Browse**: Users can discover global channels through a dedicated endpoint
- **No membership required**: Users don't need to join global channels to participate

## Database Schema Changes

### Channel Model

Added new field to the `Channel` model:

```typescript
isGlobal: {
  type: Boolean,
  default: false,
}
```

## API Endpoints

### 1. Create Global Channel (Admin Only)

**Endpoint**: `POST /api/channel/`

**Authorization**: Requires `admin` role

**Request Body**:
```json
{
  "name": "General Knowledge Quiz",
  "description": "A public quiz for everyone",
  "isGlobal": true
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Channel created successfully",
  "data": {
    "_id": "channel123",
    "name": "General Knowledge Quiz",
    "description": "A public quiz for everyone",
    "owner": {
      "_id": "admin123",
      "username": "admin",
      "email": "admin@example.com"
    },
    "members": [
      {
        "user": {
          "_id": "admin123",
          "username": "admin",
          "email": "admin@example.com"
        },
        "role": "creator"
      }
    ],
    "isGlobal": true,
    "isArchived": false,
    "createdAt": "2025-12-09T20:00:00.000Z",
    "updatedAt": "2025-12-09T20:00:00.000Z"
  }
}
```

**Error Response** (400 Bad Request) - Non-admin tries to create global channel:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Only admins can create global channels"
}
```

### 2. List Global Channels

**Endpoint**: `GET /api/channel/global`

**Authorization**: Requires authentication (any authenticated user)

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Global channels retrieved successfully",
  "data": [
    {
      "_id": "channel123",
      "name": "General Knowledge Quiz",
      "description": "A public quiz for everyone",
      "owner": {
        "_id": "admin123",
        "username": "admin",
        "email": "admin@example.com"
      },
      "isGlobal": true,
      "isArchived": false,
      "totalQuestions": 10,
      "duration": 30,
      "passingScore": 70,
      "pointsPerQuestion": 1,
      "createdAt": "2025-12-09T20:00:00.000Z"
    },
    {
      "_id": "channel456",
      "name": "Science Trivia",
      "description": "Test your science knowledge",
      "owner": {
        "_id": "admin123",
        "username": "admin",
        "email": "admin@example.com"
      },
      "isGlobal": true,
      "isArchived": false,
      "totalQuestions": 15,
      "duration": 45,
      "passingScore": 60,
      "pointsPerQuestion": 2,
      "createdAt": "2025-12-09T19:00:00.000Z"
    }
  ]
}
```

### 3. Get Questions from Global Channel

**Endpoint**: `GET /api/quiz/channel/:channelId/questions`

**Authorization**: Requires authentication

**Behavior Change**: 
- **Before**: Only channel members could access questions
- **After**: Any authenticated user can access questions if channel is global

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Questions retrieved successfully",
  "data": [
    {
      "_id": "q1",
      "questionText": "What is the capital of France?",
      "options": [
        { "text": "London" },
        { "text": "Paris" },
        { "text": "Berlin" },
        { "text": "Madrid" }
      ],
      "marks": 1
    }
  ]
}
```

**Error Response** (403 Forbidden) - Non-member accessing non-global channel:
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You must be a member of this channel to view questions, or the channel must be global"
}
```

### 4. Submit Quiz in Global Channel

**Endpoint**: `POST /api/quiz/channel/:channelId/submit`

**Authorization**: Requires authentication with `user` role

**Note**: Quiz submission works the same for global channels as for regular channels

**Request Body**:
```json
{
  "answers": [
    {
      "questionId": "q1",
      "selectedOption": "Paris"
    },
    {
      "questionId": "q2",
      "selectedOption": "42"
    }
  ]
}
```

## Usage Flow

### For Administrators

1. **Create Global Channel**:
   ```bash
   POST /api/channel/
   Authorization: Bearer <admin-token>
   
   {
     "name": "Public Math Quiz",
     "description": "Test your math skills",
     "isGlobal": true
   }
   ```

2. **Add Questions** (same as regular channels):
   ```bash
   POST /api/quiz/channel/:channelId
   Authorization: Bearer <admin-token>
   
   {
     "questionText": "What is 2 + 2?",
     "options": [
       { "text": "3", "isCorrect": false },
       { "text": "4", "isCorrect": true },
       { "text": "5", "isCorrect": false }
     ],
     "marks": 1
   }
   ```

### For Regular Users

1. **Browse Global Channels**:
   ```bash
   GET /api/channel/global
   Authorization: Bearer <user-token>
   ```

2. **View Quiz Questions**:
   ```bash
   GET /api/quiz/channel/:channelId/questions
   Authorization: Bearer <user-token>
   ```

3. **Take Quiz**:
   ```bash
   POST /api/quiz/channel/:channelId/submit
   Authorization: Bearer <user-token>
   
   {
     "answers": [...]
   }
   ```

## Security Considerations

- Only administrators can create global channels to prevent spam
- All endpoints still require authentication (no anonymous access)
- Global channels are read-only for non-members (cannot add/modify questions)
- Quiz submission rules remain the same (one attempt per user per channel)

## UI Label Suggestion

When displaying channels in the UI, global channels should show a "Global" label or badge to indicate they are publicly accessible:

```
┌─────────────────────────────────┐
│ General Knowledge Quiz   🌐     │
│ 10 questions • 30 min           │
│ Created by Admin                │
└─────────────────────────────────┘
```

The 🌐 icon or "Global" badge helps users identify public quizzes.
