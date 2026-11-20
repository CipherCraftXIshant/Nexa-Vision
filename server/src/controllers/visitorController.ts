import { Request, Response } from 'express';
import { Visitor } from '../models/Visitor';
import { User } from '../models/User';
import { Invitation } from '../models/Invitation';
import { createInvitationToken } from './authController';
import { hashToken } from '../config/security';

export const getVisitors = async (req: Request, res: Response) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { visitorId: { $regex: search, $options: 'i' } },
        { cameraLocation: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const total = await Visitor.countDocuments(query);
    const visitors = await Visitor.find(query)
      .sort({ lastSeen: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      visitors: visitors.map(v => ({
        id: v._id,
        visitorId: v.visitorId,
        name: v.name,
        snapshotUrl: v.snapshotUrl,
        firstSeen: v.firstSeen,
        lastSeen: v.lastSeen,
        visitCount: v.visitCount,
        cameraLocation: v.cameraLocation,
        confidence: v.confidence,
        status: v.status,
        notes: v.notes
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVisitor = async (req: Request, res: Response) => {
  try {
    const { name, notes, status } = req.body;
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { name, notes, status },
      { new: true }
    );
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    return res.json({ success: true, message: 'Visitor updated successfully', visitor });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const convertVisitorToUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, department } = req.body;

    const visitor = await Visitor.findById(id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    if (visitor.status === 'CONVERTED') return res.status(409).json({ success: false, message: 'Visitor has already been converted.' });

    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const setupToken = createInvitationToken();

    const newUser = new User({
      name: name || visitor.name || 'Converted Visitor',
      email: email.trim().toLowerCase(),
      role: 'USER',
      department: department || 'Visitor Converted',
      avatar: visitor.snapshotUrl,
      isVerified: false
    });

    await newUser.save();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await Invitation.create({ userId: newUser._id, tokenHash: hashToken(setupToken), expiresAt });

    visitor.status = 'CONVERTED';
    visitor.name = newUser.name;
    await visitor.save();

    return res.status(201).json({
      success: true,
      message: 'Visitor converted. Deliver the one-time password setup token to the user within 24 hours.',
      setupToken,
      setupTokenExpiresAt: expiresAt,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        avatar: newUser.avatar
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVisitor = async (req: Request, res: Response) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
    return res.json({ success: true, message: 'Visitor deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
