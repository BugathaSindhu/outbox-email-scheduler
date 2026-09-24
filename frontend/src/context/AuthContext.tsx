import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, SlackStatus } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  slackStatus: SlackStatus;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  demoLogin: (email?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshSlackStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [slackStatus, setSlackStatus] = useState<SlackStatus>({ connected: false });

  const fetchCurrentUser = async (): Promise<boolean> => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      await fetchSlackStatus();
      return true;
    } catch {
      setUser(null);
      setSlackStatus({ connected: false });
      return false;
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
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      await fetchSlackStatus();
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      setUser(res.data.user);
      await fetchSlackStatus();
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (newToken: string) => {
    setToken(newToken);
    await fetchCurrentUser();
  };

  const demoLogin = async (email?: string, name?: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/demo-login', { email, name });
      setUser(res.data.user);
      await fetchSlackStatus();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
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
        login,
        signup,
        loginWithToken,
        demoLogin,
        logout,
        checkAuth: fetchCurrentUser,
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
