import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TriviaVerse API Documentation',
      version: '1.0.0',
      description: `
## Quiz Collaboration Platform API

A comprehensive RESTful API for a quiz collaboration platform that enables teams to create channels, 
manage quizzes, invite members, and track leaderboards.

### Features
- 🔐 JWT-based authentication with refresh tokens
- 👥 Role-based access control (User, Creator, Admin)
- 📊 Quiz and question management
- 🏆 Leaderboard and scoring system
- 📝 Channel-based collaboration
- 📋 Server logs and monitoring (Admin only)
- ⚡ Rate limiting and security
- 🎯 Standardized response format

### Authentication
Most endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your_access_token>
\`\`\`

### Roles
- **user**: Can take quizzes and view scores
- **creator**: Can create channels, quizzes, and invite users
- **admin**: Full system access including logs and user management

### Rate Limits
- Auth endpoints: 5 requests per 15 minutes
- Token refresh: 20 requests per 15 minutes
- General API: 100 requests per 15 minutes
- Role management: 10 requests per hour
      `,
      contact: {
        name: 'API Support',
        email: 'triviaverse.contact@gmail.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server'
      },
      {
        url: 'https://api.triviaverse.site',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Profile',
        description: 'User profile management'
      },
      {
        name: 'Channels',
        description: 'Channel management and invitations'
      },
      {
        name: 'Quizzes',
        description: 'Quiz creation and management'
      },
      {
        name: 'Attempts',
        description: 'Quiz attempts and submissions'
      },
      {
        name: 'Logs',
        description: 'Server logs and monitoring (Admin only)'
      },
      {
        name: 'Health',
        description: 'System health and status checks'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for documentation access (required to view this page)'
        }
      },
      schemas: {
        // Standard Response
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            message: {
              type: 'string',
              description: 'Human-readable message'
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp'
            }
          }
        },
        // Error Response
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            statusCode: {
              type: 'integer',
              example: 400
            },
            message: {
              type: 'string',
              example: 'Validation failed'
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                details: {
                  type: 'object'
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            path: {
              type: 'string',
              example: '/api/login'
            }
          }
        },
        // User
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64abc123def456789'
            },
            username: {
              type: 'string',
              example: 'johndoe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'creator', 'admin'],
              example: 'user'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        // Auth Response
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        },
        // Channel
        Channel: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            name: {
              type: 'string',
              example: 'JavaScript Quiz Channel'
            },
            description: {
              type: 'string',
              example: 'Channel for JavaScript quizzes'
            },
            createdBy: {
              type: 'string',
              example: '64abc123def456789'
            },
            members: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        // Quiz
        Quiz: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            title: {
              type: 'string',
              example: 'JavaScript Basics Quiz'
            },
            description: {
              type: 'string',
              example: 'Test your JavaScript fundamentals'
            },
            channelId: {
              type: 'string'
            },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: {
                    type: 'string'
                  },
                  options: {
                    type: 'array',
                    items: {
                      type: 'string'
                    }
                  },
                  correctAnswer: {
                    type: 'integer'
                  }
                }
              }
            },
            createdBy: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        // Log Entry
        LogEntry: {
          type: 'object',
          properties: {
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-18T10:30:45.123Z'
            },
            level: {
              type: 'string',
              enum: ['error', 'warn', 'info', 'debug'],
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Database connection failed'
            },
            service: {
              type: 'string',
              example: 'blog-api'
            },
            stack: {
              type: 'string',
              description: 'Error stack trace (for errors only)'
            }
          }
        },
        // Health Check
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
              description: 'Overall service status'
            },
            uptime: {
              type: 'string',
              example: '2h 15m 30s',
              description: 'Human-readable uptime'
            },
            uptimeSeconds: {
              type: 'number',
              example: 8130.5,
              description: 'Uptime in seconds'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-27T10:30:45.123Z',
              description: 'Current server time in ISO format'
            },
            env: {
              type: 'string',
              example: 'development',
              description: 'Environment (development, production, etc.)'
            },
            memory: {
              type: 'object',
              description: 'Memory usage information',
              properties: {
                rss: {
                  type: 'string',
                  example: '45.23 MB',
                  description: 'Resident Set Size - total memory allocated'
                },
                heapTotal: {
                  type: 'string',
                  example: '20.15 MB',
                  description: 'Total heap allocated'
                },
                heapUsed: {
                  type: 'string',
                  example: '15.42 MB',
                  description: 'Heap memory currently in use'
                },
                external: {
                  type: 'string',
                  example: '2.10 MB',
                  description: 'Memory used by C++ objects bound to JS'
                },
                arrayBuffers: {
                  type: 'string',
                  example: '1.05 MB',
                  description: 'Memory allocated for ArrayBuffers and SharedArrayBuffers'
                },
                raw: {
                  type: 'object',
                  description: 'Raw memory values in bytes',
                  properties: {
                    rss: { type: 'number', example: 47448064 },
                    heapTotal: { type: 'number', example: 21135360 },
                    heapUsed: { type: 'number', example: 16168456 },
                    external: { type: 'number', example: 2202976 }
                  }
                }
              }
            },
            database: {
              type: 'object',
              description: 'Database connection status',
              properties: {
                state: {
                  type: 'string',
                  example: 'connected',
                  enum: ['disconnected', 'connected', 'connecting', 'disconnecting', 'unknown']
                },
                readyState: {
                  type: 'number',
                  example: 1,
                  description: '0=disconnected, 1=connected, 2=connecting, 3=disconnecting'
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 401,
                message: 'Not authorized, no token',
                error: {
                  code: 'UNAUTHORIZED'
                },
                timestamp: '2025-11-18T10:30:45.123Z'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 403,
                message: 'Forbidden: insufficient role',
                error: {
                  code: 'FORBIDDEN'
                },
                timestamp: '2025-11-18T10:30:45.123Z'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 422,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: {
                    email: 'Email is required',
                    password: 'Password must be at least 8 characters'
                  }
                },
                timestamp: '2025-11-18T10:30:45.123Z',
                path: '/api/register'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 404,
                message: 'Resource not found',
                error: {
                  code: 'NOT_FOUND'
                },
                timestamp: '2025-11-18T10:30:45.123Z'
              }
            }
          }
        }
      }
    },
    security: []
  },
  // Use different paths for development (TypeScript) and production (JavaScript)
  apis: process.env.NODE_ENV === 'production'
    ? ['./dist/routes/**/*.js', './dist/controllers/**/*.js', './dist/app.js']
    : ['./src/routes/**/*.ts', './src/controllers/**/*.ts', './src/app.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
