import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Calendar,
  Award,
  MessageSquare,
  Search,
  Filter,
  X,
  ExternalLink,
  Download,
  FileCheck,
  RefreshCw,
  BookOpen,
  User,
  Eye,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  Bot,
  ShieldCheck,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

interface QuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  maxMarks: number;
}

interface HomeworkItem {
  id: string;
  title: string;
  titleGu: string;
  instructions: string;
  instructionsGu: string;
  standard: string;
  division?: string;
  language?: string;
  subjectId: string;
  subjectName: string;
  subjectNameGu: string;
  subjectIcon: string;
  chapterId?: string | null;
  chapterName?: string | null;
  chapterNameGu?: string | null;
  topicId?: string | null;
  topicName?: string | null;
  topicNameGu?: string | null;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  maxMarks: number;
  totalQuestions: number;
  questions?: QuestionItem[];
  allowResubmission: boolean;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'CHECKED';
  submission?: {
    id: string;
    status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'CHECKED';
    reviewStatus: 'PENDING_AI' | 'AI_CHECKED' | 'PENDING_TEACHER_REVIEW' | 'APPROVED' | 'RECHECK_REQUESTED';
    originalFileName: string;
    submittedAt?: string;
    marksObtained?: number | null;
    aiScore?: number | null;
    aiConfidence?: string | null;
    isTeacherApproved: boolean;
    teacherComment?: string | null;
    teacherFeedback?: string | null;
    evaluatedAt?: string | null;
    submissionVersion: number;
    historyCount: number;
    evaluations?: any[];
  } | null;
}

interface SummaryData {
  totalAssigned: number;
  pending: number;
  submitted: number;
  late: number;
  checked: number;
  averageMarksPercentage: number;
}

export const HomeworkPage: React.FC = () => {
  const { t, i18n } = useTranslation(['homework', 'common']);
  const isGu = i18n.language === 'gu';

  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Modal State (Multi-page handwritten support)
  const [uploadModalHomework, setUploadModalHomework] = useState<HomeworkItem | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccessAlert, setUploadSuccessAlert] = useState('');

  // Result Detail Modal State
  const [resultModalSubmissionId, setResultModalSubmissionId] = useState<string | null>(null);
  const [detailedSubmission, setDetailedSubmission] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeResultPageNum, setActiveResultPageNum] = useState<number>(1);

  // Homework Questions Detail Modal
  const [viewQuestionsHomework, setViewQuestionsHomework] = useState<HomeworkItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHomeworkData();
  }, [i18n.language]);

  const fetchHomeworkData = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get('/homework/student'),
        api.get('/homework/student/summary')
      ]);
      setHomeworks(listRes.data.homeworks || []);
      setSummary(summaryRes.data.summary || null);
    } catch (err) {
      console.error('Failed to fetch homework data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Distinct subjects for filter dropdown
  const uniqueSubjects = Array.from(
    new Map(
      homeworks.map(h => [h.subjectId, { id: h.subjectId, name: h.subjectName, nameGu: h.subjectNameGu }])
    ).values()
  );

  // Filtered homework list
  const filteredHomeworks = homeworks.filter(h => {
    if (statusFilter !== 'ALL' && h.status !== statusFilter) return false;
    if (subjectFilter !== 'ALL' && h.subjectId !== subjectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = trItem(h.titleGu, h.title).toLowerCase().includes(q);
      const subMatch = trSubject({ name: h.subjectName, nameGu: h.subjectNameGu }).toLowerCase().includes(q);
      const teacherMatch = h.teacherName.toLowerCase().includes(q);
      if (!titleMatch && !subMatch && !teacherMatch) return false;
    }
    return true;
  });

  // Open upload modal
  const handleOpenUpload = (hw: HomeworkItem) => {
    setUploadModalHomework(hw);
    setSelectedFiles([]);
    setUploadError('');
    setUploadSuccessAlert('');
    setUploadProgress(0);
  };

  // Close upload modal
  const handleCloseUpload = () => {
    if (!uploading) {
      setUploadModalHomework(null);
      setSelectedFiles([]);
      setUploadError('');
      setUploadSuccessAlert('');
    }
  };

  // File selection validation (JPG, PNG, PDF, WEBP)
  const handleAddFiles = (newFiles: FileList | File[]) => {
    setUploadError('');
    const validFiles: File[] = [];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

    Array.from(newFiles).forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isAllowed = allowedTypes.includes(file.type) || ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext || '');

      if (!isAllowed) {
        setUploadError(tr('માત્ર JPG, PNG અથવા PDF ફાઇલો જ માન્ય છે.', 'Only JPG, PNG or PDF files are allowed.'));
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Homework (JPG, PNG, PDF, Multiple Pages)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalHomework || selectedFiles.length === 0) {
      setUploadError(tr('કૃપા કરીને હોમવર્ક પૃષ્ઠો પસંદ કરો.', 'Please upload at least one page of your homework.'));
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadProgress(20);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      setUploadProgress(45);
      const res = await api.post(`/homework/${uploadModalHomework.id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 80) / progressEvent.total);
            setUploadProgress(pct);
          }
        }
      });

      setUploadProgress(100);
      setUploadSuccessAlert(
        tr(
          'તમારું ગૃહકાર્ય સફળતાપૂર્વક સબમિટ થયું છે.',
          'Your homework has been submitted successfully.'
        )
      );

      // Refresh list
      fetchHomeworkData();

      // Automatically open the detailed result after 1.5s
      setTimeout(() => {
        handleCloseUpload();
        if (res.data.submission?.id) {
          handleOpenResult(res.data.submission.id);
        }
      }, 1800);
    } catch (err: any) {
      console.error('Homework submission failed:', err);
      setUploadError(err.response?.data?.error || 'Failed to submit homework');
    } finally {
      setUploading(false);
    }
  };

  // Open Detailed Result View
  const handleOpenResult = async (submissionId: string) => {
    setResultModalSubmissionId(submissionId);
    setLoadingDetails(true);
    setActiveResultPageNum(1);
    try {
      const res = await api.get(`/homework/submissions/${submissionId}/details`);
      setDetailedSubmission(res.data.submission);
    } catch (err) {
      console.error('Failed to load submission details:', err);
    } finally {
      setLoadingDetails(false);
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

  const getStatusBadge = (status: string, reviewStatus?: string, isApproved?: boolean) => {
    if (isApproved || reviewStatus === 'APPROVED' || status === 'CHECKED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
          ✓ {tr('મંજૂર (Approved)', 'Approved')}
        </span>
      );
    }
    if (reviewStatus === 'RECHECK_REQUESTED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
          {tr('પુનઃ-ચકાસણી (Recheck)', 'Recheck Requested')}
        </span>
      );
    }
    if (status === 'SUBMITTED' || status === 'LATE') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
          {tr('શિક્ષક સમીક્ષા બાકી (Pending)', 'Pending Review')}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
        {tr('બાકી (Pending)', 'Pending')}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>{tr('AI ગૃહકાર્ય સહાયક', 'AI Homework Assistant')}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {tr('મારું ગૃહકાર્ય', 'My Homework')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {tr(
              'સોંપેલ પ્રશ્નો જુઓ, હસ્તલેખિત કાગળો અપલોડ કરો અને ત્વરિત AI ચકાસણી તથા શિક્ષકના પ્રતિસાદ મેળવો.',
              'View assigned homework, upload handwritten pages (JPG, PNG, PDF), and view AI-evaluated marks and teacher feedback.'
            )}
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 shrink-0">
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">{tr('સોંપેલ', 'Assigned')}</span>
              <p className="text-lg font-black text-white">{summary.totalAssigned}</p>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-[10px] text-amber-400 uppercase font-bold">{tr('બાકી', 'Pending')}</span>
              <p className="text-lg font-black text-amber-400">{summary.pending}</p>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] text-emerald-400 uppercase font-bold">{tr('ચકાસાયેલ', 'Checked')}</span>
              <p className="text-lg font-black text-emerald-400">{summary.checked}</p>
            </div>
          </div>
        )}
      </div>

      {/* Global Success Notification */}
      {uploadSuccessAlert && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center space-x-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{uploadSuccessAlert}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr('ગૃહકાર્ય અથવા વિષય શોધો...', 'Search homework title, subject, or teacher...')}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{tr('બધી સ્થિતિ (All Statuses)', 'All Statuses')}</option>
            <option value="PENDING">{tr('બાકી (Pending)', 'Pending')}</option>
            <option value="SUBMITTED">{tr('સબમિટ થયેલ (Submitted)', 'Submitted')}</option>
            <option value="CHECKED">{tr('મંજૂર (Approved)', 'Approved')}</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{tr('બધા વિષયો', 'All Subjects')}</option>
            {uniqueSubjects.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name} {sub.nameGu ? `(${sub.nameGu})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Homework Cards Grid */}
      {filteredHomeworks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Bot className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">{tr('કોઈ ગૃહકાર્ય મળ્યું નથી', 'No Homework Found')}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {tr('હાલમાં તમારા ધોરણ માટે કોઈ ગૃહકાર્ય સોંપાયેલ નથી.', 'There are no active homework assignments matching your criteria.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHomeworks.map((hw) => {
            const hasSubmission = !!hw.submission;
            const isApproved = hw.submission?.isTeacherApproved || hw.submission?.status === 'CHECKED';

            return (
              <div
                key={hw.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[10px] font-bold border border-blue-500/20">
                      {trSubject({ name: hw.subjectName, nameGu: hw.subjectNameGu })}
                    </span>
                    {getStatusBadge(hw.status, hw.submission?.reviewStatus, isApproved)}
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug">
                    {trItem(hw.titleGu, hw.title)}
                  </h3>

                  {hw.instructions && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {trItem(hw.instructionsGu, hw.instructions)}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{tr('છેલ્લી તારીખ:', 'Due Date:')}</span>
                    </span>
                    <span className="font-semibold text-slate-200">{formatDate(hw.dueDate)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{tr('કુલ ગુણ:', 'Total Marks:')}</span>
                    </span>
                    <span className="font-bold text-white">
                      {hasSubmission && (isApproved || hw.submission?.marksObtained !== null)
                        ? `${hw.submission?.marksObtained ?? hw.submission?.aiScore} / ${hw.maxMarks}`
                        : `${hw.maxMarks} Marks`}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-2">
                    {/* View Questions Button */}
                    <button
                      type="button"
                      onClick={() => setViewQuestionsHomework(hw)}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                      title="View Questions & Instructions"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Questions ({hw.totalQuestions || 1})</span>
                    </button>

                    {/* View Results / Upload Button */}
                    {hasSubmission ? (
                      <button
                        type="button"
                        onClick={() => handleOpenResult(hw.submission!.id)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/30 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isApproved ? 'View Result' : 'View AI Check'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenUpload(hw)}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{tr('ગૃહકાર્ય અપલોડ કરો', 'Upload Homework')}</span>
                      </button>
                    )}

                    {hasSubmission && hw.allowResubmission && !isApproved && (
                      <button
                        type="button"
                        onClick={() => handleOpenUpload(hw)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                        title="Re-upload homework"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD MODAL (Supports JPG, PNG, PDF, Multiple Pages) */}
      {uploadModalHomework && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-extrabold text-white">
                  {tr('હસ્તલેખિત ગૃહકાર્ય અપલોડ કરો', 'Upload Handwritten Homework')}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseUpload}
                disabled={uploading}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1 text-xs">
              <p className="font-bold text-white text-sm">{uploadModalHomework.title}</p>
              <div className="flex items-center space-x-2 text-slate-400">
                <span>{uploadModalHomework.subjectName}</span>
                <span>•</span>
                <span>Due: {formatDate(uploadModalHomework.dueDate)}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{uploadModalHomework.maxMarks} Marks</span>
              </div>
            </div>

            {/* Upload Selector Cards */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase text-slate-300 block">
                {tr('પૃષ્ઠો પસંદ કરો (JPG, PNG, PDF)', 'Select Pages (JPG, PNG, PDF):')}
              </span>

              {/* Drag / Browse Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer space-y-2 transition-colors"
              >
                <div className="flex items-center justify-center space-x-3 text-blue-400">
                  <ImageIcon className="w-6 h-6" />
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-200">
                  {tr('ક્લિક કરો અથવા ફાઇલો અહીં ડ્રોપ કરો', 'Click to browse Gallery/Files or Drag & Drop')}
                </p>
                <p className="text-[11px] text-slate-500">
                  Allows multiple pages (Page 1, Page 2, Page 3...) • JPG, PNG, PDF
                </p>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  if (e.target.files) handleAddFiles(e.target.files);
                }}
                className="hidden"
              />

              <input
                ref={cameraInputRef}
                type="file"
                capture="environment"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) handleAddFiles(e.target.files);
                }}
                className="hidden"
              />

              {/* Direct Camera Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border border-slate-700 transition-colors"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Take Photo with Camera (કૅમેરા વડે ફોટો લો)</span>
              </button>
            </div>

            {/* Selected Pages List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  Uploaded Pages ({selectedFiles.length}):
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 font-bold text-[10px]">
                          Page {i + 1}
                        </span>
                        <span className="text-white truncate max-w-xs">{f.name}</span>
                        <span className="text-[10px] text-slate-500">
                          ({(f.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Uploading & running AI OCR check...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Action Buttons */}
            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseUpload}
                disabled={uploading}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={uploading || selectedFiles.length === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all hover:scale-105"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Checking in Progress...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>SUBMIT HOMEWORK</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED STUDENT RESULT MODAL */}
      {resultModalSubmissionId && detailedSubmission && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-white text-base">
                      {detailedSubmission.homework?.title}
                    </h3>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        detailedSubmission.isTeacherApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {detailedSubmission.isTeacherApproved ? 'APPROVED (FINAL)' : 'PENDING TEACHER REVIEW'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Subject: {detailedSubmission.homework?.subject?.name} • Submitted: {formatDate(detailedSubmission.submittedAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setResultModalSubmissionId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scorecard Hero Banner */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Score</span>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-3xl font-black text-emerald-400">
                    {detailedSubmission.isTeacherApproved
                      ? detailedSubmission.marksObtained
                      : (detailedSubmission.aiScore || 0)}
                  </span>
                  <span className="text-lg font-bold text-slate-400">
                    / {detailedSubmission.homework?.maxMarks} Marks
                  </span>
                  <span className="text-sm font-bold text-blue-400 ml-2">
                    ({Math.round(
                      ((detailedSubmission.isTeacherApproved
                        ? detailedSubmission.marksObtained
                        : (detailedSubmission.aiScore || 0)) /
                        (detailedSubmission.homework?.maxMarks || 1)) *
                        100
                    )}%)
                  </span>
                </div>
              </div>

              {detailedSubmission.aiConfidence && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Confidence</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-xl text-xs font-black border mt-1 ${
                      detailedSubmission.aiConfidence === 'HIGH'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : detailedSubmission.aiConfidence === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {detailedSubmission.aiConfidence} Confidence
                  </span>
                </div>
              )}
            </div>

            {/* Scrollable Result Breakdown */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Teacher Comment Callout */}
              {detailedSubmission.teacherComment && (
                <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Teacher's Note:</span>
                  </span>
                  <p className="text-xs text-purple-200 leading-relaxed font-semibold">
                    "{detailedSubmission.teacherComment}"
                  </p>
                </div>
              )}

              {/* Overall AI Feedback */}
              {detailedSubmission.aiFeedback && (
                <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Tutor Guidance:</span>
                  </span>
                  <p className="text-xs text-blue-200 leading-relaxed">
                    {detailedSubmission.aiFeedback}
                  </p>
                </div>
              )}

              {/* Question | Max Marks | AI Marks | Status Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Question-Wise Evaluation:
                </h4>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Question</th>
                        <th className="py-2.5 px-3">Max Marks</th>
                        <th className="py-2.5 px-3">Awarded Marks</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(detailedSubmission.evaluations || []).map((ev: any) => (
                        <tr key={ev.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-semibold text-white max-w-xs">
                            Q{ev.questionNumber}: {ev.question?.questionText || `Question ${ev.questionNumber}`}
                          </td>
                          <td className="py-2.5 px-3">{ev.maxMarks}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-400">
                            {ev.teacherMarks !== null && ev.teacherMarks !== undefined
                              ? ev.teacherMarks
                              : ev.aiMarks}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ev.status === 'CORRECT'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : ev.status === 'PARTIALLY_CORRECT'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {ev.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Questions Deep Dive Cards */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Detailed Answers & Rubric Criteria:
                </h4>

                {(detailedSubmission.evaluations || []).map((ev: any) => (
                  <div key={ev.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-400 text-xs">
                        Q{ev.questionNumber}: {ev.question?.questionText}
                      </span>
                      <span className="font-bold text-emerald-400 text-xs">
                        Score: {ev.teacherMarks ?? ev.aiMarks} / {ev.maxMarks}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                          Your Answer:
                        </span>
                        <p className="text-slate-200 font-mono text-xs whitespace-pre-wrap">
                          {ev.studentAnswerText || 'Handwriting could not be read clearly.'}
                        </p>
                      </div>

                      {ev.question?.modelAnswer && (
                        <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">
                            Model Answer:
                          </span>
                          <p className="text-emerald-200 text-xs leading-relaxed">
                            {ev.question.modelAnswer}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Missing points / Mistakes */}
                    {ev.missingPoints && ev.missingPoints.length > 0 && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
                        <span className="text-[10px] font-bold text-amber-300 uppercase">
                          Important Points to Include Next Time:
                        </span>
                        <ul className="list-disc list-inside text-amber-200 text-[11px] space-y-0.5">
                          {ev.missingPoints.map((m: string, idx: number) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* AI Question Feedback */}
                    {ev.aiFeedback && (
                      <p className="text-[11px] text-slate-400 italic">
                        Feedback: {ev.aiFeedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* View Original Pages Accordion */}
              {detailedSubmission.pages && detailedSubmission.pages.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase block">
                    Your Submitted Handwritten Pages ({detailedSubmission.pages.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {detailedSubmission.pages.map((p: any) => (
                      <button
                        key={p.pageNumber}
                        type="button"
                        onClick={() => setActiveResultPageNum(p.pageNumber)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeResultPageNum === p.pageNumber
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Page {p.pageNumber}
                      </button>
                    ))}
                  </div>

                  <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center max-h-96 overflow-auto">
                    {(() => {
                      const curr = detailedSubmission.pages.find((p: any) => p.pageNumber === activeResultPageNum) || detailedSubmission.pages[0];
                      const isPdf = curr?.imagePath?.endsWith('.pdf');

                      if (isPdf) {
                        return (
                          <iframe
                            src={`/api/homework/submissions/${detailedSubmission.id}/pdf`}
                            title="Submitted PDF"
                            className="w-full h-80 rounded-xl"
                          />
                        );
                      }

                      return (
                        <img
                          src={`/api/homework/submissions/${detailedSubmission.id}/file/${curr?.id}`}
                          alt={`Page ${activeResultPageNum}`}
                          className="max-h-80 object-contain rounded-xl"
                        />
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setResultModalSubmissionId(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW HOMEWORK QUESTIONS DETAIL MODAL */}
      {viewQuestionsHomework && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base">
                {viewQuestionsHomework.title}
              </h3>
              <button
                type="button"
                onClick={() => setViewQuestionsHomework(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewQuestionsHomework.instructions && (
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-blue-400 block mb-1">Instructions:</span>
                {viewQuestionsHomework.instructions}
              </div>
            )}

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Questions to Answer in your Notebook:
              </span>

              {viewQuestionsHomework.questions && viewQuestionsHomework.questions.length > 0 ? (
                viewQuestionsHomework.questions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-blue-400">Q{q.questionNumber || idx + 1}.</span>
                      <span className="font-bold text-emerald-400">{q.maxMarks} Marks</span>
                    </div>
                    <p className="text-xs text-white font-medium">{q.questionText}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300">
                  {viewQuestionsHomework.instructions || 'Answer all required chapter questions.'}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const target = viewQuestionsHomework;
                  setViewQuestionsHomework(null);
                  handleOpenUpload(target);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Answers Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkPage;
