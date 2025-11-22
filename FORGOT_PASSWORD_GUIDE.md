# Forgot Password Implementation - Security Best Practices

## Overview

A secure, production-ready forgot password system with comprehensive security measures to prevent common vulnerabilities.

## 🔐 Security Features Implemented

### 1. **Email Enumeration Protection**
- ✅ Always returns the same success message regardless of whether email exists
- ✅ Prevents attackers from discovering registered emails
- ✅ Message: "If your email is registered, you will receive a password reset link shortly."

### 2. **Token Security**
- ✅ Cryptographically secure random tokens (32 bytes)
- ✅ Tokens are hashed before storage (SHA-256)
- ✅ Original unhashed token sent via email only
- ✅ Single-use tokens (marked as used after reset)
- ✅ 1-hour expiration time

### 3. **Rate Limiting**
- ✅ 5 requests per 15 minutes on forgot-password endpoint
- ✅ 5 requests per 15 minutes on reset-password endpoint
- ✅ Prevents brute force and DoS attacks

### 4. **Session Security**
- ✅ All refresh tokens invalidated after password reset
- ✅ User logged out from all devices
- ✅ Forces re-authentication with new password

### 5. **Audit Trail**
- ✅ Tracks IP address of password reset requests
- ✅ Tracks user agent information
- ✅ Auto-cleanup of expired tokens (24 hours after expiration)

### 6. **Account Protection**
- ✅ Only active accounts can reset passwords
- ✅ Inactive accounts fail silently (no enumeration)
- ✅ Password strength validation (minimum 6 characters)

## 📊 Database Schema

### PasswordReset Model

```typescript
{
  userId: ObjectId,          // Reference to User
  token: String,             // SHA-256 hashed token
  expiresAt: Date,           // 1 hour from creation
  isUsed: Boolean,           // Single-use flag
  ipAddress: String,         // Request origin
  userAgent: String,         // Browser/device info
  createdAt: Date            // Timestamp
}
```

**Indexes:**
- `userId` - Fast user lookup
- `token` - Fast token validation
- `expiresAt` - TTL index for auto-cleanup
- `isUsed` - Query optimization

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  FORGOT PASSWORD FLOW                    │
└─────────────────────────────────────────────────────────┘

1. User Request
   └─> POST /api/forgot-password { email }
        │
        ├─> Find user by email
        │   ├─> Not found → Return success (no enumeration)
        │   ├─> Inactive → Return success (no enumeration)
        │   └─> Found & Active → Continue
        │
        ├─> Invalidate old unused tokens
        │
        ├─> Generate secure random token (32 bytes)
        │
        ├─> Hash token with SHA-256
        │
        ├─> Store hashed token in DB
        │   └─> userId, hashedToken, expiresAt (1h), IP, userAgent
        │
        ├─> Build reset URL with original token
        │   └─> http://yoursite.com/reset-password?token=UNHASHED_TOKEN
        │
        ├─> Send email asynchronously
        │   └─> Beautiful HTML email with button
        │
        └─> Return success message (always same)

2. User Clicks Email Link
   └─> GET /api/verify-reset-token?token=XXX (Optional)
        │
        ├─> Hash received token
        ├─> Check DB for valid token
        │   └─> Valid: unused, not expired
        └─> Return valid:true + masked email

3. User Submits New Password
   └─> POST /api/reset-password { token, newPassword }
        │
        ├─> Validate password strength (min 6 chars)
        │
        ├─> Hash received token
        │
        ├─> Find valid reset record
        │   └─> Must be: unused, not expired
        │
        ├─> Find user by userId
        │
        ├─> Update user password
        │   └─> Pre-save hook hashes new password
        │
        ├─> Mark token as used
        │
        ├─> Revoke all refresh tokens (logout all devices)
        │
        └─> Return success message
```

## 📝 API Endpoints

### 1. Request Password Reset

**Endpoint:** `POST /api/forgot-password`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** (Always same, prevents enumeration)
```json
{
  "success": true,
  "message": "If your email is registered, you will receive a password reset link shortly."
}
```

**Rate Limit:** 5 requests / 15 minutes

---

### 2. Verify Reset Token (Optional)

**Endpoint:** `GET /api/verify-reset-token?token=XXX`

**Response:** (Valid token)
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "email": "u***@example.com"
  }
}
```

**Response:** (Invalid token)
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired reset token"
}
```

---

### 3. Reset Password

**Endpoint:** `POST /api/reset-password`

**Request:**
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** (Success)
```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

**Response:** (Invalid token)
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired reset token"
}
```

**Rate Limit:** 5 requests / 15 minutes

## 📧 Email Template

### Features:
- ✅ Beautiful HTML design
- ✅ Prominent "Reset Password" button
- ✅ Clear security notice
- ✅ Expiration time displayed (1 hour)
- ✅ Fallback plain text version
- ✅ Direct link if button doesn't work

### Preview:

```
┌─────────────────────────────────────┐
│  🔐 Reset Your Password             │
│                                     │
│  Hi John,                           │
│                                     │
│  We received a request to reset     │
│  your password.                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    Reset Password           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ⚠️ Security Notice:                │
│  This link expires in 1 hour.       │
│  If you didn't request this,        │
│  please ignore this email.          │
└─────────────────────────────────────┘
```

## 🧪 Testing Guide

### Test Case 1: Valid Email
```bash
curl -X POST http://localhost:3000/api/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "existing@example.com"}'

# Expected: Success message + email sent
```

### Test Case 2: Non-existent Email
```bash
curl -X POST http://localhost:3000/api/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com"}'

# Expected: Same success message (no enumeration)
```

### Test Case 3: Verify Token
```bash
curl http://localhost:3000/api/verify-reset-token?token=TOKEN_FROM_EMAIL

# Expected: Valid response with email
```

### Test Case 4: Reset Password
```bash
curl -X POST http://localhost:3000/api/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_EMAIL",
    "newPassword": "NewPass123!"
  }'

# Expected: Success + all sessions terminated
```

### Test Case 5: Rate Limiting
```bash
# Run 6 times quickly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}'
done

# Expected: 6th request gets 429 Too Many Requests
```

### Test Case 6: Expired Token
```bash
# Wait 1 hour after requesting reset, then try to use token
curl -X POST http://localhost:3000/api/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "EXPIRED_TOKEN",
    "newPassword": "NewPass123!"
  }'

# Expected: 401 Invalid or expired token
```

### Test Case 7: Token Reuse
```bash
# Use same token twice
curl -X POST http://localhost:3000/api/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ALREADY_USED_TOKEN",
    "newPassword": "NewPass123!"
  }'

# Expected: 401 Invalid or expired token (already used)
```

## 🛡️ Security Checklist

- ✅ Tokens cryptographically secure (crypto.randomBytes)
- ✅ Tokens hashed before storage (SHA-256)
- ✅ Short expiration time (1 hour)
- ✅ Single-use tokens
- ✅ Rate limiting on all endpoints
- ✅ No email enumeration
- ✅ Inactive accounts handled securely
- ✅ All sessions terminated after reset
- ✅ Audit trail (IP, user agent)
- ✅ Auto-cleanup of old tokens
- ✅ Password strength validation
- ✅ Secure email delivery
- ✅ HTTPS required in production

## ⚙️ Configuration

### Environment Variables

```env
# Required
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
WEBSITE_URL=https://yoursite.com

# Optional (has defaults)
SUPPORT_EMAIL=support@yoursite.com
```

### Customization Options

#### 1. Token Expiration Time
Edit `src/services/auth.service.ts`:
```typescript
// Change from 1 hour to your preference
const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
```

#### 2. Token Length
```typescript
// Change token length (default: 32 bytes)
const resetToken = crypto.randomBytes(64).toString('hex'); // 64 bytes
```

#### 3. Rate Limits
Edit `src/middleware/rateLimit.middleware.ts`:
```typescript
// Adjust limits for forgot password
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // 3 requests per 15 minutes
});
```

## 🚨 Common Issues & Solutions

### Issue 1: Emails Not Sending
**Symptoms:** Users don't receive reset emails

**Solutions:**
- Check EMAIL_USER and EMAIL_PASS in .env
- For Gmail: Enable "App Passwords"
- Check spam folder
- Verify email service is running
- Check console for email errors

### Issue 2: Tokens Always Invalid
**Symptoms:** Valid tokens rejected

**Solutions:**
- Check system clock is synchronized
- Verify token expiration time
- Check if token was already used
- Ensure token is passed correctly (no extra spaces)

### Issue 3: Rate Limit Too Strict
**Symptoms:** Legitimate users blocked

**Solutions:**
- Increase rate limit window or max requests
- Whitelist trusted IPs
- Implement user-based rate limiting

### Issue 4: Email Enumeration Detected
**Symptoms:** Different responses for existing/non-existing emails

**Solutions:**
- Ensure always returning same message
- Check timing attacks (add constant delay)
- Review error handling

## 📈 Monitoring & Metrics

### Key Metrics to Track

1. **Reset Request Rate**
   - Normal: 1-5% of user base per day
   - Alert: Sudden spike (possible attack)

2. **Token Usage Rate**
   - Normal: 60-80% of tokens used
   - Alert: Very low usage (email delivery issues)

3. **Failed Reset Attempts**
   - Normal: < 5% of total attempts
   - Alert: High failure rate (UX or technical issues)

4. **Average Time to Reset**
   - Normal: 5-15 minutes
   - Alert: Very long (email delays)

### Log Examples

```typescript
// Add to your logger
logger.info('Password reset requested', {
  email: 'masked@email.com',
  ipAddress,
  userAgent
});

logger.info('Password reset successful', {
  userId,
  ipAddress
});

logger.warn('Invalid reset token attempt', {
  token: 'hashed_token',
  ipAddress
});
```

## 🔄 Migration Guide

### For Existing Apps

1. **Create password reset collection:**
```bash
# MongoDB will auto-create, but you can prepare:
db.createCollection("passwordresets")
db.passwordresets.createIndex({ token: 1 }, { unique: true })
db.passwordresets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 86400 })
```

2. **Update environment:**
```bash
# Add to .env
WEBSITE_URL=https://yoursite.com
SUPPORT_EMAIL=support@yoursite.com
```

3. **Deploy changes:**
```bash
npm run build
npm start
```

4. **Test thoroughly:**
- Test with real email accounts
- Verify rate limiting works
- Check token expiration
- Test all error cases

## 🎯 Best Practices

### ✅ DO:
- Always use HTTPS in production
- Log security events (rate limit hits, failed attempts)
- Monitor for unusual patterns
- Keep tokens short-lived (1 hour max)
- Hash tokens before storage
- Send emails asynchronously
- Use rate limiting
- Validate password strength
- Terminate all sessions after reset

### ❌ DON'T:
- Store unhashed tokens in database
- Reveal if email exists or not
- Use long-lived tokens (> 1 hour)
- Allow token reuse
- Skip rate limiting
- Send passwords via email
- Log sensitive data (tokens, passwords)
- Use predictable tokens

## 🚀 Production Checklist

Before deploying to production:

- [ ] HTTPS enabled and enforced
- [ ] Environment variables set correctly
- [ ] Email service configured and tested
- [ ] Rate limiting working as expected
- [ ] Logging and monitoring in place
- [ ] Database indexes created
- [ ] Error handling tested
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Backup and recovery tested
- [ ] Documentation updated
- [ ] Team trained on support process

## 📚 Related Documentation

- [Authentication Guide](./README.md#authentication)
- [Email Templates](./src/utils/mailer.ts)
- [Rate Limiting](./src/middleware/rateLimit.middleware.ts)
- [Security Best Practices](./SECURITY.md)

## 📞 Support

For issues or questions:
- Check logs for error details
- Review rate limit configurations
- Verify email service status
- Contact: ${process.env.SUPPORT_EMAIL}
