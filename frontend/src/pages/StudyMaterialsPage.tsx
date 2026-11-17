import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import api from '../services/api';
import {
  Library,
  Search,
  Filter,
  FileText,
  Video,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  User,
  Sparkles,
  ExternalLink,
  X,
  BookOpen,
  ArrowRight,
  FolderTree,
  Check
} from 'lucide-react';

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
  pdfFilePath?: string;
  pdfFileName?: string;
  videoTitle?: string;
  videoUrl?: string;
  viewsCount: number;
  downloadsCount: number;
  videoClicksCount: number;
  publishedAt?: string;
  createdAt: string;
  subject?: { id: string; name: string; nameGu?: string; code: string; icon?: string };
  chapter?: { id: string; name: string; nameGu?: string };
  topic?: { id: string; name: string; nameGu?: string };
  teacher?: { id: string; name: string; email: string };
  videoMeta?: {
    isValid: boolean;
    isEmbeddable: boolean;
    embedUrl: string | null;
    originalUrl: string | null;
  };
  studentState?: {
    isStudied: boolean;
    hasViewed: boolean;
    hasDownloaded: boolean;
    hasWatchedVideo: boolean;
  };
}

interface RecommendationItem {
  material: MaterialItem;
  reason: string;
  reasonGu?: string;
  isWeakTopicMatch: boolean;
  accuracy?: number;
}

export const StudyMaterialsPage: React.FC = () => {
  const { t, i18n } = useTranslation('studyMaterials');

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');
  const [selectedChapterId, setSelectedChapterId] = useState('ALL');
  const [selectedTopicId, setSelectedTopicId] = useState('ALL');

  // Active Modals
  const [detailsMaterial, setDetailsMaterial] = useState<MaterialItem | null>(null);
  const [pdfViewerMaterial, setPdfViewerMaterial] = useState<MaterialItem | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [videoModalMaterial, setVideoModalMaterial] = useState<MaterialItem | null>(null);

  useEffect(() => {
    fetchStudentMaterialsData();
  }, [i18n.language]);

  const fetchStudentMaterialsData = async () => {
    setLoading(true);
    try {
      const [matRes, recRes, sumRes] = await Promise.all([
        api.get('/study-materials/student'),
        api.get('/study-materials/student/recommendations'),
        api.get('/study-materials/student/summary')
      ]);

      setMaterials(matRes.data.materials || []);
      setRecommendations(recRes.data.recommendations || []);
      setSummary(sumRes.data.summary || null);
    } catch (err) {
      console.error('Failed to load study materials:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Studied Status
  const handleToggleStudied = async (materialId: string) => {
    try {
      const res = await api.post(`/study-materials/${materialId}/event`, {
        eventType: 'STUDIED'
      });

      // Update local state
      setMaterials(prev => prev.map(m => {
        if (m.id === materialId) {
          const prevState = m.studentState || {
            isStudied: false,
            hasViewed: false,
            hasDownloaded: false,
            hasWatchedVideo: false
          };
          return {
            ...m,
            studentState: {
              ...prevState,
              isStudied: res.data.isStudied
            }
          };
        }
        return m;
      }));

      // Also update details modal if open
      if (detailsMaterial && detailsMaterial.id === materialId) {
        setDetailsMaterial(prev => prev ? {
          ...prev,
          studentState: {
            ...(prev.studentState || { hasViewed: false, hasDownloaded: false, hasWatchedVideo: false, isStudied: false }),
            isStudied: res.data.isStudied
          }
        } : null);
      }

      // Refresh summary counts
      const sumRes = await api.get('/study-materials/student/summary');
      setSummary(sumRes.data.summary || null);
    } catch (err) {
      console.error('Failed to toggle studied status:', err);
    }
  };

  // Open PDF Viewer Modal
  const handleOpenPdfViewer = async (mat: MaterialItem) => {
    setPdfViewerMaterial(mat);
    setLoadingPdf(true);
    setPdfBlobUrl(null);

    try {
      const res = await api.get(`/study-materials/${mat.id}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);

      // Update views count locally
      setMaterials(prev => prev.map(m => m.id === mat.id ? { ...m, viewsCount: m.viewsCount + 1 } : m));
    } catch (err) {
      console.error('Failed to stream PDF:', err);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleClosePdfViewer = () => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
    }
    setPdfBlobUrl(null);
    setPdfViewerMaterial(null);
  };

  // Open Video Player Modal
  const handleOpenVideo = (mat: MaterialItem) => {
    // Record video click event
    api.post(`/study-materials/${mat.id}/event`, { eventType: 'VIDEO_CLICK' }).catch(console.error);

    if (mat.videoMeta?.isEmbeddable && mat.videoMeta.embedUrl) {
      setVideoModalMaterial(mat);
    } else if (mat.videoUrl) {
      window.open(mat.videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Download PDF
  const handleDownloadPdf = async (mat: MaterialItem) => {
    try {
      const link = document.createElement('a');
      link.href = `/api/study-materials/${mat.id}/download`;
      link.setAttribute('download', mat.pdfFileName || 'study_material.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMaterials(prev => prev.map(m => m.id === mat.id ? { ...m, downloadsCount: m.downloadsCount + 1 } : m));
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Extract unique subjects, chapters, and topics for filter dropdowns
  const uniqueSubjects = Array.from(
    new Map(
      materials.map(m => [m.subjectId, { id: m.subjectId, name: m.subject?.name, nameGu: m.subject?.nameGu }])
    ).values()
  ).filter(s => s.name);

  const availableChapters = Array.from(
    new Map(
      materials
        .filter(m => selectedSubjectId === 'ALL' || m.subjectId === selectedSubjectId)
        .filter(m => m.chapterId && m.chapter)
        .map(m => [m.chapterId, { id: m.chapterId, name: m.chapter?.name, nameGu: m.chapter?.nameGu }])
    ).values()
  );

  const availableTopics = Array.from(
    new Map(
      materials
        .filter(m => selectedChapterId === 'ALL' || m.chapterId === selectedChapterId)
        .filter(m => m.topicId && m.topic)
        .map(m => [m.topicId, { id: m.topicId, name: m.topic?.name, nameGu: m.topic?.nameGu }])
    ).values()
  );

  // Filtered materials
  const filteredMaterials = materials.filter(m => {
    if (selectedSubjectId !== 'ALL' && m.subjectId !== selectedSubjectId) return false;
    if (selectedChapterId !== 'ALL' && m.chapterId !== selectedChapterId) return false;
    if (selectedTopicId !== 'ALL' && m.topicId !== selectedTopicId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = trItem(m.titleGu, m.title).toLowerCase().includes(q);
      const matchSubject = (m.subject?.name || '').toLowerCase().includes(q);
      const matchChapter = (m.chapter?.name || '').toLowerCase().includes(q);
      const matchTopic = (m.topic?.name || '').toLowerCase().includes(q);
      const matchTeacher = (m.teacher?.name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchChapter && !matchTopic && !matchTeacher) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900/50 via-slate-900 to-purple-900/30 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
              <Library className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide">{t('title')}</h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Summary Metrics Bar */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                {t('metrics.totalAvailable')}
              </span>
              <span className="text-xl font-extrabold text-white mt-0.5 block">
                {summary.totalAvailable}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-2xl">
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                {t('metrics.pdfCount')}
              </span>
              <span className="text-xl font-extrabold text-rose-400 mt-0.5 block">
                {summary.pdfCount}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-2xl">
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                {t('metrics.videoCount')}
              </span>
              <span className="text-xl font-extrabold text-red-400 mt-0.5 block">
                {summary.videoCount}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-2xl">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                {t('metrics.studiedCount')}
              </span>
              <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">
                {summary.studiedCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI WEAK-TOPIC RECOMMENDATION BANNER */}
      {recommendations.length > 0 && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider">{t('aiRecommended.badge')}</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t('aiRecommended.title')}</h3>
            <p className="text-xs text-slate-300 mt-0.5">{t('aiRecommended.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {recommendations.map((rec) => {
              const m = rec.material;
              const displayTitle = trItem(m.titleGu, m.title);
              const displaySubject = trSubject(m.subject) || '-';
              const reasonText = trItem(rec.reasonGu, rec.reason);

              return (
                <div
                  key={m.id}
                  className="bg-slate-900/80 border border-indigo-500/20 p-4 rounded-2xl flex flex-col justify-between hover:border-indigo-500/50 transition-all space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        {displaySubject}
                      </span>
                      {rec.accuracy !== undefined && (
                        <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-bold rounded-lg">
                          {t('aiRecommended.accuracy')}: {rec.accuracy}%
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug">{displayTitle}</h4>
                    <p className="text-[11px] text-indigo-200/80 italic">"{reasonText}"</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      {m.pdfFilePath && <span className="text-rose-400 font-semibold flex items-center space-x-1"><FileText className="w-3.5 h-3.5" /><span>PDF</span></span>}
                      {m.videoUrl && <span className="text-red-400 font-semibold flex items-center space-x-1"><Video className="w-3.5 h-3.5" /><span>Video</span></span>}
                    </div>
                    <button
                      onClick={() => setDetailsMaterial(m)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <span>{t('aiRecommended.openMaterial')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
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
          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedChapterId('ALL');
              setSelectedTopicId('ALL');
            }}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{t('filters.allSubjects')}</option>
            {uniqueSubjects.map(s => (
              <option key={s.id} value={s.id}>
                {trSubject(s)}
              </option>
            ))}
          </select>

          {/* Chapter Filter */}
          {availableChapters.length > 0 && (
            <select
              value={selectedChapterId}
              onChange={(e) => {
                setSelectedChapterId(e.target.value);
                setSelectedTopicId('ALL');
              }}
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">{t('filters.allChapters')}</option>
              {availableChapters.map(c => (
                <option key={c.id} value={c.id}>
                  {trItem(c.nameGu, c.name)}
                </option>
              ))}
            </select>
          )}

          {/* Clear Filters */}
          {(searchQuery || selectedSubjectId !== 'ALL' || selectedChapterId !== 'ALL' || selectedTopicId !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectId('ALL');
                setSelectedChapterId('ALL');
                setSelectedTopicId('ALL');
              }}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-xs"
              title={t('filters.clearFilters')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* STUDY MATERIAL CARDS GRID */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Library className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">{t('empty.noMaterialsTitle')}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{t('empty.noMaterialsSubtitle')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((mat) => {
            const displayTitle = trItem(mat.titleGu, mat.title);
            const displaySubject = trSubject(mat.subject) || '-';
            const displayChapter = trItem(mat.chapter?.nameGu, mat.chapter?.name);
            const displayTopic = trItem(mat.topic?.nameGu, mat.topic?.name);
            const isStudied = mat.studentState?.isStudied;

            return (
              <div
                key={mat.id}
                className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 hover:border-indigo-500/50 shadow-lg ${
                  isStudied ? 'border-emerald-500/30 bg-slate-900/90' : 'border-slate-800'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Subject Badge & Studied Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                      {displaySubject}
                    </span>

                    <button
                      onClick={() => handleToggleStudied(mat.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 border transition-all ${
                        isStudied
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title={isStudied ? t('actions.markUnstudied') : t('actions.markStudied')}
                    >
                      <Check className={`w-3 h-3 ${isStudied ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{isStudied ? tr('પૂર્ણ', 'Completed') : tr('અભ્યાસ બાકી', 'To Study')}</span>
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => setDetailsMaterial(mat)}
                      className="font-bold text-sm text-white hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
                    >
                      {displayTitle}
                    </h3>

                    {(displayChapter || displayTopic) && (
                      <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-1">
                        {displayChapter && <span className="truncate max-w-[120px]">{displayChapter}</span>}
                        {displayChapter && displayTopic && <span>›</span>}
                        {displayTopic && <span className="text-indigo-400 truncate max-w-[120px]">{displayTopic}</span>}
                      </div>
                    )}

                    {(mat.description || mat.descriptionGu) && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {trItem(mat.descriptionGu, mat.description)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Info & Actions */}
                <div className="space-y-3 pt-4 border-t border-slate-800/80 mt-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1 truncate max-w-[140px]">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{mat.teacher?.name || 'Teacher'}</span>
                    </div>

                    {mat.publishedAt && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(mat.publishedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {mat.pdfFilePath ? (
                      <button
                        onClick={() => handleOpenPdfViewer(mat)}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t('actions.viewPdf')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setDetailsMaterial(mat)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('actions.viewDetails')}</span>
                      </button>
                    )}

                    {mat.videoUrl ? (
                      <button
                        onClick={() => handleOpenVideo(mat)}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-red-600/20"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{t('actions.watchVideo')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setDetailsMaterial(mat)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <span>{t('actions.viewDetails')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL STUDY MATERIAL DETAILS MODAL */}
      {detailsMaterial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  {trSubject(detailsMaterial.subject)} • {detailsMaterial.standard}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  {trItem(detailsMaterial.titleGu, detailsMaterial.title)}
                </h2>
                {(detailsMaterial.chapter || detailsMaterial.topic) && (
                  <p className="text-xs text-slate-400 mt-1">
                    {trItem(detailsMaterial.chapter?.nameGu, detailsMaterial.chapter?.name)}
                    {detailsMaterial.topic && ` › ${trItem(detailsMaterial.topic?.nameGu, detailsMaterial.topic?.name)}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDetailsMaterial(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Description Box */}
              {(detailsMaterial.description || detailsMaterial.descriptionGu) && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    {trItem(detailsMaterial.descriptionGu, detailsMaterial.description)}
                  </div>
                </div>
              )}

              {/* PDF Resource Section */}
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-rose-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{tr('અભ્યાસ સાહિત્ય PDF', 'Study Material PDF', 'अध्ययन सामग्री पीडीएफ')}</h4>
                      <p className="text-[11px] text-slate-400">{detailsMaterial.pdfFileName || 'Document Available'}</p>
                    </div>
                  </div>
                </div>

                {detailsMaterial.pdfFilePath ? (
                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      onClick={() => handleOpenPdfViewer(detailsMaterial)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-600/20 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('actions.viewPdf')}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadPdf(detailsMaterial)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('actions.downloadPdf')}</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">{t('modal.noPdfAttached')}</p>
                )}
              </div>

              {/* Video Resource Section */}
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <Video className="w-5 h-5 text-red-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{tr('શૈક્ષણિક વિડિઓ', 'Related Educational Video', 'संबंधित शैक्षणिक वीडियो')}</h4>
                    <p className="text-[11px] text-slate-400">{detailsMaterial.videoTitle || 'Educational Video Lesson'}</p>
                  </div>
                </div>

                {detailsMaterial.videoUrl ? (
                  <div className="pt-1">
                    <button
                      onClick={() => handleOpenVideo(detailsMaterial)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-red-600/20 transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{t('actions.watchVideo')}</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">{t('modal.noVideoAttached')}</p>
                )}
              </div>

              {/* Upload Meta */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>{t('modal.uploadedBy')}: <strong className="text-slate-200">{detailsMaterial.teacher?.name || 'Teacher'}</strong></span>
                {detailsMaterial.publishedAt && (
                  <span>{t('modal.publishedOn')}: {new Date(detailsMaterial.publishedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
              <button
                onClick={() => handleToggleStudied(detailsMaterial.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                  detailsMaterial.studentState?.isStudied
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {detailsMaterial.studentState?.isStudied
                    ? t('actions.markUnstudied')
                    : t('actions.markStudied')
                  }
                </span>
              </button>

              <button
                onClick={() => setDetailsMaterial(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                {t('actions.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF VIEWER MODAL (Full In-Browser Reader) */}
      {pdfViewerMaterial && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate pr-4">
                <FileText className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span className="font-bold text-sm text-white truncate">
                  {trItem(pdfViewerMaterial.titleGu, pdfViewerMaterial.title)}
                </span>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => handleDownloadPdf(pdfViewerMaterial)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('actions.downloadPdf')}</span>
                </button>
                <button
                  onClick={handleClosePdfViewer}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
              {loadingPdf ? (
                <div className="text-xs text-slate-400 flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>{t('modal.loadingPdf')}</span>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="Study Material PDF"
                  className="w-full h-full border-0"
                />
              ) : (
                <span className="text-xs text-slate-500">Failed to load PDF</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIDEO PLAYER MODAL */}
      {videoModalMaterial && videoModalMaterial.videoMeta?.embedUrl && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate pr-4">
                <Video className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="font-bold text-sm text-white truncate">
                  {videoModalMaterial.videoTitle || trItem(videoModalMaterial.titleGu, videoModalMaterial.title)}
                </span>
              </div>
              <button
                onClick={() => setVideoModalMaterial(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              <iframe
                src={videoModalMaterial.videoMeta.embedUrl}
                title={videoModalMaterial.videoTitle || 'Educational Video Lesson'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterialsPage;
