import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, SlackStatus } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  slackStatus: SlackStatus;
  loginWithToken: (token: string) => Promise<void>;
  demoLogin: (email?: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshSlackStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('outbox_token'));
  const [slackStatus, setSlackStatus] = useState<SlackStatus>({ connected: false });

  const fetchCurrentUser = async (jwtToken: string) => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      await fetchSlackStatus();
    } catch (error) {
      console.error('Failed to fetch user', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchSlackStatus = async () => {
    try {
      const res = await api.get('/slack/status');
      setSlackStatus(res.data);
    } catch {
      setSlackStatus({ connected: false });
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginWithToken = async (newToken: string) => {
    localStorage.setItem('outbox_token', newToken);
    setToken(newToken);
    await fetchCurrentUser(newToken);
  };

  const demoLogin = async (email?: string, name?: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/demo-login', { email, name });
      const newToken = res.data.token;
      localStorage.setItem('outbox_token', newToken);
      setToken(newToken);
      setUser(res.data.user);
      await fetchSlackStatus();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('outbox_token');
    setToken(null);
    setUser(null);
    setSlackStatus({ connected: false });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        slackStatus,
        loginWithToken,
        demoLogin,
        logout,
        refreshSlackStatus: fetchSlackStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
