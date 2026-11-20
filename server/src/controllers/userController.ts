import { Request, Response } from 'express';
import { User } from '../models/User';
import { FaceEmbedding } from '../models/FaceEmbedding';
import { Session } from '../models/Session';
import { AuthRequest } from '../middleware/auth';
import { getSocketIO } from '../socket';
import { canAssignRole } from '../config/security';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'ALL') {
      query.role = role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        department: u.department,
        isActive: u.isActive,
        lastSeen: u.lastSeen,
        createdAt: u.createdAt
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const embeddings = await FaceEmbedding.find({ userId: user._id });

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.department,
        isActive: user.isActive,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
        registeredFacesCount: embeddings.length
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role, department, isActive } = req.body;
    const actor = (req as AuthRequest).user;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (role && !['USER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });
    if (!actor || !canAssignRole(actor.role, user.role, role)) return res.status(403).json({ success: false, message: 'Insufficient role privileges for this account change.' });
    if (name !== undefined) user.name = String(name).trim();
    if (email !== undefined) user.email = String(email).trim().toLowerCase();
    if (department !== undefined) user.department = String(department).trim();
    if (role !== undefined) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    await user.save();
    if (!user.isActive || role !== undefined) {
      await Session.deleteMany({ userId: user._id });
      getSocketIO()?.in(`user:${user.id}`).disconnectSockets(true);
    }
    return res.json({ success: true, message: 'User updated successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, department: user.department, isActive: user.isActive, lastSeen: user.lastSeen, createdAt: user.createdAt } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const actor = (req as AuthRequest).user;
    if (actor?.id === req.params.id) return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    const target = await User.findById(req.params.id);
    if (target?.role === 'SUPER_ADMIN' && actor?.role !== 'SUPER_ADMIN') return res.status(403).json({ success: false, message: 'Only a Super Admin may delete a Super Admin account.' });
    if (target?.role === 'ADMIN' && actor?.role === 'ADMIN') return res.status(403).json({ success: false, message: 'Only a Super Admin may delete an Admin account.' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await FaceEmbedding.deleteMany({ userId: user._id });
    await Session.deleteMany({ userId: user._id });
    getSocketIO()?.in(`user:${user.id}`).disconnectSockets(true);
    return res.json({ success: true, message: 'User and associated face embeddings deleted.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
