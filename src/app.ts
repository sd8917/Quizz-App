import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/v1/auth.routes';
import channelRoutes from './routes/v1/channel.routes';
import { quizRoutes } from './routes/v1/quiz.routes';
import { attemptRoutes } from './routes/v1/attempt.routes';
import { profileRoutes } from './routes/v1/profile.routes';
import { logsRoutes } from './routes/v1/logs.routes';
import errorHandler from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit.middleware';
import logger, { morganStream } from './utils/logger';


const app = express();

// --- Core middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// HTTP request logging - logs to both console and file
app.use(morgan('combined', { stream: morganStream }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// --- Healthcheck ---
app.get('/', (_req, res) => {
  logger.info('Root endpoint accessed');
  res.json({ message: '🧠 Welcome to the Blogging/Quiz API Service' });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    env: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    database: {
      state: stateMap[dbState] || 'unknown',
      readyState: dbState,
    },
  };

  const code = dbState === 1 ? 200 : 503;
  res.status(code).json(health);
});

// Routes
//add rout for auth
app.use('/api/', authRoutes);
app.use('/api/channel', channelRoutes);

// quiz routes
app.use('/api/quiz', quizRoutes);

//leaderboard
app.use('/api/attempt', attemptRoutes);

//profile routes
app.use('/api/profile', profileRoutes);

//logs routes (admin only)
app.use('/api/logs', logsRoutes);



// Error handling middleware (centralized)
app.use(errorHandler);

export default app;
