import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket.IO Client] Connected to real-time server hub.');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket.IO Client] Disconnected.');
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
