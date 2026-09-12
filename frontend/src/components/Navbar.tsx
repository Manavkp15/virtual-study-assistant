import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { NotificationItem } from '../types';
import { Flame, Bell, Globe, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['common', 'notifications']);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>(i18n.language || 'en');

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

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3 truncate">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl md:hidden transition-colors shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate">
          {t('welcomeBack')}, <span className="text-blue-400">{user?.name}</span> 👋
        </h2>
        <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider shrink-0">
          {user?.role === 'ADMIN' ? t('teacherMode') : t('studentMode')}
        </span>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        {/* Language Selector Dropdown */}
        <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/70 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
          <Globe className="w-4 h-4 text-blue-400" />
          <select
            value={currentLang}
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-bold"
          >
            <option value="en" className="bg-slate-900 text-slate-100">🌐 English</option>
            <option value="gu" className="bg-slate-900 text-slate-100">🌐 ગુજરાતી</option>
          </select>
        </div>

        {/* Standard Badge */}
        {user?.role === 'STUDENT' && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs">
            <span>📚 {user?.profile?.standard ? t(`standards.${user.profile.standard.toLowerCase().replace(' ', '')}`, user.profile.standard) : t('standards.standard8')}</span>
          </div>
        )}

        {/* Streak Badge */}
        {user?.role === 'STUDENT' && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs shadow-sm">
            <Flame className="w-4 h-4 fill-amber-400 animate-pulse" />
            <span>{user?.profile?.streakCount || 1} {t('streak')}</span>
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900">
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
                    className="text-xs text-blue-400 hover:underline"
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
      </div>
    </header>
  );
};
