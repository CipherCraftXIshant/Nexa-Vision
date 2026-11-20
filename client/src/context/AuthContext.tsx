import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { IUser } from '../../../shared/types';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (data: Partial<IUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(() => {
    const saved = localStorage.getItem('nexavision_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexavision_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const updateToken = () => setToken(localStorage.getItem('nexavision_access_token'));
    window.addEventListener('nexavision:session-updated', updateToken);
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('nexavision_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          // Token invalid, clear state
          logout();
        }
      }
      setIsLoading(false);
    };
    verifyUser();
    return () => window.removeEventListener('nexavision:session-updated', updateToken);
  }, [token]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { email, password: pass });
      if (res.data.success) {
        const { accessToken, refreshToken, user: loggedUser } = res.data;
        localStorage.setItem('nexavision_access_token', accessToken);
        localStorage.setItem('nexavision_refresh_token', refreshToken);
        localStorage.setItem('nexavision_user', JSON.stringify(loggedUser));
        setToken(accessToken);
        setUser(loggedUser);
        return true;
      }
    } catch (err) {
      // The visible login message is generic; do not log request details or credentials.
    }
    return false;
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('nexavision_refresh_token');
    if (refreshToken) api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    localStorage.removeItem('nexavision_access_token');
    localStorage.removeItem('nexavision_refresh_token');
    localStorage.removeItem('nexavision_user');
    setUser(null);
    setToken(null);
  };

  const updateUserProfile = (data: Partial<IUser>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('nexavision_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
