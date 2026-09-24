import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { Dashboard } from './pages/Dashboard';
import { SubjectsPage } from './pages/SubjectsPage';
import { StudyPlanPage } from './pages/StudyPlanPage';
import { TestsPage } from './pages/TestsPage';
import { TestTakingPage } from './pages/TestTakingPage';
import { TestResultPage } from './pages/TestResultPage';
import { MistakeBookPage } from './pages/MistakeBookPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { TextToSpeechPage } from './pages/TextToSpeechPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { HomeworkPage } from './pages/HomeworkPage';
import { TeacherHomeworkPage } from './pages/TeacherHomeworkPage';
import { StudyMaterialsPage } from './pages/StudyMaterialsPage';
import { TeacherStudyMaterialsPage } from './pages/TeacherStudyMaterialsPage';
import { VideoLecturesPage } from './pages/VideoLecturesPage';
import { TeacherVideoLecturesPage } from './pages/TeacherVideoLecturesPage';
import { FocusManager } from './components/FocusManager';

const ProtectedLayout: React.FC = () => {
  const { user, token, loading } = useAuth();
  
  // Desktop collapse state (persisted in localStorage)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('vsa_sidebar_collapsed') === 'true';
  });

  // Mobile drawer open state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Active role view for Admin perspective preview
  const [activeRoleView, setActiveRoleView] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>(() => {
    if (user?.role === 'STUDENT') return 'STUDENT';
    if (user?.role === 'TEACHER') return 'TEACHER';
    const saved = localStorage.getItem('vsa_active_role_view');
    if (saved === 'TEACHER' || saved === 'ADMIN') return saved;
    return 'ADMIN';
  });

  const [notificationsTrigger, setNotificationsTrigger] = useState(0);

  const handleToggleDesktopCollapse = () => {
    setIsDesktopCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('vsa_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      handleToggleDesktopCollapse();
    } else {
      setIsMobileDrawerOpen(prev => !prev);
    }
  };

  const handleSwitchRoleView = (role: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    setActiveRoleView(role);
    localStorage.setItem('vsa_active_role_view', role);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Sidebar with Desktop Sticky Collapsible & Mobile Slide-Out Drawer */}
      <Sidebar
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={handleToggleDesktopCollapse}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        activeRoleView={activeRoleView}
        onSwitchRoleView={handleSwitchRoleView}
        onOpenNotifications={() => setNotificationsTrigger(n => n + 1)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300">
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isMobileDrawerOpen}
          isDesktopCollapsed={isDesktopCollapsed}
          activeRoleView={activeRoleView}
          onSwitchRoleView={handleSwitchRoleView}
          externalNotificationsTrigger={notificationsTrigger}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Route guard for Teacher / Admin Dashboard
const TeacherRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN' && user?.role !== 'TEACHER') {
    return <Navigate to="/dashboard" replace />;
  }
  return <AdminDashboardPage />;
};

const RequireTeacher: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN' && user?.role !== 'TEACHER') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Route guard for Student Dashboard
const StudentRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN' || user?.role === 'TEACHER') {
    return <Navigate to="/teacher-dashboard" replace />;
  }
  return <Dashboard />;
};

// Default home redirection guard
const IndexRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN' || user?.role === 'TEACHER') {
    return <Navigate to="/teacher-dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <FocusManager />
          <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Full Screen Exam Mode Route */}
          <Route
            path="/tests/:id"
            element={
              <React.Suspense fallback={<div>Loading Test...</div>}>
                <TestTakingPage />
              </React.Suspense>
            }
          />

          {/* Protected Main Application Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<IndexRedirect />} />
            <Route path="/dashboard" element={<StudentRoute />} />
            <Route path="/teacher-dashboard" element={<TeacherRoute />} />
            <Route path="/admin" element={<TeacherRoute />} />

            {/* Video Lecture Routes */}
            <Route path="/video-lectures" element={<VideoLecturesPage />} />
            <Route path="/teacher/video-lectures" element={<RequireTeacher><TeacherVideoLecturesPage /></RequireTeacher>} />

            {/* Study Material Routes */}
            <Route path="/study-materials" element={<StudyMaterialsPage />} />
            <Route path="/teacher/materials" element={<RequireTeacher><TeacherStudyMaterialsPage /></RequireTeacher>} />
            <Route path="/teacher/study-materials" element={<RequireTeacher><TeacherStudyMaterialsPage /></RequireTeacher>} />

            {/* Homework Management Routes */}
            <Route path="/homework" element={<HomeworkPage />} />
            <Route path="/teacher/homework" element={<RequireTeacher><TeacherHomeworkPage /></RequireTeacher>} />

            {/* Student Specific Routes */}
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/study-plan" element={<StudyPlanPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/tests/:id/results" element={<TestResultPage />} />
            <Route path="/mistakes" element={<MistakeBookPage />} />
            <Route path="/mistake-book" element={<MistakeBookPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/text-to-speech" element={<TextToSpeechPage />} />
            <Route path="/pdf-reader" element={<TextToSpeechPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="*" element={<IndexRedirect />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
