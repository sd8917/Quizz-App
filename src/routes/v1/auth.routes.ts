import express from 'express';
import { register, login, refreshToken, logout, logoutAll } from '../../controllers/auth.controller';
import { protect } from '../../middleware/auth.middleware';
import { authLimiter, refreshLimiter } from '../../middleware/rateLimit.middleware';

const router = express.Router();

// Apply strict rate limiting to auth endpoints
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Apply moderate rate limiting to token refresh
router.post('/refresh', refreshLimiter, refreshToken);

// Logout endpoints (no strict rate limit needed)
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAll);

export default router;