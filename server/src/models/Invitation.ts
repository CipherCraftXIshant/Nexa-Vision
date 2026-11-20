import mongoose, { Document, Schema } from 'mongoose';

export interface IInvitationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
}

const InvitationSchema = new Schema<IInvitationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: { type: Date }
}, { timestamps: true });

export const Invitation = mongoose.model<IInvitationDocument>('Invitation', InvitationSchema);
