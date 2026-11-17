import React, { useState } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, ArrowRight, Lock, Mail, User, ShieldCheck, BookOpen, Globe, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { tr } from '../utils/tr';
import { isValidEmail, normalizeEmail } from '../utils/emailValidator';
import { TEACHER_SUBJECTS } from '../utils/subjectConstants';

export const Register: React.FC = () => {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navState = location.state as { role?: string } | null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>(() => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    if (
      roleParam === 'TEACHER' ||
      roleParam === 'ADMIN' ||
      navState?.role === 'TEACHER' ||
      navState?.role === 'ADMIN' ||
      location.pathname === '/teacher-register'
    ) {
      return 'TEACHER';
    }
    return 'STUDENT';
  });
  const [standard, setStandard] = useState('Standard 8');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
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

    // REQUIREMENT: "Subjects You Teach" is required for teachers.
    // A teacher can select ONE or MULTIPLE subjects. The teacher MUST select at least one subject.
    // Validation: "Please select at least one subject." / "કૃપા કરીને ઓછામાં ઓછો એક વિષય પસંદ કરો."
    if (role === 'TEACHER' && selectedSubjects.length === 0) {
      setError(
        tr(
          'કૃપા કરીને ઓછામાં ઓછો એક વિષય પસંદ કરો.',
          'Please select at least one subject.',
          'कृपया कम से कम एक विषय चुनें।'
        )
      );
      return;
    }

    setLoading(true);

    try {
      const normalized = normalizeEmail(email);
      await register(normalized, password, name.trim(), role, standard, role === 'TEACHER' ? selectedSubjects : undefined);

      const isTeacher = role === 'TEACHER';
      // Account created successfully. Redirect to login (specifically teacher login if teacher registered)
      navigate(isTeacher ? '/login?role=teacher' : '/login?role=student', {
        state: {
          registeredEmail: normalized,
          registeredRole: role,
          justRegistered: true
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
          <h1 className="text-2xl font-bold text-white">
            {role === 'TEACHER' ? t('registerTeacherTitle') : t('registerTitle')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {role === 'TEACHER' ? t('registerTeacherSubtitle') : t('registerSubtitle')}
          </p>
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
                <span>{t('studentAccount')}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('TEACHER')}
                className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  role === 'TEACHER'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t('teacherAccount')}</span>
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

          {/* Multi-Select Subjects for Teacher Role */}
          {role === 'TEACHER' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>{tr('તમે ભણાવતા વિષયો', 'Subjects You Teach', 'आपके द्वारा पढ़ाए जाने वाले विषय')}</span>
                  <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  {selectedSubjects.length} {tr('પસંદ કરેલ', 'Selected', 'चयनित')}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mb-2.5">
                {tr(
                  'તમે એક અથવા વધુ વિષયો પસંદ કરી શકો છો. ઓછામાં ઓછો એક વિષય પસંદ કરવો ફરજિયાત છે.',
                  'You can select one or multiple subjects. At least one subject is required.',
                  'आप एक या कई विषय चुन सकते हैं। कम से कम एक विषय चुनना अनिवार्य है।'
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TEACHER_SUBJECTS.map((s) => {
                  const isChecked = selectedSubjects.includes(s.name);
                  return (
                    <label
                      key={s.name}
                      className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-950/40 border-purple-500 text-purple-100 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedSubjects(prev =>
                            prev.includes(s.name) ? prev.filter(x => x !== s.name) : [...prev, s.name]
                          );
                        }}
                        className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                      />
                      <span className="text-xs font-semibold">
                        {i18n.language === 'gu'
                          ? s.nameGu
                          : i18n.language === 'hi'
                          ? s.nameHi
                          : s.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 mt-2 ${
              role === 'TEACHER'
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            }`}
          >
            <span>
              {loading
                ? t('common:saving')
                : role === 'TEACHER'
                ? t('registerTeacherButton')
                : t('registerButton')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-2">
          {t('haveAccount')}{' '}
          <Link
            to={role === 'TEACHER' ? '/login?role=teacher' : '/login'}
            state={{ registeredRole: role }}
            className="text-blue-400 hover:underline font-semibold"
          >
            {t('loginHere')}
          </Link>
        </p>
      </div>
    </div>
  );
};
