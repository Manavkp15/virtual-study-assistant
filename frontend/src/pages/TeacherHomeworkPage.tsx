import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import { useAuth } from '../context/AuthContext';
import {
  getUserAssignedSubjects,
  formatUserSubjectsDisplay,
  getLocalizedSubjectName
} from '../utils/subjectConstants';
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
  Check,
  Sparkles,
  Bot,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Sliders,
  HelpCircle,
  Lock
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

interface RubricFormItem {
  criterion: string;
  marks: number;
}

interface QuestionFormItem {
  questionNumber: number;
  questionText: string;
  questionTextGu?: string;
  maxMarks: number;
  modelAnswer: string;
  modelAnswerGu?: string;
  alternativeAnswers: string;
  rubric: RubricFormItem[];
  keywords: string;
}

interface SubmissionItem {
  id: string;
  homeworkId: string;
  homeworkTitle: string;
  homeworkTitleGu: string;
  standard: string;
  division?: string;
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
  studentDivision?: string;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'CHECKED';
  reviewStatus: 'PENDING_AI' | 'AI_CHECKED' | 'PENDING_TEACHER_REVIEW' | 'APPROVED' | 'RECHECK_REQUESTED';
  submittedAt?: string;
  originalFileName: string;
  fileSizeBytes?: number;
  marksObtained?: number | null;
  aiScore?: number | null;
  aiConfidence?: string | null;
  isTeacherApproved: boolean;
  teacherComment?: string | null;
  teacherFeedback?: string | null;
  evaluatedAt?: string | null;
  submissionVersion: number;
  pageCount: number;
  needsTeacherReview: boolean;
  pdfUrl: string;
}

interface HomeworkAssignment {
  id: string;
  title: string;
  titleGu?: string;
  instructions?: string;
  instructionsGu?: string;
  standard: string;
  division?: string;
  language?: string;
  subjectId: string;
  subject: { id: string; name: string; nameGu?: string };
  chapterId?: string | null;
  chapter?: { id: string; name: string; nameGu?: string } | null;
  topicId?: string | null;
  topic?: { id: string; name: string; nameGu?: string } | null;
  dueDate: string;
  maxMarks: number;
  totalQuestions?: number;
  allowResubmission: boolean;
  assignedDate: string;
  questions?: any[];
}

export const TeacherHomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['homework', 'common', 'admin']);
  const isGu = i18n.language === 'gu';

  const [activeTab, setActiveTab] = useState<'SUBMISSIONS' | 'ASSIGNMENTS' | 'CREATE' | 'ANALYTICS'>('SUBMISSIONS');
  const [loading, setLoading] = useState(true);

  // Overview metrics
  const [metrics, setMetrics] = useState<any>(null);

  // Submissions list & filters
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [standardFilter, setStandardFilter] = useState('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('ALL');
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
  const [division, setDivision] = useState('ALL');
  const [language, setLanguage] = useState('en');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('10');
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [editingHomework, setEditingHomework] = useState<HomeworkAssignment | null>(null);

  // Dynamic Questions State
  const [questions, setQuestions] = useState<QuestionFormItem[]>([
    {
      questionNumber: 1,
      questionText: 'What is photosynthesis? Explain the process and state its requirements.',
      maxMarks: 5,
      modelAnswer:
        'Photosynthesis is the process by which green plants prepare food using sunlight, carbon dioxide and water in the presence of chlorophyll.',
      alternativeAnswers:
        'Food making process in plants using solar energy, CO2 and moisture.\nProcess of synthesizing glucose from carbon dioxide and water using light.',
      rubric: [
        { criterion: 'Definition: food preparation in green plants', marks: 2 },
        { criterion: 'Sunlight requirement', marks: 1 },
        { criterion: 'CO2 and water intake', marks: 1 },
        { criterion: 'Role of chlorophyll', marks: 1 }
      ],
      keywords: 'photosynthesis, sunlight, carbon dioxide, water, chlorophyll'
    }
  ]);

  // Submission Detailed Modal State
  const [activeSubmissionDetails, setActiveSubmissionDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activePageNum, setActivePageNum] = useState<number>(1);
  const [editedQuestionMarks, setEditedQuestionMarks] = useState<Record<number, number>>({});
  const [editedTeacherComment, setEditedTeacherComment] = useState<string>('');
  const [approvalSaving, setApprovalSaving] = useState(false);
  const [approvalError, setApprovalError] = useState('');

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

  // Allowed subjects for teacher (filtered to assigned subjects if teacher)
  const allowedSubjects = React.useMemo(() => {
    if (user?.role !== 'TEACHER') return subjects;
    const assigned = getUserAssignedSubjects(user).map(s => s.toLowerCase());
    if (assigned.length === 0) return subjects;
    return subjects.filter(s => {
      const sName = (s.name || '').trim().toLowerCase();
      const sNameGu = (s.nameGu || '').trim().toLowerCase();
      return assigned.some(a => sName === a || sNameGu === a || sName.includes(a) || a.includes(sName));
    });
  }, [subjects, user]);

  // Auto-select assigned subject for teachers
  useEffect(() => {
    if (user?.role === 'TEACHER' && allowedSubjects.length > 0) {
      if (!subjectId || !allowedSubjects.some(s => s.id === subjectId)) {
        setSubjectId(allowedSubjects[0].id);
      }
    }
  }, [user, allowedSubjects, activeTab]);

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (standardFilter !== 'ALL' && s.standard !== standardFilter) return false;
    if (divisionFilter !== 'ALL' && s.division && s.division !== divisionFilter) return false;
    if (subjectFilter !== 'ALL' && s.subjectName !== subjectFilter) return false;
    if (reviewStatusFilter === 'PENDING_REVIEW' && s.reviewStatus !== 'PENDING_TEACHER_REVIEW') return false;
    if (reviewStatusFilter === 'APPROVED' && s.reviewStatus !== 'APPROVED') return false;
    if (reviewStatusFilter === 'LOW_CONFIDENCE' && !s.needsTeacherReview && s.aiConfidence !== 'LOW') return false;
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

  // Question Management Functions
  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    setQuestions([
      ...questions,
      {
        questionNumber: nextNum,
        questionText: '',
        maxMarks: 5,
        modelAnswer: '',
        alternativeAnswers: '',
        rubric: [
          { criterion: 'Core concept definition', marks: 2 },
          { criterion: 'Key requirements and explanation', marks: 3 }
        ],
        keywords: ''
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index).map((q, i) => ({
      ...q,
      questionNumber: i + 1
    }));
    setQuestions(updated);
  };

  const handleUpdateQuestion = (index: number, field: keyof QuestionFormItem, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleAddRubricItem = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].rubric.push({ criterion: '', marks: 1 });
    setQuestions(updated);
  };

  const handleRemoveRubricItem = (qIndex: number, rIndex: number) => {
    const updated = [...questions];
    updated[qIndex].rubric = updated[qIndex].rubric.filter((_, i) => i !== rIndex);
    setQuestions(updated);
  };

  const handleUpdateRubricItem = (qIndex: number, rIndex: number, field: 'criterion' | 'marks', value: any) => {
    const updated = [...questions];
    updated[qIndex].rubric[rIndex] = {
      ...updated[qIndex].rubric[rIndex],
      [field]: field === 'marks' ? Number(value) || 0 : value
    };
    setQuestions(updated);
  };

  // Reset Create Form
  const resetForm = () => {
    setTitle('');
    setTitleGu('');
    setInstructions('');
    setInstructionsGu('');
    if (user?.role === 'TEACHER') {
      const assignedSubj = (user?.teacherSubject || user?.teachingSubjects || '').trim().toLowerCase();
      const matched = subjects.find(s => {
        const sName = (s.name || '').trim().toLowerCase();
        const sNameGu = (s.nameGu || '').trim().toLowerCase();
        return sName === assignedSubj ||
               sNameGu === assignedSubj ||
               (sName !== '' && (assignedSubj.includes(sName) || sName.includes(assignedSubj)));
      });
      setSubjectId(matched ? matched.id : '');
    } else {
      setSubjectId('');
    }
    setChapterId('');
    setTopicId('');
    setStandard('Standard 8');
    setDivision('ALL');
    setLanguage('en');
    setDueDate('');
    setMaxMarks('10');
    setAllowResubmission(true);
    setEditingHomework(null);
    setQuestions([
      {
        questionNumber: 1,
        questionText: '',
        maxMarks: 5,
        modelAnswer: '',
        alternativeAnswers: '',
        rubric: [{ criterion: 'Main concept', marks: 5 }],
        keywords: ''
      }
    ]);
  };

  // Preload Sample Questions (Photosynthesis example from user request)
  const handleLoadSample = () => {
    setTitle('Photosynthesis & Plant Nutrition');
    setStandard('Standard 8');
    setDivision('ALL');
    setLanguage('en');
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setMaxMarks('10');
    setInstructions('Answer the questions with neat handwriting. Write question numbers clearly.');
    if (subjects.length > 0) {
      const scienceSub = subjects.find(s => s.name.toLowerCase().includes('science')) || subjects[0];
      setSubjectId(scienceSub.id);
    }
    setQuestions([
      {
        questionNumber: 1,
        questionText: 'What is photosynthesis?',
        maxMarks: 5,
        modelAnswer:
          'Photosynthesis is the process by which green plants prepare food using sunlight, carbon dioxide and water in the presence of chlorophyll.',
        alternativeAnswers:
          'Food making process in plants using solar energy, CO2 and moisture.\nProcess of synthesizing glucose from carbon dioxide and water using light.',
        rubric: [
          { criterion: 'Definition: food preparation in green plants', marks: 2 },
          { criterion: 'Sunlight requirement', marks: 1 },
          { criterion: 'CO2 and water intake', marks: 1 },
          { criterion: 'Chlorophyll/food production', marks: 1 }
        ],
        keywords: 'photosynthesis, sunlight, carbon dioxide, water, chlorophyll'
      },
      {
        questionNumber: 2,
        questionText: 'State Newton’s Second Law of Motion and its formula.',
        maxMarks: 5,
        modelAnswer:
          'Newton’s second law states that the rate of change of momentum of an object is proportional to the applied unbalanced force in the direction of force. Formula: F = ma.',
        alternativeAnswers: 'Force equals mass times acceleration (F = m * a).',
        rubric: [
          { criterion: 'Statement of Second Law of Motion', marks: 3 },
          { criterion: 'Formula F = ma with notation meanings', marks: 2 }
        ],
        keywords: 'force, mass, acceleration, momentum, F=ma'
      }
    ]);
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

    if (questions.length === 0 || !questions[0].questionText.trim()) {
      setErrorMsg('Please enter at least one question for the homework assignment.');
      return;
    }

    const formattedQuestions = questions.map(q => ({
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionTextGu: q.questionTextGu || null,
      maxMarks: Number(q.maxMarks) || 5,
      modelAnswer: q.modelAnswer,
      modelAnswerGu: q.modelAnswerGu || null,
      alternativeAnswers: q.alternativeAnswers
        ? q.alternativeAnswers.split('\n').map(s => s.trim()).filter(Boolean)
        : [],
      rubric: q.rubric.filter(r => r.criterion.trim().length > 0),
      keywords: q.keywords
        ? q.keywords.split(',').map(s => s.trim()).filter(Boolean)
        : []
    }));

    const totalCalculatedMarks = formattedQuestions.reduce((acc, q) => acc + q.maxMarks, 0);

    const payload = {
      title,
      titleGu: titleGu || undefined,
      instructions,
      instructionsGu: instructionsGu || undefined,
      subjectId,
      chapterId: chapterId || undefined,
      topicId: topicId || undefined,
      standard,
      division,
      language,
      dueDate,
      maxMarks: totalCalculatedMarks > 0 ? totalCalculatedMarks : Number(maxMarks) || 10,
      allowResubmission,
      questions: formattedQuestions
    };

    try {
      if (editingHomework) {
        await api.put(`/homework/${editingHomework.id}`, payload);
        setSuccessMsg(tr('ગૃહકાર્ય સફળતાપૂર્વક અપડેટ થયું!', 'Homework updated successfully!'));
      } else {
        await api.post('/homework', payload);
        setSuccessMsg(tr('ગૃહકાર્ય અને રુબ્રિક્સ સફળતાપૂર્વક તૈયાર થયું!', 'Homework created with AI rubrics successfully!'));
      }

      resetForm();
      setActiveTab('ASSIGNMENTS');
      fetchAssignments();
      fetchInitialData();
    } catch (err: any) {
      console.error('Failed to save homework:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to save homework');
    }
  };

  // Open Full Submission Details (AI Evaluation & Teacher Approval modal)
  const handleOpenSubmissionDetails = async (sub: SubmissionItem) => {
    setLoadingDetails(true);
    setApprovalError('');
    setActivePageNum(1);
    try {
      const res = await api.get(`/homework/submissions/${sub.id}/details`);
      const details = res.data.submission;
      setActiveSubmissionDetails(details);

      // Pre-fill teacher marks with either existing teacher marks or AI marks
      const initialMarks: Record<number, number> = {};
      (details.evaluations || []).forEach((ev: any) => {
        initialMarks[ev.questionNumber] =
          ev.teacherMarks !== null && ev.teacherMarks !== undefined
            ? ev.teacherMarks
            : ev.aiMarks || 0;
      });
      setEditedQuestionMarks(initialMarks);
      setEditedTeacherComment(details.teacherComment || details.teacherFeedback || '');
    } catch (err) {
      console.error('Failed to load submission details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Teacher Approval Actions: APPROVE | EDIT_MARKS | RECHECK
  const handleTeacherAction = async (action: 'APPROVE' | 'EDIT_MARKS' | 'RECHECK') => {
    if (!activeSubmissionDetails) return;
    setApprovalSaving(true);
    setApprovalError('');

    try {
      const questionMarksPayload = Object.entries(editedQuestionMarks).map(([qNum, marks]) => ({
        questionNumber: Number(qNum),
        teacherMarks: marks
      }));

      const finalMarksSum = Object.values(editedQuestionMarks).reduce((a, b) => a + b, 0);

      const res = await api.post(`/homework/submissions/${activeSubmissionDetails.id}/review`, {
        action,
        finalMarks: finalMarksSum,
        teacherComment: editedTeacherComment,
        questionMarks: questionMarksPayload
      });

      setSuccessMsg(
        action === 'RECHECK'
          ? 'Submission sent back to student for recheck.'
          : 'Result approved successfully as Final!'
      );

      setActiveSubmissionDetails(null);
      fetchInitialData();
    } catch (err: any) {
      console.error('Failed to process teacher approval:', err);
      setApprovalError(err.response?.data?.error || 'Failed to process teacher action');
    } finally {
      setApprovalSaving(false);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(i18n.language === 'gu' ? 'gu-IN' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>{tr('AI-સંચાલિત ગૃહકાર્ય ચકાસણી સિસ્ટમ', 'AI-Powered Homework Checking System')}</span>
            </div>
            {user?.role === 'TEACHER' && getUserAssignedSubjects(user).length > 0 && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-[11px] normal-case">
                <BookOpen className="w-3 h-3 text-purple-400" />
                <span>{formatUserSubjectsDisplay(getUserAssignedSubjects(user), i18n.language)}</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {tr('ગૃહકાર્ય વ્યવસ્થાપન અને ચકાસણી', 'Homework & AI Evaluation Hub')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {tr(
              'રૂબ્રિક્સ અને મોડેલ જવાબો સાથે હોમવર્ક સોંપો, હસ્તલેખિત કાગળોની AI ચકાસણીની સમીક્ષા કરો અને અંતિમ ગુણ મંજૂર કરો.',
              'Assign homework with model answers and rubrics, review handwriting OCR & AI grading, and approve final marks.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setActiveTab('CREATE');
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('નવું ગૃહકાર્ય સોંપો', 'Create & Assign Homework')}</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('SUBMISSIONS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'SUBMISSIONS'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{tr('સબમિશન & AI સમીક્ષા', 'Submissions & AI Reviews')}</span>
          {metrics?.pendingReviews > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
              {metrics.pendingReviews}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ASSIGNMENTS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'ASSIGNMENTS'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{tr('સોંપેલ ગૃહકાર્ય', 'My Homework Assignments')}</span>
        </button>

        <button
          onClick={() => setActiveTab('CREATE')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'CREATE'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{editingHomework ? tr('ગૃહકાર્ય સંપાદિત કરો', 'Edit Homework') : tr('નવું ગૃહકાર્ય બનાવો', 'Create Homework')}</span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'ANALYTICS'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{tr('વિશ્લેષણ', 'Analytics & Reports')}</span>
        </button>
      </div>

      {/* TAB 1: SUBMISSIONS & AI EVALUATIONS */}
      {activeTab === 'SUBMISSIONS' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{tr('કુલ સબમિશન', 'Total Submissions')}</span>
              <p className="text-2xl font-black text-white mt-1">{submissions.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{tr('શિક્ષક મંજૂરી બાકી', 'Pending Teacher Approval')}</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{metrics?.pendingReviews || 0}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{tr('મંજૂર થયેલ પરિણામો', 'Approved (Final)')}</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{metrics?.checkedCount || 0}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">{tr('ધ્યાન જરૂરી (Low Confidence)', 'Review Required')}</span>
              <p className="text-2xl font-black text-rose-400 mt-1">{metrics?.lowConfidenceCount || 0}</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr('વિદ્યાર્થી અથવા ગૃહકાર્ય શોધો...', 'Search student name or homework...')}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={standardFilter}
                onChange={(e) => setStandardFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Classes (બધા વર્ગ)</option>
                <option value="Standard 6">Class 6</option>
                <option value="Standard 7">Class 7</option>
                <option value="Standard 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
              </select>

              {allowedSubjects.length > 1 && (
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">{tr('બધા વિષયો', 'All Subjects')}</option>
                  {allowedSubjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {trSubject(s)}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Review Status</option>
                <option value="PENDING_REVIEW">Pending Teacher Approval</option>
                <option value="APPROVED">Approved (Final)</option>
                <option value="LOW_CONFIDENCE">Flagged for Review</option>
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          {filteredSubmissions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Bot className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">{tr('કોઈ સબમિશન મળ્યા નથી', 'No Submissions Found')}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {tr(
                  'વિદ્યાર્થીઓ તેમના હસ્તલેખિત કાગળો અથવા PDF અપલોડ કરશે ત્યારે AI આપમેળે તપાસીને અહીં સૂચિબદ્ધ કરશે.',
                  'When students upload handwritten homework pages, AI will check them and list them here for review.'
                )}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800 text-[10px]">
                      <th className="py-3.5 px-4">{tr('વિદ્યાર્થી', 'Student')}</th>
                      <th className="py-3.5 px-4">{tr('ગૃહકાર્ય શીર્ષક', 'Homework Title')}</th>
                      <th className="py-3.5 px-4">{tr('વિષય', 'Subject')}</th>
                      <th className="py-3.5 px-4">{tr('સબમિશન તારીખ', 'Submitted Date')}</th>
                      <th className="py-3.5 px-4">{tr('AI સ્કોર & કન્ફિડન્સ', 'AI Score & Confidence')}</th>
                      <th className="py-3.5 px-4">{tr('અંતિમ ગુણ (Approved)', 'Final Approved Marks')}</th>
                      <th className="py-3.5 px-4 text-right">{tr('ક્રિયાઓ', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{sub.studentName}</div>
                          <div className="text-[11px] text-slate-400">{sub.studentStandard} - Div {sub.studentDivision || 'A'}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="font-semibold text-slate-100 truncate" title={sub.homeworkTitle}>
                            {trItem(sub.homeworkTitleGu, sub.homeworkTitle)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {sub.pageCount > 0 ? `${sub.pageCount} Pages` : sub.originalFileName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-300">
                            {trSubject({ name: sub.subjectName, nameGu: sub.subjectNameGu })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {formatDate(sub.submittedAt || '')}
                        </td>
                        <td className="py-3.5 px-4">
                          {sub.aiScore !== null && sub.aiScore !== undefined ? (
                            <div className="space-y-1">
                              <span className="font-bold text-blue-400 text-xs">
                                {sub.aiScore} / {sub.maxMarks}
                              </span>
                              <div className="flex items-center space-x-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                                    sub.aiConfidence === 'HIGH'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : sub.aiConfidence === 'MEDIUM'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  }`}
                                >
                                  {sub.aiConfidence || 'MED'} Conf
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Checking...</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {sub.isTeacherApproved ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              ✓ {sub.marksObtained} / {sub.maxMarks}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px]">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenSubmissionDetails(sub)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{sub.isTeacherApproved ? 'View / Edit' : 'Review & Approve'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS LIST */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((hw) => (
              <div key={hw.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[10px] font-bold border border-blue-500/20">
                      {hw.standard} • Div {hw.division || 'ALL'}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {hw.maxMarks} Marks
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base line-clamp-2">
                    {trItem(hw.titleGu, hw.title)}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {hw.instructions || 'No specific instructions provided.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span className="font-semibold text-slate-200">{formatDate(hw.dueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span className="font-semibold text-blue-400">{hw.totalQuestions || hw.questions?.length || 1} Questions</span>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => {
                        setEditingHomework(hw);
                        setTitle(hw.title);
                        setTitleGu(hw.titleGu || '');
                        setInstructions(hw.instructions || '');
                        setInstructionsGu(hw.instructionsGu || '');
                        setSubjectId(hw.subjectId);
                        setChapterId(hw.chapterId || '');
                        setTopicId(hw.topicId || '');
                        setStandard(hw.standard);
                        setDivision(hw.division || 'ALL');
                        setDueDate(hw.dueDate ? new Date(hw.dueDate).toISOString().split('T')[0] : '');
                        setMaxMarks(String(hw.maxMarks));
                        setActiveTab('CREATE');
                      }}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CREATE / ASSIGN HOMEWORK WITH QUESTIONS & RUBRICS */}
      {activeTab === 'CREATE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <span>{editingHomework ? 'Edit Homework Assignment' : 'Create & Assign Homework with AI Rubric'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Define questions, model answers, acceptable alternative answers, and marking rubrics.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Load Example (Photosynthesis Rubric)</span>
            </button>
          </div>

          <form onSubmit={handleSaveHomework} className="space-y-6">
            {/* Meta Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Homework Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Photosynthesis & Nutrition in Plants"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Title in Gujarati</label>
                <input
                  type="text"
                  value={titleGu}
                  onChange={(e) => setTitleGu(e.target.value)}
                  placeholder="e.g. પ્રકાશસંશ્લેષણ અને વનસ્પતિમાં પોષણ"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1 flex items-center justify-between">
                  <span>{tr('વિષય *', 'Subject *')}</span>
                  {user?.role === 'TEACHER' && (
                    <span className="text-[10px] text-purple-400 font-bold flex items-center space-x-1">
                      {allowedSubjects.length === 1 ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>{tr('સોંપાયેલ વિષય (લૉક)', 'Assigned Subject (Locked)')}</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3 h-3" />
                          <span>{tr('તમારા સોંપાયેલ વિષયો', 'Your Assigned Subjects')} ({allowedSubjects.length})</span>
                        </>
                      )}
                    </span>
                  )}
                </label>
                <select
                  required
                  value={subjectId}
                  disabled={user?.role === 'TEACHER' && allowedSubjects.length === 1}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    setChapterId('');
                    setTopicId('');
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 ${
                    user?.role === 'TEACHER' && allowedSubjects.length === 1
                      ? 'cursor-not-allowed opacity-90 border-purple-500/40 bg-slate-900/80 font-medium'
                      : ''
                  }`}
                >
                  <option value="">{tr('-- વિષય પસંદ કરો --', '-- Select Subject --')}</option>
                  {allowedSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.nameGu ? `(${s.nameGu})` : ''}
                    </option>
                  ))}
                </select>
                {user?.role === 'TEACHER' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {allowedSubjects.length === 1
                      ? tr('શિક્ષકો ફક્ત તેમના સોંપાયેલ વિષય માટે જ ગૃહકાર્ય બનાવી શકે છે.', 'Teachers can only create homework for their assigned subject.')
                      : tr('તમે ભણાવતા સોંપાયેલ વિષયોમાંથી કોઈ એક વિષય પસંદ કરો.', 'Select one of the subjects you are assigned to teach.')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Class / Standard *</label>
                <select
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Standard 8">Class 8</option>
                  <option value="Standard 7">Class 7</option>
                  <option value="Standard 6">Class 6</option>
                  <option value="ALL">All Classes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Division *</label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="ALL">All Divisions (બધી શાખાઓ)</option>
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                  <option value="D">Division D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Homework Language *</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="en">English (અંગ્રેજી)</option>
                  <option value="gu">Gujarati (ગુજરાતી)</option>
                  <option value="hi">Hindi (હિન્દી)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Total Marks</label>
                <input
                  type="number"
                  value={questions.reduce((acc, q) => acc + (Number(q.maxMarks) || 0), 0) || maxMarks}
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-emerald-400 font-bold"
                />
              </div>
            </div>

            {/* Questions Builder Section */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Questions, Model Answers & Rubrics ({questions.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define maximum marks and marking criteria per question. AI will evaluate answers against these rules.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-purple-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              </div>

              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="font-extrabold text-blue-400 text-sm">
                      Question {q.questionNumber}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-slate-400 font-semibold">Marks:</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={q.maxMarks}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'maxMarks', e.target.value)}
                          className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-center text-white font-bold"
                        />
                      </div>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Question Text *</label>
                    <input
                      type="text"
                      required
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestion(qIndex, 'questionText', e.target.value)}
                      placeholder="e.g. What is photosynthesis?"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-emerald-400 mb-1">Model / Correct Answer *</label>
                    <textarea
                      rows={2}
                      required
                      value={q.modelAnswer}
                      onChange={(e) => handleUpdateQuestion(qIndex, 'modelAnswer', e.target.value)}
                      placeholder="e.g. Photosynthesis is the process by which green plants prepare food using sunlight, carbon dioxide and water in the presence of chlorophyll."
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Acceptable Alternative Answers (One per line)
                    </label>
                    <textarea
                      rows={2}
                      value={q.alternativeAnswers}
                      onChange={(e) => handleUpdateQuestion(qIndex, 'alternativeAnswers', e.target.value)}
                      placeholder="Food making process in plants using solar energy, CO2 and moisture."
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Marking Rubric Breakdown */}
                  <div className="space-y-2 pt-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300">
                        Marking Rubric / Criteria ({q.rubric.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddRubricItem(qIndex)}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Criterion</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {q.rubric.map((r, rIndex) => (
                        <div key={rIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={r.criterion}
                            onChange={(e) => handleUpdateRubricItem(qIndex, rIndex, 'criterion', e.target.value)}
                            placeholder="e.g. Definition of process"
                            className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500"
                          />
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min={0.5}
                              max={q.maxMarks}
                              step={0.5}
                              value={r.marks}
                              onChange={(e) => handleUpdateRubricItem(qIndex, rIndex, 'marks', e.target.value)}
                              className="w-16 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-center text-emerald-400 font-bold"
                            />
                            <span className="text-[11px] text-slate-400">mk</span>
                          </div>
                          {q.rubric.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRubricItem(qIndex, rIndex)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Keywords (Comma separated)</label>
                    <input
                      type="text"
                      value={q.keywords}
                      onChange={(e) => handleUpdateQuestion(qIndex, 'keywords', e.target.value)}
                      placeholder="e.g. photosynthesis, sunlight, carbon dioxide, water, chlorophyll"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingHomework ? 'Save Changes' : 'Create & Assign Homework'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: ANALYTICS & REPORTS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Completion & Review Breakdown</span>
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Approved', count: metrics?.checkedCount || 0, fill: '#10b981' },
                      { name: 'Pending Review', count: metrics?.pendingReviews || 0, fill: '#f59e0b' },
                      { name: 'Late Submissions', count: metrics?.lateCount || 0, fill: '#ef4444' }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Performance & Quality Metrics</span>
              </h4>

              <div className="space-y-4 pt-2">
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Average Class Marks:</span>
                  <span className="text-2xl font-black text-purple-400">{metrics?.averageClassMarks || 0}%</span>
                </div>
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Homework Completion Rate:</span>
                  <span className="text-2xl font-black text-blue-400">{metrics?.completionPercentage || 0}%</span>
                </div>
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Flagged Low Confidence Answers:</span>
                  <span className="text-2xl font-black text-amber-400">{metrics?.lowConfidenceCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPLIT SCREEN MODAL: TEACHER REVIEW & APPROVAL */}
      {activeSubmissionDetails && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-base">
                      {activeSubmissionDetails.student?.name}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {activeSubmissionDetails.student?.profile?.standard} - Div {activeSubmissionDetails.student?.profile?.division || 'A'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        activeSubmissionDetails.isTeacherApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {activeSubmissionDetails.isTeacherApproved ? 'APPROVED (FINAL)' : 'PENDING TEACHER APPROVAL'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Homework: {activeSubmissionDetails.homework?.title} • Max Marks: {activeSubmissionDetails.homework?.maxMarks}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveSubmissionDetails(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Screen Container */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Pane: Submitted Handwriting Pages Viewer */}
              <div className="flex-1 bg-slate-950 p-4 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase text-slate-300 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Original Submitted Pages ({activeSubmissionDetails.pages?.length || 1})</span>
                  </span>

                  {/* Multi-Page Tabs */}
                  {activeSubmissionDetails.pages && activeSubmissionDetails.pages.length > 1 && (
                    <div className="flex items-center space-x-1">
                      {activeSubmissionDetails.pages.map((p: any) => (
                        <button
                          key={p.pageNumber}
                          type="button"
                          onClick={() => setActivePageNum(p.pageNumber)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            activePageNum === p.pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Page {p.pageNumber}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Page Viewer Content */}
                <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800/80 my-2">
                  {(() => {
                    const currentPage = activeSubmissionDetails.pages?.find((p: any) => p.pageNumber === activePageNum) || activeSubmissionDetails.pages?.[0];
                    const isPdf = activeSubmissionDetails.pdfFilePath?.endsWith('.pdf');

                    if (isPdf && (!currentPage || currentPage.imagePath?.endsWith('.pdf'))) {
                      return (
                        <iframe
                          src={`/api/homework/submissions/${activeSubmissionDetails.id}/pdf`}
                          title="Student Submission PDF"
                          className="w-full h-full rounded-xl border border-slate-800"
                        />
                      );
                    }

                    const imgUrl = currentPage
                      ? `/api/homework/submissions/${activeSubmissionDetails.id}/file/${currentPage.id}`
                      : `/api/homework/submissions/${activeSubmissionDetails.id}/pdf`;

                    return (
                      <img
                        src={imgUrl}
                        alt={`Page ${activePageNum}`}
                        className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                      />
                    );
                  })()}
                </div>

                {/* OCR Transcription Accordion */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 max-h-32 overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    OCR / Handwriting Reading (Page {activePageNum}):
                  </span>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                    {activeSubmissionDetails.pages?.find((p: any) => p.pageNumber === activePageNum)?.ocrText ||
                      'No OCR text extracted for this page.'}
                  </p>
                </div>
              </div>

              {/* Right Pane: AI Evaluation Breakdown & Teacher Marks Adjustment */}
              <div className="w-full lg:w-[480px] bg-slate-900 p-5 flex flex-col justify-between overflow-y-auto space-y-5">
                <div className="space-y-5">
                  {/* Summary Bar */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Score</span>
                      <p className="text-xl font-black text-blue-400">
                        {activeSubmissionDetails.aiScore} / {activeSubmissionDetails.homework?.maxMarks}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Approved Score</span>
                      <p className="text-2xl font-black text-emerald-400">
                        {Object.values(editedQuestionMarks).reduce((a, b) => a + b, 0)} / {activeSubmissionDetails.homework?.maxMarks}
                      </p>
                    </div>
                  </div>

                  {/* Question-by-Question Evaluation List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Question-Wise Evaluation & Rubrics:
                    </h4>

                    {(activeSubmissionDetails.evaluations || []).map((ev: any) => (
                      <div key={ev.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-bold text-white text-xs">
                            Q{ev.questionNumber}: {ev.question?.questionText || `Question ${ev.questionNumber}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ev.status === 'CORRECT'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : ev.status === 'PARTIALLY_CORRECT'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : ev.status === 'NEEDS_TEACHER_REVIEW'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </div>

                        {/* Student Answer & Model Answer */}
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Student Extracted Answer:</span>
                            <div className="p-2 bg-slate-900 rounded-xl text-slate-200 text-xs">
                              {ev.studentAnswerText || 'No answer detected or unclear handwriting.'}
                            </div>
                          </div>

                          {ev.question?.modelAnswer && (
                            <div>
                              <span className="text-[10px] text-emerald-400 font-bold uppercase">Model Answer:</span>
                              <div className="p-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-emerald-200 text-xs">
                                {ev.question.modelAnswer}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Rubric Breakdown */}
                        {ev.rubricBreakdown && ev.rubricBreakdown.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] text-purple-300 font-bold uppercase">Rubric Criteria Applied:</span>
                            <div className="space-y-1">
                              {ev.rubricBreakdown.map((rb: any, rIdx: number) => (
                                <div key={rIdx} className="flex items-center justify-between text-[11px] p-1.5 bg-slate-900 rounded-lg">
                                  <span className="text-slate-300 truncate max-w-[280px]">
                                    {rb.criterion}
                                  </span>
                                  <span className={`font-bold ${rb.awardedMarks > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {rb.awardedMarks} / {rb.maxMarks}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Points & Mistakes */}
                        {ev.missingPoints && ev.missingPoints.length > 0 && (
                          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
                            <span className="text-[10px] font-bold text-amber-300 uppercase">Missing Points / Mistakes:</span>
                            <ul className="list-disc list-inside text-amber-200 text-[11px] space-y-0.5">
                              {ev.missingPoints.map((m: string, mIdx: number) => (
                                <li key={mIdx}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Marks & Teacher Override Field */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-400 font-semibold">AI Marks:</span>
                            <span className="text-xs font-bold text-blue-400">{ev.aiMarks} / {ev.maxMarks}</span>
                            <span className="text-[10px] text-slate-500">({ev.confidenceScore}% conf)</span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs text-white font-bold">Teacher Marks:</span>
                            <input
                              type="number"
                              min={0}
                              max={ev.maxMarks}
                              step={0.5}
                              value={editedQuestionMarks[ev.questionNumber] ?? ev.aiMarks}
                              onChange={(e) =>
                                setEditedQuestionMarks({
                                  ...editedQuestionMarks,
                                  [ev.questionNumber]: Number(e.target.value) || 0
                                })
                              }
                              className="w-16 px-2 py-1 bg-slate-850 border border-emerald-500/40 rounded-lg text-center text-xs text-emerald-400 font-black"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Teacher Feedback Comment Box */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-slate-300">
                      Teacher Comments / Feedback for Student
                    </label>
                    <textarea
                      rows={3}
                      value={editedTeacherComment}
                      onChange={(e) => setEditedTeacherComment(e.target.value)}
                      placeholder="e.g. Good explanation! Remember to include the diagram next time."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {approvalError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
                      {approvalError}
                    </div>
                  )}
                </div>

                {/* Teacher Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleTeacherAction('APPROVE')}
                    disabled={approvalSaving}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{approvalSaving ? 'Saving Approval...' : 'APPROVE RESULT (FINAL)'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTeacherAction('EDIT_MARKS')}
                      disabled={approvalSaving}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>EDIT MARKS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTeacherAction('RECHECK')}
                      disabled={approvalSaving}
                      className="py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition-colors flex items-center justify-center space-x-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>SEND BACK</span>
                    </button>
                  </div>
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
