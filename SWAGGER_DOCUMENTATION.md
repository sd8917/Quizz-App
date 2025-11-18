# Swagger API Documentation Guide

## 🎯 Overview

The Quiz App API now includes complete **Swagger/OpenAPI 3.0 documentation** with **API key authentication** for secure access to the documentation interface.

---

## 🔑 API Key Authentication

### Purpose
The Swagger documentation endpoint (`/api-docs`) is protected with an API key to prevent unauthorized access to your API documentation in production environments.

### Setup

1. **Set the API Key in `.env` file:**
```bash
API_DOC_KEY=your-secret-api-key-here
```

⚠️ **Important**: Use a strong, random string in production!

2. **Generate a Secure API Key** (Recommended):
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Example output:
# a7f3d9e2c1b4f8e6d5a9c3b7e1f4d8c2a6b9e3f7d1c5a8e2b6d9f3c7e1a5d8b2
```

---

## 🚀 Accessing the Documentation

### Method 1: Query Parameter (Browser)

Access the documentation by adding the API key as a query parameter:

```
http://localhost:3000/api-docs?apiKey=your-secret-api-key-here
```

**Example:**
```
http://localhost:3000/api-docs?apiKey=a7f3d9e2c1b4f8e6d5a9c3b7e1f4d8c2
```

### Method 2: Header (API Clients)

Use the `x-api-key` header when accessing the documentation:

**cURL:**
```bash
curl -H "x-api-key: your-secret-api-key-here" \
  http://localhost:3000/api-docs
```

**JavaScript/Fetch:**
```javascript
fetch('http://localhost:3000/api-docs', {
  headers: {
    'x-api-key': 'your-secret-api-key-here'
  }
});
```

**Postman:**
1. Add a new Header
2. Key: `x-api-key`
3. Value: `your-secret-api-key-here`

---

## 📚 Documentation Endpoints

### Swagger UI (Interactive)
```
GET /api-docs?apiKey=YOUR_KEY
```
Interactive documentation with "Try it out" functionality.

### OpenAPI JSON Spec
```
GET /api-docs.json?apiKey=YOUR_KEY
```
Raw OpenAPI 3.0 specification in JSON format.

---

## 🔐 Security Features

### 1. **Protected Access**
- ✅ Documentation requires valid API key
- ✅ Prevents public access to API structure
- ✅ Separate from API authentication (JWT)

### 2. **Dual Authentication System**
The API uses two types of authentication:

**For Documentation Access:**
- API Key (`x-api-key` header or `apiKey` query param)
- Required to view Swagger UI

**For API Endpoints:**
- JWT Bearer Token (`Authorization: Bearer <token>`)
- Required for most API operations

### 3. **Error Responses**

**Missing API Key:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "API key is required. Provide x-api-key header or apiKey query parameter",
  "error": {
    "code": "UNAUTHORIZED"
  },
  "timestamp": "2025-11-18T10:30:45.123Z"
}
```

**Invalid API Key:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Invalid API key",
  "error": {
    "code": "FORBIDDEN"
  },
  "timestamp": "2025-11-18T10:30:45.123Z"
}
```

---

## 🎨 Swagger UI Features

Once authenticated, you'll have access to:

### ✨ Features
- 📖 Complete API reference
- 🎯 Interactive "Try it out" buttons
- 🔐 JWT token authorization
- 📋 Request/response examples
- 🏷️ Organized by tags (Auth, Profile, Logs, etc.)
- 🔍 Search functionality
- 📊 Schema definitions
- ⚡ Response time display

### 📑 Organized Sections
- **Authentication** - Login, register, token management
- **Profile** - User profile and role management
- **Channels** - Channel management
- **Quizzes** - Quiz creation and management
- **Attempts** - Quiz attempts
- **Logs** - Server logs (Admin only)
- **Health** - System health checks

---

## 🧪 Testing with Swagger UI

### Step 1: Access Documentation
```
http://localhost:3000/api-docs?apiKey=YOUR_KEY
```

### Step 2: Authenticate for API Calls

1. Click the **"Authorize"** button (top right)
2. Enter your JWT token in the format: `Bearer <your_token>`
3. Click "Authorize"
4. Click "Close"

### Step 3: Test Endpoints

1. Expand any endpoint (e.g., `POST /api/login`)
2. Click **"Try it out"**
3. Fill in the request body
4. Click **"Execute"**
5. View the response

---

## 💡 Usage Examples

### Example 1: Get API Key and Access Docs

```bash
# 1. Set API key in .env
echo "API_DOC_KEY=my-secret-key-12345" >> .env

# 2. Start server
npm run dev

# 3. Access documentation
open "http://localhost:3000/api-docs?apiKey=my-secret-key-12345"
```

### Example 2: Complete Authentication Flow in Swagger

```markdown
1. Open Swagger UI with API key
2. Use POST /api/register to create account
3. Copy the accessToken from response
4. Click "Authorize" button
5. Enter: Bearer <accessToken>
6. Now test protected endpoints!
```

### Example 3: Download OpenAPI Spec

```bash
# Download OpenAPI JSON specification
curl -H "x-api-key: your-secret-api-key-here" \
  http://localhost:3000/api-docs.json > openapi-spec.json

# Import into Postman, Insomnia, or other tools
```

---

## 🔧 Configuration Options

### Customize Swagger UI

Edit `src/app.ts` to customize the Swagger UI:

```typescript
swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Your Custom Title',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,  // Remember auth token
    displayRequestDuration: true, // Show request time
    filter: true,                 // Enable search
    tryItOutEnabled: true,        // Enable "Try it out"
    docExpansion: 'list',        // 'none', 'list', or 'full'
    defaultModelsExpandDepth: 3   // Schema depth
  }
})
```

### Change API Key Location

You can modify where the API key is expected:

**Current Implementation** (`src/middleware/swagger.middleware.ts`):
```typescript
const apiKey = req.headers['x-api-key'] || req.query.apiKey;
```

Accepts:
- Header: `x-api-key: YOUR_KEY`
- Query: `?apiKey=YOUR_KEY`

---

## 📊 API Documentation Structure

### OpenAPI 3.0 Specification

The documentation includes:

**1. General Information**
- API title and version
- Description and features
- Contact information
- License details

**2. Server URLs**
- Development: `http://localhost:3000`
- Production: `https://api.quizapp.com`

**3. Security Schemes**
- Bearer Auth (JWT)
- API Key Auth (documentation access)

**4. Schemas**
- ApiResponse
- ErrorResponse
- User
- Channel
- Quiz
- LogEntry
- HealthCheck

**5. Endpoints**
All endpoints documented with:
- Parameters
- Request bodies
- Response schemas
- Example values
- Error codes

---

## 🛠️ Maintenance

### Adding New Endpoints

Add JSDoc comments above your routes:

```typescript
/**
 * @openapi
 * /api/your-endpoint:
 *   get:
 *     tags:
 *       - YourTag
 *     summary: Your endpoint summary
 *     description: Detailed description
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
router.get('/your-endpoint', yourController.yourMethod);
```

### Updating Schemas

Edit `src/config/swagger.ts` in the `components.schemas` section:

```typescript
YourNewSchema: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' }
  }
}
```

---

## 🚀 Production Deployment

### Security Checklist

- [ ] Change `API_DOC_KEY` to a strong random value
- [ ] Use environment variable (don't commit to git)
- [ ] Consider disabling docs in production (`NODE_ENV === 'production'`)
- [ ] Use HTTPS only
- [ ] Implement IP whitelist for documentation access (optional)
- [ ] Monitor documentation access logs

### Disable Documentation in Production (Optional)

```typescript
// In src/app.ts
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', validateSwaggerApiKey, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

---

## 📋 Quick Reference

| Feature | Value |
|---------|-------|
| **Swagger UI URL** | `http://localhost:3000/api-docs` |
| **OpenAPI Spec** | `http://localhost:3000/api-docs.json` |
| **API Key Header** | `x-api-key` |
| **API Key Query Param** | `apiKey` |
| **API Auth** | `Authorization: Bearer <JWT>` |
| **Environment Variable** | `API_DOC_KEY` |

---

## 🎉 Summary

✅ Complete OpenAPI 3.0 documentation  
✅ Interactive Swagger UI  
✅ API key protection  
✅ Dual authentication (API key + JWT)  
✅ All endpoints documented  
✅ Request/response schemas  
✅ "Try it out" functionality  
✅ Organized by tags  
✅ Example values included  
✅ Production-ready  

Access your documentation now:
```
http://localhost:3000/api-docs?apiKey=your-secret-api-key-here
```

---

## 🆘 Troubleshooting

**Q: Can't access /api-docs**  
A: Make sure you're providing the correct API key via header or query parameter

**Q: API key not working**  
A: Check your `.env` file has `API_DOC_KEY` set correctly

**Q: "Try it out" returns 401**  
A: Click "Authorize" and enter your JWT Bearer token

**Q: Don't see all endpoints**  
A: Make sure all route files are included in `swagger.ts` apis array

**Q: Changes not showing**  
A: Restart the server to reload Swagger configuration

---

For more information, see:
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
