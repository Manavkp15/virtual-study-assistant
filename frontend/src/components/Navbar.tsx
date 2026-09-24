import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { NotificationItem } from '../types';
import { Flame, Bell, Globe, Menu, Sun, Moon, Sparkles, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { tr } from '../utils/tr';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isDesktopCollapsed?: boolean;
  activeRoleView?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  onSwitchRoleView?: (role: 'STUDENT' | 'TEACHER' | 'ADMIN') => void;
  externalNotificationsTrigger?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activeRoleView,
  onSwitchRoleView,
  externalNotificationsTrigger
}) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['common', 'notifications']);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>(i18n.language || 'en');

  // Effective role
  const effectiveRole: 'STUDENT' | 'TEACHER' | 'ADMIN' =
    user?.role === 'STUDENT'
      ? 'STUDENT'
      : user?.role === 'TEACHER'
      ? 'TEACHER'
      : activeRoleView || 'ADMIN';

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications || []);
      } catch (err) {
        // silent fallback
      }
    };
    fetchNotifs();
  }, []);

  // External trigger to open notification popover from sidebar
  useEffect(() => {
    if (externalNotificationsTrigger && externalNotificationsTrigger > 0) {
      setShowNotifs(true);
    }
  }, [externalNotificationsTrigger]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    setCurrentLang(lang);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  // Determine current Page Title dynamically
  const getPageTitle = (): string => {
    const path = location.pathname;
    if (path === '/dashboard') {
      return tr('વિદ્યાર્થી ડેશબોર્ડ', 'Student Dashboard', 'विद्यार्थी डैशबोर्ड');
    }
    if (path === '/teacher-dashboard' || path === '/admin') {
      const tab = new URLSearchParams(location.search).get('tab');
      if (tab === 'students') return tr('વિદ્યાર્થી યાદી', 'Student Roster', 'विद्यार्थी सूची');
      if (tab === 'teachers') return tr('શિક્ષકો યાદી', 'Teachers', 'शिक्षक सूची');
      if (tab === 'subjects') return tr('વિષયો અને સંપાદન', 'Subjects & Edit', 'विषय और संपादन');
      if (tab === 'chapters') return tr('અધ્યાયો', 'Chapters', 'अध्याय');
      if (tab === 'topics') return tr('મુદ્દાઓ', 'Topics', 'टॉपिक');
      if (tab === 'users') return tr('વપરાશકર્તાઓ', 'Users', 'उपयोगकर्ता');
      return effectiveRole === 'ADMIN'
        ? tr('એડમિન ડેશબોર્ડ', 'Admin Dashboard', 'एडमिन डैशबोर्ड')
        : tr('શિક્ષક ડેશબોર્ડ', 'Teacher Dashboard', 'शिक्षक डैशबोर्ड');
    }
    if (path.startsWith('/study-materials') || path.startsWith('/teacher/materials')) {
      return tr('અભ્યાસ સાહિત્ય', 'Study Materials', 'अध्ययन सामग्री');
    }
    if (path.startsWith('/tests')) {
      return tr('પરીક્ષાઓ અને ટેસ્ટ', 'Tests & Exams', 'परीक्षाएं और अभ्यास');
    }
    if (path.startsWith('/homework') || path.startsWith('/teacher/homework')) {
      return tr('ગૃહકાર્ય સંચાલન', 'Homework Management', 'गृहकार्य प्रबंधन');
    }
    if (path.startsWith('/mistake') || path.startsWith('/doubt')) {
      return tr('શંકા નિવારણ કેન્દ્ર', 'Doubt Center', 'संदेह निवारण केंद्र');
    }
    if (path.startsWith('/study-plan')) {
      return tr('અભ્યાસ યોજના', 'Study Plan', 'अध्ययन योजना');
    }
    if (path.startsWith('/analytics')) {
      return tr('પ્રદર્શન અને વિશ્લેષણ', 'Performance & Analytics', 'प्रदर्शन और विश्लेषण');
    }
    if (path.startsWith('/video-lectures') || path.startsWith('/teacher/video-lectures')) {
      return tr('વિડિઓ લેક્ચર્સ', 'Video Lectures', 'वीडियो लेक्चर्स');
    }
    if (path.startsWith('/ai-assistant')) {
      return tr('AI અભ્યાસ મદદગાર', 'AI Assistant', 'एआई अध्ययन सहायक');
    }
    if (path.startsWith('/text-to-speech') || path.startsWith('/pdf-reader')) {
      return tr('PDF અવાજ વાચક', 'PDF Voice Reader', 'PDF वॉइस रीडर');
    }
    if (path.startsWith('/profile')) {
      return tr('પ્રોફાઇલ અને સેટિંગ્સ', 'Profile & Settings', 'मेरी प्रोफ़ाइल और सेटिंग्स');
    }
    if (path.startsWith('/subjects')) {
      return tr('મારા વિષયો', 'My Subjects', 'मेरे विषय');
    }
    return tr('વર્ચ્યુઅલ અભ્યાસ પ્લેટફોર્મ', 'Virtual Study Platform', 'वर्चुअल स्टडी प्लेटफॉर्म');
  };

  const pageTitle = getPageTitle();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-all select-none">
      {/* ========================================================================= */}
      {/* Left: [ ☰ Hamburger ] [ School Logo ] [ Page Title ]                      */}
      {/* On Mobile: [ ☰ Hamburger ] [ School Logo ]                                */}
      {/* ========================================================================= */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
        {/* Universal Accessible Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 active:scale-95 rounded-xl border border-slate-700/60 transition-all shrink-0 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          aria-label={tr('નેવિગેશન મેનૂ ખોલો/બંધ કરો', 'Toggle navigation menu', 'नेविगेशन मेनू टॉगल करें')}
          title={tr('મેનૂ (☰)', 'Navigation Menu (☰)', 'नेविगेशन मेनू (☰)')}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* School Logo */}
        <Link to="/" className="shrink-0 flex items-center" title={t('appName')}>
          <img
            src="/school-logo.png"
            alt="School Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 drop-shadow-md hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Dynamic Page Title (Visible on Desktop & Tablet, hidden on small mobile) */}
        <div className="hidden md:flex items-center space-x-2.5 pl-1 truncate">
          <span className="text-slate-600">/</span>
          <h1 className="text-sm sm:text-base font-bold text-slate-100 truncate tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Right Controls: Role Badge, Language, Theme, Notifications, Profile       */}
      {/* ========================================================================= */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Admin Perspective Toggle (Only visible if logged in user is ADMIN) */}
        {user?.role === 'ADMIN' && onSwitchRoleView && (
          <div className="hidden lg:flex items-center bg-slate-800/80 border border-slate-700/70 p-1 rounded-xl text-xs font-semibold shadow-sm">
            <span className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{tr('મોડ', 'Mode', 'मोड')}:</span>
            </span>
            <button
              type="button"
              onClick={() => onSwitchRoleView('ADMIN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                effectiveRole === 'ADMIN'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => onSwitchRoleView('TEACHER')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                effectiveRole === 'TEACHER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Teacher
            </button>
          </div>
        )}

        {/* Language Selector Dropdown */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700/70 px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
          <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <select
            value={currentLang}
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-bold text-xs"
            aria-label="Select Language"
          >
            <option value="en" className="bg-slate-900 text-slate-100">English</option>
            <option value="gu" className="bg-slate-900 text-slate-100">ગુજરાતી</option>
            <option value="hi" className="bg-slate-900 text-slate-100">हिन्दी</option>
          </select>
        </div>

        {/* Standard Badge (Student Only) */}
        {user?.role === 'STUDENT' && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs">
            <span>📚 {user?.profile?.standard ? t(`standards.${user.profile.standard.toLowerCase().replace(' ', '')}`, user.profile.standard) : t('standards.standard8')}</span>
          </div>
        )}

        {/* Streak Badge (Student Only) */}
        {user?.role === 'STUDENT' && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{user?.profile?.streakCount || 1} {t('streak')}</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-amber-500 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          title={theme === 'white' ? tr('ડાર્ક મોડમાં બદલો', 'Switch to Dark Mode', 'डार्क मोड में बदलें') : tr('વ્હાઇટ થીમમાં બદલો', 'Switch to White Theme', 'व्हाइट थीम में बदलें')}
          aria-label="Toggle Theme"
        >
          {theme === 'white' ? (
            <Sun className="w-4 h-4 text-amber-500 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-blue-400 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all relative cursor-pointer"
            aria-label={t('notifications')}
            title={t('notifications')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/90">
                <h3 className="font-semibold text-slate-200 text-sm">{t('notifications')}</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-400 hover:underline cursor-pointer"
                  >
                    {t('markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    {t('noNotifications')}
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-700/40 transition-colors ${
                        !n.isRead ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <p className="font-semibold text-xs text-slate-200">
                        {currentLang === 'gu' ? (n.titleGu || n.title) : n.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {currentLang === 'gu' ? (n.messageGu || n.message) : n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Link with Avatar */}
        <Link
          to="/profile"
          className="flex items-center space-x-2 pl-1 group cursor-pointer"
          title={`${user?.name} (${effectiveRole})`}
          aria-label="View Profile"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-xl object-cover border border-slate-700 group-hover:border-blue-500 transition-colors shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xs group-hover:bg-blue-500 transition-colors shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
};

