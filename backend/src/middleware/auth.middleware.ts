import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = authService.verifyToken(token);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired user session' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
