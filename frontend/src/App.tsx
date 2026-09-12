import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { SubjectsPage } from './pages/SubjectsPage';
import { StudyPlanPage } from './pages/StudyPlanPage';
import { TestsPage } from './pages/TestsPage';
import { TestTakingPage } from './pages/TestTakingPage';
import { TestResultPage } from './pages/TestResultPage';
import { MistakeBookPage } from './pages/MistakeBookPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedLayout: React.FC = () => {
  const { token, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setMobileMenuOpen(prev => !prev)} isSidebarOpen={mobileMenuOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Route guard for Teacher Dashboard
const TeacherRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <AdminDashboardPage />;
};

// Route guard for Student Dashboard
const StudentRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <Navigate to="/teacher-dashboard" replace />;
  }
  return <Dashboard />;
};

// Default home redirection guard
const IndexRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <Navigate to="/teacher-dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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

            {/* Student Specific Routes */}
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/study-plan" element={<StudyPlanPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/tests/:id/results" element={<TestResultPage />} />
            <Route path="/mistakes" element={<MistakeBookPage />} />
            <Route path="/mistake-book" element={<MistakeBookPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="*" element={<IndexRedirect />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
