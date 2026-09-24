import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import api from '../services/api';
import {
  Library,
  Plus,
  Search,
  Filter,
  FileText,
  Video,
  Eye,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ExternalLink,
  ArrowLeft,
  X,
  UploadCloud,
  Check,
  BarChart3,
  Globe2,
  FolderTree,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface SubjectItem {
  id: string;
  name: string;
  nameGu?: string;
  code: string;
  chapters?: Array<{
    id: string;
    name: string;
    nameGu?: string;
    topics?: Array<{
      id: string;
      name: string;
      nameGu?: string;
    }>;
  }>;
}

interface MaterialItem {
  id: string;
  title: string;
  titleGu?: string;
  description?: string;
  descriptionGu?: string;
  subjectId: string;
  chapterId?: string;
  topicId?: string;
  standard: string;
  teacherId: string;
  pdfFilePath?: string;
  pdfFileName?: string;
  fileSizeBytes?: number;
  videoTitle?: string;
  videoUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  viewsCount: number;
  downloadsCount: number;
  videoClicksCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string; nameGu?: string; code: string };
  chapter?: { id: string; name: string; nameGu?: string };
  topic?: { id: string; name: string; nameGu?: string };
  videoMeta?: {
    isValid: boolean;
    isEmbeddable: boolean;
    embedUrl: string | null;
    originalUrl: string | null;
  };
}

export const TeacherStudyMaterialsPage: React.FC = () => {
  const { t, i18n } = useTranslation(['materials', 'common']);

  const [activeTab, setActiveTab] = useState<'LIST' | 'ADD_EDIT' | 'ANALYTICS'>('LIST');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Overview metrics state
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);
  const [subjectBreakdown, setSubjectBreakdown] = useState<any[]>([]);
  const [topMaterials, setTopMaterials] = useState<any[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [standardFilter, setStandardFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form State
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formTitleGu, setFormTitleGu] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDescriptionGu, setFormDescriptionGu] = useState('');
  const [formStandard, setFormStandard] = useState('Standard 8');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formChapterId, setFormChapterId] = useState('');
  const [formTopicId, setFormTopicId] = useState('');
  const [formVideoTitle, setFormVideoTitle] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'>('PUBLISHED');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Alert and feedback states
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preview Modal States
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [i18n.language]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [matRes, subRes, overRes] = await Promise.all([
        api.get('/study-materials/teacher/list'),
        api.get('/student/subjects'),
        api.get('/study-materials/teacher/overview')
      ]);

      setMaterials(matRes.data.materials || []);
      setSubjects(subRes.data.subjects || []);
      setOverviewMetrics(overRes.data.metrics || null);
      setSubjectBreakdown(overRes.data.subjectBreakdown || []);
      setTopMaterials(overRes.data.topAccessed || []);
    } catch (err) {
      console.error('Failed to load teacher study materials data:', err);
      showFeedback('error', t('messages.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4500);
  };

  // Cascading chapters and topics based on selected subject in form
  const currentSubjectObj = subjects.find(s => s.id === formSubjectId);
  const availableChapters = currentSubjectObj?.chapters || [];
  const currentChapterObj = availableChapters.find(c => c.id === formChapterId);
  const availableTopics = currentChapterObj?.topics || [];

  // Reset form
  const resetForm = () => {
    setEditingMaterial(null);
    setFormTitle('');
    setFormTitleGu('');
    setFormDescription('');
    setFormDescriptionGu('');
    setFormStandard('Standard 8');
    setFormSubjectId('');
    setFormChapterId('');
    setFormTopicId('');
    setFormVideoTitle('');
    setFormVideoUrl('');
    setFormStatus('PUBLISHED');
    setSelectedFile(null);
    setUploadProgress(0);
  };

  // Open Edit Mode
  const handleStartEdit = (mat: MaterialItem) => {
    setEditingMaterial(mat);
    setFormTitle(mat.title);
    setFormTitleGu(mat.titleGu || '');
    setFormDescription(mat.description || '');
    setFormDescriptionGu(mat.descriptionGu || '');
    setFormStandard(mat.standard || 'Standard 8');
    setFormSubjectId(mat.subjectId);
    setFormChapterId(mat.chapterId || '');
    setFormTopicId(mat.topicId || '');
    setFormVideoTitle(mat.videoTitle || '');
    setFormVideoUrl(mat.videoUrl || '');
    setFormStatus(mat.status);
    setSelectedFile(null);
    setActiveTab('ADD_EDIT');
  };

  // Handle PDF file selection (strictly PDF, NO size limit)
  const handleFileSelect = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      showFeedback('error', tr('કૃપા કરીને ફક્ત પીડીએફ (.pdf) ફાઇલ પસંદ કરો', 'Only PDF documents (.pdf) are allowed'));
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (targetStatus?: 'DRAFT' | 'PUBLISHED') => {
    if (!formTitle.trim() || !formSubjectId) {
      showFeedback('error', t('messages.titleSubjectRequired'));
      return;
    }

    const effectiveStatus = targetStatus || formStatus;
    setSubmitting(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('title', formTitle.trim());
    if (formTitleGu.trim()) formData.append('titleGu', formTitleGu.trim());
    if (formDescription.trim()) formData.append('description', formDescription.trim());
    if (formDescriptionGu.trim()) formData.append('descriptionGu', formDescriptionGu.trim());
    formData.append('standard', formStandard);
    formData.append('subjectId', formSubjectId);
    if (formChapterId) formData.append('chapterId', formChapterId);
    if (formTopicId) formData.append('topicId', formTopicId);
    if (formVideoTitle.trim()) formData.append('videoTitle', formVideoTitle.trim());
    if (formVideoUrl.trim()) formData.append('videoUrl', formVideoUrl.trim());
    formData.append('status', effectiveStatus);

    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      if (editingMaterial) {
        await api.put(`/study-materials/${editingMaterial.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          }
        });
        showFeedback('success', t('messages.updatedSuccess'));
      } else {
        await api.post('/study-materials', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          }
        });
        showFeedback('success', t('messages.createdSuccess'));
      }

      resetForm();
      await fetchInitialData();
      setActiveTab('LIST');
    } catch (err: any) {
      console.error('Save material error:', err);
      showFeedback('error', err.response?.data?.error || t('messages.errorOccurred'));
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Toggle Publish / Unpublish
  const handleToggleStatus = async (mat: MaterialItem, nextStatus: 'PUBLISHED' | 'UNPUBLISHED' | 'DRAFT') => {
    try {
      await api.patch(`/study-materials/${mat.id}/status`, { status: nextStatus });
      showFeedback('success', t('messages.statusChanged'));
      fetchInitialData();
    } catch (err: any) {
      console.error('Toggle status error:', err);
      showFeedback('error', err.response?.data?.error || t('messages.errorOccurred'));
    }
  };

  // Delete Material
  const handleDelete = async (mat: MaterialItem) => {
    const titleText = trItem(mat.titleGu, mat.title);
    const confirmMsg = tr(
      `શું તમે ખરેખર "${titleText}" અભ્યાસ સાહિત્ય કાઢી નાખવા માંગો છો? આ ક્રિયા કાયમી છે.`,
      `Are you sure you want to delete "${mat.title}"? This will permanently delete the PDF file and all records.`,
      `क्या आप वाकई "${titleText}" अध्ययन सामग्री हटाना चाहते हैं? यह क्रिया स्थायी है।`
    );

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/study-materials/${mat.id}`);
      showFeedback('success', t('messages.deletedSuccess'));
      fetchInitialData();
    } catch (err: any) {
      console.error('Delete error:', err);
      showFeedback('error', err.response?.data?.error || t('messages.errorOccurred'));
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async (mat: MaterialItem) => {
    setPreviewMaterial(mat);
    setPreviewPdfBlobUrl(null);

    if (mat.pdfFilePath) {
      setLoadingPdf(true);
      try {
        const res = await api.get(`/study-materials/${mat.id}/pdf`, {
          responseType: 'blob'
        });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewPdfBlobUrl(url);
      } catch (err) {
        console.error('Failed to load PDF preview blob:', err);
      } finally {
        setLoadingPdf(false);
      }
    }
  };

  const handleClosePreview = () => {
    if (previewPdfBlobUrl) {
      URL.revokeObjectURL(previewPdfBlobUrl);
    }
    setPreviewPdfBlobUrl(null);
    setPreviewMaterial(null);
  };

  // Filtered materials
  const filteredMaterials = materials.filter(m => {
    if (standardFilter !== 'ALL' && m.standard !== standardFilter) return false;
    if (subjectFilter !== 'ALL' && m.subjectId !== subjectFilter) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = trItem(m.titleGu, m.title).toLowerCase().includes(q);
      const matchSubject = (m.subject?.name || '').toLowerCase().includes(q);
      const matchChapter = (m.chapter?.name || '').toLowerCase().includes(q);
      const matchVideo = (m.videoTitle || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchChapter && !matchVideo) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Library className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">{t('teacherTitle')}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{t('teacherSubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              resetForm();
              setActiveTab('ADD_EDIT');
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addMaterial')}</span>
          </button>

          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('LIST')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'LIST'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('tabs.allMaterials')} ({materials.length})
            </button>
            <button
              onClick={() => setActiveTab('ANALYTICS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'ANALYTICS'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t('tabs.analytics')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 border transition-all ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* TAB 1: MATERIALS MANAGEMENT LIST */}
      {activeTab === 'LIST' && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          {overviewMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  {t('metrics.totalUploads')}
                </span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  {overviewMetrics.totalMaterials}
                </span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                  {t('metrics.published')}
                </span>
                <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
                  {overviewMetrics.publishedCount}
                </span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
                  {t('metrics.drafts')}
                </span>
                <span className="text-xl font-extrabold text-amber-400 mt-1 block">
                  {overviewMetrics.draftCount}
                </span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider block">
                  {t('metrics.totalViews')}
                </span>
                <span className="text-xl font-extrabold text-blue-400 mt-1 block">
                  {overviewMetrics.totalViews}
                </span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block">
                  {t('metrics.totalDownloads')}
                </span>
                <span className="text-xl font-extrabold text-purple-400 mt-1 block">
                  {overviewMetrics.totalDownloads}
                </span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-pink-400 uppercase font-bold tracking-wider block">
                  {t('metrics.videoClicks')}
                </span>
                <span className="text-xl font-extrabold text-pink-400 mt-1 block">
                  {overviewMetrics.totalVideoClicks}
                </span>
              </div>
            </div>
          )}

          {/* Search and Filters Bar */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('filters.searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={standardFilter}
                onChange={(e) => setStandardFilter(e.target.value)}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">{t('filters.allStandards')}</option>
                <option value="Standard 6">Standard 6</option>
                <option value="Standard 7">Standard 7</option>
                <option value="Standard 8">Standard 8</option>
              </select>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">{t('filters.allSubjects')}</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {trSubject(s)}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">{t('filters.allStatuses')}</option>
                <option value="PUBLISHED">{t('status.PUBLISHED')}</option>
                <option value="DRAFT">{t('status.DRAFT')}</option>
                <option value="UNPUBLISHED">{t('status.UNPUBLISHED')}</option>
              </select>

              {(searchQuery || standardFilter !== 'ALL' || subjectFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStandardFilter('ALL');
                    setSubjectFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-xs"
                  title={t('filters.clearFilters')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Table on Desktop / Responsive Cards on Mobile */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Library className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">{t('empty.noMaterialsTitle')}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{t('empty.noMaterialsSubtitle')}</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Material</th>
                      <th className="px-6 py-4">Class & Subject</th>
                      <th className="px-6 py-4">Chapter / Topic</th>
                      <th className="px-4 py-4 text-center">Resources</th>
                      <th className="px-4 py-4 text-center">Status</th>
                      <th className="px-4 py-4 text-center">Engagement</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredMaterials.map((mat) => {
                      const displayTitle = trItem(mat.titleGu, mat.title);
                      const displaySubject = trSubject(mat.subject) || '-';
                      const displayChapter = trItem(mat.chapter?.nameGu, mat.chapter?.name) || '-';
                      const displayTopic = trItem(mat.topic?.nameGu, mat.topic?.name) || '-';

                      return (
                        <tr key={mat.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 max-w-xs">
                            <span className="font-bold text-slate-100 block text-sm truncate" title={displayTitle}>
                              {displayTitle}
                            </span>
                            {mat.description && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5" title={mat.description}>
                                {mat.description}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-200 block">{displaySubject}</span>
                            <span className="text-[10px] text-slate-400 block">{mat.standard}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-300 block">{displayChapter}</span>
                            <span className="text-[10px] text-indigo-400 block truncate max-w-[140px]">{displayTopic}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {mat.pdfFilePath ? (
                                <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20" title="PDF Document Attached">
                                  <FileText className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[10px]">-</span>
                              )}
                              {mat.videoUrl ? (
                                <span className="p-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20" title="Video Lesson Attached">
                                  <Video className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[10px]">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${
                              mat.status === 'PUBLISHED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : mat.status === 'DRAFT'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-slate-700/40 text-slate-400 border-slate-600'
                            }`}>
                              {t(`status.${mat.status}`)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-[11px] text-slate-400 flex items-center justify-center space-x-3">
                              <span title="PDF Views" className="flex items-center space-x-1">
                                <Eye className="w-3 h-3 text-blue-400" />
                                <span>{mat.viewsCount}</span>
                              </span>
                              <span title="Downloads" className="flex items-center space-x-1">
                                <Download className="w-3 h-3 text-purple-400" />
                                <span>{mat.downloadsCount}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenPreview(mat)}
                                title={t('actions.viewDetails')}
                                className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleStartEdit(mat)}
                                title={t('actions.edit')}
                                className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {mat.status === 'PUBLISHED' ? (
                                <button
                                  onClick={() => handleToggleStatus(mat, 'UNPUBLISHED')}
                                  title={t('actions.unpublish')}
                                  className="p-2 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(mat, 'PUBLISHED')}
                                  title={t('actions.publish')}
                                  className="p-2 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(mat)}
                                title={t('actions.delete')}
                                className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="lg:hidden divide-y divide-slate-800">
                {filteredMaterials.map((mat) => {
                  const displayTitle = trItem(mat.titleGu, mat.title);
                  const displaySubject = trSubject(mat.subject);

                  return (
                    <div key={mat.id} className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                            {displaySubject} • {mat.standard}
                          </span>
                          <h4 className="font-bold text-sm text-white mt-0.5">{displayTitle}</h4>
                        </div>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border flex-shrink-0 ${
                          mat.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : mat.status === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-700/40 text-slate-400 border-slate-600'
                        }`}>
                          {t(`status.${mat.status}`)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-b border-slate-800/80 py-2">
                        <div className="flex items-center space-x-2">
                          {mat.pdfFilePath && <span className="text-rose-400 flex items-center space-x-1"><FileText className="w-3.5 h-3.5" /><span>PDF</span></span>}
                          {mat.videoUrl && <span className="text-red-400 flex items-center space-x-1"><Video className="w-3.5 h-3.5" /><span>Video</span></span>}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center space-x-1 text-slate-400"><Eye className="w-3 h-3 text-blue-400" /><span>{mat.viewsCount}</span></span>
                          <span className="flex items-center space-x-1 text-slate-400"><Download className="w-3 h-3 text-purple-400" /><span>{mat.downloadsCount}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          onClick={() => handleOpenPreview(mat)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-semibold flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{t('actions.viewDetails')}</span>
                        </button>
                        <button
                          onClick={() => handleStartEdit(mat)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-semibold flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{t('actions.edit')}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(mat)}
                          className="p-1.5 bg-rose-500/10 text-rose-400 rounded-xl"
                          title={t('actions.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADD / EDIT MATERIAL FORM */}
      {activeTab === 'ADD_EDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => { resetForm(); setActiveTab('LIST'); }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                title={t('backToMaterials')}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingMaterial ? t('editMaterial') : t('addMaterial')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {tr('વિદ્યાર્થીઓ માટે શૈક્ષણિક વિગતો, પીડીએફ અને વિડિયો ઉમેરો', 'Fill in the educational details, PDF document, and video lesson for your students')}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmitForm(); }} className="space-y-6">
            {/* Title English & Gujarati */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <span>{t('form.title')}</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={t('form.titlePlaceholder')}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t('form.titleGu')}</span>
                </label>
                <input
                  type="text"
                  value={formTitleGu}
                  onChange={(e) => setFormTitleGu(e.target.value)}
                  placeholder={t('form.titleGuPlaceholder')}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Standard and Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {t('form.standard')} <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formStandard}
                  onChange={(e) => setFormStandard(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Standard 6">Standard 6 (ધોરણ 6)</option>
                  <option value="Standard 7">Standard 7 (ધોરણ 7)</option>
                  <option value="Standard 8">Standard 8 (ધોરણ 8)</option>
                  <option value="ALL">All Standards (બધા ધોરણો)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {t('form.subject')} <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formSubjectId}
                  onChange={(e) => {
                    setFormSubjectId(e.target.value);
                    setFormChapterId('');
                    setFormTopicId('');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">{t('form.selectSubject')}</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {trSubject(s)} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cascading Chapter and Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t('form.chapter')}</span>
                </label>
                <select
                  value={formChapterId}
                  onChange={(e) => {
                    setFormChapterId(e.target.value);
                    setFormTopicId('');
                  }}
                  disabled={!formSubjectId || availableChapters.length === 0}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white disabled:opacity-50 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">{t('form.selectChapter')}</option>
                  {availableChapters.map(c => (
                    <option key={c.id} value={c.id}>
                      {trItem(c.nameGu, c.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {t('form.topic')}
                </label>
                <select
                  value={formTopicId}
                  onChange={(e) => setFormTopicId(e.target.value)}
                  disabled={!formChapterId || availableTopics.length === 0}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white disabled:opacity-50 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">{t('form.selectTopic')}</option>
                  {availableTopics.map(tItem => (
                    <option key={tItem.id} value={tItem.id}>
                      {trItem(tItem.nameGu, tItem.name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description (English & Gujarati) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">{t('form.description')}</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t('form.descriptionPlaceholder')}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t('form.descriptionGu')}</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescriptionGu}
                  onChange={(e) => setFormDescriptionGu(e.target.value)}
                  placeholder={t('form.descriptionGuPlaceholder')}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Section: Study Material PDF Upload (Zero size limit, strict PDF) */}
            <div className="space-y-3 pt-2">
              <label className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-rose-400" />
                <span>{t('form.pdfSection')}</span>
              </label>

              {editingMaterial?.pdfFileName && !selectedFile && (
                <div className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-rose-400" />
                    <span className="text-slate-300 font-medium">
                      {tr('હાલની પીડીએફ: ', 'Current PDF: ')}
                      <span className="font-bold text-white">{editingMaterial.pdfFileName}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-semibold">{t('actions.replacePdf')}</span>
                </div>
              )}

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-600/10'
                    : selectedFile
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'
                }`}
                onClick={() => document.getElementById('material-pdf-input')?.click()}
              >
                <input
                  id="material-pdf-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-100">{selectedFile.name}</p>
                      <p className="text-[11px] text-emerald-400 font-medium">{t('form.pdfOnlyNotice')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      className="text-[11px] text-rose-400 hover:underline pt-1"
                    >
                      {t('actions.cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">{t('form.pdfDragDrop')}</p>
                    <p className="text-[11px] text-slate-500">{t('form.pdfOnlyNotice')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Related Educational Video */}
            <div className="space-y-3 pt-2">
              <label className="text-sm font-bold text-white flex items-center space-x-2">
                <Video className="w-4 h-4 text-red-400" />
                <span>{t('form.videoSection')}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{t('form.videoTitle')}</label>
                  <input
                    type="text"
                    value={formVideoTitle}
                    onChange={(e) => setFormVideoTitle(e.target.value)}
                    placeholder={t('form.videoTitlePlaceholder')}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">{t('form.videoUrl')}</label>
                  <input
                    type="url"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder={t('form.videoUrlPlaceholder')}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">{t('form.videoHelper')}</p>

              {/* Real-time Video Preview */}
              {formVideoUrl && formVideoUrl.includes('youtube') && (
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{tr('YouTube વિડિયો ઓળખાયો (સીધો એમ્બેડ થશે)', 'YouTube video detected (will embed directly for students)')}</span>
                  </span>
                  <a
                    href={formVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Test Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Upload Progress Bar */}
            {submitting && uploadProgress > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-indigo-300">
                  <span>Uploading Material...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { resetForm(); setActiveTab('LIST'); }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-2xl transition-colors"
              >
                {t('actions.cancel')}
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitForm('DRAFT')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-2xl transition-all disabled:opacity-50"
                >
                  {t('actions.saveDraft')}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitForm('PUBLISHED')}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingMaterial ? t('actions.update') : t('actions.publishNow')}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ENGAGEMENT & ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Breakdown Chart */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>{tr('વિષય-વાર અભ્યાસ સાહિત્ય અને જોવાયેલ સંખ્યા', 'Materials & PDF Views by Subject')}</span>
              </h3>
              {subjectBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500 py-12 text-center">No data available yet</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectBreakdown.map((b: any) => ({ ...b, displayName: trSubject(b) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="displayName" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Legend />
                      <Bar dataKey="count" name={tr('કુલ સાહિત્ય', 'Materials Count')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="views" name={tr('કુલ વ્યુઝ', 'Total Views')} fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Accessed Materials */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>{t('metrics.topMaterials')}</span>
              </h3>
              {topMaterials.length === 0 ? (
                <p className="text-xs text-slate-500 py-12 text-center">No interaction data yet</p>
              ) : (
                <div className="space-y-3">
                  {topMaterials.map((tm, idx) => (
                    <div key={tm.id} className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="truncate">
                          <h5 className="font-bold text-xs text-white truncate">{trItem(tm.titleGu, tm.title)}</h5>
                          <span className="text-[10px] text-slate-400">{trSubject({ name: tm.subjectName, nameGu: tm.subjectNameGu })}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-xs flex-shrink-0 pl-2">
                        <span className="flex items-center space-x-1 text-blue-400" title="Views">
                          <Eye className="w-3 h-3" />
                          <span>{tm.viewsCount}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-purple-400" title="Downloads">
                          <Download className="w-3 h-3" />
                          <span>{tm.downloadsCount}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-pink-400" title="Video Clicks">
                          <Video className="w-3 h-3" />
                          <span>{tm.videoClicksCount}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW & DETAILS MODAL */}
      {previewMaterial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  {trSubject(previewMaterial.subject)} • {previewMaterial.standard}
                </span>
                <h3 className="text-base font-bold text-white">
                  {trItem(previewMaterial.titleGu, previewMaterial.title)}
                </h3>
              </div>
              <button
                onClick={handleClosePreview}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Description */}
              {(previewMaterial.description || previewMaterial.descriptionGu) && (
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <p>{trItem(previewMaterial.descriptionGu, previewMaterial.description)}</p>
                </div>
              )}

              {/* PDF Preview Section */}
              {previewMaterial.pdfFilePath && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-rose-400" />
                      <span>{previewMaterial.pdfFileName || 'PDF Study Material'}</span>
                    </h4>
                    <a
                      href={`/api/study-materials/${previewMaterial.id}/download`}
                      download
                      className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('actions.downloadPdf')}</span>
                    </a>
                  </div>

                  <div className="h-96 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                    {loadingPdf ? (
                      <div className="text-xs text-slate-400 flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span>{t('modal.loadingPdf')}</span>
                      </div>
                    ) : previewPdfBlobUrl ? (
                      <iframe
                        src={previewPdfBlobUrl}
                        title="Study Material PDF Preview"
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">PDF preview unavailable</span>
                    )}
                  </div>
                </div>
              )}

              {/* Video Preview Section */}
              {previewMaterial.videoUrl && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                    <Video className="w-4 h-4 text-red-400" />
                    <span>{previewMaterial.videoTitle || 'Educational Video Lesson'}</span>
                  </h4>

                  {previewMaterial.videoMeta?.isEmbeddable && previewMaterial.videoMeta.embedUrl ? (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                      <iframe
                        src={previewMaterial.videoMeta.embedUrl}
                        title={previewMaterial.videoTitle || 'Educational Video'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-300">External Educational Video Lesson</span>
                      <a
                        href={previewMaterial.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center space-x-1.5"
                      >
                        <span>{t('actions.watchVideo')}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudyMaterialsPage;
