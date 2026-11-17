import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { useParentMode } from '../context/ParentModeContext';
import { tr, trSubject, trItem } from '../utils/tr';
import { exportStudentAnalyticsExcel } from '../utils/excelExport';
import {
  Users,
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  BookOpen,
  FileText,
  AlertTriangle,
  Search,
  Eye,
  X,
  Bot,
  User,
  ShieldCheck,
  TrendingUp,
  Flame,
  Download,
  FileSpreadsheet,
  Target,
  Percent,
  LogOut,
  Settings,
  Sparkles,
  KeyRound,
  Check,
  HelpCircle,
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  Timer,
  AlertCircle
} from 'lucide-react';

interface ParentHomeworkItem {
  homeworkId: string;
  title: string;
  titleGu?: string;
  subject: string;
  subjectGu?: string;
  dueDate: string;
  maxMarks: number;
  status: string;
  submittedAt?: string | null;
  marksObtained?: number | null;
  aiScore?: number | null;
  isTeacherApproved: boolean;
  teacherFeedback?: string | null;
  aiFeedback?: string | null;
  submissionId?: string | null;
}

export const ParentDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation(['homework', 'common']);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isParentMode, exitParentMode, enterParentMode } = useParentMode();

  const currentTab = searchParams.get('tab') || 'overview';

  const [student, setStudent] = useState<any | null>(null);
  const [homeworks, setHomeworks] = useState<ParentHomeworkItem[]>([]);
  const [academicData, setAcademicData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search for homework
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Submission Detail Modal (Read-Only)
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Parent Settings Form State
  const [availableHours, setAvailableHours] = useState<number>(2.5);
  const [targetPercent, setTargetPercent] = useState<number>(85);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  useEffect(() => {
    // When visiting parent dashboard, ensure Parent Mode is marked active
    if (!isParentMode) {
      enterParentMode();
    }
    fetchParentData();
  }, [i18n.language]);

  const fetchParentData = async () => {
    setLoading(true);
    try {
      const [hwRes, overviewRes] = await Promise.all([
        api.get('/homework/parent/overview').catch(() => ({ data: { student: null, homeworks: [] } })),
        api.get('/student/parent-overview').catch(() => ({ data: null }))
      ]);

      const studentProfile = overviewRes.data?.student || hwRes.data?.student || null;
      setStudent(studentProfile);
      setHomeworks(hwRes.data?.homeworks || []);
      setAcademicData(overviewRes.data || null);

      if (studentProfile) {
        setAvailableHours(studentProfile.availableHoursPerDay || 2.5);
        setTargetPercent(studentProfile.targetPercentage || 85);
      }
    } catch (err) {
      console.error('Failed to load parent dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmissionDetails = async (subId: string) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/homework/submissions/${subId}/details`);
      setSelectedSubmission(res.data.submission);
    } catch (err) {
      console.error('Failed to load submission details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveAcademicSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(null);
    try {
      await api.put('/student/parent-settings', {
        studentId: student?.id,
        availableHoursPerDay: availableHours,
        targetPercentage: targetPercent
      });
      setSettingsSuccess(tr('વાલી સેટિંગ્સ સફળતાપૂર્વક સાચવવામાં આવ્યા!', 'Settings saved successfully!', 'सेटिंग्स सफलतापूर्वक सहेजी गईं!'));
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportExcel = () => {
    if (!academicData?.summary) return;
    exportStudentAnalyticsExcel({
      analytics: {
        overallScore: academicData.summary.overallScore || 0,
        averagePercentage: academicData.summary.averagePercentage || 0,
        accuracy: academicData.summary.accuracy || 0,
        testsCompleted: academicData.summary.testsCompleted || 0,
        totalTimeTakenSeconds: 0,
        avgTimePerQuestionSeconds: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalUnanswered: 0,
        correctToWrongRatio: 0,
        improvementRate: academicData.summary.improvementRate || 0,
        consistencyScore: academicData.summary.consistencyScore || 0,
        subjectPerformance: academicData.subjectPerformance || [],
        difficultyPerformance: [],
        recentTrends: []
      },
      prediction: academicData.prediction,
      weakTopics: academicData.weakTopics || [],
      recentTestResults: academicData.recentTests || [],
      studentProfile: student,
      lang: i18n.language || 'en'
    });
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(i18n.language === 'gu' ? 'gu-IN' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredHomeworks = homeworks.filter((hw) => {
    if (statusFilter !== 'ALL' && hw.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (hw.title || '').toLowerCase().includes(q);
      const matchSub = (hw.subject || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSub) return false;
    }
    return true;
  });

  // Homework calculations
  const totalHomework = homeworks.length;
  const submittedCount = homeworks.filter(h => h.status !== 'PENDING' && h.status !== 'LATE').length;
  const approvedCount = homeworks.filter(h => h.isTeacherApproved).length;
  const totalMarksEarned = homeworks.reduce((acc, h) => acc + (h.marksObtained || 0), 0);
  const totalMaxMarks = homeworks
    .filter(h => h.marksObtained !== null && h.marksObtained !== undefined)
    .reduce((acc, h) => acc + h.maxMarks, 0);

  const averageHwPercentage = totalMaxMarks > 0 ? Math.round((totalMarksEarned / totalMaxMarks) * 100) : 0;

  // Academic summary from backend
  const overallPercentage = academicData?.summary?.averagePercentage ?? averageHwPercentage;
  const testsCompleted = academicData?.summary?.testsCompleted ?? 0;
  const accuracy = academicData?.summary?.accuracy ?? 0;
  const streakCount = student?.streakCount ?? 1;

  // Dynamic AI guidance for parents
  const parentGuidanceMessage =
    academicData?.parentGuidance?.[i18n.language] ||
    academicData?.parentGuidance?.en ||
    tr(
      'તમારા બાળકના નિયમિત વાંચન અને હોમવર્ક પર વિશેષ ધ્યાન આપો. નબળા વિષયોમાં શિક્ષકની મદદ મેળવો.',
      'Regularly encourage your child to complete daily homework and revise weak concepts.',
      'अपने बच्चे के नियमित अध्ययन और गृहकार्य पर ध्यान दें। कमजोर विषयों में मदद करें।'
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">
            {tr('વાલી પોર્ટલ લોડ થઈ રહ્યું છે...', 'Loading Parent Monitoring Portal...', 'अभिभावक पोर्टल लोड हो रहा है...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER: STUDENT INFO & ACTIONS                              */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/50 border border-purple-500/30 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        {/* Accent Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>{tr('વાલી નિરીક્ષણ પોર્ટલ (Parent Mode)', 'Parent Monitoring Portal', 'अभिभावक निगरानी पोर्टल')}</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] border border-purple-500/30 font-bold lowercase">
              read-only
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>{student ? student.name : 'Student Profile'}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {student?.standard || 'Standard 8'} • {tr('વર્ગખંડ', 'Div', 'कक्षा')} {student?.division || 'A'}
            </span>
          </h1>

          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {tr(
              'તમારા બાળકના સોંપેલ ગૃહકાર્ય, મેળવેલ ગુણ, પરીક્ષા પરિણામો અને અભ્યાસના કલાકોનું સુરક્ષિત નિરીક્ષણ કરો.',
              'Safely monitor homework submissions, test scores, study consistency, and teacher remarks in real time.'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap relative z-10">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
            title={tr('વિદ્યાર્થી પ્રગતિ રિપોર્ટ ડાઉનલોડ કરો', 'Download Progress Report (Excel)', 'प्रगति रिपोर्ट डाउनलोड करें')}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{tr('રિપોર્ટ એક્સપોર્ટ', 'Export Report', 'रिपोर्ट एक्सपोर्ट')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              exitParentMode();
              navigate('/dashboard');
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{tr('વિદ્યાર્થી મોડ પર પાછા ફરો', 'Exit Parent Mode', 'विद्यार्थी मोड पर वापस')}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB NAVIGATION                                                         */}
      {/* ========================================================================= */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'overview' })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            currentTab === 'overview'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{tr('સમગ્ર પ્રગતિ & રિપોર્ટ', 'Overview & Report Card', 'समग्र प्रगति & रिपोर्ट')}</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'homework' })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            currentTab === 'homework'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>{tr('ગૃહકાર્ય અને ચકાસણી', 'Homework & Verification', 'गृहकार्य और जाँच')}</span>
          {totalHomework > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px]">
              {submittedCount}/{totalHomework}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'tests' })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            currentTab === 'tests'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>{tr('પરીક્ષા પરિણામો', 'Tests & Exam History', 'परीक्षा परिणाम')}</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'habits' })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            currentTab === 'habits'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>{tr('અભ્યાસ સમય & ટેવો', 'Study Habits & Goals', 'अध्ययन समय और आदतें')}</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'settings' })}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            currentTab === 'settings'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{tr('વાલી સેટિંગ્સ & લક્ષ્યાંક', 'Parent Settings & Goals', 'अभिभावक सेटिंग्स और लक्ष्य')}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT: OVERVIEW & REPORT CARD                                    */}
      {/* ========================================================================= */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {tr('સરેરાશ સ્કોર / ટકાવારી', 'Overall Percentage')}
              </span>
              <p className="text-2xl font-black text-purple-400 mt-1">
                {overallPercentage}%
              </p>
              <span className="text-[10px] text-slate-500">
                {overallPercentage >= 80 ? 'Grade A (ઉત્કૃષ્ટ)' : overallPercentage >= 60 ? 'Grade B (સારો)' : 'સુધારણાની જરૂર'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {tr('ગૃહકાર્ય પૂર્ણતા', 'Homework Completed')}
              </span>
              <p className="text-2xl font-black text-blue-400 mt-1">
                {submittedCount} / {totalHomework}
              </p>
              <span className="text-[10px] text-slate-500">
                {approvedCount} {tr('શિક્ષકે ચકાસ્યા', 'Approved by Teacher')}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {tr('ટેસ્ટ / પરીક્ષાઓ', 'Tests Completed')}
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {testsCompleted}
              </p>
              <span className="text-[10px] text-slate-500">
                {accuracy > 0 ? `${accuracy}% ${tr('ચોકસાઈ', 'Accuracy')}` : tr('સક્રિય તૈયારી', 'Active practice')}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {tr('દૈનિક નિયમિતતા', 'Study Streak')}
              </span>
              <div className="flex items-center space-x-1.5 mt-1">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                <p className="text-2xl font-black text-amber-400">{streakCount} {tr('દિવસ', 'Days')}</p>
              </div>
              <span className="text-[10px] text-slate-500">
                {tr('ધ્યેય:', 'Target:')} {availableHours} {tr('કલાક/દિવસ', 'hrs/day')}
              </span>
            </div>
          </div>

          {/* AI Parent Guidance Advisory */}
          <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>{tr('AI વાલી માર્ગદર્શન અને વિશ્લેષણ', 'AI Guidance for Parents', 'AI अभिभावक मार्गदर्शन')}</span>
            </div>
            <p className="text-sm font-semibold text-slate-200 leading-relaxed">
              "{parentGuidanceMessage}"
            </p>
          </div>

          {/* Subject Mastery Cards */}
          {academicData?.subjectPerformance && academicData.subjectPerformance.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>{tr('વિષયવાર ગુણ અને પ્રદર્શન', 'Subject-Wise Performance', 'विषयवार प्रदर्शन')}</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {academicData.subjectPerformance.map((subj: any) => {
                  const pct = Math.round(subj.averagePercentage || 0);
                  const color = pct >= 75 ? 'emerald' : pct >= 55 ? 'blue' : 'amber';
                  return (
                    <div key={subj.subjectId} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">
                          {trSubject(subj.subjectNameGu, subj.subjectName)}
                        </span>
                        <span className={`text-xs font-bold text-${color}-400`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>{tr('ટેસ્ટ:', 'Tests:')} {subj.testsAttempted || 0}</span>
                        <span>{tr('ચોકસાઈ:', 'Accuracy:')} {Math.round(subj.accuracy || 0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strong vs Weak Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>{tr('બાળકના મજબૂત વિષયો / મુદ્દાઓ', "Child's Strengths", 'मजबूत विषय')}</span>
              </div>
              <div className="space-y-2">
                {academicData?.strongTopics && academicData.strongTopics.length > 0 ? (
                  academicData.strongTopics.slice(0, 5).map((top: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="font-semibold text-slate-200 truncate">{trItem(top.topicNameGu, top.topicName)}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-[10px]">
                        ✓ {tr('નિપુણ', 'Mastered', 'निपुण')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-3">
                    {tr('વધુ ટેસ્ટ આપ્યા પછી વિશ્લેષણ દેખાશે.', 'Data will update as more tests are completed.')}
                  </p>
                )}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>{tr('વધારાના ધ્યાનની જરૂર વાળા મુદ્દાઓ', 'Areas Needing Attention', 'ध्यान देने योग्य बिंदु')}</span>
              </div>
              <div className="space-y-2">
                {academicData?.weakTopics && academicData.weakTopics.length > 0 ? (
                  academicData.weakTopics.slice(0, 5).map((top: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="font-semibold text-slate-200 truncate">{trItem(top.topicNameGu, top.topicName)}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold text-[10px]">
                        ⚠️ {tr('પુનરાવર્તન જરૂરી', 'Revise', 'दोहराएं')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-3">
                    {tr('કોઈ ગંભીર નબળાઈ જણાઈ નથી. બાળક સારું પ્રદર્શન કરી રહ્યું છે!', 'No major weak areas detected. Child is progressing smoothly!')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: HOMEWORK & VERIFICATION                                   */}
      {/* ========================================================================= */}
      {currentTab === 'homework' && (
        <div className="space-y-5">
          {/* Homework Summary Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {tr('કુલ સોંપેલ ગૃહકાર્ય', 'Total Homework')}
              </span>
              <p className="text-2xl font-black text-white mt-1">{totalHomework}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                {tr('સબમિટ થયેલ', 'Submitted')}
              </span>
              <p className="text-2xl font-black text-blue-400 mt-1">
                {submittedCount} / {totalHomework}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                {tr('શિક્ષકે ચકાસાયેલ', 'Teacher Approved')}
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                {tr('ગૃહકાર્ય સરેરાશ', 'Homework Average')}
              </span>
              <p className="text-2xl font-black text-purple-400 mt-1">{averageHwPercentage}%</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr('ગૃહકાર્ય અથવા વિષય શોધો...', 'Search homework title or subject...')}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">{tr('બધી સ્થિતિ', 'All Status')}</option>
              <option value="APPROVED">{tr('મંજૂર / ચકાસાયેલ (Approved)', 'Approved (Final)')}</option>
              <option value="SUBMITTED">{tr('ચકાસણી બાકી (Pending Review)', 'Pending Teacher Review')}</option>
              <option value="PENDING">{tr('બાકી (Not Submitted)', 'Pending / Not Submitted')}</option>
            </select>
          </div>

          {/* Homework Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">{tr('ગૃહકાર્ય શીર્ષક', 'Homework Title')}</th>
                    <th className="py-3.5 px-4">{tr('વિષય', 'Subject')}</th>
                    <th className="py-3.5 px-4">{tr('છેલ્લી તારીખ', 'Due Date')}</th>
                    <th className="py-3.5 px-4">{tr('સ્થિતિ', 'Status')}</th>
                    <th className="py-3.5 px-4">{tr('મેળવેલ ગુણ', 'Score')}</th>
                    <th className="py-3.5 px-4">{tr('શિક્ષક પ્રતિસાદ', 'Teacher Feedback')}</th>
                    <th className="py-3.5 px-4 text-right">{tr('ક્રિયા', 'Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredHomeworks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        {tr('કોઈ ગૃહકાર્ય મળ્યું નથી.', 'No homework found matching criteria.')}
                      </td>
                    </tr>
                  ) : (
                    filteredHomeworks.map((hw) => (
                      <tr key={hw.homeworkId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">
                          {trItem(hw.titleGu, hw.title)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-200">
                          {trSubject(hw.subjectGu, hw.subject)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {formatDate(hw.dueDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          {hw.isTeacherApproved ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                              ✓ {tr('મંજૂર', 'Approved')}
                            </span>
                          ) : hw.status === 'SUBMITTED' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                              {tr('ચકાસણી બાકી', 'Pending Review')}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[10px]">
                              {tr('સબમિટ નથી કર્યું', 'Not Submitted')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {hw.marksObtained !== null && hw.marksObtained !== undefined ? (
                            <span className="font-extrabold text-emerald-400">
                              {hw.marksObtained} / {hw.maxMarks}
                            </span>
                          ) : hw.aiScore !== null && hw.aiScore !== undefined ? (
                            <span className="font-semibold text-blue-400">
                              {hw.aiScore} / {hw.maxMarks} (AI)
                            </span>
                          ) : (
                            <span className="text-slate-500">— / {hw.maxMarks}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-[11px]">
                          {hw.teacherFeedback ? (
                            <span className="text-purple-300 font-medium">"{hw.teacherFeedback}"</span>
                          ) : hw.aiFeedback ? (
                            <span className="text-blue-300">"{hw.aiFeedback}"</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {hw.submissionId ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSubmissionDetails(hw.submissionId!)}
                              className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold rounded-xl text-xs flex items-center space-x-1 ml-auto border border-purple-500/30 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{tr('વિગતો જુઓ', 'View Details')}</span>
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: TESTS & EXAMS                                             */}
      {/* ========================================================================= */}
      {currentTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-purple-400" />
                <span>{tr('વિદ્યાર્થીની પરીક્ષાઓ અને પરિણામ ઇતિહાસ', 'Completed Tests & Exam Results History')}</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{tr('પરીક્ષાનું નામ', 'Test Title')}</th>
                    <th className="py-3 px-4">{tr('વિષય', 'Subject')}</th>
                    <th className="py-3 px-4">{tr('મેળવેલ ગુણ', 'Score')}</th>
                    <th className="py-3 px-4">{tr('ટકાવારી', 'Percentage')}</th>
                    <th className="py-3 px-4">{tr('ચોકસાઈ', 'Accuracy')}</th>
                    <th className="py-3 px-4">{tr('તારીખ', 'Date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {academicData?.recentTests && academicData.recentTests.length > 0 ? (
                    academicData.recentTests.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                          {trItem(t.testTitleGu, t.testTitle)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-300">
                          {trSubject(t.subjectNameGu, t.subjectName)}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-emerald-400">
                          {t.score} / {t.maxScore}
                        </td>
                        <td className="py-3 px-4 font-bold text-purple-300">
                          {Math.round(t.percentage)}%
                        </td>
                        <td className="py-3 px-4 text-blue-400">
                          {Math.round(t.accuracy)}%
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {formatDate(t.completedAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {tr('હજુ સુધી કોઈ ટેસ્ટ રેકોર્ડ મળ્યો નથી.', 'No test records found yet.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: STUDY HABITS & GOALS                                      */}
      {/* ========================================================================= */}
      {currentTab === 'habits' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
              <Timer className="w-5 h-5" />
              <h3>{tr('દૈનિક અભ્યાસ અને નિયમિતતા', 'Daily Study Consistency')}</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span>{tr('દૈનિક અભ્યાસ ધ્યેય:', 'Target Daily Hours:')}</span>
                <span className="font-extrabold text-white text-base">{availableHours} {tr('કલાક', 'Hours')}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span>{tr('પરીક્ષા ટકાવારી લક્ષ્યાંક:', 'Target Exam Score:')}</span>
                <span className="font-extrabold text-purple-400 text-base">{targetPercent}%</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span>{tr('સતત અભ્યાસ દિવસો (Streak):', 'Study Streak:')}</span>
                <span className="font-extrabold text-amber-400 text-base">{streakCount} {tr('દિવસ', 'Days')} 🔥</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <h3>{tr('વાલી સુરક્ષા નોંધ', 'Parental Protection & Safety')}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {tr(
                'આ પ્લેટફોર્મ સંપૂર્ણપણે જાહેરાત મુક્ત (Ad-Free) અને વિદ્યાર્થીઓ માટે સુરક્ષિત છે. તમામ અભ્યાસ સાહિત્ય GSEB / NCERT ધોરણ મુજબ શિક્ષકો દ્વારા પ્રમાણિત છે.',
                'This platform is 100% ad-free and safe for students. All learning materials are aligned with GSEB/NCERT curriculum and verified by school teachers.'
              )}
            </p>
            <div className="p-3.5 bg-blue-950/20 border border-blue-500/20 rounded-2xl text-xs text-blue-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 shrink-0 text-blue-400" />
              <span>{tr('AI અભ્યાસ મદદગાર દ્વારા બાળકના શિક્ષણ પર ૨૪/૭ સકારાત્મક માર્ગદર્શન મળે છે.', 'AI Study Assistant provides 24/7 educational support.')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB CONTENT: PARENT CONTROLS & PIN SETTINGS                            */}
      {/* ========================================================================= */}
      {currentTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Study Target Setting */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-base">
              <Target className="w-5 h-5" />
              <h3>{tr('બાળકના અભ્યાસ ધ્યેય સેટ કરો', 'Child Study Targets', 'अध्ययन लक्ष्य')}</h3>
            </div>

            <form onSubmit={handleSaveAcademicSettings} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {tr('દૈનિક અભ્યાસ સમય (કલાક/દિવસ):', 'Daily Study Target (Hours/Day):')}
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(parseFloat(e.target.value) || 2.5)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {tr('પરીક્ષા ટકાવારી લક્ષ્યાંક (%):', 'Target Exam Percentage (%):')}
                </label>
                <input
                  type="number"
                  min="40"
                  max="100"
                  value={targetPercent}
                  onChange={(e) => setTargetPercent(parseFloat(e.target.value) || 85)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-purple-500"
                />
              </div>

              {settingsSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? tr('સાચવી રહ્યું છે...', 'Saving...') : tr('ધ્યેય સાચવો', 'Save Targets')}
              </button>
            </form>
          </div>

          {/* Direct & Safe Supervision Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-base">
              <ShieldCheck className="w-5 h-5" />
              <h3>{tr('સીધો અને સુરક્ષિત પ્રવેશ (No PIN Required)', 'Direct & Seamless Access', 'सीधा और सुरक्षित पर्यवेक्षण')}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {tr(
                'વાલી મોડમાં કોઈપણ પિન વગર સીધો પ્રવેશ ઉપલબ્ધ છે. તમે બાળકના દૈનિક ગૃહકાર્ય, મેળવેલ ગુણ, પરીક્ષાઓ અને અભ્યાસના સમયનું કોઈપણ અવરોધ વગર સરળતાથી નિરીક્ષણ કરી શકો છો.',
                'Parent Mode is enabled with direct, instant access without requiring any PIN. You can monitor homework, test scores, and study habits with total ease.'
              )}
            </p>
            <div className="p-3.5 bg-purple-950/20 border border-purple-500/20 rounded-2xl text-xs text-purple-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 shrink-0 text-purple-400" />
              <span>{tr('અહીં સેટ કરેલા ધ્યેય વિદ્યાર્થી માટે AI દ્વારા અભ્યાસ યોજનાને વધુ સચોટ બનાવે છે.', 'Targets set here help personalize the AI study planner for your child.')}</span>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  exitParentMode();
                  navigate('/dashboard');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>{tr('વિદ્યાર્થી મોડ પર પાછા ફરો (Exit Parent Mode)', 'Exit to Student Mode', 'विद्यार्थी मोड पर वापस जाएं')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* READ-ONLY SUBMISSION DETAIL MODAL                                         */}
      {/* ========================================================================= */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  {selectedSubmission.homework?.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">{tr('મેળવેલ ગુણ:', 'Marks Scored:')}</span>
                <p className="text-2xl font-black text-emerald-400">
                  {selectedSubmission.isTeacherApproved
                    ? selectedSubmission.marksObtained
                    : selectedSubmission.aiScore}{' '}
                  / {selectedSubmission.homework?.maxMarks} Marks
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedSubmission.isTeacherApproved
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {selectedSubmission.isTeacherApproved ? tr('✓ શિક્ષકે મંજૂર કર્યું', 'Teacher Approved (Final)') : tr('ચકાસણી બાકી', 'Pending Teacher Review')}
              </span>
            </div>

            {selectedSubmission.teacherComment && (
              <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-2xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase">{tr('શિક્ષકની નોંધ:', "Teacher's Note:")}</span>
                <p className="text-purple-200">"{selectedSubmission.teacherComment}"</p>
              </div>
            )}

            {selectedSubmission.aiFeedback && (
              <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-2xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase">{tr('AI વિશ્લેષણ પ્રતિસાદ:', 'AI Learning Feedback:')}</span>
                <p className="text-blue-200">{selectedSubmission.aiFeedback}</p>
              </div>
            )}

            {/* Question Breakdown Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-300">{tr('પ્રશ્નવાર ગુણ:', 'Question-Wise Marks:')}</span>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">{tr('પ્રશ્ન', 'Question')}</th>
                      <th className="py-2 px-3">{tr('કુલ ગુણ', 'Max Marks')}</th>
                      <th className="py-2 px-3">{tr('આપેલ ગુણ', 'Marks Awarded')}</th>
                      <th className="py-2 px-3">{tr('સ્થિતિ', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(selectedSubmission.evaluations || []).map((ev: any) => (
                      <tr key={ev.id}>
                        <td className="py-2 px-3 text-white font-semibold">Q{ev.questionNumber}</td>
                        <td className="py-2 px-3">{ev.maxMarks}</td>
                        <td className="py-2 px-3 font-bold text-emerald-400">
                          {ev.teacherMarks ?? ev.aiMarks}
                        </td>
                        <td className="py-2 px-3 text-[11px] font-semibold text-slate-300">
                          {ev.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {tr('બંધ કરો', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboardPage;
