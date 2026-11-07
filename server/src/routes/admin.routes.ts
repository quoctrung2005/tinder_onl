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
  forceMatchUsers,
  getAdminRevenue,
  getAdminAuditLogs,
  sendAdminBroadcast,
  getSystemConfig,
  updateSystemConfig
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

// 6. Tài chính, Doanh thu & Giao dịch VIP
router.get('/revenue', getAdminRevenue);

// 7. Nhật ký Hành động Quản trị viên (Audit Logs)
router.get('/audit-logs', getAdminAuditLogs);

// 8. Phát thông báo toàn hệ thống (Broadcast Announcement)
router.post('/broadcast', sendAdminBroadcast);

// 9. Cấu hình thuật toán & tham số nền tảng
router.get('/config', getSystemConfig);
router.put('/config', updateSystemConfig);

export default router;
