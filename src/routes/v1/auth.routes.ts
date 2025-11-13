import express from 'express';
import { register, login, refreshToken, logout, logoutAll } from '../../controllers/auth.controller';
import { protect } from '../../middleware/auth.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAll);

export default router;