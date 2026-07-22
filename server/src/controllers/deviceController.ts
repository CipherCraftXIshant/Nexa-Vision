import { Request, Response } from 'express';
import { Device } from '../models/Device';

export const getDevices = async (req: Request, res: Response) => {
  try {
    const devices = await Device.find().sort({ name: 1 });
    return res.json({ success: true, devices });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createDevice = async (req: Request, res: Response) => {
  try {
    const { name, ipAddress, location, resolution, fps } = req.body;
    const device = new Device({ name, ipAddress, location, resolution, fps });
    await device.save();
    return res.status(201).json({ success: true, device });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDevice = async (req: Request, res: Response) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    return res.json({ success: true, device });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
