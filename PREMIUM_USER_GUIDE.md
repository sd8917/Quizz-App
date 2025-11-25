/**
 * Premium User Management Guide
 * 
 * This document explains how to manage premium subscriptions for users
 */

## Premium User System

### Overview
The application now has a premium subscription system with the following features:
- `isPremium` flag on user model (boolean)
- `premiumExpiresAt` optional expiry date
- Automatic premium status checking with expiration
- Middleware to protect premium-only features

### User Model Changes

```typescript
{
  isPremium: boolean,           // Whether user has premium access
  premiumExpiresAt?: Date,      // Optional: When premium expires (null = permanent)
}
```

### Methods Available

**checkPremiumStatus()**: Automatically checks and updates premium status
- Returns true if user has active premium
- Auto-expires if premiumExpiresAt is past
- Returns true for permanent premium (no expiry date)

---

## Granting Premium Access

### Method 1: Using MongoDB Compass / Shell

#### Grant Permanent Premium
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { 
    $set: { 
      isPremium: true,
      premiumExpiresAt: null  // No expiry = permanent
    } 
  }
)
```

#### Grant 30-Day Premium
```javascript
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 30);

db.users.updateOne(
  { email: "user@example.com" },
  { 
    $set: { 
      isPremium: true,
      premiumExpiresAt: expiryDate
    } 
  }
)
```

#### Grant 1-Year Premium
```javascript
const expiryDate = new Date();
expiryDate.setFullYear(expiryDate.getFullYear() + 1);

db.users.updateOne(
  { email: "user@example.com" },
  { 
    $set: { 
      isPremium: true,
      premiumExpiresAt: expiryDate
    } 
  }
)
```

#### Remove Premium Access
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { 
    $set: { 
      isPremium: false,
      premiumExpiresAt: null
    } 
  }
)
```

### Method 2: Using API Endpoint (Future Enhancement)

You can create an admin endpoint to manage premium subscriptions:

```typescript
// POST /api/admin/users/:userId/premium
{
  "isPremium": true,
  "duration": 30  // days, or null for permanent
}
```

---

## Using Premium Middleware

### Protect Route with Premium Requirement

```typescript
import requirePremium from '../../middleware/premium.middleware';

// Only premium users can access
router.post('/premium-feature', protect, requirePremium, controller.premiumFeature);
```

### Optional Premium Check

```typescript
import { checkPremium } from '../../middleware/premium.middleware';

// Adds req.isPremiumUser boolean, but doesn't block access
router.get('/feature', protect, checkPremium, controller.feature);
```

---

## AI Question Generation

### Current Setup
AI question generation now requires **premium subscription** instead of creator role.

**Endpoint**: `POST /api/ai/generate-questions`

**Requirements**:
1. User must be authenticated
2. User must have `isPremium: true`
3. Premium must not be expired

**Response if not premium**:
```json
{
  "success": false,
  "message": "Premium subscription required. Upgrade to access this feature."
}
```

---

## Checking Premium Status

### In Code
```typescript
const user = await User.findById(userId);
const hasPremium = user.checkPremiumStatus();

if (hasPremium) {
  // User has active premium
} else {
  // User doesn't have premium or it expired
}
```

### Query All Premium Users
```javascript
db.users.find({ isPremium: true })
```

### Query Expired Premium Users
```javascript
db.users.find({ 
  isPremium: true,
  premiumExpiresAt: { $lt: new Date() }
})
```

---

## Examples

### Example 1: Give Your Test User Premium Access

```javascript
// MongoDB Shell
use Quizz

db.users.updateOne(
  { email: "sudhanshuraj8917@gmail.com" },
  { 
    $set: { 
      isPremium: true,
      premiumExpiresAt: null  // Permanent premium
    } 
  }
)
```

### Example 2: Grant Trial Premium (7 days)

```javascript
const trialEnd = new Date();
trialEnd.setDate(trialEnd.getDate() + 7);

db.users.updateOne(
  { _id: ObjectId("USER_ID_HERE") },
  { 
    $set: { 
      isPremium: true,
      premiumExpiresAt: trialEnd
    } 
  }
)
```

### Example 3: Bulk Grant Premium to All Creators

```javascript
db.users.updateMany(
  { roles: "creator" },
  { 
    $set: { 
      isPremium: true,
      premiumExpiresAt: null
    } 
  }
)
```

---

## Testing Premium Features

### 1. Grant yourself premium:
```bash
# MongoDB Shell
db.users.updateOne(
  { email: "YOUR_EMAIL" },
  { $set: { isPremium: true } }
)
```

### 2. Test AI generation:
```bash
curl -X POST http://localhost:8000/api/ai/generate-questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "JavaScript",
    "difficulty": "medium",
    "numberOfQuestions": 5
  }'
```

### 3. Verify premium status:
```bash
curl http://localhost:8000/api/profile/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response should include:
```json
{
  "isPremium": true,
  "premiumExpiresAt": null
}
```

---

## Automatic Expiration

The system automatically handles premium expiration:
- When `checkPremiumStatus()` is called, it checks the expiry date
- If expired, it sets `isPremium: false` automatically
- This happens when user tries to access premium features

---

## Future Enhancements

- [ ] Admin API endpoint for managing premium subscriptions
- [ ] Payment integration (Stripe/Razorpay)
- [ ] Premium tier levels (Basic/Pro/Enterprise)
- [ ] Grace period after expiration
- [ ] Email notifications before expiry
- [ ] Premium usage analytics
- [ ] Subscription renewal reminders

---

## Migration Note

Existing users will have `isPremium: false` by default. You need to:
1. Identify which users should have premium
2. Update their accounts using the methods above
3. Communicate the change to users

---

## Support

For questions about premium access:
- Check user's premium status in database
- Verify expiration date if set
- Use `checkPremiumStatus()` method for accurate status
