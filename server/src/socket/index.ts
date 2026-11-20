import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { canUseRealtimeEvents, loadSecurityConfig } from '../config/security';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HTTPServer) => {
  const config = loadSecurityConfig();
  io = new SocketIOServer(httpServer, { cors: { origin: config.clientUrl, methods: ['GET', 'POST'] } });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') return next(new Error('Authentication required'));
      const claims = jwt.verify(token, config.jwtSecret) as JwtPayload;
      if (claims.typ !== 'access' || typeof claims.id !== 'string' || typeof claims.sid !== 'string') return next(new Error('Invalid access token'));
      const [user, session] = await Promise.all([
        User.findById(claims.id).select('role isActive'),
        Session.exists({ _id: claims.sid, userId: claims.id, expiresAt: { $gt: new Date() } })
      ]);
      if (!user || !canUseRealtimeEvents(user.role, user.isActive, Boolean(session))) return next(new Error('Not authorized for real-time events'));
      socket.data.userId = user.id;
      socket.data.role = user.role;
      socket.data.sessionId = claims.sid;
      return next();
    } catch {
      return next(new Error('Invalid or expired access token'));
    }
  });
  io.on('connection', (socket) => {
    socket.join('authorized-operators');
    socket.join(`user:${socket.data.userId}`);
    socket.join(`session:${socket.data.sessionId}`);
    // Rooms are server controlled. The former client supplied join:room event is intentionally unsupported.
    socket.on('join:room', () => socket.emit('authorization:error', { message: 'Room membership is managed by the server.' }));
    socket.on('disconnect', () => undefined);
  });
  return io;
};

export const getSocketIO = (): SocketIOServer | null => io;
