import React, { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useParentMode } from '../context/ParentModeContext';
import { useTranslation } from 'react-i18next';
import { tr } from '../utils/tr';
import {
  LayoutDashboard,
  BookOpen,
  BookCheck,
  CalendarCheck,
  FileCheck2,
  AlertTriangle,
  BarChart3,
  Bot,
  User,
  ShieldCheck,
  GraduationCap,
  LogOut,
  X,
  FileText,
  ClipboardCheck,
  Library,
  Video,
  Users,
  Bookmark,
  Tag,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Headphones,
  Timer,
  CheckSquare,
  FileCheck,
  BookA,
  FileQuestion,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  isDesktopCollapsed: boolean;
  onToggleDesktopCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activeRoleView?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  onSwitchRoleView?: (role: 'STUDENT' | 'TEACHER' | 'ADMIN') => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

interface MenuItem {
  name: string;
  path?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  onClick?: () => void;
  isExact?: boolean;
}

interface MenuGroup {
  title?: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isDesktopCollapsed,
  onToggleDesktopCollapse,
  isMobileOpen,
  onCloseMobile,
  activeRoleView,
  onSwitchRoleView,
  onOpenNotifications,
  unreadCount = 0
}) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const { isParentMode, exitParentMode } = useParentMode();

  // Effective role: strictly obeys user.role unless user is an ADMIN who switched perspective,
  // or if student user has activated PARENT mode!
  const effectiveRole: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT' =
    isParentMode && user?.role === 'STUDENT'
      ? 'PARENT'
      : user?.role === 'STUDENT'
      ? 'STUDENT'
      : user?.role === 'TEACHER'
      ? 'TEACHER'
      : (user?.role as any) === 'PARENT'
      ? 'PARENT'
      : activeRoleView || 'ADMIN';

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Helper to check active state including query params for tabs
  const checkIsActive = (itemPath?: string) => {
    if (!itemPath) return false;
    const [pathPart, queryPart] = itemPath.split('?');
    if (queryPart) {
      return location.pathname === pathPart && location.search.includes(queryPart);
    }
    if (location.pathname === pathPart) {
      if (pathPart === '/teacher-dashboard' && location.search && location.search.includes('tab=')) {
        return false;
      }
      return true;
    }
    return false;
  };

  const getNavGroups = (): MenuGroup[] => {
    if (effectiveRole === 'PARENT') {
      return [
        {
          title: tr('વાલી પોર્ટલ', 'Parent Portal', 'अभिभावक पोर्टल'),
          items: [
            { name: tr('સમગ્ર પ્રગતિ & રિપોર્ટ', 'Overview & Report Card', 'समग्र प्रगति & रिपोर्ट'), path: '/parent-dashboard', icon: LayoutDashboard },
            { name: tr('ગૃહકાર્ય અને ચકાસણી', 'Homework & Verification', 'गृहकार्य और जाँच'), path: '/parent/homework', icon: ClipboardCheck },
            { name: tr('પરીક્ષા પરિણામો', 'Tests & Exam Results', 'परीक्षा परिणाम'), path: '/parent-dashboard?tab=tests', icon: FileCheck2 },
            { name: tr('અભ્યાસ સમય & ટેવો', 'Study Habits & Time', 'अध्ययन समय और आदतें'), path: '/parent-dashboard?tab=habits', icon: Timer },
            { name: tr('અભ્યાસ સાહિત્ય', 'Study Materials', 'अध्ययन सामग्री'), path: '/study-materials', icon: Library },
            { name: tr('વિડિઓ લેક્ચર્સ', 'Video Lectures', 'वीडियो लेक्चर्स'), path: '/video-lectures', icon: Video },
            { name: tr('વાલી નિયંત્રણ અને પિન', 'Parent Controls & PIN', 'अभिभावक नियंत्रण और पिन'), path: '/parent-dashboard?tab=settings', icon: ShieldCheck },
          ]
        },
        {
          title: tr('મોડ સ્વિચ', 'Mode Switch', 'मोड स्विच'),
          items: [
            {
              name: tr('વિદ્યાર્થી મોડ પર પાછા ફરો', 'Return to Student Mode', 'विद्यार्थी मोड पर वापस जाएं'),
              icon: LogOut,
              onClick: () => {
                exitParentMode();
                navigate('/dashboard');
              }
            }
          ]
        },
        {
          title: tr('ખાતું', 'Account', 'खाता'),
          items: [
            { name: tr('પ્રોફાઇલ', 'Profile', 'मेरी प्रोफ़ाइल'), path: '/profile', icon: User },
          ]
        }
      ];
    }

    if (effectiveRole === 'STUDENT') {
      return [
        {
          title: tr('મુખ્ય મેનૂ', 'Main Menu', 'मुख्य मेनू'),
          items: [
            { name: tr('ડેશબોર્ડ', 'Dashboard', 'डैशबोर्ड'), path: '/dashboard', icon: LayoutDashboard },

            { name: tr('NCERT પ્રમાણિત જ્ઞાનકોશ', 'NCERT Knowledge Base', 'एनसीईआरटी ज्ञानकोश'), path: '/ncert-knowledge', icon: BookCheck },
            { name: tr('અભ્યાસ સાહિત્ય', 'Study Materials', 'अध्ययन सामग्री'), path: '/study-materials', icon: Library },
            { name: tr('પરીક્ષાઓ / ટેસ્ટ', 'Tests / Exams', 'परीक्षाएं और अभ्यास'), path: '/tests', icon: FileCheck2 },
            { name: tr('ગૃહકાર્ય', 'Homework', 'गृहकार्य'), path: '/homework', icon: FileText },
            { name: tr('ભૂલ પુસ્તિકા', 'Mistake Book', 'मिस्टेक बुक'), path: '/mistake-book', icon: AlertTriangle },
            { name: tr('અભ્યાસ યોજના', 'Study Plan', 'अध्ययन योजना'), path: '/study-plan', icon: CalendarCheck },
            { name: tr('પ્રદર્શન / વિશ્લેષણ', 'Performance / Analytics', 'प्रदर्शन और विश्लेषण'), path: '/analytics', icon: BarChart3 },
          ]
        },
        {
          title: tr('શિક્ષણ સાધનો', 'Learning Tools', 'अध्ययन उपकरण'),
          items: [
            { name: tr('વિડિઓ લેક્ચર્સ', 'Video Lectures', 'वीडियो लेक्चर्स'), path: '/video-lectures', icon: Video },
            { name: tr('AI શબ્દકોશ', 'AI Dictionary', 'एआई शब्दकोश'), path: '/student/ai-dictionary', icon: BookA },
            { name: tr('AI મદદગાર', 'AI Assistant', 'एआई अध्ययन सहायक'), path: '/ai-assistant', icon: Bot },
            { name: tr('પગલાંવાર સોલ્વર', 'Step-by-Step Solver', 'स्टेप-बाय-स्टेप सॉल्वर'), path: '/step-by-step-solver', icon: Sparkles },
            { name: tr('PDF વૉઇસ રીડર & TTS', 'PDF Voice Reader & TTS', 'PDF वॉइस रीडर और TTS'), path: '/text-to-speech', icon: Headphones },
            { name: tr('પોમોડોરો ટાઈમર', 'Pomodoro Timer', 'पोमोडोरो टाइमર'), path: '/pomodoro', icon: Timer },
            { name: tr('વિષયો', 'Subjects', 'विषय'), path: '/subjects', icon: BookOpen }
          ]
        },
        {
          title: tr('ખાતું', 'Account', 'खाता'),
          items: [
            { name: tr('પ્રોફાઇલ', 'Profile', 'मेरी प्रोफ़ाइल'), path: '/profile', icon: User },
          ]
        }
      ];
    }

    if (effectiveRole === 'TEACHER') {
      return [
        {
          title: tr('શિક્ષક સંચાલન', 'Teacher Management', 'शिक्षक प्रबंधन'),
          items: [
            { name: tr('ડેશબોર્ડ', 'Dashboard', 'डैशबोर्ड'), path: '/teacher-dashboard', icon: LayoutDashboard },
            { name: tr('અભ્યાસ સાહિત્ય', 'Study Materials', 'अध्ययन सामग्री'), path: '/teacher/materials', icon: Library },
            { name: tr('ગૃહકાર્ય અને ચકાસણી', 'Homework & Checking', 'गृहकार्य और जाँच'), path: '/teacher/homework', icon: ClipboardCheck },
            { name: tr('વિદ્યાર્થી શંકાઓ', 'Student Doubts', 'विद्यार्थी संदेह'), path: '/mistake-book', icon: AlertTriangle },
            { name: tr('વિદ્યાર્થીઓ', 'Students', 'विद्यार्थी'), path: '/teacher-dashboard?tab=students', icon: GraduationCap },
            { name: tr('પ્રદર્શન / વિશ્લેષણ', 'Performance / Analytics', 'प्रदर्शन और विश्लेषण'), path: '/analytics', icon: BarChart3 },
            { name: tr('વિડિઓ લેક્ચર અપલોડ', 'Video Lectures', 'वीडियो लेक्चर्स'), path: '/teacher/video-lectures', icon: Video },
            { name: tr('પગલાંવાર સોલ્વર', 'Step-by-Step Solver', 'स्टेप-बाय-स्टेप सॉल्वर'), path: '/step-by-step-solver', icon: Sparkles }
          ]
        },
        {
          title: tr('ખાતું', 'Account', 'खाता'),
          items: [
            { name: tr('પ્રોફાઇલ', 'Profile', 'मेरी प्रोफ़ाइल'), path: '/profile', icon: User },
          ]
        }
      ];
    }

    // ADMIN MENU
    return [
      {
        title: tr('એડમિન કંટ્રોલ', 'Admin Control', 'एडमिन कंट्रोल'),
        items: [
          { name: tr('ડેશબોર્ડ', 'Dashboard', 'डैशबोर्ड'), path: '/teacher-dashboard', icon: ShieldCheck },
          { name: tr('વિદ્યાર્થીઓ', 'Students', 'विद्यार्थी'), path: '/teacher-dashboard?tab=students', icon: GraduationCap },
          { name: tr('શિક્ષકો', 'Teachers', 'शिक्षक'), path: '/teacher-dashboard?tab=teachers', icon: Users },
          { name: tr('વિષયો', 'Subjects', 'विषय'), path: '/teacher-dashboard?tab=subjects', icon: BookOpen },
          { name: tr('પ્રશ્ન બેંક', 'Question Bank', 'प्रश्न बैंक'), path: '/teacher-dashboard?tab=questions', icon: FileQuestion },
          { name: tr('પ્રકરણો', 'Chapters', 'અध्याय'), path: '/teacher-dashboard?tab=chapters', icon: Bookmark },
          { name: tr('મુદ્દાઓ', 'Topics', 'टॉपिक'), path: '/teacher-dashboard?tab=topics', icon: Tag },
          { name: tr('અભ્યાસ સાહિત્ય', 'Study Materials', 'अध्ययन सामग्री'), path: '/teacher/materials', icon: Library },
          { name: tr('ગૃહકાર્ય અને ચકાસણી', 'Homework & Checking', 'गृहकार्य और जाँच'), path: '/teacher/homework', icon: ClipboardCheck },
          { name: tr('ગૃહકાર્ય એનાલિટિક્સ', 'AI Homework Analytics', 'गृहकार्य एनालिटिक्स'), path: '/teacher-dashboard?tab=homework', icon: TrendingUp },
          { name: tr('વપરાશકર્તાઓ', 'Users', 'उपयोगकर्ता'), path: '/teacher-dashboard?tab=users', icon: UserCheck },
          { name: tr('એનાલિટિક્સ', 'Analytics', 'एनालिटिक्स'), path: '/analytics', icon: BarChart3 },
          { name: tr('પગલાંવાર સોલ્વર', 'Step-by-Step Solver', 'स्टेप-बाय-स्टेप सॉल्वर'), path: '/step-by-step-solver', icon: Sparkles }
        ]
      },
      {
        title: tr('ખાતું', 'Account', 'खाता'),
        items: [
            { name: tr('પ્રોફાઇલ', 'Profile', 'मेरी प्रोफ़ाइल'), path: '/profile', icon: User },
        ]
      }
    ];
  };

  const navGroups = getNavGroups().filter(group => group.items && group.items.length > 0);

  // Render navigation item helper
  const renderItem = (item: MenuItem, isCollapsed: boolean, isMobile: boolean) => {
    const Icon = item.icon;
    const active = checkIsActive(item.path);

    const handleClick = () => {
      if (item.onClick) {
        item.onClick();
      }
      if (isMobile) {
        onCloseMobile();
      }
    };

    const content = (
      <>
        <div className="relative flex items-center justify-center">
          <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} shrink-0 transition-transform duration-200 group-hover:scale-110`} />
          {item.badge !== undefined && (
            <span className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-slate-900 ${isCollapsed ? 'ring-2 ring-slate-900' : ''}`}>
              {item.badge}
            </span>
          )}
        </div>

        {!isCollapsed && (
          <span className="flex-1 truncate tracking-tight text-xs">{item.name}</span>
        )}

        {/* Collapsed Tooltip on Desktop */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
            {item.name}
            {item.badge !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px]">
                {item.badge}
              </span>
            )}
          </div>
        )}

        {/* Active glowing indicator for collapsed state */}
        {isCollapsed && active && (
          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
        )}
      </>
    );

    const commonClasses = `group relative flex items-center ${
      isCollapsed ? 'justify-center p-3 my-1' : 'space-x-3 px-3.5 py-2.5 my-0.5'
    } rounded-xl font-medium text-xs transition-all duration-150 ${
      active
        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
    }`;

    if (item.path) {
      return (
        <NavLink
          key={item.path + item.name}
          to={item.path}
          onClick={handleClick}
          title={isCollapsed ? item.name : undefined}
          aria-label={item.name}
          className={commonClasses}
        >
          {content}
        </NavLink>
      );
    }

    return (
      <button
        key={item.name}
        type="button"
        onClick={handleClick}
        title={isCollapsed ? item.name : undefined}
        aria-label={item.name}
        className={`${commonClasses} w-full text-left cursor-pointer`}
      >
        {content}
      </button>
    );
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE SLIDE-OUT DRAWER OVERLAY & ASIDE                                 */}
      {/* ========================================================================= */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <aside
        id="mobile-navigation-drawer"
        aria-label="Mobile Navigation"
        className={`fixed inset-y-0 left-0 w-72 sm:w-80 bg-slate-900 border-r border-slate-800 z-50 lg:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 truncate">
            <img
              src="/school-logo.png"
              alt="School Logo"
              className="w-8 h-8 object-contain shrink-0 drop-shadow-md"
            />
            <div className="truncate">
              <h2 className="font-bold text-white text-sm leading-tight truncate">{t('appName')}</h2>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
                {effectiveRole === 'ADMIN'
                  ? tr('એડમિન પેનલ', 'Admin Panel', 'एडमिन पैनल')
                  : effectiveRole === 'TEACHER'
                  ? tr('શિક્ષક પેનલ', 'Teacher Panel', 'शिक्षक पैनल')
                  : tr('વિદ્યાર્થી પોર્ટલ', 'Student Portal', 'विद्यार्थी पोर्टल')}
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Close navigation drawer"
            title={tr('નેવિગેશન બંધ કરો', 'Close Navigation', 'नेविगेशन बंद करें')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role View Switcher for Admins */}
        {user?.role === 'ADMIN' && onSwitchRoleView && (
          <div className="px-4 pt-3 pb-1 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
              <span>{tr('વ્યૂ મોડ બદલો', 'View Mode', 'व्यू मोड')}:</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase font-mono font-bold text-[10px]">
                {effectiveRole}
              </span>
            </div>
            <div className={`grid ${effectiveRole === 'ADMIN' ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60`}>
              {effectiveRole === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => onSwitchRoleView('ADMIN')}
                  className="py-1.5 px-2 rounded-lg text-xs font-bold transition-all bg-purple-600 text-white shadow-sm"
                >
                  {tr('એડમિન', 'Admin', 'एडमिन')}
                </button>
              )}
              <button
                type="button"
                onClick={() => onSwitchRoleView('TEACHER')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  effectiveRole === 'TEACHER'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tr('શિક્ષક', 'Teacher', 'शिक्षक')}
              </button>
            </div>
          </div>
        )}

        {/* Drawer Scrollable Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {group.title && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => renderItem(item, false, true))}
            </div>
          ))}
        </nav>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 shrink-0 space-y-2">
          {user?.role === 'STUDENT' && isParentMode && (
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-purple-300 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>{tr('વાલી મોડ સક્રિય', 'Parent Mode Active', 'अभिभावक मोड सक्रिय')}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCloseMobile();
                  exitParentMode();
                  navigate('/dashboard');
                }}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                {tr('બહાર નીકળો', 'Exit', 'बाहर निकलें')}
              </button>
            </div>
          )}
          <div className="flex items-center justify-between bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{effectiveRole.toLowerCase()}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onCloseMobile();
                logout();
              }}
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. DESKTOP COLLAPSIBLE SIDEBAR                                            */}
      {/* ========================================================================= */}
      <aside
        id="desktop-sidebar"
        aria-label="Desktop Navigation"
        className={`hidden lg:flex flex-col justify-between sticky top-0 h-screen bg-slate-900 border-r border-slate-800 z-30 transition-all duration-300 ease-in-out shrink-0 select-none ${
          isDesktopCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className={`h-16 flex items-center border-b border-slate-800 shrink-0 transition-all duration-300 ${
            isDesktopCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          }`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <img
                src="/school-logo.png"
                alt="School Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-md shrink-0"
              />
              {!isDesktopCollapsed && (
                <div className="truncate transition-opacity duration-200">
                  <h1 className="font-bold text-white text-sm leading-tight truncate">{t('appName')}</h1>
                  <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase truncate block">
                    {effectiveRole === 'ADMIN'
                      ? tr('એડમિન પેનલ', 'Admin Panel', 'एडमिन पैनल')
                      : effectiveRole === 'TEACHER'
                      ? tr('શિક્ષક પેનલ', 'Teacher Panel', 'शिक्षक पैनल')
                      : tr('વિદ્યાર્થી પોર્ટલ', 'Student Portal', 'विद्यार्थी पोर्टल')}
                  </span>
                </div>
              )}
            </div>

            {/* Direct Collapse/Expand Button on Desktop Header */}
            {!isDesktopCollapsed && (
              <button
                type="button"
                onClick={onToggleDesktopCollapse}
                className="flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title={tr('સાઇડબાર નાનું કરો', 'Collapse Sidebar', 'साइडबार संक्षिप्त करें')}
                aria-label={tr('સાઇડબાર નાનું કરો', 'Collapse Sidebar', 'साइडबार संक्षिप्त करें')}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Perspective Switcher for Admin on Desktop Expanded */}
          {!isDesktopCollapsed && user?.role === 'ADMIN' && onSwitchRoleView && (
            <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/50 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>{tr('વ્યૂ મોડ', 'View Mode', 'व्यू मोड')}</span>
                </span>
                <span className="px-2 py-0.2 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase font-mono font-bold text-[9px]">
                  {effectiveRole}
                </span>
              </div>
              <div className={`grid ${effectiveRole === 'ADMIN' ? 'grid-cols-2' : 'grid-cols-1'} gap-1 p-0.5 bg-slate-800/80 rounded-lg border border-slate-700/60`}>
                {effectiveRole === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => onSwitchRoleView('ADMIN')}
                    className="py-1 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer bg-purple-600 text-white shadow-sm"
                  >
                    Admin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSwitchRoleView('TEACHER')}
                  className={`py-1 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    effectiveRole === 'TEACHER'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>
          )}

          {/* Desktop Navigation Links with custom scrollbar */}
          <nav className={`flex-1 overflow-y-auto space-y-4 py-3 ${
            isDesktopCollapsed ? 'px-2' : 'px-3'
          }`}>
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-0.5">
                {group.title && !isDesktopCollapsed && (
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {group.title}
                  </p>
                )}
                {group.title && isDesktopCollapsed && (
                  <div className="h-px bg-slate-800 mx-2 my-2" />
                )}
                {group.items.map((item) => renderItem(item, isDesktopCollapsed, false))}
              </div>
            ))}
          </nav>
        </div>

        {/* Desktop Footer (Profile & Logout) */}
        <div className={`border-t border-slate-800 bg-slate-900/90 shrink-0 ${
          isDesktopCollapsed ? 'p-2' : 'p-3'
        }`}>
          {isDesktopCollapsed ? (
            <div className="flex flex-col items-center space-y-2 py-1">
              <button
                type="button"
                onClick={onToggleDesktopCollapse}
                title={tr('સાઇડબાર મોટું કરો', 'Expand Sidebar', 'साइडबार विस्तृत करें')}
                aria-label={tr('સાઇડબાર મોટું કરો', 'Expand Sidebar', 'साइडबार विस्तृत करें')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
              >
                <PanelLeftOpen className="w-5 h-5 text-blue-400" />
              </button>

              {user?.role === 'STUDENT' && isParentMode && (
                <button
                  type="button"
                  onClick={() => {
                    exitParentMode();
                    navigate('/dashboard');
                  }}
                  title={tr('વાલી મોડમાંથી બહાર નીકળો', 'Exit Parent Mode', 'अभिभावक मोड से बाहर निकलें')}
                  className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}

              <NavLink
                to="/profile"
                title={`${user?.name || 'User'} (${effectiveRole})`}
                aria-label="Profile"
                className="relative group p-1"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user?.name || 'Avatar'}
                    className="w-9 h-9 rounded-xl object-cover border border-white/10 group-hover:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xs group-hover:bg-blue-500 transition-colors">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </NavLink>

              <button
                type="button"
                onClick={logout}
                title={t('nav.logout')}
                aria-label={t('nav.logout')}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              {user?.role === 'STUDENT' && isParentMode && (
                <div className="mb-2">
                  <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-1.5 text-purple-300 font-bold text-xs truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{tr('વાલી મોડ સક્રિય', 'Parent Mode Active', 'अभिभावक मोड सक्रिय')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        exitParentMode();
                        navigate('/dashboard');
                      }}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer shrink-0 ml-1"
                    >
                      {tr('બહાર નીકળો', 'Exit', 'बाहर निकलें')}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
              <NavLink to="/profile" className="flex items-center space-x-2.5 overflow-hidden group flex-1">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-9 h-9 rounded-lg object-cover border border-white/10 group-hover:border-blue-500 transition-colors shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shrink-0 group-hover:bg-blue-500 transition-colors">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{effectiveRole.toLowerCase()}</p>
                </div>
              </NavLink>
              <button
                type="button"
                onClick={logout}
                title={t('nav.logout')}
                aria-label={t('nav.logout')}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
