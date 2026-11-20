import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || user?.role === 'USER') {
      setSocket(null);
      setIsConnected(false);
      return;
    }
    const s = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket.IO Client] Connected to real-time server hub.');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('connect_error', () => setIsConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
