import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Visitor } from '../models/Visitor';
import { RecognitionLog } from '../models/RecognitionLog';
import { FaceEmbedding } from '../models/FaceEmbedding';
import { Device } from '../models/Device';
import { Notification } from '../models/Notification';

const seedDatabase = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexavision';
    await mongoose.connect(connStr);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Visitor.deleteMany({});
    await RecognitionLog.deleteMany({});
    await FaceEmbedding.deleteMany({});
    await Device.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seed] Cleared old collections.');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Password@123', salt);

    // Create Admin and Users
    const users = await User.insertMany([
      {
        name: 'Alex Vance',
        email: 'admin@nexavision.io',
        password: defaultPassword,
        role: 'SUPER_ADMIN',
        department: 'Executive Board',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        isActive: true,
        isVerified: true
      },
      {
        name: 'Sarah Connor',
        email: 'sarah.c@nexavision.io',
        password: defaultPassword,
        role: 'ADMIN',
        department: 'Security Operations',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
        isActive: true,
        isVerified: true
      },
      {
        name: 'David Miller',
        email: 'david.m@nexavision.io',
        password: defaultPassword,
        role: 'OPERATOR',
        department: 'Surveillance Tier 1',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        isActive: true,
        isVerified: true
      },
      {
        name: 'Elena Rostova',
        email: 'elena.r@nexavision.io',
        password: defaultPassword,
        role: 'USER',
        department: 'AI Research Lab',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        isActive: true,
        isVerified: true
      }
    ]);

    console.log(`[Seed] Created ${users.length} default users.`);

    // Seed Face Embeddings for Alex and Sarah
    for (const u of users.slice(0, 2)) {
      const mockVec = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.1));
      await FaceEmbedding.create({
        userId: u._id,
        embedding: mockVec,
        imagePath: u.avatar || '',
        qualityScore: 0.94,
        livenessScore: 0.96
      });
    }

    // Seed Visitors
    const visitors = await Visitor.insertMany([
      {
        visitorId: 'VIS-90214',
        name: 'Michael Scott',
        snapshotUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
        firstSeen: new Date(Date.now() - 3600000 * 5),
        lastSeen: new Date(Date.now() - 3600000 * 1),
        visitCount: 3,
        cameraLocation: 'Main Lobby Entrance',
        confidence: 0.92,
        status: 'IDENTIFIED',
        notes: 'Scheduled meeting with Tech Lead.'
      },
      {
        visitorId: 'VIS-88123',
        name: 'Unknown Visitor',
        snapshotUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
        firstSeen: new Date(Date.now() - 1800000),
        lastSeen: new Date(Date.now() - 1800000),
        visitCount: 1,
        cameraLocation: 'Perimeter Gate B',
        confidence: 0.88,
        status: 'UNIDENTIFIED',
        notes: 'Flagged for unregistered perimeter entry.'
      }
    ]);

    console.log(`[Seed] Created ${visitors.length} visitor records.`);

    // Seed Recognition Logs
    await RecognitionLog.insertMany([
      {
        personId: users[0]._id,
        personType: 'User',
        personName: users[0].name,
        cameraLocation: 'Main Lobby Entrance',
        confidence: 0.98,
        snapshotUrl: users[0].avatar,
        status: 'SUCCESS',
        livenessScore: 0.97,
        qualityScore: 0.95,
        timestamp: new Date(Date.now() - 1000 * 60 * 15)
      },
      {
        personId: users[1]._id,
        personType: 'User',
        personName: users[1].name,
        cameraLocation: 'Server Room Entry',
        confidence: 0.96,
        snapshotUrl: users[1].avatar,
        status: 'SUCCESS',
        livenessScore: 0.95,
        qualityScore: 0.92,
        timestamp: new Date(Date.now() - 1000 * 60 * 45)
      },
      {
        personId: visitors[1].visitorId,
        personType: 'Visitor',
        personName: 'Unknown Visitor',
        cameraLocation: 'Perimeter Gate B',
        confidence: 0.88,
        snapshotUrl: visitors[1].snapshotUrl,
        status: 'UNKNOWN',
        livenessScore: 0.89,
        qualityScore: 0.86,
        timestamp: new Date(Date.now() - 1000 * 60 * 120)
      }
    ]);

    // Seed Devices
    await Device.insertMany([
      { name: 'Cam 01 - Main Entrance', ipAddress: '192.168.1.101', location: 'Lobby HQ', status: 'ONLINE', resolution: '4K', fps: 30 },
      { name: 'Cam 02 - Server Vault', ipAddress: '192.168.1.102', location: 'Basement Floor 1', status: 'ONLINE', resolution: '1080p', fps: 60 },
      { name: 'Cam 03 - Perimeter Gate B', ipAddress: '192.168.1.103', location: 'North Fence', status: 'ONLINE', resolution: '1080p', fps: 30 },
      { name: 'Cam 04 - Executive Suite', ipAddress: '192.168.1.104', location: 'Floor 12', status: 'OFFLINE', resolution: '4K', fps: 30 }
    ]);

    // Seed Notifications
    await Notification.insertMany([
      { title: 'Unknown Person Detected', message: 'Unregistered visitor detected at Perimeter Gate B.', type: 'UNKNOWN_FACE', read: false },
      { title: 'Camera Disconnected', message: 'Cam 04 - Executive Suite went offline.', type: 'SYSTEM_OFFLINE', read: false },
      { title: 'Face Registration Complete', message: 'User Alex Vance updated 128-d face embedding.', type: 'FACE_REGISTERED', read: true }
    ]);

    console.log('[Seed] Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
