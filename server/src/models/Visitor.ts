import mongoose, { Schema, Document } from 'mongoose';

export type VisitorStatus = 'UNIDENTIFIED' | 'IDENTIFIED' | 'CONVERTED';

export interface IVisitorDocument extends Document {
  visitorId: string;
  name?: string;
  snapshotUrl: string;
  firstSeen: Date;
  lastSeen: Date;
  visitCount: number;
  cameraLocation: string;
  confidence: number;
  status: VisitorStatus;
  notes?: string;
}

const VisitorSchema = new Schema<IVisitorDocument>(
  {
    visitorId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'Unknown Visitor' },
    snapshotUrl: { type: String, required: true },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    visitCount: { type: Number, default: 1 },
    cameraLocation: { type: String, default: 'Main Entrance' },
    confidence: { type: Number, default: 0.9 },
    status: {
      type: String,
      enum: ['UNIDENTIFIED', 'IDENTIFIED', 'CONVERTED'],
      default: 'UNIDENTIFIED'
    },
    notes: { type: String }
  },
  { timestamps: true }
);

export const Visitor = mongoose.model<IVisitorDocument>('Visitor', VisitorSchema);
