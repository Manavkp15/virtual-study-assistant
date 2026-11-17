import React, { useState } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Globe,
  Eye,
  EyeOff,
  CheckCircle2,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { tr } from '../utils/tr';
import { isValidEmail, normalizeEmail } from '../utils/emailValidator';
import api from '../services/api';

export const Login: React.FC = () => {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const { theme, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navState = location.state as {
    registeredEmail?: string;
    registeredRole?: string;
    justRegistered?: boolean;
  } | null;

  const isTeacherTarget = (): boolean => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    if (roleParam === 'TEACHER' || roleParam === 'ADMIN') return true;
    if (navState?.registeredRole === 'TEACHER' || navState?.registeredRole === 'ADMIN') return true;
    if (location.pathname === '/teacher-login') return true;
    return false;
  };

  const [activeRoleTab, setActiveRoleTab] = useState<'STUDENT' | 'TEACHER'>(() => {
    return isTeacherTarget() ? 'TEACHER' : 'STUDENT';
  });
  const [email, setEmail] = useState(() => {
    if (navState?.registeredEmail) return navState.registeredEmail;
    return '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  const [successMessage, setSuccessMessage] = useState(() => {
    if (navState?.justRegistered) {
      return t('registrationSuccess');
    }
    return '';
  });
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleTabChange = (role: 'STUDENT' | 'TEACHER') => {
    setActiveRoleTab(role);
    setError('');
    setSearchParams({ role: role.toLowerCase() });
  };

  React.useEffect(() => {
    // Ensure any previously saved credentials are permanently erased from browser storage
    localStorage.removeItem('vsa_saved_email');
    localStorage.removeItem('vsa_saved_password');
    localStorage.removeItem('vsa_save_password');

    if (isTeacherTarget()) {
      setActiveRoleTab('TEACHER');
    }
  }, [searchParams, navState, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError(t('validation.emailRequired'));
      return;
    }

    if (!isValidEmail(email)) {
      // Must not reveal whether email exists or not
      setError(t('invalidCredentials'));
      return;
    }

    if (!password) {
      setError(t('validation.passwordRequired'));
      return;
    }

    setLoading(true);

    try {
      const normalized = normalizeEmail(email);
      const loggedInUser = await login(normalized, password);
      // Clean any residual credentials in storage
      localStorage.removeItem('vsa_saved_email');
      localStorage.removeItem('vsa_saved_password');
      localStorage.removeItem('vsa_save_password');

      const isTeacherRole = loggedInUser?.role
        ? (loggedInUser.role === 'TEACHER' || loggedInUser.role === 'ADMIN')
        : activeRoleTab === 'TEACHER';
      navigate(isTeacherRole ? '/teacher-dashboard' : '/dashboard');
    } catch (err: any) {
      const errData = err.response?.data;
      const status = err.response?.status;

      if (status === 401 || status === 403) {
        // Strict requirement: NEVER show "Email already exists" on login!
        setError(t('invalidCredentials'));
      } else {
        const rawErr = errData?.error;
        if (rawErr && rawErr.toLowerCase().includes('already exists')) {
          setError(t('invalidCredentials'));
        } else {
          setError(rawErr || t('invalidCredentials'));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !isValidEmail(forgotEmail)) {
      setError(t('validation.emailInvalid'));
      return;
    }
    setForgotLoading(true);
    setForgotMessage('');
    try {
      await api.post('/auth/forgot-password', { email: normalizeEmail(forgotEmail) });
      setForgotMessage(t('passwordResetSent'));
    } catch (err: any) {
      setForgotMessage(t('passwordResetSent'));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-y-auto overflow-x-hidden py-12">
      {/* Top Controls (Theme Toggle & Language Switcher) */}
      <div className="absolute top-6 right-6 flex items-center space-x-2 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-amber-500 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/70 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          title={theme === 'white' ? 'Switch to Dark Mode' : 'Switch to White Theme'}
        >
          {theme === 'white' ? (
            <Sun className="w-4 h-4 text-amber-500 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-blue-400 hover:-rotate-12 transition-transform" />
          )}
        </button>

        <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/70 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
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
            <option value="hi" className="bg-slate-900 text-slate-100">🌐 हिन्दी</option>
          </select>
        </div>
      </div>

      {/* Background Image with Cinematic Overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/login-bg.jpg"
          alt="VM જ્ઞાન સેતુ - લાઇબ્રેરી અને ડિજિટલ હબ"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 auth-bg-overlay" />
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl z-10 space-y-6">
        <div className="text-center">
          {/* School Logo */}
          <div className="flex justify-center mb-3">
            <img
              src="/school-logo.png"
              alt="School Logo"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl"
            />
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
            {t('step2Badge')}
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

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t('password')}
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotPasswordModal(true);
                  setForgotMessage('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium cursor-pointer"
              >
                {t('forgotPassword')}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {(email || password) && (
            <div className="flex justify-end text-xs pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('');
                  setPassword('');
                }}
                className="text-slate-400 hover:text-red-400 text-xs transition-colors cursor-pointer"
              >
                {tr('સાફ કરો', 'Clear')}
              </button>
            </div>
          )}

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

        <p className="text-center text-xs text-slate-400 pt-2">
          {t('noAccount')}{' '}
          <Link
            to={activeRoleTab === 'TEACHER' ? '/register?role=teacher' : '/register'}
            state={{ role: activeRoleTab }}
            className="text-blue-400 hover:underline font-semibold"
          >
            {t('registerHere')}
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{t('resetPasswordTitle')}</h2>
              <p className="text-xs text-slate-400 mt-1">{t('resetPasswordSubtitle')}</p>
            </div>

            {forgotMessage ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{forgotMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-all"
                  >
                    {t('backToLogin')}
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>{forgotLoading ? t('common:saving') : t('sendResetLink')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
