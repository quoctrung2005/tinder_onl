import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/messages/:partnerId', authMiddleware, getMessages);
router.post('/messages', authMiddleware, sendMessage);

export default router;
