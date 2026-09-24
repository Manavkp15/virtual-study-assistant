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
  AlertTriangle
} from 'lucide-react';

interface HomeworkItem {
  id: string;
  title: string;
  titleGu: string;
  instructions: string;
  instructionsGu: string;
  standard: string;
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
  allowResubmission: boolean;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'CHECKED';
  submission?: {
    id: string;
    status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'CHECKED';
    originalFileName: string;
    submittedAt?: string;
    marksObtained?: number | null;
    teacherFeedback?: string | null;
    evaluatedAt?: string | null;
    submissionVersion: number;
    historyCount: number;
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

  // Upload Modal State
  const [uploadModalHomework, setUploadModalHomework] = useState<HomeworkItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // PDF Viewer Modal State
  const [viewerModalSubmission, setViewerModalSubmission] = useState<{
    id: string;
    fileName: string;
    title: string;
  } | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setSelectedFile(null);
    setUploadError('');
    setUploadSuccess('');
    setUploadProgress(0);
  };

  // Close upload modal
  const handleCloseUpload = () => {
    if (!uploading) {
      setUploadModalHomework(null);
      setSelectedFile(null);
      setUploadError('');
      setUploadSuccess('');
    }
  };

  // File selection validation (Strict PDF only, NO file-size limit)
  const validateAndSetFile = (file: File) => {
    setUploadError('');
    setUploadSuccess('');

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadError(t('upload.onlyPdf'));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Submit PDF
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalHomework || !selectedFile) {
      setUploadError(t('upload.selectFileFirst'));
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post(`/homework/${uploadModalHomework.id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      });

      setUploadSuccess(t('upload.success'));
      await fetchHomeworkData();
      setTimeout(() => {
        handleCloseUpload();
      }, 1500);
    } catch (err: any) {
      console.error('Homework upload error:', err);
      setUploadError(err.response?.data?.error || t('upload.error'));
    } finally {
      setUploading(false);
    }
  };

  // Open PDF Viewer Modal
  const handleOpenPdfViewer = async (submissionId: string, fileName: string, title: string) => {
    setViewerModalSubmission({ id: submissionId, fileName, title });
    setLoadingPdf(true);
    setPdfBlobUrl(null);

    try {
      const res = await api.get(`/homework/submissions/${submissionId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error('Failed to load PDF blob:', err);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleClosePdfViewer = () => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
    }
    setViewerModalSubmission(null);
    setPdfBlobUrl(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isGu ? 'gu-IN' : (i18n.language === 'hi' ? 'hi-IN' : 'en-US'), {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    switch (status) {
      case 'CHECKED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('status.CHECKED')}</span>
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileCheck className="w-3.5 h-3.5" />
            <span>{t('status.SUBMITTED')}</span>
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('status.LATE')}</span>
          </span>
        );
      default:
        const isPastDue = new Date() > new Date(dueDate);
        return (
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isPastDue
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}>
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{isPastDue ? t('status.LATE') : t('status.PENDING')}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>{t('title')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t('studentTitle')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('studentSubtitle')}</p>
        </div>
        <button
          onClick={fetchHomeworkData}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{tr('રિફ્રેશ કરો', 'Refresh')}</span>
        </button>
      </div>

      {/* Summary Metrics Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">{t('summary.totalAssigned')}</p>
            <p className="text-2xl font-bold text-white mt-1">{summary.totalAssigned}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">{t('summary.pending')}</p>
            <p className="text-2xl font-bold text-slate-200 mt-1">{summary.pending}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-blue-400 font-medium">{t('summary.submitted')}</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{summary.submitted}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-amber-400 font-medium">{t('summary.late')}</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{summary.late}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-emerald-400 font-medium">{t('summary.checked')}</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.checked}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-purple-400 font-medium">{t('summary.averageMarks')}</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{summary.averageMarksPercentage}%</p>
          </div>
        </div>
      )}

      {/* Filter & Search Controls */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('filters.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{t('filters.allStatuses')}</option>
            <option value="PENDING">{t('status.PENDING')}</option>
            <option value="SUBMITTED">{t('status.SUBMITTED')}</option>
            <option value="LATE">{t('status.LATE')}</option>
            <option value="CHECKED">{t('status.CHECKED')}</option>
          </select>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{t('filters.allSubjects')}</option>
            {uniqueSubjects.map(sub => (
              <option key={sub.id} value={sub.id}>
                {trSubject(sub)}
              </option>
            ))}
          </select>

          {(statusFilter !== 'ALL' || subjectFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSubjectFilter('ALL');
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

      {/* Homework Cards List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">{t('common:loading')}</p>
          </div>
        </div>
      ) : filteredHomeworks.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">
            {searchQuery || statusFilter !== 'ALL' || subjectFilter !== 'ALL'
              ? t('empty.noSubmissions')
              : t('empty.noHomeworkAssigned')}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {tr('તમારા શિક્ષક નવું ગૃહકાર્ય સોંપશે ત્યારે તે અહીં દેખાશે.', 'Assigned homework will appear here with instructions, due dates, and grading feedback.', 'जब आपके शिक्षक नया गृहकार्य आवंटित करेंगे तब वह यहाँ दिखाई देगा।')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHomeworks.map((hw) => {
            const hasSubmitted = !!hw.submission;
            const isEvaluated = hw.status === 'CHECKED';
            const isPastDue = new Date() > new Date(hw.dueDate);

            return (
              <div
                key={hw.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-5 backdrop-blur-sm"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold text-xs flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{trSubject({ name: hw.subjectName, nameGu: hw.subjectNameGu })}</span>
                      </span>
                      {hw.chapterName && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                          {trItem(hw.chapterNameGu, hw.chapterName)}
                        </span>
                      )}
                    </div>
                    <div>{getStatusBadge(hw.status, hw.dueDate)}</div>
                  </div>

                  {/* Title & Teacher */}
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                      {trItem(hw.titleGu, hw.title)}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('fields.teacher')}: <strong className="text-slate-300">{hw.teacherName}</strong></span>
                    </div>
                  </div>

                  {/* Instructions */}
                  {hw.instructions && (
                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                      <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                        {t('fields.instructions')}
                      </p>
                      <p>{trItem(hw.instructionsGu, hw.instructions)}</p>
                    </div>
                  )}

                  {/* Dates & Marks Meta Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">{t('fields.assignedDate')}</span>
                      <span className="font-semibold text-slate-200">{formatDate(hw.assignedDate)}</span>
                    </div>
                    <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">{t('fields.dueDate')}</span>
                      <span className={`font-semibold ${isPastDue && !hasSubmitted ? 'text-rose-400' : 'text-slate-200'}`}>
                        {formatDate(hw.dueDate)}
                      </span>
                    </div>
                    <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">{t('fields.maxMarks')}</span>
                      <span className="font-bold text-blue-400">{hw.maxMarks} {tr('ગુણ', 'Marks')}</span>
                    </div>
                  </div>

                  {/* Evaluated Marks & Teacher Feedback Card */}
                  {isEvaluated && hw.submission && (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                          <Award className="w-4 h-4" />
                          <span>{t('fields.marksObtained')}:</span>
                        </div>
                        <span className="text-base font-black text-emerald-300">
                          {hw.submission.marksObtained} / {hw.maxMarks}
                          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                            {Math.round(((hw.submission.marksObtained || 0) / hw.maxMarks) * 100)}%
                          </span>
                        </span>
                      </div>

                      {hw.submission.teacherFeedback && (
                        <div className="space-y-1 text-xs pt-1 border-t border-emerald-500/20">
                          <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{t('fields.teacherFeedback')}</span>
                          </span>
                          <p className="text-slate-200 italic pl-4 border-l-2 border-emerald-500/40">
                            "{hw.submission.teacherFeedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submission Info Bar */}
                  {hasSubmitted && hw.submission && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 bg-slate-800/30 px-3 py-2 rounded-xl border border-slate-800">
                      <div className="flex items-center space-x-2 truncate">
                        <FileCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={hw.submission.originalFileName}>
                          {hw.submission.originalFileName}
                        </span>
                      </div>
                      {hw.submission.submittedAt && (
                        <span>{t('fields.submittedDate')}: {formatDate(hw.submission.submittedAt)}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 justify-end items-center">
                  {hasSubmitted && hw.submission && (
                    <button
                      onClick={() =>
                        handleOpenPdfViewer(
                          hw.submission!.id,
                          hw.submission!.originalFileName,
                          trItem(hw.titleGu, hw.title)
                        )
                      }
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center space-x-2 border border-slate-700 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t('actions.viewPdf')}</span>
                    </button>
                  )}

                  {!hasSubmitted ? (
                    <button
                      onClick={() => handleOpenUpload(hw)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t('actions.submit')}</span>
                    </button>
                  ) : hw.allowResubmission ? (
                    <button
                      onClick={() => handleOpenUpload(hw)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-2 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('upload.replaceBtn')}</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Upload Modal */}
      {uploadModalHomework && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  {uploadModalHomework.submission ? t('upload.replaceBtn') : t('upload.dropzoneTitle')}
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {trItem(uploadModalHomework.titleGu, uploadModalHomework.title)}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {trSubject({ name: uploadModalHomework.subjectName, nameGu: uploadModalHomework.subjectNameGu })} • {uploadModalHomework.maxMarks} {tr('મહત્તમ ગુણ', 'Max Marks')}
                </p>
              </div>
              <button
                onClick={handleCloseUpload}
                disabled={uploading}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Re-submission warning if replacing */}
            {uploadModalHomework.submission && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>{t('upload.resubmitWarning')}</span>
              </div>
            )}

            {/* Drag & Drop Box */}
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-600/10'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-blue-400 mb-3 shadow-inner">
                  {selectedFile ? (
                    <FileCheck className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-400">{t('upload.selected')}:</p>
                    <p className="text-sm font-semibold text-white truncate max-w-xs mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatFileSize(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{t('upload.dropzoneSubtitle')}</p>
                    <p className="text-xs text-slate-400 font-medium">{t('upload.supportedFormat')}</p>
                  </div>
                )}
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span>{t('upload.uploading')}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Success Message */}
              {uploadSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseUpload}
                  disabled={uploading}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? t('upload.uploading') : t('upload.submitBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewerModalSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-3 truncate">
                <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-white text-sm sm:text-base truncate">
                    {viewerModalSubmission.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">{viewerModalSubmission.fileName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {pdfBlobUrl && (
                  <>
                    <a
                      href={pdfBlobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('viewer.openNewTab')}</span>
                    </a>
                    <a
                      href={pdfBlobUrl}
                      download={viewerModalSubmission.fileName}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('viewer.download')}</span>
                    </a>
                  </>
                )}
                <button
                  onClick={handleClosePdfViewer}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / PDF Frame */}
            <div className="flex-1 bg-slate-950 relative flex items-center justify-center">
              {loadingPdf ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-slate-400">{t('viewer.loading')}</p>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="PDF Preview"
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="p-6 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-xs text-slate-400">{t('viewer.fallbackMsg')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkPage;
