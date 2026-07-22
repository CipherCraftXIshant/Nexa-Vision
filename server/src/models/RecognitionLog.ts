import mongoose, { Schema, Document } from 'mongoose';

export type RecognitionStatus = 'SUCCESS' | 'UNKNOWN' | 'LIVENESS_FAILED' | 'LOW_QUALITY';

export interface IRecognitionLogDocument extends Document {
  personId?: mongoose.Types.ObjectId | string;
  personType: 'User' | 'Visitor';
  personName: string;
  cameraLocation: string;
  confidence: number;
  snapshotUrl: string;
  status: RecognitionStatus;
  livenessScore?: number;
  qualityScore?: number;
  timestamp: Date;
}

const RecognitionLogSchema = new Schema<IRecognitionLogDocument>(
  {
    personId: { type: Schema.Types.Mixed, index: true },
    personType: { type: String, enum: ['User', 'Visitor'], required: true },
    personName: { type: String, required: true },
    cameraLocation: { type: String, default: 'Cam 01 - Gate' },
    confidence: { type: Number, required: true },
    snapshotUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['SUCCESS', 'UNKNOWN', 'LIVENESS_FAILED', 'LOW_QUALITY'],
      default: 'SUCCESS'
    },
    livenessScore: { type: Number },
    qualityScore: { type: Number },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export const RecognitionLog = mongoose.model<IRecognitionLogDocument>('RecognitionLog', RecognitionLogSchema);
