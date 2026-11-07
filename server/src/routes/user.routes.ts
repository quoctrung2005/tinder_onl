import { Router } from 'express';
import {
  updateProfile, updatePreferences, getAllInterests,
  verifyPhoto, blockContact, getBlockedContacts,
  upgradeVip, updatePassport
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.put('/profile', authMiddleware, updateProfile);
router.put('/preferences', authMiddleware, updatePreferences);
router.post('/verify-photo', authMiddleware, verifyPhoto);
router.post('/block-contact', authMiddleware, blockContact);
router.get('/blocked-contacts', authMiddleware, getBlockedContacts);
router.get('/interests', getAllInterests);

// Tính năng thực tế nâng cao: Nâng cấp VIP & Hộ chiếu Tinder
router.post('/upgrade-vip', authMiddleware, upgradeVip);
router.post('/passport', authMiddleware, updatePassport);

export default router;
