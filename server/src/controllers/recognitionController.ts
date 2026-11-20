import { Request, Response } from 'express';
import axios from 'axios';
import { RecognitionLog } from '../models/RecognitionLog';
import { FaceEmbedding } from '../models/FaceEmbedding';
import { User } from '../models/User';
import { Visitor } from '../models/Visitor';
import { Notification } from '../models/Notification';
import { getSocketIO } from '../socket';
import { randomBytes } from 'crypto';
import { AuthRequest } from '../middleware/auth';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

export const getRecognitionLogs = async (req: Request, res: Response) => {
  try {
    const { search, status, personType, startDate, endDate, page = 1, limit = 25 } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { personName: { $regex: search, $options: 'i' } },
        { cameraLocation: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (personType && personType !== 'ALL') {
      query.personType = personType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const total = await RecognitionLog.countDocuments(query);
    const logs = await RecognitionLog.find(query)
      .sort({ timestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      logs: logs.map(l => ({
        id: l._id,
        personId: l.personId,
        personType: l.personType,
        personName: l.personName,
        cameraLocation: l.cameraLocation,
        confidence: l.confidence,
        snapshotUrl: l.snapshotUrl,
        status: l.status,
        livenessScore: l.livenessScore,
        qualityScore: l.qualityScore,
        timestamp: l.timestamp
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const processCameraFrame = async (req: Request, res: Response) => {
  try {
    const { image, cameraLocation = 'Cam 01 - Main Entrance', threshold = 0.65 } = req.body;
    if (typeof image !== 'string' || !image) {
      return res.status(400).json({ success: false, message: 'Camera frame image is required.' });
    }
    if (typeof threshold !== 'number' || threshold < 0.4 || threshold > 0.95) return res.status(400).json({ success: false, message: 'Threshold must be between 0.4 and 0.95.' });
    if (typeof cameraLocation !== 'string' || cameraLocation.length > 200) return res.status(400).json({ success: false, message: 'Camera location is invalid.' });

    // Fetch registered candidate embeddings from DB
    const embeddingsDocs = await FaceEmbedding.find().populate({ path: 'userId', match: { isActive: true }, select: 'name role avatar department isActive' });
    const candidates = embeddingsDocs.filter(doc => doc.userId).map(doc => {
      const userObj = doc.userId as any;
      return {
        id: userObj._id.toString(),
        name: userObj.name,
        role: userObj.role,
        type: 'User',
        avatarUrl: userObj.avatar,
        embedding: doc.embedding
      };
    });

    // Call Python AI Microservice
    let aiResponse;
    try {
      if (!AI_SERVICE_URL) throw new Error('AI_SERVICE_URL is not configured');
      const resAI = await axios.post(`${AI_SERVICE_URL}/recognize`, {
        image,
        candidates,
        threshold
      }, { timeout: 15000 });
      aiResponse = resAI.data;
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        return res.status(err.response.status === 422 ? 422 : 502).json({ success: false, message: 'Vision service rejected the frame.' });
      }
      return res.status(503).json({ success: false, message: 'Vision service is unavailable. No recognition was recorded.' });
    }
    if (aiResponse?.success && aiResponse.recognized === false && Array.isArray(aiResponse.faces)) aiResponse.results = [];
    if (!aiResponse?.success || !Array.isArray(aiResponse.results)) return res.status(502).json({ success: false, message: 'Vision service returned an invalid recognition response.' });

    const io = getSocketIO();
    const processedResults = [];

    for (const result of aiResponse.results || []) {
      const isMatched = result.matched;
      const personName = result.personName || 'Unknown Visitor';
      const personType = isMatched ? 'User' : 'Visitor';
      const statusStr = isMatched ? 'SUCCESS' : 'UNKNOWN';

      const log = new RecognitionLog({
        personId: result.personId || `VIS-${randomBytes(8).toString('hex')}`,
        personType,
        personName,
        cameraLocation,
        confidence: result.matchConfidence ?? result.detectionConfidence,
        snapshotUrl: image,
        status: statusStr,
        livenessScore: result.livenessScore,
        qualityScore: result.qualityScore
      });

      await log.save();
      processedResults.push({ ...result, logId: log._id });

      // If Unknown, register or update visitor record and fire socket alert
      if (!isMatched) {
        const visitorIdStr = `VIS-${randomBytes(8).toString('hex')}`;
        const newVisitor = new Visitor({
          visitorId: visitorIdStr,
          name: 'Unknown Visitor',
          snapshotUrl: log.snapshotUrl,
          cameraLocation,
          confidence: result.detectionConfidence
        });
        await newVisitor.save();

        const notif = new Notification({
          title: 'Unknown Person Detected',
          message: `Unregistered visitor detected at ${cameraLocation}. Snapshot logged (${visitorIdStr}).`,
          type: 'UNKNOWN_FACE',
          metadata: { visitorId: visitorIdStr, cameraLocation }
        });
        await notif.save();

        if (io) {
          io.to('authorized-operators').emit('notification:new', {
            id: notif._id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            createdAt: notif.createdAt
          });
        }
      }

      if (io) {
        io.to('authorized-operators').emit('recognition:event', {
          id: log._id,
          logId: log._id,
          personName,
          personType,
          cameraLocation,
          confidence: log.confidence,
          status: statusStr,
          timestamp: log.timestamp,
          snapshotUrl: log.snapshotUrl
        });
      }
    }

    return res.json({
      success: true,
      processed: processedResults.length,
      results: processedResults
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const registerUserFace = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, image } = req.body;
    if (typeof userId !== 'string' || typeof image !== 'string' || !image) {
      return res.status(400).json({ success: false, message: 'User ID and Image string are required.' });
    }

    if (req.user?.id !== String(userId) && !['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      return res.status(403).json({ success: false, message: 'You may only enroll your own face.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Inactive users cannot enroll a face.' });

    let aiRes;
    try {
      if (!AI_SERVICE_URL) throw new Error('AI_SERVICE_URL is not configured');
      const resp = await axios.post(`${AI_SERVICE_URL}/register-face`, { image }, { timeout: 15000 });
      aiRes = resp.data;
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) return res.status(err.response.status === 422 ? 422 : 502).json({ success: false, message: 'Vision service rejected the enrollment image.' });
      return res.status(503).json({ success: false, message: 'Vision service is unavailable. Face enrollment was not saved.' });
    }
    if (!aiRes?.success || !Array.isArray(aiRes.embedding) || aiRes.embedding.length === 0 || !aiRes.embedding.every((n: unknown) => typeof n === 'number' && Number.isFinite(n))) {
      return res.status(502).json({ success: false, message: 'Vision service returned an invalid face embedding.' });
    }

    const embeddingDoc = new FaceEmbedding({
      userId: user._id,
      embedding: aiRes.embedding,
      imagePath: image.length > 500 ? image.substring(0, 100) + '...' : image,
      qualityScore: aiRes.qualityScore,
      livenessScore: aiRes.livenessScore
    });

    await embeddingDoc.save();

    if (image.length > 50) {
      user.avatar = image;
      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Face registered successfully and 128-d embedding saved.',
      embeddingId: embeddingDoc._id,
      qualityScore: aiRes.qualityScore,
      livenessScore: aiRes.livenessScore
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
