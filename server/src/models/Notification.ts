import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'UNKNOWN_FACE' | 'SYSTEM_OFFLINE' | 'FACE_REGISTERED' | 'ALERT';

export interface INotificationDocument extends Document {
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['UNKNOWN_FACE', 'SYSTEM_OFFLINE', 'FACE_REGISTERED', 'ALERT'],
      default: 'ALERT'
    },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
