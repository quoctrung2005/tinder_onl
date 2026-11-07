import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDriver } from '../config/neo4j';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_tinder_jwt_key_2026';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ') ||
    authHeader === 'Bearer null' ||
    authHeader === 'Bearer undefined' ||
    authHeader === 'Bearer '
  ) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role?: string };
    req.userId = decoded.id;
    req.userRole = decoded.role || 'user';
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  }
};

/**
 * Middleware phân quyền Quản trị viên (Admin RBAC)
 * Kiểm tra xem người dùng có quyền admin hay không.
 * Nếu không phải admin, trả về mã lỗi 403 Forbidden.
 */
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục.' });
  }

  if (req.userRole === 'admin') {
    return next();
  }

  // Truy vấn trực tiếp Neo4j để đảm bảo tính chuẩn xác thời gian thực
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $id}) RETURN coalesce(u.role, 'user') AS role`,
      { id: req.userId }
    );

    if (result.records.length > 0) {
      const role = result.records[0].get('role');
      if (role === 'admin') {
        req.userRole = 'admin';
        return next();
      }
    }

    return res.status(403).json({
      error: 'Quyền truy cập bị từ chối: Chỉ tài khoản Quản trị viên (Admin) mới có quyền truy cập trang quản lý.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
};
