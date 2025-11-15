# API Test Request Bodies

## Update User Roles Endpoint

### Endpoint
```
PUT /api/v1/profile/users/:userId/roles
```

### Required Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <admin_access_token>"
}
```

### Request Body Examples

#### 1. Update to User Role
```json
{
  "role": "user"
}
```

#### 2. Update to Creator Role
```json
{
  "role": "creator"
}
```

#### 3. Update to Admin Role
```json
{
  "role": "admin"
}
```

### Complete cURL Example
```bash
curl -X PUT http://localhost:3000/api/v1/profile/users/64abc123def456/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "role": "creator"
  }'
```

### PowerShell Example
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

$body = @{
    role = "creator"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/profile/users/64abc123def456/roles" `
    -Method Put `
    -Headers $headers `
    -Body $body
```

### Postman/Thunder Client/REST Client

**URL:** `PUT http://localhost:3000/api/v1/profile/users/64abc123def456/roles`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_admin_token>
```

**Body (JSON):**
```json
{
  "role": "creator"
}
```

---

## Expected Responses

### Success Response (200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User role updated successfully",
  "data": {
    "id": "64abc123def456",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "creator",
    "updatedAt": "2025-11-15T10:45:30.123Z"
  },
  "timestamp": "2025-11-15T10:45:30.123Z"
}
```

### Error Response - Missing Role (400)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Role is required",
  "error": {
    "code": "BAD_REQUEST",
    "details": {
      "allowedRoles": ["user", "creator", "admin"]
    }
  },
  "timestamp": "2025-11-15T10:46:00.456Z"
}
```

### Error Response - Invalid Role (400)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid role specified",
  "error": {
    "code": "BAD_REQUEST",
    "details": {
      "provided": "superuser",
      "allowedRoles": ["user", "creator", "admin"]
    }
  },
  "timestamp": "2025-11-15T10:47:15.789Z"
}
```

### Error Response - User Not Found (404)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "error": {
    "code": "NOT_FOUND"
  },
  "timestamp": "2025-11-15T10:48:20.123Z"
}
```

### Error Response - Unauthorized (401)
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized access",
  "error": {
    "code": "UNAUTHORIZED"
  },
  "timestamp": "2025-11-15T10:49:30.456Z"
}
```

### Error Response - Forbidden (403)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Admin access required",
  "error": {
    "code": "FORBIDDEN"
  },
  "timestamp": "2025-11-15T10:50:45.789Z"
}
```

---

## Role Hierarchy

```
user < creator < admin
```

- **user**: Can take tests/quizzes
- **creator**: Can create tests, questions, and invite users to channels
- **admin**: Full system access (manage all channels, users, roles)

---

## Testing Workflow

### 1. Get Admin Token
First, login as an admin user:

```json
POST /api/v1/auth/login
{
  "email": "admin@example.com",
  "password": "adminPassword123"
}
```

### 2. Get User ID
List all users to get the target user ID:

```
GET /api/v1/profile/users
Authorization: Bearer <admin_token>
```

### 3. Update User Role
Use the user ID and update their role:

```json
PUT /api/v1/profile/users/:userId/roles
{
  "role": "creator"
}
```

### 4. Verify Update
Get the user profile again to confirm the role change:

```
GET /api/v1/profile/users
Authorization: Bearer <admin_token>
```

---

## Test Cases

### Valid Test Cases
✅ Update user to creator
✅ Update creator to admin
✅ Update admin to user
✅ Admin updating their own role

### Invalid Test Cases
❌ Missing role field
❌ Invalid role value (e.g., "superadmin")
❌ Non-existent user ID
❌ Non-admin user trying to update roles
❌ Missing authentication token
❌ Empty role string

---

## Quick Test with Node.js Fetch

```javascript
const updateUserRole = async (userId, role, token) => {
  const response = await fetch(`http://localhost:3000/api/v1/profile/users/${userId}/roles`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ role })
  });
  
  return await response.json();
};

// Usage
const result = await updateUserRole('64abc123def456', 'creator', 'your_admin_token');
console.log(result);
```
