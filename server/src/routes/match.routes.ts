import { Router } from 'express';
import { getMatches, unmatchUser, blockUser } from '../controllers/match.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/matches', authMiddleware, getMatches);
router.get('/matches/:userId', authMiddleware, getMatches); // Hỗ trợ backward compatibility
router.post('/unmatch', authMiddleware, unmatchUser);
router.post('/block', authMiddleware, blockUser);

export default router;
