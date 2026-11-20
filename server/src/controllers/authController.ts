import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { User, IUserDocument } from '../models/User';
import { Session } from '../models/Session';
import { Invitation } from '../models/Invitation';
import { AuthRequest } from '../middleware/auth';
import { hashToken, isPublicRegistrationRole, loadSecurityConfig } from '../config/security';
import { getSocketIO } from '../socket';

const tokensFor = (user: IUserDocument, sessionId: string) => {
  const config = loadSecurityConfig();
  const accessToken = jwt.sign(
    { id: user._id.toString(), sid: sessionId, email: user.email, role: user.role, name: user.name, typ: 'access' },
    config.jwtSecret,
    { expiresIn: config.accessTokenTtl as SignOptions['expiresIn'] }
  );
  const refreshToken = jwt.sign(
    { id: user._id.toString(), sid: sessionId, typ: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: config.refreshTokenTtl as SignOptions['expiresIn'] }
  );
  return { accessToken, refreshToken };
};

const publicUser = (user: IUserDocument) => ({
  id: user._id.toString(), name: user.name, email: user.email, role: user.role,
  avatar: user.avatar, department: user.department, isActive: user.isActive
});

const issueSession = async (user: IUserDocument, req: Request) => {
  const session = new Session({
    userId: user._id,
    refreshTokenHash: hashToken(randomBytes(32).toString('hex')),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  const tokens = tokensFor(user, session.id);
  session.refreshTokenHash = hashToken(tokens.refreshToken);
  await session.save();
  return tokens;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, department } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: 'Name, valid email, and a password of 12 to 72 bytes are required.' });
    }
    if (!isPublicRegistrationRole(req.body.role)) {
      return res.status(403).json({ success: false, message: 'Public registration only permits the USER role.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }
    const user = await User.create({
      name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 12), role: 'USER',
      department: typeof department === 'string' ? department.trim().slice(0, 100) : 'Operations'
    });
    const tokens = await issueSession(user, req);
    return res.status(201).json({ success: true, message: 'Registration successful.', ...tokens, user: publicUser(user) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Registration could not be completed.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ success: false, message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !user.isActive || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
    }
    user.lastSeen = new Date();
    await user.save();
    const tokens = await issueSession(user, req);
    return res.json({ success: true, message: 'Login successful.', ...tokens, user: publicUser(user) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Login could not be completed.' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const supplied = req.body?.refreshToken;
  if (typeof supplied !== 'string' || !supplied) return res.status(400).json({ success: false, message: 'Refresh token is required.' });
  try {
    const config = loadSecurityConfig();
    const payload = jwt.verify(supplied, config.jwtRefreshSecret) as JwtPayload;
    if (payload.typ !== 'refresh' || typeof payload.id !== 'string' || typeof payload.sid !== 'string') {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }
    const session = await Session.findOne({ _id: payload.sid, userId: payload.id, refreshTokenHash: hashToken(supplied), expiresAt: { $gt: new Date() } });
    if (!session) return res.status(401).json({ success: false, message: 'Refresh token is expired, revoked, or already used.' });
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ success: false, message: 'Account is inactive.' });
    }
    const tokens = tokensFor(user, session.id);
    const rotated = await Session.updateOne(
      { _id: session._id, refreshTokenHash: hashToken(supplied) },
      { $set: { refreshTokenHash: hashToken(tokens.refreshToken), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
    );
    if (rotated.modifiedCount !== 1) return res.status(401).json({ success: false, message: 'Refresh token has already been used.' });
    return res.json({ success: true, ...tokens, user: publicUser(user) });
  } catch (error: any) {
    if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Expired or invalid refresh token.' });
    return res.status(500).json({ success: false, message: 'Session refresh could not be completed.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const supplied = req.body?.refreshToken;
    const sessionId = (req as AuthRequest).user?.sessionId;
    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
      getSocketIO()?.in(`session:${sessionId}`).disconnectSockets(true);
    } else if (typeof supplied === 'string' && supplied) {
      await Session.deleteOne({ refreshTokenHash: hashToken(supplied) });
    }
    return res.json({ success: true, message: 'Session revoked.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Session could not be revoked.' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Account is inactive.' });
    return res.json({ success: true, user: publicUser(user) });
  } catch {
    return res.status(500).json({ success: false, message: 'Account data could not be loaded.' });
  }
};

export const setupPassword = async (req: Request, res: Response) => {
  try {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ success: false, message: 'A valid setup token and password of 12 to 72 bytes are required.' });
  }
  const invitation = await Invitation.findOneAndUpdate(
    { tokenHash: hashToken(token), usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true }
  );
  if (!invitation) return res.status(400).json({ success: false, message: 'Setup token is invalid or expired.' });
  const user = await User.findById(invitation.userId);
  if (!user || !user.isActive) return res.status(400).json({ success: false, message: 'Account is unavailable.' });
  user.password = await bcrypt.hash(password, 12);
  user.isVerified = true;
  await user.save();
  return res.json({ success: true, message: 'Password set. You can now sign in.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Password setup could not be completed.' });
  }
};

export const forgotPassword = async (_req: Request, res: Response) => res.status(501).json({ success: false, message: 'Password reset is not configured. Contact an administrator.' });
export const resetPassword = async (_req: Request, res: Response) => res.status(501).json({ success: false, message: 'Password reset is not configured. Contact an administrator.' });

export const createInvitationToken = () => randomBytes(32).toString('hex');
