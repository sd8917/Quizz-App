import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import passport from 'passport';
import { configurePassport } from './config/passport';
import authRoutes from './routes/v1/auth.routes';
import channelRoutes from './routes/v1/channel.routes';
import { quizRoutes } from './routes/v1/quiz.routes';
import { attemptRoutes } from './routes/v1/attempt.routes';
import { profileRoutes } from './routes/v1/profile.routes';
import { logsRoutes } from './routes/v1/logs.routes';
import aiRoutes from './routes/v1/ai.routes';
import errorHandler from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit.middleware';
import logger, { morganStream } from './utils/logger';
import { supportRoutes } from './routes/v1/support.routes';
import { feedbackRoutes } from './routes/v1/feedback.routes';


const app = express();

// --- Core middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(compression());

// Passport (Google OAuth)
configurePassport();
app.use(passport.initialize());

// HTTP request logging - logs to both console and file
app.use(morgan('combined', { stream: morganStream }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// --- Swagger API Documentation (Public Access) ---
/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Health
 *     summary: Root endpoint
 *     description: Welcome message for the API
 *     security: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 🧠 Welcome to the Blogging/Quiz API Service
 */
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'TriviaVerse API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  })
);

// Swagger JSON endpoint
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// --- Healthcheck ---
app.get('/', (_req, res) => {
  logger.info('Root endpoint accessed');
  res.json({ message: '🧠 Welcome to the TriviaVerse API Service' });
});

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Check the health and status of the API server
 *     security: []
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Service unavailable (database not connected)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
// Health check endpoint
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  // Convert bytes to MB
  const memoryUsage = process.memoryUsage();
  const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

  const health = {
    status: 'ok',
    uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s`,
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    memory: {
      rss: `${toMB(memoryUsage.rss)} MB`,
      heapTotal: `${toMB(memoryUsage.heapTotal)} MB`,
      heapUsed: `${toMB(memoryUsage.heapUsed)} MB`,
      external: `${toMB(memoryUsage.external)} MB`,
      arrayBuffers: memoryUsage.arrayBuffers ? `${toMB(memoryUsage.arrayBuffers)} MB` : undefined,
      raw: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      }
    },
    database: {
      state: stateMap[dbState] || 'unknown',
      readyState: dbState,
    },
  };

  const code = dbState === 1 ? 200 : 503;
  res.status(code).json(health);
});

// Routes

// Add debug endpoint to see all requests
{
  process.env.NODE_ENV == "development" && app.use((req, _res, next) => {
    if (req.path.includes('google') || req.path.includes('callback')) {
      console.log('[Request Debug]', {
        method: req.method,
        path: req.path,
        fullUrl: req.originalUrl,
        query: req.query,
        timestamp: new Date().toISOString()
      });
    }
    next();
  })
}

// add route for auth
app.use('/api/', authRoutes);

// channel routes
app.use('/api/channel', channelRoutes);

// quiz routes
app.use('/api/quiz', quizRoutes);

// leaderboard routes
app.use('/api/attempt', attemptRoutes);

// profile routes
app.use('/api/profile', profileRoutes);

// logs routes (admin only)
app.use('/api/logs', logsRoutes);

// AI routes (premium creators only)
app.use('/api/ai', aiRoutes);

// Contact/Support routes
app.use("/api/contact", supportRoutes)

// Feedback routes
app.use('/api/feedback', feedbackRoutes);

// Error handling middleware (centralized)
app.use(errorHandler);

export default app;
