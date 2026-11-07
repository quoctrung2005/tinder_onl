import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middlewares/auth.middleware';
import {
  getAdminStats,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleUserRole,
  resetUserPassword,
  toggleUserVerification,
  toggleUserBan,
  deleteUser,
  getAdminReports,
  getAdminConversations,
  getAdminRoomMessages,
  deleteAdminMessage,
  forceMatchUsers
} from '../controllers/admin.controller';

const router = Router();

// Toàn bộ API Quản trị viên bắt buộc phải có Token hợp lệ và có quyền Admin
router.use(authMiddleware);
router.use(requireAdmin);

// 1. Thống kê tổng quan & KPIs nâng cao
router.get('/stats', getAdminStats);

// 2. Quản lý người dùng mở rộng
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);
router.put('/users/:id', updateAdminUser);
router.patch('/users/:id/role', toggleUserRole);
router.post('/users/:id/reset-password', resetUserPassword);
router.patch('/users/:id/verify', toggleUserVerification);
router.patch('/users/:id/ban', toggleUserBan);
router.delete('/users/:id', deleteUser);

// 3. Quản lý báo cáo & kiểm duyệt
router.get('/reports', getAdminReports);

// 4. Giám sát Hội thoại & Tin nhắn
router.get('/conversations', getAdminConversations);
router.get('/conversations/:roomId/messages', getAdminRoomMessages);
router.delete('/messages/:messageId', deleteAdminMessage);

// 5. Kết nối ghép đôi thủ công (Force Match)
router.post('/force-match', forceMatchUsers);

export default router;
