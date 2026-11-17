import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'study_assistant_super_secret_jwt_key_2026_antigravity';

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user as AuthenticatedRequest['user'];
    next();
  });
};

export const optionalAuthToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err && user) {
      req.user = user as AuthenticatedRequest['user'];
    }
    next();
  });
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER')) {
    return res.status(403).json({ error: 'Admin / Teacher access required' });
  }
  next();
};
