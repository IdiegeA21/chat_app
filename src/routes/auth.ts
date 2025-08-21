import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../middlewares/validation';
import { registerSchema, loginSchema } from '../utils/validation';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

export default router;
