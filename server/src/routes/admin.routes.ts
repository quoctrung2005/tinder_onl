import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middlewares/auth.middleware';
import {
  getAdminStats,
  getAdminUsers,
  toggleUserVerification,
  toggleUserBan,
  deleteUser,
  getAdminReports,
  forceMatchUsers
} from '../controllers/admin.controller';

const router = Router();

// Toàn bộ API Quản trị viên bắt buộc phải có Token hợp lệ và có quyền Admin
router.use(authMiddleware);
router.use(requireAdmin);

// 1. Thống kê tổng quan & KPIs
router.get('/stats', getAdminStats);

// 2. Quản lý người dùng
router.get('/users', getAdminUsers);
router.patch('/users/:id/verify', toggleUserVerification);
router.patch('/users/:id/ban', toggleUserBan);
router.delete('/users/:id', deleteUser);

// 3. Quản lý báo cáo & kiểm duyệt
router.get('/reports', getAdminReports);

// 4. Kết nối ghép đôi thủ công (Force Match)
router.post('/force-match', forceMatchUsers);

export default router;
