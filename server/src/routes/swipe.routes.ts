import { Router } from 'express';
import { getFeed, handleSwipe, rewindSwipe, resetFeed, getLikesYou } from '../controllers/swipe.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/feed', authMiddleware, getFeed);
router.get('/feed/:userId', authMiddleware, getFeed);
router.get('/likes-you', authMiddleware, getLikesYou);
router.post('/swipe', authMiddleware, handleSwipe);
router.post('/rewind', authMiddleware, rewindSwipe);
router.post('/reset', authMiddleware, resetFeed);

export default router;
