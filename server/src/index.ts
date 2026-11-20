import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { loadSecurityConfig } from './config/security';
import { initSocket } from './socket';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import visitorRoutes from './routes/visitorRoutes';
import recognitionRoutes from './routes/recognitionRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import deviceRoutes from './routes/deviceRoutes';
import adminRoutes from './routes/adminRoutes';

const security = loadSecurityConfig();
const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || 5000);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: security.clientUrl, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
initSocket(server);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/visitors', visitorRoutes);
app.use('/api/v1/recognition', recognitionRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/admin', adminRoutes);
app.get('/api/v1/health', (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'healthy' : 'not_ready',
    service: 'NexaVision Core API Gateway',
    dependencies: { mongodb: databaseReady ? 'connected' : 'unavailable' },
    timestamp: new Date().toISOString()
  });
});
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = Number(err?.status) || 500;
  if (status >= 500) console.error('[Error Middleware] Request failed.');
  return res.status(status).json({ success: false, message: status >= 500 ? 'Internal Server Error' : err.message || 'Request failed.' });
});

export const startServer = async () => {
  await connectDB();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '0.0.0.0', () => { server.removeListener('error', reject); resolve(); });
  });
  console.log(`[NexaVision Server] API Gateway listening on port ${PORT}`);
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('[NexaVision Server] Startup failed. Verify database and required environment configuration.');
    process.exitCode = 1;
  });
}
