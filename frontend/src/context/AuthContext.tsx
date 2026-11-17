import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (email: string, pass: string, name: string, role?: string, standard?: string, subjects?: string[] | string) => Promise<any>;
  logout: () => void;
  updateProfileState: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vsa_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Purge any legacy saved credentials if they exist
    localStorage.removeItem('vsa_saved_email');
    localStorage.removeItem('vsa_saved_password');
    localStorage.removeItem('vsa_save_password');

    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err: any) {
        console.error('Session restore error:', err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          logout();
        }
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
    // Ensure no plaintext credentials are stored
    localStorage.removeItem('vsa_saved_email');
    localStorage.removeItem('vsa_saved_password');
    localStorage.removeItem('vsa_save_password');
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const register = async (
    email: string,
    pass: string,
    name: string,
    role: string = 'STUDENT',
    standard: string = 'Standard 8',
    subjects?: string[] | string
  ) => {
    let subjectsList: string[] = [];
    if (Array.isArray(subjects)) {
      subjectsList = subjects.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof subjects === 'string' && subjects.trim()) {
      subjectsList = subjects.split(',').map(s => s.trim()).filter(Boolean);
    }

    const payload: any = { email, password: pass, name, role, standard };
    if (role === 'TEACHER') {
      payload.subjects = subjectsList;
      payload.teachingSubjects = subjectsList.join(', ');
      payload.teacherSubject = subjectsList[0] || null;
      payload.subject = subjectsList[0] || null;
    }

    const res = await api.post('/auth/register', payload);
    // Registration only creates the account; explicit sign in is required as Step 2
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('vsa_token');
    localStorage.removeItem('vsa_saved_email');
    localStorage.removeItem('vsa_saved_password');
    localStorage.removeItem('vsa_save_password');
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
