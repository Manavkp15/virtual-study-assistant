import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  ArrowRight,
  Sun,
  Moon,
  Globe,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import { isValidEmail, normalizeEmail } from '../utils/emailValidator';

export const VerifyEmailPage: React.FC = () => {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ALREADY_VERIFIED' | 'INVALID_OR_EXPIRED'>('LOADING');
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState(emailParam);

  useEffect(() => {
    if (!token) {
      setStatus('INVALID_OR_EXPIRED');
      return;
    }

    const performVerification = async () => {
      try {
        const query = new URLSearchParams();
        query.set('token', token);
        if (emailParam) query.set('email', emailParam);

        const res = await api.get(`/auth/verify-email?${query.toString()}`);
        if (res.data?.status === 'ALREADY_VERIFIED') {
          setStatus('ALREADY_VERIFIED');
        } else {
          setStatus('SUCCESS');
        }
        if (res.data?.email) {
          setVerifiedEmail(res.data.email);
        }
      } catch (err: any) {
        const errData = err.response?.data;
        if (errData?.status === 'ALREADY_VERIFIED') {
          setStatus('ALREADY_VERIFIED');
        } else {
          setStatus('INVALID_OR_EXPIRED');
        }
      }
    };

    performVerification();
  }, [token, emailParam]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendError('');
    setResendSuccess('');

    if (!resendEmail.trim() || !isValidEmail(resendEmail)) {
      setResendError(t('validation.emailInvalid'));
      return;
    }

    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email: normalizeEmail(resendEmail) });
      setResendSuccess(t('verificationSent'));
    } catch (err: any) {
      setResendError(err.response?.data?.error || t('common:error'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', {
      state: {
        registeredEmail: verifiedEmail || resendEmail
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-y-auto overflow-x-hidden py-12">
      {/* Top Controls */}
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

      {/* Background Graphic */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/login-bg.jpg"
          alt="VM જ્ઞાન સેતુ"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 auth-bg-overlay" />
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl z-10 space-y-6 text-center">
        {/* School Logo */}
        <div className="flex justify-center mb-2">
          <img
            src="/school-logo.png"
            alt="School Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl"
          />
        </div>

        {/* LOADING STATE */}
        {status === 'LOADING' && (
          <div className="py-8 space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">{t('verifyingEmail')}</h2>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'SUCCESS' && (
          <div className="space-y-6 py-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {t('emailVerifiedSuccess')}
              </h1>
              {verifiedEmail && (
                <p className="text-xs text-slate-400 font-mono">{verifiedEmail}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleGoToLogin}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{t('goToLogin')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ALREADY VERIFIED STATE */}
        {status === 'ALREADY_VERIFIED' && (
          <div className="space-y-6 py-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {t('emailAlreadyVerified')}
              </h1>
              {verifiedEmail && (
                <p className="text-xs text-slate-400 font-mono">{verifiedEmail}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleGoToLogin}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{t('goToLogin')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* INVALID OR EXPIRED STATE */}
        {status === 'INVALID_OR_EXPIRED' && (
          <div className="space-y-6 py-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {t('verificationLinkExpired')}
              </h1>
            </div>

            {resendSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-start space-x-2.5 text-left">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {resendError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-left">
                {resendError}
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resendLoading}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{resendLoading ? t('common:saving') : t('resendVerification')}</span>
                <Mail className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2">
              <Link to="/login" className="text-xs text-blue-400 hover:underline font-semibold">
                {t('backToLogin')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
