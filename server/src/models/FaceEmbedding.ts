import mongoose, { Schema, Document } from 'mongoose';

export interface IFaceEmbeddingDocument extends Document {
  userId: mongoose.Types.ObjectId;
  embedding: number[];
  imagePath: string;
  qualityScore: number;
  livenessScore: number;
  createdAt: Date;
}

const FaceEmbeddingSchema = new Schema<IFaceEmbeddingDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    embedding: { type: [Number], required: true },
    imagePath: { type: String, required: true },
    qualityScore: { type: Number, default: 0.8 },
    livenessScore: { type: Number, default: 0.85 }
  },
  { timestamps: true }
);

export const FaceEmbedding = mongoose.model<IFaceEmbeddingDocument>('FaceEmbedding', FaceEmbeddingSchema);
