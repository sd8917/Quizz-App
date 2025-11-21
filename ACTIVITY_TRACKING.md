# Activity Tracking & Last Active Status

## Overview

The system efficiently tracks user login times and activity status with minimal database overhead.

## Features

### 1. **Login Time Tracking** 
- `lastLoginAt`: Updated on every successful login
- Stored as UTC timestamp in MongoDB

### 2. **Last Active Tracking**
- `lastActiveAt`: Updated on protected API requests
- **Efficient Implementation**: Debounced updates (max every 2 minutes)
- Prevents excessive DB writes on every request
- Updates asynchronously without blocking requests

### 3. **Active Status**
Human-readable status strings:
- **"Online"** - Active within last 5 minutes
- **"X minutes ago"** - Active 5-59 minutes ago
- **"X hours ago"** - Active 1-23 hours ago  
- **"X days ago"** - Active 1-6 days ago
- **"[Date]"** - Active more than 7 days ago
- **"Never active"** - No activity recorded

## Implementation Details

### User Model Fields

```typescript
{
  lastLoginAt?: Date,      // Updated on login
  lastActiveAt?: Date,     // Updated on API requests (debounced)
}
```

### Helper Methods

```typescript
user.isOnline()           // Returns true if active < 5 min ago
user.getActiveStatus()    // Returns human-readable status
```

## Efficiency Strategy

### Why Debouncing?

Without debouncing, every API request would trigger a database write:
- **Problem**: 100 requests/minute = 100 DB writes/minute
- **Solution**: Debounced to max 1 write per 2 minutes = ~30 writes/hour

### How It Works

```typescript
// In-memory map tracks last update time per user
const lastUpdateMap = new Map<string, number>();
const UPDATE_INTERVAL = 2 * 60 * 1000; // 2 minutes

// Only update if interval elapsed
if (now - lastUpdate > UPDATE_INTERVAL) {
  User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
  lastUpdateMap.set(userId, now);
}
```

### Benefits

✅ **Reduced DB Load**: 97% fewer writes  
✅ **Non-blocking**: Updates run asynchronously  
✅ **Accurate Enough**: 2-minute precision sufficient for "last active"  
✅ **Memory Efficient**: Only stores timestamps, not user objects  

## API Response Examples

### Login Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6...",
    "lastLoginAt": "2025-11-21T10:30:45.123Z",
    "lastActiveAt": "2025-11-21T10:30:45.123Z",
    "activeStatus": "Online"
  }
}
```

### Get Profile Response

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "roles": ["user"],
    "isActive": true,
    "createdAt": "2025-11-01T08:00:00.000Z",
    "lastLoginAt": "2025-11-21T10:30:45.123Z",
    "lastActiveAt": "2025-11-21T14:25:30.456Z",
    "activeStatus": "3 minutes ago",
    "isOnline": true
  }
}
```

### List All Users (Admin)

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "john@example.com",
      "roles": ["user"],
      "isActive": true,
      "createdAt": "2025-11-01T08:00:00.000Z",
      "lastLoginAt": "2025-11-21T10:30:45.123Z",
      "lastActiveAt": "2025-11-21T14:28:12.789Z",
      "activeStatus": "Online",
      "isOnline": true
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "username": "janedoe",
      "email": "jane@example.com",
      "roles": ["creator"],
      "isActive": true,
      "createdAt": "2025-10-15T12:00:00.000Z",
      "lastLoginAt": "2025-11-20T18:45:30.000Z",
      "lastActiveAt": "2025-11-21T09:15:22.000Z",
      "activeStatus": "5 hours ago",
      "isOnline": false
    }
  ]
}
```

## Usage Examples

### Check if User is Online

```typescript
// In your code
const user = await User.findById(userId);
if (user.isOnline()) {
  console.log('User is currently active');
}
```

### Display Last Active Status

```typescript
const user = await User.findById(userId);
console.log(`Last seen: ${user.getActiveStatus()}`);
// Output: "Last seen: 15 minutes ago"
```

### Filter Online Users (Admin)

```typescript
const users = await User.find();
const onlineUsers = users.filter(user => user.isOnline());
console.log(`${onlineUsers.length} users currently online`);
```

## Configuration

### Adjust Update Interval

Edit `src/middleware/auth.middleware.ts`:

```typescript
// Change from 2 minutes to your preferred interval
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
```

**Recommendations:**
- **1-2 minutes**: Real-time presence (higher DB load)
- **5 minutes**: Good balance (recommended)
- **10+ minutes**: Less accurate but minimal overhead

### Adjust "Online" Threshold

Edit `src/models/user.model.ts`:

```typescript
// Change "online" detection window
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 min
const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000); // 10 min
```

## Performance Metrics

### Database Impact

| Scenario | Without Debouncing | With Debouncing (2 min) | Reduction |
|----------|-------------------|------------------------|-----------|
| 100 req/min | 100 writes/min | 0.5 writes/min | 99.5% |
| 1000 req/hour | 1000 writes/hour | ~30 writes/hour | 97% |
| 10k req/day | 10k writes/day | ~720 writes/day | 93% |

### Memory Usage

- **Per User**: ~16 bytes (userId + timestamp)
- **1000 Active Users**: ~16 KB
- **10000 Active Users**: ~160 KB

**Negligible memory footprint** ✅

## Testing

### Test Login Tracking

```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Response includes lastLoginAt and lastActiveAt
```

### Test Activity Tracking

```bash
# Get profile (requires auth)
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Make multiple requests within 2 minutes
# lastActiveAt won't change (debounced)

# Wait 3 minutes, make another request
# lastActiveAt will update
```

### Test Active Status Display

```bash
# As admin, list all users
curl -X GET http://localhost:3000/api/profile/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Check activeStatus and isOnline fields in response
```

## Migration (Existing Users)

Existing users won't have `lastLoginAt` or `lastActiveAt`:

1. **On Next Login**: Fields auto-populate
2. **On Next API Request**: `lastActiveAt` updates
3. **Status Display**: Shows "Never active" until first activity

### Optional: Backfill Script

```typescript
// scripts/backfill-activity.ts
import User from './src/models/user.model';
import mongoose from 'mongoose';

async function backfillActivity() {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  // Set lastActiveAt to createdAt for users without activity
  await User.updateMany(
    { lastActiveAt: { $exists: false } },
    { $set: { lastActiveAt: new Date() } }
  );
  
  console.log('Backfill complete');
  await mongoose.disconnect();
}

backfillActivity();
```

## Security Considerations

### Privacy

- ✅ Activity data only visible to:
  - User themselves (their own profile)
  - Admin users (all profiles)
- ❌ Not exposed in public endpoints
- ❌ Not included in channel member lists

### Rate Limiting

Activity tracking doesn't bypass rate limits:
- Debounced updates prevent abuse
- Still respects API rate limits
- Won't cause performance issues

## Troubleshooting

### "activeStatus always shows 'Never active'"

**Cause**: User hasn't made any authenticated requests  
**Solution**: Login or make any protected API call

### "lastActiveAt not updating"

**Cause**: Update interval not elapsed (< 2 minutes since last update)  
**Solution**: Wait 2+ minutes between requests to see updates

### "High memory usage"

**Cause**: `lastUpdateMap` not cleared for inactive users  
**Solution**: Add cleanup job (optional):

```typescript
// Clear entries older than 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [userId, timestamp] of lastUpdateMap.entries()) {
    if (timestamp < oneHourAgo) {
      lastUpdateMap.delete(userId);
    }
  }
}, 3600000); // Run every hour
```

## Best Practices

1. **Don't query on every render** - Cache activity status client-side
2. **Use websockets for real-time** - For chat/live features, use WebSocket presence
3. **Batch admin queries** - When showing many users, consider pagination
4. **Index the field** - Add index if filtering by `lastActiveAt` frequently

## Future Enhancements

- [ ] WebSocket integration for real-time presence
- [ ] Activity history/logs
- [ ] Per-device tracking
- [ ] Geographic location tracking
- [ ] Session duration analytics
- [ ] Custom status messages ("Away", "Busy", etc.)

## Related Documentation

- [Authentication Guide](./README.md#authentication)
- [Profile API](./README.md#profile-endpoints)
- [User Management](./README.md#admin-user-management)
