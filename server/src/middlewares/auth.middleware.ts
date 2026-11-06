import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  }
};
