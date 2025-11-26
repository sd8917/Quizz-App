# 📚 Documentation Index

Welcome to the Quizz-App API documentation. This guide will help you navigate all available documentation.

---

## 🎯 Quick Start

**New to the project?** Start here:
1. [README.md](./README.md) - Project overview and setup
2. [LOGS_API_QUICK_REFERENCE.md](./LOGS_API_QUICK_REFERENCE.md) - Quick commands
3. [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md) - Response structure

---

## 📖 Main Documentation

### Core Documentation
| Document | Description | Best For |
|----------|-------------|----------|
| [README.md](./README.md) | Project overview, architecture, setup | Understanding the project |
| [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md) | Standard API response format | API integration |
| [TEST_REQUESTS.md](./TEST_REQUESTS.md) | API testing examples | Testing endpoints |

### Logs API Documentation
| Document | Description | Best For |
|----------|-------------|----------|
| [LOGS_API_DOCUMENTATION.md](./LOGS_API_DOCUMENTATION.md) | Complete logs API reference | Detailed implementation |
| [LOGS_API_QUICK_REFERENCE.md](./LOGS_API_QUICK_REFERENCE.md) | Quick commands & examples | Daily usage |
| [LOGS_API_VISUAL_GUIDE.md](./LOGS_API_VISUAL_GUIDE.md) | Visual diagrams & flows | Understanding architecture |
| [LOGS_API_SUMMARY.md](./LOGS_API_SUMMARY.md) | Implementation summary | Overview of features |

---

## 🔍 Find What You Need

### I want to...

#### 🚀 Get Started
- **Setup the project** → [README.md](./README.md) (Setup section)
- **Understand architecture** → [README.md](./README.md) (Architecture section)
- **Run the server** → [README.md](./README.md) (Getting started)

#### 📝 Work with APIs
- **Understand response format** → [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md)
- **Test API endpoints** → [TEST_REQUESTS.md](./TEST_REQUESTS.md)
- **Handle errors** → [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md) (Error Handling)

#### 📊 Use Logs API
- **Quick commands** → [LOGS_API_QUICK_REFERENCE.md](./LOGS_API_QUICK_REFERENCE.md)
- **Detailed documentation** → [LOGS_API_DOCUMENTATION.md](./LOGS_API_DOCUMENTATION.md)
- **See visual flow** → [LOGS_API_VISUAL_GUIDE.md](./LOGS_API_VISUAL_GUIDE.md)
- **Implementation details** → [LOGS_API_SUMMARY.md](./LOGS_API_SUMMARY.md)

#### 🐛 Debug Issues
- **View server logs** → [LOGS_API_QUICK_REFERENCE.md](./LOGS_API_QUICK_REFERENCE.md)
- **Search for errors** → [LOGS_API_DOCUMENTATION.md](./LOGS_API_DOCUMENTATION.md) (Get Logs with Filtering)
- **Check server health** → [LOGS_API_DOCUMENTATION.md](./LOGS_API_DOCUMENTATION.md) (Get Log Statistics)

#### 🔒 Security & Auth
- **Authentication** → [README.md](./README.md) (Auth section)
- **Role-based access** → [TEST_REQUESTS.md](./TEST_REQUESTS.md)
- **Admin endpoints** → [LOGS_API_DOCUMENTATION.md](./LOGS_API_DOCUMENTATION.md)

---

## 📚 Documentation by Feature

### Authentication & Authorization
- [README.md](./README.md) - Auth overview
- [TEST_REQUESTS.md](./TEST_REQUESTS.md) - Login/register examples
- [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md) - Auth error responses

### User Management
- [TEST_REQUESTS.md](./TEST_REQUESTS.md) - Update user roles
- [README.md](./README.md) - Role hierarchy

### Logs & Monitoring
- [LOGS_API_DOCUMENTATION.md](./LOGS_API_DOCUMENTATION.md) - Complete reference
- [LOGS_API_QUICK_REFERENCE.md](./LOGS_API_QUICK_REFERENCE.md) - Quick commands
- [LOGS_API_VISUAL_GUIDE.md](./LOGS_API_VISUAL_GUIDE.md) - Visual diagrams
- [LOGS_API_SUMMARY.md](./LOGS_API_SUMMARY.md) - Implementation summary

### API Standards
- [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md) - Response format
- [README.md](./README.md) - Rate limiting
- [TEST_REQUESTS.md](./TEST_REQUESTS.md) - Testing examples

---

## 🎓 Learning Path

### For New Developers
1. Read [README.md](./README.md) - Understand the project
2. Review [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md) - Learn response structure
3. Try [TEST_REQUESTS.md](./TEST_REQUESTS.md) - Test basic endpoints
4. Explore [LOGS_API_QUICK_REFERENCE.md](./LOGS_API_QUICK_REFERENCE.md) - Learn debugging

### For Frontend Developers
1. [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md) - Response structure
2. [TEST_REQUESTS.md](./TEST_REQUESTS.md) - API examples
3. [README.md](./README.md) - Available endpoints

### For DevOps Engineers
1. [README.md](./README.md) - Architecture & deployment
2. [LOGS_API_DOCUMENTATION.md](./LOGS_API_DOCUMENTATION.md) - Monitoring API
3. [LOGS_API_VISUAL_GUIDE.md](./LOGS_API_VISUAL_GUIDE.md) - System flow

### For QA Engineers
1. [TEST_REQUESTS.md](./TEST_REQUESTS.md) - Test cases
2. [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md) - Expected responses
3. [LOGS_API_QUICK_REFERENCE.md](./LOGS_API_QUICK_REFERENCE.md) - Debug commands

---

## 📋 Quick Reference Cheat Sheet

### Most Common Tasks

```bash
# Login as admin
POST /api/login
Body: { "email": "admin@example.com", "password": "..." }

# View recent errors
GET /api/logs/errors?limit=50
Header: Authorization: Bearer <token>

# Search logs
GET /api/logs?search=database&level=error
Header: Authorization: Bearer <token>

# Check server health
GET /api/logs/stats
Header: Authorization: Bearer <token>

# Update user role
PUT /api/profile/users/:userId/roles
Body: { "role": "creator" }
Header: Authorization: Bearer <admin_token>
```

---

## 🔗 Related Resources

### External Documentation
- [Express.js](https://expressjs.com/)
- [MongoDB](https://docs.mongodb.com/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [JWT](https://jwt.io/)

### Project Files
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `jest.config.js` - Test configuration
- `.env.example` - Environment variables

---

## 📊 Documentation Stats

- **Total Documents**: 8
- **Core Docs**: 3
- **Logs API Docs**: 4
- **Quick References**: 2

---

## 🆘 Need Help?

### Common Questions

**Q: How do I test the API?**  
A: See [TEST_REQUESTS.md](./TEST_REQUESTS.md)

**Q: What's the response format?**  
A: See [API_RESPONSE_FORMAT.md](./API_RESPONSE_FORMAT.md)

**Q: How do I view logs?**  
A: See [LOGS_API_QUICK_REFERENCE.md](./LOGS_API_QUICK_REFERENCE.md)

**Q: How do I debug errors?**  
A: See [LOGS_API_DOCUMENTATION.md](./LOGS_API_DOCUMENTATION.md)

**Q: What are the available roles?**  
A: See [README.md](./README.md) or [TEST_REQUESTS.md](./TEST_REQUESTS.md)

---

## 📝 Document Descriptions

### README.md
**Purpose**: Main project documentation  
**Contains**: Architecture, setup, features, tech stack  
**Read Time**: 15-20 minutes  
**Update Frequency**: Major releases

### API_RESPONSE_FORMAT.md
**Purpose**: Standard API response documentation  
**Contains**: Response structure, status codes, examples  
**Read Time**: 10 minutes  
**Update Frequency**: When API format changes

### TEST_REQUESTS.md
**Purpose**: API testing guide  
**Contains**: Request examples, test cases, cURL commands  
**Read Time**: 5 minutes  
**Update Frequency**: When endpoints change

### LOGS_API_DOCUMENTATION.md
**Purpose**: Complete logs API reference  
**Contains**: All endpoints, parameters, examples  
**Read Time**: 15 minutes  
**Update Frequency**: When logs API changes

### LOGS_API_QUICK_REFERENCE.md
**Purpose**: Quick command reference for logs API  
**Contains**: Quick examples, cheat sheet, tips  
**Read Time**: 3 minutes  
**Update Frequency**: As needed

### LOGS_API_VISUAL_GUIDE.md
**Purpose**: Visual diagrams and flow charts  
**Contains**: Architecture diagrams, flow charts  
**Read Time**: 5 minutes  
**Update Frequency**: Major architecture changes

### LOGS_API_SUMMARY.md
**Purpose**: Implementation summary  
**Contains**: What was built, features, files  
**Read Time**: 10 minutes  
**Update Frequency**: After implementation

### DOCUMENTATION_INDEX.md (This File)
**Purpose**: Documentation navigation  
**Contains**: Index of all docs, quick links  
**Read Time**: 5 minutes  
**Update Frequency**: When docs are added

---

## 🎯 Recommended Reading Order

### First Time Setup
1. README.md (Project overview)
2. API_RESPONSE_FORMAT.md (API structure)
3. TEST_REQUESTS.md (Testing)

### Daily Development
1. LOGS_API_QUICK_REFERENCE.md (When debugging)
2. API_RESPONSE_FORMAT.md (When building features)
3. TEST_REQUESTS.md (When testing)

### Deep Dive
1. LOGS_API_DOCUMENTATION.md (Full logs API)
2. LOGS_API_VISUAL_GUIDE.md (Architecture)
3. LOGS_API_SUMMARY.md (Implementation details)

---

## ✨ Documentation Quality

All documentation includes:
- ✅ Clear examples
- ✅ Code snippets
- ✅ Error handling
- ✅ Best practices
- ✅ Security notes
- ✅ Quick references
- ✅ Visual aids

---

## 🔄 Last Updated

**Date**: November 16, 2025  
**Version**: 1.0  
**Contributors**: Development Team

---

**Happy Coding! 🚀**
