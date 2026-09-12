import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  FileCheck2,
  AlertTriangle,
  BarChart3,
  Bot,
  User,
  ShieldCheck,
  GraduationCap,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation('common');

  const isTeacher = user?.role === 'ADMIN';

  const navItems = isTeacher
    ? [
        { name: t('nav.teacherDashboard'), path: '/teacher-dashboard', icon: ShieldCheck },
        { name: t('nav.profile'), path: '/profile', icon: User },
      ]
    : [
        { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { name: t('nav.subjects'), path: '/subjects', icon: BookOpen },
        { name: t('nav.studyPlan'), path: '/study-plan', icon: CalendarCheck },
        { name: t('nav.tests'), path: '/tests', icon: FileCheck2 },
        { name: t('nav.mistakeBook'), path: '/mistake-book', icon: AlertTriangle },
        { name: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
        { name: t('nav.aiAssistant'), path: '/ai-assistant', icon: Bot },
        { name: t('nav.profile'), path: '/profile', icon: User },
      ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 md:z-30 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-white tracking-wide text-base leading-tight">{t('appName')}</h1>
                <p className="text-xs text-blue-400 font-medium">{t('tagline')}</p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg md:hidden hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose?.()}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 capitalize">{isTeacher ? t('roles.teacher') : t('roles.student')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title={t('nav.logout')}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  </>
  );
};
