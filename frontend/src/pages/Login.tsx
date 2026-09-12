import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { GraduationCap, ArrowRight, Lock, Mail, UserCheck, ShieldCheck, Globe } from 'lucide-react';

export const Login: React.FC = () => {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const [activeRoleTab, setActiveRoleTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleTabChange = (role: 'STUDENT' | 'TEACHER') => {
    setActiveRoleTab(role);
    setError('');
    if (role === 'STUDENT') {
      setEmail('student@example.com');
      setPassword('password123');
    } else {
      setEmail('teacher@example.com');
      setPassword('teacher123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || t('common:error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoStudent = async () => {
    setActiveRoleTab('STUDENT');
    setEmail('student@example.com');
    setPassword('password123');
    setLoading(true);
    try {
      await login('student@example.com', 'password123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || t('common:error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoTeacher = async () => {
    setActiveRoleTab('TEACHER');
    setEmail('teacher@example.com');
    setPassword('teacher123');
    setLoading(true);
    try {
      await login('teacher@example.com', 'teacher123');
      navigate('/teacher-dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || t('common:error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Top Language Switcher */}
      <div className="absolute top-6 right-6 flex items-center space-x-2 bg-slate-800/80 border border-slate-700/70 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm z-20">
        <Globe className="w-4 h-4 text-blue-400" />
        <select
          value={i18n.language}
          onChange={(e) => {
            i18n.changeLanguage(e.target.value);
            localStorage.setItem('language', e.target.value);
          }}
          className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-bold"
        >
          <option value="en" className="bg-slate-900 text-slate-100">🌐 English</option>
          <option value="gu" className="bg-slate-900 text-slate-100">🌐 ગુજરાતી</option>
        </select>
      </div>

      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl z-10 space-y-6">
        <div className="text-center">
          <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-400 mb-3 shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('loginTitle')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('loginSubtitle')}</p>
        </div>

        {/* Role Tab Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => handleRoleTabChange('STUDENT')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activeRoleTab === 'STUDENT'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{t('studentLogin')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('TEACHER')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activeRoleTab === 'TEACHER'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('teacherLogin')}</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeRoleTab === 'STUDENT' ? 'student@example.com' : 'teacher@example.com'}
                className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t('password')}
              </label>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 ${
              activeRoleTab === 'STUDENT'
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
            }`}
          >
            <span>{loading ? t('common:saving') : t('loginButton')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('quickDemo')}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDemoStudent}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700/80 text-blue-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>{t('studentLogin')}</span>
            </button>
            <button
              onClick={handleDemoTeacher}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700/80 text-purple-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t('teacherLogin')}</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pt-2">
          {t('noAccount')}{' '}
          <Link to="/register" className="text-blue-400 hover:underline font-semibold">
            {t('registerHere')}
          </Link>
        </p>
      </div>
    </div>
  );
};
