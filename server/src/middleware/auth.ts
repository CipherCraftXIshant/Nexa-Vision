import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { Session } from '../models/Session';
import { loadSecurityConfig } from '../config/security';

export interface AuthIdentity { id: string; email: string; role: UserRole; name: string; sessionId?: string; }
export interface AuthRequest extends Request { user?: AuthIdentity; }

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
  try {
    const payload = jwt.verify(token, loadSecurityConfig().jwtSecret) as JwtPayload;
    if (payload.typ !== 'access' || typeof payload.id !== 'string') return res.status(401).json({ success: false, message: 'Invalid access token.' });
    const user = await User.findById(payload.id).select('email role name isActive');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Account is inactive or unavailable.' });
    if (typeof payload.sid !== 'string' || !(await Session.exists({ _id: payload.sid, userId: user._id, expiresAt: { $gt: new Date() } }))) {
      return res.status(401).json({ success: false, message: 'Session has been revoked or expired.' });
    }
    req.user = { id: user.id, email: user.email, role: user.role, name: user.name, sessionId: payload.sid };
    return next();
  } catch (err: any) {
    if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Invalid or expired access token.' });
    return res.status(500).json({ success: false, message: 'Authentication could not be verified.' });
  }
};
