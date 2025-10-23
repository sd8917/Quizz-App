import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/v1/auth.routes';


const app = express();

// --- Core middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// --- Healthcheck ---
app.get('/', (_req, res) => {
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
app.use('/api/auth', authRoutes);


// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app;
