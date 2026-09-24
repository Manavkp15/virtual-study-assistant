import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Download,
  Search,
  Filter,
  X,
  Eye,
  Award,
  MessageSquare,
  BarChart3,
  Calendar,
  Layers,
  BookOpen,
  User,
  ShieldCheck,
  RefreshCw,
  Save,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface SubmissionItem {
  id: string;
  homeworkId: string;
  homeworkTitle: string;
  homeworkTitleGu: string;
  standard: string;
  subjectName: string;
  subjectNameGu: string;
  chapterName?: string | null;
  topicName?: string | null;
  maxMarks: number;
  dueDate: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentStandard: string;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'CHECKED';
  submittedAt?: string;
  originalFileName: string;
  fileSizeBytes?: number;
  marksObtained?: number | null;
  teacherFeedback?: string | null;
  evaluatedAt?: string | null;
  submissionVersion: number;
  pdfUrl: string;
}

interface HomeworkAssignment {
  id: string;
  title: string;
  titleGu?: string;
  instructions?: string;
  instructionsGu?: string;
  standard: string;
  subjectId: string;
  subject: { id: string; name: string; nameGu?: string };
  chapterId?: string | null;
  chapter?: { id: string; name: string; nameGu?: string } | null;
  topicId?: string | null;
  topic?: { id: string; name: string; nameGu?: string } | null;
  dueDate: string;
  maxMarks: number;
  allowResubmission: boolean;
  assignedDate: string;
  submissions?: any[];
}

export const TeacherHomeworkPage: React.FC = () => {
  const { t, i18n } = useTranslation(['homework', 'common', 'admin']);
  const isGu = i18n.language === 'gu';

  const [activeTab, setActiveTab] = useState<'SUBMISSIONS' | 'ASSIGNMENTS' | 'CREATE' | 'ANALYTICS'>('SUBMISSIONS');
  const [loading, setLoading] = useState(true);

  // Overview metrics
  const [metrics, setMetrics] = useState<any>(null);

  // Submissions list & filters
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [standardFilter, setStandardFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Assignments list
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);

  // Reference data
  const [subjects, setSubjects] = useState<any[]>([]);

  // Create/Edit Form State
  const [title, setTitle] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [instructions, setInstructions] = useState('');
  const [instructionsGu, setInstructionsGu] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [standard, setStandard] = useState('Standard 8');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('20');
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [editingHomework, setEditingHomework] = useState<HomeworkAssignment | null>(null);

  // Evaluation Modal State
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<SubmissionItem | null>(null);
  const [evalMarks, setEvalMarks] = useState<string>('');
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [evalError, setEvalError] = useState('');
  const [evalSaving, setEvalSaving] = useState(false);
  const [evalPdfUrl, setEvalPdfUrl] = useState<string | null>(null);

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [i18n.language]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [overRes, subRes, subjRes] = await Promise.all([
        api.get('/homework/teacher/overview'),
        api.get('/homework/teacher/submissions'),
        api.get('/student/subjects')
      ]);

      setMetrics(overRes.data.metrics || null);
      setSubmissions(subRes.data.submissions || []);
      setSubjects(subjRes.data.subjects || []);

      // Also fetch detailed assignments
      fetchAssignments();
    } catch (err) {
      console.error('Failed to load teacher homework data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/homework/student');
      setAssignments(res.data.homeworks || []);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (standardFilter !== 'ALL' && s.standard !== standardFilter) return false;
    if (subjectFilter !== 'ALL' && s.subjectName !== subjectFilter) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.studentName.toLowerCase().includes(q);
      const matchEmail = s.studentEmail.toLowerCase().includes(q);
      const matchHw = s.homeworkTitle.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchHw) return false;
    }
    return true;
  });

  // Selected subject's chapters
  const activeSubjectObj = subjects.find((s) => s.id === subjectId);
  const availableChapters = activeSubjectObj?.chapters || [];
  const activeChapterObj = availableChapters.find((c: any) => c.id === chapterId);
  const availableTopics = activeChapterObj?.topics || [];

  // Reset Create Form
  const resetForm = () => {
    setTitle('');
    setTitleGu('');
    setInstructions('');
    setInstructionsGu('');
    setSubjectId('');
    setChapterId('');
    setTopicId('');
    setStandard('Standard 8');
    setDueDate('');
    setMaxMarks('20');
    setAllowResubmission(true);
    setEditingHomework(null);
  };

  // Create or Update Homework
  const handleSaveHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!title || !subjectId || !dueDate) {
      setErrorMsg('Title, Subject, and Due Date are required');
      return;
    }

    try {
      const payload = {
        title,
        titleGu,
        instructions,
        instructionsGu,
        subjectId,
        chapterId: chapterId || null,
        topicId: topicId || null,
        standard,
        dueDate,
        maxMarks: Number(maxMarks),
        allowResubmission
      };

      if (editingHomework) {
        await api.put(`/homework/${editingHomework.id}`, payload);
        setSuccessMsg(tr('ગૃહકાર્ય સફળતાપૂર્વક અપડેટ થયું!', 'Homework updated successfully!'));
      } else {
        await api.post('/homework', payload);
        setSuccessMsg(tr('નવું ગૃહકાર્ય સફળતાપૂર્વક સોંપાયું!', 'Homework created and assigned successfully!'));
      }

      resetForm();
      fetchInitialData();
      setActiveTab('ASSIGNMENTS');
    } catch (err: any) {
      console.error('Save homework error:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to save homework assignment');
    }
  };

  // Edit Assignment
  const handleStartEdit = (hw: HomeworkAssignment) => {
    setEditingHomework(hw);
    setTitle(hw.title);
    setTitleGu(hw.titleGu || '');
    setInstructions(hw.instructions || '');
    setInstructionsGu(hw.instructionsGu || '');
    setSubjectId(hw.subjectId);
    setChapterId(hw.chapterId || '');
    setTopicId(hw.topicId || '');
    setStandard(hw.standard);
    setDueDate(new Date(hw.dueDate).toISOString().slice(0, 16));
    setMaxMarks(String(hw.maxMarks));
    setAllowResubmission(hw.allowResubmission);
    setActiveTab('CREATE');
  };

  // Delete Assignment
  const handleDeleteHomework = async (id: string) => {
    if (!window.confirm(tr('શું તમે ખરેખર આ ગૃહકાર્ય કાઢી નાખવા માંગો છો?', 'Are you sure you want to delete this homework assignment?'))) {
      return;
    }

    try {
      await api.delete(`/homework/${id}`);
      setSuccessMsg(tr('ગૃહકાર્ય સફળતાપૂર્વક કાઢી નાખવામાં આવ્યું', 'Homework deleted successfully'));
      fetchInitialData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete homework');
    }
  };

  // Open Evaluation Modal
  const handleOpenEvaluate = async (sub: SubmissionItem) => {
    setEvaluatingSubmission(sub);
    setEvalMarks(sub.marksObtained !== null && sub.marksObtained !== undefined ? String(sub.marksObtained) : '');
    setEvalFeedback(sub.teacherFeedback || '');
    setEvalError('');
    setEvalPdfUrl(null);

    try {
      const res = await api.get(`/homework/submissions/${sub.id}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      setEvalPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Failed to load PDF preview:', err);
    }
  };

  const handleCloseEvaluate = () => {
    if (evalPdfUrl) {
      URL.revokeObjectURL(evalPdfUrl);
    }
    setEvaluatingSubmission(null);
    setEvalPdfUrl(null);
  };

  // Save Evaluation & Grade
  const handleSaveEvaluation = async (markAsChecked: boolean = true) => {
    if (!evaluatingSubmission) return;

    setEvalError('');
    const marksNum = Number(evalMarks);

    if (isNaN(marksNum) || marksNum < 0 || marksNum > evaluatingSubmission.maxMarks) {
      setEvalError(tr(`કૃપા કરીને 0 થી ${evaluatingSubmission.maxMarks} વચ્ચે માન્ય ગુણ દાખલ કરો`, `Please enter valid marks between 0 and ${evaluatingSubmission.maxMarks}`, `कृपया 0 से ${evaluatingSubmission.maxMarks} के बीच मान्य अंक दर्ज करें`));
      return;
    }

    setEvalSaving(true);
    try {
      await api.patch(`/homework/submissions/${evaluatingSubmission.id}/evaluate`, {
        marksObtained: marksNum,
        teacherFeedback: evalFeedback,
        status: markAsChecked ? 'CHECKED' : evaluatingSubmission.status
      });

      setSuccessMsg(t('evaluation.evaluatedSuccess'));
      handleCloseEvaluate();
      fetchInitialData();
    } catch (err: any) {
      console.error('Evaluation error:', err);
      setEvalError(err.response?.data?.error || 'Failed to save evaluation');
    } finally {
      setEvalSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isGu ? 'gu-IN' : (i18n.language === 'hi' ? 'hi-IN' : 'en-US'), {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t('status.CHECKED')}</span>
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Check className="w-3 h-3" />
            <span>{t('status.SUBMITTED')}</span>
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>{t('status.LATE')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <AlertCircle className="w-3 h-3" />
            <span>{t('status.PENDING')}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('common:teacherMode')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t('teacherTitle')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('teacherSubtitle')}</p>
        </div>
        <button
          onClick={fetchInitialData}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{tr('રિફ્રેશ કરો', 'Refresh')}</span>
        </button>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">{t('summary.totalAssigned')}</p>
            <p className="text-2xl font-bold text-white mt-1">{metrics.totalHomeworks}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-blue-400 font-medium">{t('summary.totalSubmissions')}</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{metrics.totalSubmissions}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-amber-400 font-medium">{t('summary.pendingReviews')}</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.pendingReviews}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-emerald-400 font-medium">{t('summary.checked')}</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.checkedCount}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-purple-400 font-medium">{t('summary.classAverage')}</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{metrics.averageClassMarks}%</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-indigo-400 font-medium">{t('summary.completionRate')}</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{metrics.completionPercentage}%</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('SUBMISSIONS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'SUBMISSIONS'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('tabs.submissions')}</span>
          {metrics && metrics.pendingReviews > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
              {metrics.pendingReviews}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ASSIGNMENTS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'ASSIGNMENTS'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('tabs.assignments')}</span>
        </button>

        <button
          onClick={() => {
            resetForm();
            setActiveTab('CREATE');
          }}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'CREATE'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{editingHomework ? t('actions.editHomework') : t('tabs.create')}</span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'ANALYTICS'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t('tabs.analytics')}</span>
        </button>
      </div>

      {/* TAB 1: SUBMISSIONS & CHECKING */}
      {activeTab === 'SUBMISSIONS' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('filters.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Standard Filter */}
              <select
                value={standardFilter}
                onChange={(e) => setStandardFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">{t('filters.allStandards')}</option>
                <option value="Standard 6">Standard 6</option>
                <option value="Standard 7">Standard 7</option>
                <option value="Standard 8">Standard 8</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">{t('filters.allStatuses')}</option>
                <option value="SUBMITTED">{t('status.SUBMITTED')}</option>
                <option value="LATE">{t('status.LATE')}</option>
                <option value="CHECKED">{t('status.CHECKED')}</option>
              </select>

              {(standardFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStandardFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                  title={t('actions.clearFilters')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">{t('empty.noSubmissions')}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {tr('વિદ્યાર્થીઓ તેમની PDF અપલોડ કરશે ત્યારે તે અહીં ચકાસણી માટે ઉપલબ્ધ થશે.', 'Student submissions will appear here for review and grading.', 'जब विद्यार्थी अपनी PDF अपलोड करेंगे तब वह यहाँ जाँच के लिए उपलब्ध होगी।')}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800 text-[10px]">
                      <th className="py-3.5 px-4">{t('fields.student')}</th>
                      <th className="py-3.5 px-4">{t('fields.title')}</th>
                      <th className="py-3.5 px-4">{t('fields.subject')}</th>
                      <th className="py-3.5 px-4">{t('fields.submittedDate')}</th>
                      <th className="py-3.5 px-4">{t('fields.status')}</th>
                      <th className="py-3.5 px-4">{t('fields.marksObtained')}</th>
                      <th className="py-3.5 px-4 text-right">{t('common:actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{sub.studentName}</div>
                          <div className="text-[11px] text-slate-400">{sub.studentStandard}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="font-semibold text-slate-100 truncate" title={sub.homeworkTitle}>
                            {trItem(sub.homeworkTitleGu, sub.homeworkTitle)}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{sub.originalFileName}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-300">
                            {trSubject({ name: sub.subjectName, nameGu: sub.subjectNameGu })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {sub.submittedAt ? formatDate(sub.submittedAt) : '—'}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(sub.status)}</td>
                        <td className="py-3.5 px-4">
                          {sub.marksObtained !== null && sub.marksObtained !== undefined ? (
                            <span className="font-bold text-emerald-400">
                              {sub.marksObtained} / {sub.maxMarks}
                            </span>
                          ) : (
                            <span className="text-slate-500">— / {sub.maxMarks}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenEvaluate(sub)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-blue-600/20"
                          >
                            {sub.status === 'CHECKED' ? t('actions.reEvaluate') : t('actions.evaluate')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Cards */}
              <div className="lg:hidden divide-y divide-slate-800">
                {filteredSubmissions.map((sub) => (
                  <div key={sub.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{sub.studentName}</h4>
                        <p className="text-xs text-slate-400">
                          {sub.studentStandard} • {trSubject({ name: sub.subjectName, nameGu: sub.subjectNameGu })}
                        </p>
                      </div>
                      <div>{getStatusBadge(sub.status)}</div>
                    </div>

                    <div className="bg-slate-800/40 p-2.5 rounded-xl text-xs space-y-1">
                      <p className="font-semibold text-slate-200 truncate">
                        {trItem(sub.homeworkTitleGu, sub.homeworkTitle)}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{sub.originalFileName}</p>
                      <div className="flex justify-between items-center pt-1 text-[11px] text-slate-400">
                        <span>{t('fields.submittedDate')}: {sub.submittedAt ? formatDate(sub.submittedAt) : '—'}</span>
                        <span className="font-bold text-emerald-400">
                          {sub.marksObtained !== null ? `${sub.marksObtained}/${sub.maxMarks}` : `—/${sub.maxMarks}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleOpenEvaluate(sub)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{sub.status === 'CHECKED' ? t('actions.reEvaluate') : t('actions.evaluate')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE ASSIGNMENTS */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">{t('tabs.assignments')}</h3>
            <button
              onClick={() => {
                resetForm();
                setActiveTab('CREATE');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('tabs.create')}</span>
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">{t('empty.noHomeworkAssigned')}</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {assignments.map((hw) => (
                <div
                  key={hw.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold text-xs">
                        {trSubject(hw.subject)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-semibold">
                        {hw.standard}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-base leading-snug">
                      {trItem(hw.titleGu, hw.title)}
                    </h4>

                    {hw.instructions && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {trItem(hw.instructionsGu, hw.instructions)}
                      </p>
                    )}

                    <div className="bg-slate-800/40 p-3 rounded-2xl text-xs space-y-1.5 border border-slate-800">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">{t('fields.dueDate')}:</span>
                        <span className="font-semibold">{formatDate(hw.dueDate)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">{t('fields.maxMarks')}:</span>
                        <span className="font-bold text-blue-400">{hw.maxMarks}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleStartEdit(hw)}
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title={t('actions.editHomework')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHomework(hw.id)}
                      className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title={t('actions.deleteHomework')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE / EDIT HOMEWORK */}
      {activeTab === 'CREATE' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {editingHomework ? t('actions.editHomework') : t('tabs.create')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {tr('વિદ્યાર્થીઓને અભ્યાસ માટે નવું ગૃહકાર્ય સોંપો અને નિયત તારીખ નિર્ધારિત કરો.', 'Assign new homework to students with guidelines, deadline, and maximum marks.', 'विद्यार्थियों को अध्ययन के लिए नया गृहकार्य आवंटित करें और अंतिम तिथि निर्धारित करें।')}
            </p>
          </div>

          <form onSubmit={handleSaveHomework} className="space-y-4">
            {/* Title English */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {t('fields.title')} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Linear Equations & Quadratic Polynomials Problem Set"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Title Gujarati */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {t('fields.titleGu')}
              </label>
              <input
                type="text"
                value={titleGu}
                onChange={(e) => setTitleGu(e.target.value)}
                placeholder="દા.ત. સુરેખ સમીકરણો અને બહુપદી પ્રશ્ન સેટ"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Subject & Standard Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('fields.subject')} *
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    setChapterId('');
                    setTopicId('');
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- {t('fields.subject')} --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {trSubject(s)} ({s.standard})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('fields.standard')} *
                </label>
                <select
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Standard 6">Standard 6</option>
                  <option value="Standard 7">Standard 7</option>
                  <option value="Standard 8">Standard 8</option>
                  <option value="ALL">All Standards</option>
                </select>
              </div>
            </div>

            {/* Chapter & Topic (Optional) */}
            {availableChapters.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {t('fields.chapter')}
                  </label>
                  <select
                    value={chapterId}
                    onChange={(e) => {
                      setChapterId(e.target.value);
                      setTopicId('');
                    }}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Optional Chapter --</option>
                    {availableChapters.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {trItem(c.nameGu, c.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {t('fields.topic')}
                  </label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    disabled={!chapterId}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">-- Optional Topic --</option>
                    {availableTopics.map((top: any) => (
                      <option key={top.id} value={top.id}>
                        {trItem(top.nameGu, top.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Instructions English */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {t('fields.instructions')}
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Specific directions, textbook page numbers, formatting requirements..."
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Instructions Gujarati */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {t('fields.instructionsGu')}
              </label>
              <textarea
                rows={2}
                value={instructionsGu}
                onChange={(e) => setInstructionsGu(e.target.value)}
                placeholder="પાઠ્યપુસ્તકના પાના નંબર, જરૂરી સૂચનાઓ..."
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Due Date & Max Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('fields.dueDate')} *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('fields.maxMarks')} *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Allow Re-submission Checkbox */}
            <div className="pt-2">
              <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-white select-none text-xs">
                <input
                  type="checkbox"
                  checked={allowResubmission}
                  onChange={(e) => setAllowResubmission(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <span className="font-semibold">{t('fields.allowResubmission')}</span>
              </label>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('ASSIGNMENTS');
                }}
                className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="submit"
                className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingHomework ? t('actions.saveChanges') : t('actions.createAssignment')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion Chart */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>{t('summary.completionRate')}</span>
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: t('status.SUBMITTED'), count: metrics?.checkedCount || 0, fill: '#10b981' },
                      { name: t('summary.pendingReviews'), count: metrics?.pendingReviews || 0, fill: '#f59e0b' },
                      { name: t('status.LATE'), count: metrics?.lateCount || 0, fill: '#ef4444' }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>{t('summary.classAverage')}</span>
              </h4>

              <div className="space-y-4 pt-2">
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">{t('summary.averageMarks')}:</span>
                  <span className="text-2xl font-black text-purple-400">{metrics?.averageClassMarks || 0}%</span>
                </div>

                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">{t('summary.totalSubmissions')}:</span>
                  <span className="text-2xl font-black text-blue-400">{metrics?.totalSubmissions || 0}</span>
                </div>

                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">{t('summary.pendingReviews')}:</span>
                  <span className="text-2xl font-black text-amber-400">{metrics?.pendingReviews || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER EVALUATION & CHECKING MODAL */}
      {evaluatingSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {t('evaluation.modalTitle')}: <span className="text-blue-400">{evaluatingSubmission.studentName}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {evaluatingSubmission.studentStandard} • {trItem(evaluatingSubmission.homeworkTitleGu, evaluatingSubmission.homeworkTitle)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {evalPdfUrl && (
                  <a
                    href={evalPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('viewer.openNewTab')}</span>
                  </a>
                )}
                <button
                  onClick={handleCloseEvaluate}
                  disabled={evalSaving}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Screen: PDF Viewer on Left/Top, Grading Form on Right/Bottom */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* PDF Viewer Pane */}
              <div className="flex-1 bg-slate-950 p-2 border-b lg:border-b-0 lg:border-r border-slate-800 relative flex items-center justify-center">
                {evalPdfUrl ? (
                  <iframe
                    src={evalPdfUrl}
                    title="Student PDF Homework"
                    className="w-full h-full rounded-2xl border border-slate-800"
                  />
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400">{t('viewer.loading')}</p>
                  </div>
                )}
              </div>

              {/* Grading Pane */}
              <div className="w-full lg:w-96 bg-slate-900 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
                <div className="space-y-5">
                  {/* Meta Summary */}
                  <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('fields.student')}:</span>
                      <span className="font-bold text-white">{evaluatingSubmission.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('fields.subject')}:</span>
                      <span className="font-semibold text-slate-200">
                        {trSubject({ name: evaluatingSubmission.subjectName, nameGu: evaluatingSubmission.subjectNameGu })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('fields.dueDate')}:</span>
                      <span className="text-slate-300">{formatDate(evaluatingSubmission.dueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('fields.submittedDate')}:</span>
                      <span className="text-slate-300">
                        {evaluatingSubmission.submittedAt ? formatDate(evaluatingSubmission.submittedAt) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-700/50">
                      <span className="text-slate-400">{t('fields.status')}:</span>
                      <span>{getStatusBadge(evaluatingSubmission.status)}</span>
                    </div>
                  </div>

                  {/* Marks Entry Field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {t('evaluation.enterMarks')} *
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min={0}
                        max={evaluatingSubmission.maxMarks}
                        step={0.5}
                        required
                        value={evalMarks}
                        onChange={(e) => setEvalMarks(e.target.value)}
                        placeholder="0.0"
                        className="w-32 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-lg font-black text-emerald-400 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-sm font-bold text-slate-400">
                        / {evaluatingSubmission.maxMarks} {tr('ગુણ', 'Marks')}
                      </span>
                    </div>
                  </div>

                  {/* Teacher Feedback Textarea */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {t('fields.teacherFeedback')}
                    </label>
                    <textarea
                      rows={4}
                      value={evalFeedback}
                      onChange={(e) => setEvalFeedback(e.target.value)}
                      placeholder={t('evaluation.feedbackPlaceholder')}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {evalError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{evalError}</span>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleSaveEvaluation(true)}
                    disabled={evalSaving || !evalMarks}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{evalSaving ? t('common:saving') : t('evaluation.markChecked')}</span>
                  </button>

                  <button
                    onClick={() => handleSaveEvaluation(false)}
                    disabled={evalSaving || !evalMarks}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('evaluation.saveEvaluation')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherHomeworkPage;
