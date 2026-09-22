import { Router } from 'express';
import {
  listCompetitions,
  getCompetition,
  registerForCompetition,
  submitEntry,
  getReferral,
} from '../controllers/competitionController';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for registration — tighter to prevent abuse
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many registration attempts, please try later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public (optional auth to include user state)
router.get('/', optionalAuth, listCompetitions);
router.get('/:id', optionalAuth, getCompetition);

// Protected
router.post('/:id/register', authMiddleware, registerLimiter, registerForCompetition);
router.post('/:id/submit', authMiddleware, submitEntry);
router.get('/:id/referral', authMiddleware, getReferral);

export default router;
