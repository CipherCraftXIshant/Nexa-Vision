import { Request, Response } from 'express';
import { User } from '../models/User';
import { FaceEmbedding } from '../models/FaceEmbedding';

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
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, isActive },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({ success: true, message: 'User updated successfully', user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await FaceEmbedding.deleteMany({ userId: user._id });
    return res.json({ success: true, message: 'User and associated face embeddings deleted.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
