import { Request, Response } from 'express';
import { User } from '../models/User';
import { Visitor } from '../models/Visitor';
import { RecognitionLog } from '../models/RecognitionLog';
import { Device } from '../models/Device';

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const weekStart = new Date(startOfDay);
    weekStart.setDate(weekStart.getDate() - 6);

    const [totalUsers, activeUsers, visitorsToday, unknownFacesToday, totalLogsToday, successLogsToday, devices, recentEvents, weeklyRows] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Visitor.countDocuments({ lastSeen: { $gte: startOfDay } }),
      RecognitionLog.countDocuments({ status: 'UNKNOWN', timestamp: { $gte: startOfDay } }),
      RecognitionLog.countDocuments({ timestamp: { $gte: startOfDay } }),
      RecognitionLog.countDocuments({ status: 'SUCCESS', timestamp: { $gte: startOfDay } }),
      Device.find().select('name location status fps resolution lastPing').sort({ name: 1 }),
      RecognitionLog.find().sort({ timestamp: -1 }).limit(6),
      RecognitionLog.aggregate([
        { $match: { timestamp: { $gte: weekStart } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          recognitions: { $sum: 1 },
          visitors: { $sum: { $cond: [{ $eq: ['$personType', 'Visitor'] }, 1, 0] } },
          unknown: { $sum: { $cond: [{ $eq: ['$status', 'UNKNOWN'] }, 1, 0] } }
        } }
      ])
    ]);

    const grouped = new Map(weeklyRows.map((row: any) => [row._id, row]));
    const weeklyTrends = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const row = grouped.get(key) as any;
      return { day: date.toLocaleDateString('en', { weekday: 'short' }), recognitions: row?.recognitions || 0, visitors: row?.visitors || 0, unknown: row?.unknown || 0 };
    });

    return res.json({
      success: true,
      stats: {
        totalRegisteredUsers: totalUsers,
        activeUsersCount: activeUsers,
        visitorsToday,
        unknownFacesCount: unknownFacesToday,
        recognitionSuccessRate: totalLogsToday ? Math.round((successLogsToday / totalLogsToday) * 100) : 0,
        cameraStatus: { total: devices.length, online: devices.filter(d => d.status === 'ONLINE').length, offline: devices.filter(d => d.status === 'OFFLINE').length }
      },
      devices: devices.map(d => ({ id: d.id, name: d.name, location: d.location, status: d.status, fps: d.fps, resolution: d.resolution, lastPing: d.lastPing })),
      weeklyTrends,
      recentEvents: recentEvents.map(e => ({ id: e._id, personName: e.personName, personType: e.personType, cameraLocation: e.cameraLocation, confidence: e.confidence, status: e.status, timestamp: e.timestamp, snapshotUrl: e.snapshotUrl }))
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Dashboard data could not be loaded.' });
  }
};
