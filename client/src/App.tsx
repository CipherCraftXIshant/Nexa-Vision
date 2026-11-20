import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { CommandPalette } from './components/CommandPalette';

import { Login } from './pages/Auth/Login';
import { PasswordSetup } from './pages/Auth/PasswordSetup';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { LiveCamera } from './pages/LiveCamera/LiveCamera';
import { FaceRegistration } from './pages/FaceRegistration/FaceRegistration';
import { Visitors } from './pages/Visitors/Visitors';
import { RecognitionLogs } from './pages/RecognitionLogs/RecognitionLogs';
import { Admin } from './pages/Admin/Admin';
import { Settings } from './pages/Settings/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center text-xs font-mono text-slate-400">
        Initializing NexaVision Session...
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const MainLayout: React.FC = () => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-dark-bg text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenCommandPalette={() => setIsCommandOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-16">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live-camera" element={<LiveCamera />} />
            <Route path="/registration" element={<FaceRegistration />} />
            <Route path="/visitors" element={<Visitors />} />
            <Route path="/logs" element={<RecognitionLogs />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/setup-password" element={<PasswordSetup />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
