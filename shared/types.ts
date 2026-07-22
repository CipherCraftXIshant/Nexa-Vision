export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'USER';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  isActive: boolean;
  lastSeen?: string;
  createdAt: string;
}

export type VisitorStatus = 'UNIDENTIFIED' | 'IDENTIFIED' | 'CONVERTED';

export interface IVisitor {
  id: string;
  visitorId: string;
  name?: string;
  snapshotUrl: string;
  firstSeen: string;
  lastSeen: string;
  visitCount: number;
  cameraLocation: string;
  confidence: number;
  status: VisitorStatus;
}

export type RecognitionStatus = 'SUCCESS' | 'UNKNOWN' | 'LIVENESS_FAILED' | 'LOW_QUALITY';

export interface IRecognitionLog {
  id: string;
  personId?: string;
  personType: 'User' | 'Visitor';
  personName: string;
  cameraLocation: string;
  confidence: number;
  snapshotUrl: string;
  status: RecognitionStatus;
  livenessScore?: number;
  qualityScore?: number;
  timestamp: string;
}

export interface IDevice {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE';
  resolution: string;
  fps: number;
  lastPing: string;
}

export type NotificationType = 'UNKNOWN_FACE' | 'SYSTEM_OFFLINE' | 'FACE_REGISTERED' | 'ALERT';

export interface INotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface IDashboardStats {
  totalRegisteredUsers: number;
  activeUsersCount: number;
  visitorsToday: number;
  unknownFacesCount: number;
  recognitionSuccessRate: number;
  recognitionAccuracy: number;
  cameraStatus: {
    total: number;
    online: number;
    offline: number;
  };
}

export interface IFaceDetectionResult {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  landmarks?: { x: number; y: number }[];
  livenessScore: number;
  qualityScore: number;
}

export interface IFaceRecognitionResult extends IFaceDetectionResult {
  matched: boolean;
  personId?: string;
  personName?: string;
  personRole?: UserRole;
  personType?: 'User' | 'Visitor';
  matchConfidence: number;
  avatarUrl?: string;
}
