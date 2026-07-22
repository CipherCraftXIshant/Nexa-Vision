import { Request, Response } from 'express';

// In-memory application settings storage
let systemSettings = {
  recognitionThreshold: 0.65,
  livenessThreshold: 0.60,
  aiModel: 'InsightFace ResNet-50',
  cameraTimeoutSeconds: 15,
  emailNotifications: true,
  theme: 'dark',
  autoRegisterVisitors: true
};

export const getSystemSettings = async (req: Request, res: Response) => {
  return res.json({ success: true, settings: systemSettings });
};

export const updateSystemSettings = async (req: Request, res: Response) => {
  systemSettings = { ...systemSettings, ...req.body };
  return res.json({
    success: true,
    message: 'System settings updated successfully.',
    settings: systemSettings
  });
};
