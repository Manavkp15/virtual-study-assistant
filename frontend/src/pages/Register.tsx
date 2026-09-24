import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, ArrowRight, Lock, Mail, User, ShieldCheck, BookOpen, Globe, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { tr } from '../utils/tr';
import { isValidEmail, normalizeEmail } from '../utils/emailValidator';

export const Register: React.FC = () => {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('STUDENT');
  const [standard, setStandard] = useState('Standard 8');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('validation.nameRequired'));
      return;
    }

    if (!email.trim()) {
      setError(t('validation.emailRequired'));
      return;
    }

    if (!isValidEmail(email)) {
      setError(t('validation.emailInvalid'));
      return;
    }

    if (!password) {
      setError(t('validation.passwordRequired'));
      return;
    }

    if (password.length < 8) {
      setError(t('validation.passwordMinLength'));
      return;
    }

    if (!confirmPassword) {
      setError(t('validation.confirmPasswordRequired'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('validation.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      const normalized = normalizeEmail(email);
      await register(normalized, password, name.trim(), role, standard);

      // Account created successfully. Redirect to login with verification instruction notice
      navigate('/login', {
        state: {
          registeredEmail: normalized,
          registeredRole: role,
          justRegistered: true,
          verificationNotice: true
        }
      });
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.data?.error?.includes('already exists')) {
        setError(t('accountAlreadyExists'));
      } else {
        setError(err.response?.data?.error || t('common:error'));
      }
    } finally {
      setLoading(false);
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
          src="/register-bg.jpg"
          alt="VM Digital Library & Classroom"
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
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
            {t('step1Badge')}
          </div>
          <h1 className="text-2xl font-bold text-white">{t('registerTitle')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('registerSubtitle')}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{t('fullName')}</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                name="name"
                id="register-name"
                autoComplete="name"
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
                name="email"
                id="register-email"
                autoComplete="off"
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
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="register-password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t('confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="register-confirm-password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {tr('એકાઉન્ટ પ્રકાર', 'Account Role')}
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
