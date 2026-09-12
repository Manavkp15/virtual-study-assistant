import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role?: string, standard?: string) => Promise<void>;
  logout: () => void;
  updateProfileState: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vsa_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        console.error('Session restore error:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.post('/auth/login', { email, password: pass });
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('vsa_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const register = async (email: string, pass: string, name: string, role: string = 'STUDENT', standard: string = 'Standard 8') => {
    const res = await api.post('/auth/register', { email, password: pass, name, role, standard });
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('vsa_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('vsa_token');
    setToken(null);
    setUser(null);
  };

  const updateProfileState = (updated: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updated } : null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
