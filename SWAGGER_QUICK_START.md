# Swagger API Documentation - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### Step 1: Install Dependencies ✅
Already done! Swagger dependencies are installed.

### Step 2: Set API Key

Add this to your `.env` file:
```bash
API_DOC_KEY=my-secret-documentation-key-12345
```

Or generate a secure random key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Start Server

```bash
npm run dev
```

### Step 4: Access Swagger UI

Open in your browser:
```
http://localhost:3000/api-docs?apiKey=my-secret-documentation-key-12345
```

🎉 **Done!** You now have interactive API documentation!

---

## 📖 How to Use Swagger UI

### 1. View Endpoints

Browse all available endpoints organized by tags:
- **Authentication** - Login, register, tokens
- **Profile** - User management
- **Logs** - Server logs (Admin only)
- **Health** - System status

### 2. Test Endpoints

**Step-by-step:**

1. **Find an endpoint** (e.g., `POST /api/register`)
2. Click **"Try it out"**
3. **Fill in the request body**:
   ```json
   {
     "username": "testuser",
     "email": "test@example.com",
     "password": "SecurePass123!"
   }
   ```
4. Click **"Execute"**
5. **View the response** below

### 3. Authenticate for Protected Endpoints

**Get a token first:**

1. Use `POST /api/register` or `POST /api/login`
2. Copy the `accessToken` from the response
3. Click the **"Authorize" button** 🔓 (top right)
4. Enter: `Bearer YOUR_ACCESS_TOKEN`
5. Click **"Authorize"**
6. Click **"Close"**

Now you can test all protected endpoints!

---

## 🎯 Common Tasks

### Task 1: Register and Login

```yaml
1. POST /api/register
   Body: {"username": "john", "email": "john@example.com", "password": "Pass123!"}
   
2. Copy accessToken from response

3. Click "Authorize" button

4. Enter: Bearer YOUR_ACCESS_TOKEN

5. Now test protected endpoints!
```

### Task 2: Check Server Logs (Admin)

```yaml
1. Login as admin user

2. Authorize with admin token

3. GET /api/logs/stats
   - View server statistics
   
4. GET /api/logs/errors?limit=50
   - View recent errors
```

### Task 3: Update User Role (Admin)

```yaml
1. Login as admin

2. Authorize with admin token

3. GET /api/profile/users
   - Get list of users and their IDs

4. PUT /api/profile/user/{userId}/roles
   Body: {"role": "creator"}
```

---

## 🔑 Authentication Quick Reference

### Two Types of Auth

| Type | Purpose | Location | Format |
|------|---------|----------|--------|
| **API Key** | Access documentation | Query param or header | `?apiKey=YOUR_KEY` or `x-api-key: YOUR_KEY` |
| **JWT Token** | Use API endpoints | Header | `Authorization: Bearer YOUR_TOKEN` |

### Getting Your JWT Token

```bash
# Method 1: Via Swagger UI
1. Open /api-docs
2. Use POST /api/login
3. Copy accessToken

# Method 2: Via cURL
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpass"}'
```

---

## 💡 Tips & Tricks

### Tip 1: Persistent Authorization
Swagger UI **remembers your token** between page refreshes! Just authorize once.

### Tip 2: Use Search
Press `Ctrl+F` or use the search box to find specific endpoints quickly.

### Tip 3: Copy cURL Command
After executing a request, scroll down to see the **cURL command** - copy it for use in terminal!

### Tip 4: Expand All Schemas
Click on schema names to see detailed object structures.

### Tip 5: Test Error Cases
Try invalid data to see error responses - Swagger shows all possible status codes!

---

## 🐛 Troubleshooting

### "API key is required" Error

**Problem:** Can't access /api-docs  
**Solution:** Add `?apiKey=YOUR_KEY` to URL or set `x-api-key` header

### "Not authorized" on Protected Endpoints

**Problem:** 401 Unauthorized  
**Solution:** 
1. Get token from login/register
2. Click "Authorize" button
3. Enter: `Bearer YOUR_TOKEN` (include "Bearer ")

### Changes Not Showing

**Problem:** Updated code but Swagger doesn't reflect changes  
**Solution:** Restart the server (`npm run dev`)

### API Key Not Working

**Problem:** 403 Forbidden  
**Solution:** Check `.env` file has correct `API_DOC_KEY` value

---

## 📚 What's Documented

### ✅ Complete Coverage

All endpoints are fully documented with:
- **Parameters** - Path, query, and body params
- **Request bodies** - With example values
- **Response schemas** - Success and error formats
- **Status codes** - All possible responses
- **Authentication** - Which endpoints need tokens
- **Rate limits** - Request limits per endpoint
- **Examples** - Real-world usage examples

### 📋 Endpoint Count by Tag

- **Authentication**: 5 endpoints
- **Profile**: 4 endpoints
- **Logs**: 5 endpoints (Admin only)
- **Health**: 2 endpoints
- **Channels**: Coming soon
- **Quizzes**: Coming soon
- **Attempts**: Coming soon

---

## 🎓 Learning Path

### For Beginners

1. ✅ Access Swagger UI with API key
2. ✅ Try `GET /health` (no auth needed)
3. ✅ Register a new user
4. ✅ Login and get token
5. ✅ Authorize in Swagger
6. ✅ Test `GET /api/profile`

### For Developers

1. ✅ Read [SWAGGER_DOCUMENTATION.md](./SWAGGER_DOCUMENTATION.md)
2. ✅ Test all auth endpoints
3. ✅ Test profile management
4. ✅ Test with admin user (logs endpoints)
5. ✅ Export OpenAPI spec for tools
6. ✅ Add JSDoc for new endpoints

### For Admins

1. ✅ Secure API_DOC_KEY in production
2. ✅ Test logs endpoints
3. ✅ Test role management
4. ✅ Monitor via `/api/logs/stats`
5. ✅ Consider IP whitelist for docs

---

## 🚀 Next Steps

1. **Explore the API** - Try every endpoint!
2. **Read Full Docs** - See [SWAGGER_DOCUMENTATION.md](./SWAGGER_DOCUMENTATION.md)
3. **Secure Your Key** - Use strong API_DOC_KEY in production
4. **Share with Team** - Give them the API key
5. **Export Spec** - Import into Postman/Insomnia

---

## 📞 Quick Support

**Access URL:**
```
http://localhost:3000/api-docs?apiKey=YOUR_KEY
```

**OpenAPI JSON:**
```
http://localhost:3000/api-docs.json?apiKey=YOUR_KEY
```

**Full Documentation:**
[SWAGGER_DOCUMENTATION.md](./SWAGGER_DOCUMENTATION.md)

---

Happy exploring! 🎉
