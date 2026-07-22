import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceDocument extends Document {
  name: string;
  ipAddress: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE';
  resolution: string;
  fps: number;
  lastPing: Date;
}

const DeviceSchema = new Schema<IDeviceDocument>(
  {
    name: { type: String, required: true },
    ipAddress: { type: String, required: true },
    location: { type: String, default: 'Entrance' },
    status: { type: String, enum: ['ONLINE', 'OFFLINE'], default: 'ONLINE' },
    resolution: { type: String, default: '1080p' },
    fps: { type: Number, default: 30 },
    lastPing: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Device = mongoose.model<IDeviceDocument>('Device', DeviceSchema);
