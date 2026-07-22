import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'USER';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  isActive: boolean;
  isVerified: boolean;
  googleId?: string;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'USER'],
      default: 'USER'
    },
    avatar: { type: String },
    department: { type: String, default: 'General' },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
    googleId: { type: String },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUserDocument>('User', UserSchema);
