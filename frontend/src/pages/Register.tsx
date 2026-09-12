import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { GraduationCap, ArrowRight, Lock, Mail, User, ShieldCheck, BookOpen, Globe } from 'lucide-react';

export const Register: React.FC = () => {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [standard, setStandard] = useState('Standard 8');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, name, role, standard);
      navigate(role === 'ADMIN' ? '/teacher-dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || t('common:error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden py-12">
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

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl z-10 space-y-6">
        <div className="text-center">
          <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-400 mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('registerTitle')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('registerSubtitle')}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{t('fullName')}</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{t('email')}</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{t('password')}</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {i18n.language === 'gu' ? 'એકાઉન્ટ પ્રકાર' : 'Account Role'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  role === 'STUDENT'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{t('studentLogin')}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  role === 'ADMIN'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t('teacherLogin')}</span>
              </button>
            </div>
          </div>

          {/* Standard Selection List for Student Role */}
          {role === 'STUDENT' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('selectStandard')}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Standard 6', 'Standard 7', 'Standard 8'].map((std) => (
                  <button
                    key={std}
                    type="button"
                    onClick={() => setStandard(std)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      standard === std
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {t(`common:standards.${std.toLowerCase().replace(' ', '')}`, std)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? t('common:saving') : t('registerButton')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-2">
          {t('haveAccount')}{' '}
          <Link to="/login" className="text-blue-400 hover:underline font-semibold">
            {t('loginHere')}
          </Link>
        </p>
      </div>
    </div>
  );
};
