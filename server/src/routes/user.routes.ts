import { Router } from 'express';
import {
  updateProfile, updatePreferences, getAllInterests,
  verifyPhoto, blockContact, getBlockedContacts
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.put('/profile', authMiddleware, updateProfile);
router.put('/preferences', authMiddleware, updatePreferences);
router.post('/verify-photo', authMiddleware, verifyPhoto);
router.post('/block-contact', authMiddleware, blockContact);
router.get('/blocked-contacts', authMiddleware, getBlockedContacts);
router.get('/interests', getAllInterests);

export default router;
