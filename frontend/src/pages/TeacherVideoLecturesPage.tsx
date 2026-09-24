import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import api from '../services/api';
import {
  Video,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  X,
  UploadCloud,
  Check,
  AlertCircle,
  FileVideo,
  Play,
  Pause,
  Maximize2,
  BookOpen,
  Users
} from 'lucide-react';

interface SubjectItem {
  id: string;
  name: string;
  nameGu?: string;
  code: string;
  standard?: string;
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

interface VideoLectureItem {
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
  videoFilePath: string;
  videoFileName: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  mimeType: string;
  status: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string; nameGu?: string; code: string };
  chapter?: { id: string; name: string; nameGu?: string };
  topic?: { id: string; name: string; nameGu?: string };
  teacher?: { id: string; name: string; email?: string };
}

export const TeacherVideoLecturesPage: React.FC = () => {
  const { i18n } = useTranslation('common');

  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'LECTURES'>('UPLOAD');
  const [lectures, setLectures] = useState<VideoLectureItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Filters
  const [standardFilter, setStandardFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Form State
  const [title, setTitle] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionGu, setDescriptionGu] = useState('');
  const [standard, setStandard] = useState('Standard 8');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFilePreviewUrl, setVideoFilePreviewUrl] = useState<string | null>(null);

  // Status and Preview Modals
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastUploadedLecture, setLastUploadedLecture] = useState<{
    title: string;
    standard: string;
    subjectName: string;
    fileName: string;
    size: number;
    id?: string;
  } | null>(null);
  const [activePreviewLecture, setActivePreviewLecture] = useState<VideoLectureItem | null>(null);
  const [previewVideoError, setPreviewVideoError] = useState(false);
  const [previewRetryKey, setPreviewRetryKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [standardFilter, subjectFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lecturesRes, subjectsRes] = await Promise.all([
        api.get('/video-lectures/teacher/all', {
          params: {
            standard: standardFilter !== 'ALL' ? standardFilter : undefined,
            subjectId: subjectFilter !== 'ALL' ? subjectFilter : undefined
          }
        }),
        api.get('/student/subjects')
      ]);

      setLectures(lecturesRes.data.lectures || []);
      setSubjects(subjectsRes.data.subjects || []);
    } catch (err) {
      console.error('Failed to load video lectures data:', err);
      setErrorMsg(tr('વિડિઓ લેક્ચર્સ લોડ કરવામાં નિષ્ફળ', 'Failed to load video lectures'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');

      if (!isMp4) {
        setErrorMsg(
          tr(
            'કૃપા કરીને ફક્ત માન્ય MP4 (.mp4) વિડિઓ ફાઇલ અપલોડ કરો. અન્ય ફાઇલ પ્રકારો અથવા બાહ્ય લિંક્સ માન્ય નથી.',
            'Please upload a valid MP4 (.mp4) video file only. Other file types or external links are not allowed.'
          )
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setVideoFile(file);
      const preview = URL.createObjectURL(file);
      setVideoFilePreviewUrl(preview);
    }
  };

  const clearSelectedFile = () => {
    if (videoFilePreviewUrl) {
      URL.revokeObjectURL(videoFilePreviewUrl);
    }
    setVideoFile(null);
    setVideoFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubjectChange = (subjId: string) => {
    setSelectedSubjectId(subjId);
    setSelectedChapterId('');
    setSelectedTopicId('');
    const s = subjects.find(sub => sub.id === subjId);
    if (s && s.standard) {
      setStandard(s.standard);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');

    if (!videoFile) {
      setErrorMsg(
        tr(
          'કૃપા કરીને લેક્ચર માટે MP4 વિડિઓ ફાઇલ પસંદ કરો',
          'Please select an MP4 video file for the lecture'
        )
      );
      return;
    }

    if (!title.trim()) {
      setErrorMsg(
        tr('કૃપા કરીને વિડિઓ લેક્ચર શીર્ષક દાખલ કરો', 'Please enter a video lecture title')
      );
      return;
    }

    if (!selectedSubjectId) {
      setErrorMsg(tr('કૃપા કરીને વિષય પસંદ કરો', 'Please select a subject'));
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', title);
      formData.append('titleGu', titleGu || title);
      formData.append('standard', standard);
      formData.append('subjectId', selectedSubjectId);
      if (selectedChapterId) formData.append('chapterId', selectedChapterId);
      if (selectedTopicId) formData.append('topicId', selectedTopicId);
      if (description) formData.append('description', description);
      if (descriptionGu) formData.append('descriptionGu', descriptionGu);

      await api.post('/video-lectures/teacher/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      });

      const uploadedSub = subjects.find(s => s.id === selectedSubjectId);
      const uploadedSubjectName = trSubject(uploadedSub) || 'Subject';
      
      setLastUploadedLecture({
        title: trItem(titleGu, title),
        standard,
        subjectName: uploadedSubjectName,
        fileName: videoFile?.name || 'lecture.mp4',
        size: videoFile?.size || 0
      });

      const dispTitle = trItem(titleGu, title);
      setMsg(
        tr(
          `વિડિઓ લેક્ચર "${dispTitle}" સફળતાપૂર્વક અપલોડ કરવામાં આવ્યો!`,
          `Video lecture "${title}" uploaded successfully!`,
          `वीडियो लेक्चर "${dispTitle}" सफलतापूर्वक अपलोड किया गया!`
        )
      );

      // Reset form
      setTitle('');
      setTitleGu('');
      setDescription('');
      setDescriptionGu('');
      clearSelectedFile();
      // Stay on UPLOAD tab!
      setActiveTab('UPLOAD');
      fetchData();
    } catch (err: any) {
      console.error('Upload video lecture error:', err);
      setErrorMsg(
        err.response?.data?.error ||
          tr('વિડિઓ લેક્ચર અપલોડ કરવામાં નિષ્ફળ', 'Failed to upload video lecture')
      );
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteLecture = async (id: string, lectureTitle: string) => {
    const confirmMsg = tr(
      `શું તમે ખરેખર "${lectureTitle}" વિડિઓ લેક્ચર કાઢી નાખવા માંગો છો? આનાથી સર્વરમાંથી MP4 ફાઇલ પણ કાયમ માટે હટાવી દેવામાં આવશે.`,
      `Are you sure you want to delete video lecture "${lectureTitle}"? This will permanently delete the MP4 file from the server.`,
      `क्या आप वाकई "${lectureTitle}" वीडियो लेक्चर हटाना चाहते हैं? इससे सर्वर से MP4 फ़ाइल भी हमेशा के लिए हटा दी जाएगी।`
    );

    if (!window.confirm(confirmMsg)) return;

    setMsg('');
    setErrorMsg('');

    try {
      await api.delete(`/video-lectures/teacher/${id}`);
      setMsg(
        tr(
          `વિડિઓ લેક્ચર "${lectureTitle}" સફળતાપૂર્વક કાઢી નાખવામાં આવ્યો!`,
          `Video lecture "${lectureTitle}" deleted successfully!`,
          `वीडियो लेक्चर "${lectureTitle}" सफलतापूर्वक हटा दिया गया!`
        )
      );
      fetchData();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          tr('વિડિઓ લેક્ચર કાઢી નાખવામાં નિષ્ફળ', 'Failed to delete video lecture')
      );
    }
  };

  // Helper formatting
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const currentSubjectObj = subjects.find(s => s.id === selectedSubjectId);
  const currentChapterObj = currentSubjectObj?.chapters?.find(c => c.id === selectedChapterId);

  // Filtered lectures
  const filteredLectures = lectures.filter(l => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q) || (l.titleGu && l.titleGu.toLowerCase().includes(q));
      const matchSubj = l.subject?.name.toLowerCase().includes(q);
      const matchDesc = l.description?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchSubj && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img
            src="/school-logo.png"
            alt="School Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-xl"
          />
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
              <UploadCloud className="w-6 h-6 text-purple-400" />
              <span>{tr('વિડિઓ લેક્ચર અપલોડ કરો', 'Upload Video Lecture')}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                'ધોરણ ૬, ૭ અને ૮ ના વિદ્યાર્થીઓ માટે સીધા MP4 વિડિઓ લેક્ચર્સ અપલોડ કરો (લિંક વગર)',
                'Upload direct MP4 video lecture files for Standard 6, 7, and 8 students',
                'कक्षा 6, 7 और 8 के छात्रों के लिए सीधे MP4 वीडियो लेक्चर्स अपलोड करें (बिना लिंक)'
              )}
            </p>
          </div>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'UPLOAD'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>{tr('વિડિઓ લેક્ચર અપલોડ કરો', 'Upload Lecture')}</span>
          </button>

          <button
            onClick={() => setActiveTab('LECTURES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'LECTURES'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{tr('અગાઉના લેક્ચર્સ', 'Uploaded Lectures')} ({lectures.length})</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2 max-w-4xl mx-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Last Uploaded Lecture Card */}
      {lastUploadedLecture && (
        <div className="bg-purple-950/40 border border-purple-500/40 rounded-3xl p-5 max-w-4xl mx-auto flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-xs text-purple-300 font-bold">
                {tr('તાજેતરમાં અપલોડ કરેલો વિડિઓ લેક્ચર:', 'Newly Uploaded Lecture:')}
              </p>
              <p className="text-sm font-extrabold text-white truncate">{lastUploadedLecture.title}</p>
              <p className="text-[11px] text-slate-400">
                {lastUploadedLecture.standard} • {lastUploadedLecture.subjectName} • {formatBytes(lastUploadedLecture.size)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastUploadedLecture(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* METRIC SUMMARY CARDS (Shown on LECTURES tab only) */}
      {activeTab === 'LECTURES' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              {tr('કુલ વિડિઓ લેક્ચર્સ', 'Total Lectures')}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{lectures.length}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              {tr('ધોરણ ૬ લેક્ચર્સ', 'Standard 6')}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-1.5">
              {lectures.filter(l => l.standard === 'Standard 6').length}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              {tr('ધોરણ ૭ લેક્ચર્સ', 'Standard 7')}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1.5">
              {lectures.filter(l => l.standard === 'Standard 7').length}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              {tr('ધોરણ ૮ લેક્ચર્સ', 'Standard 8')}
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1.5">
              {lectures.filter(l => l.standard === 'Standard 8').length}
            </p>
          </div>
        </div>
      )}

      {/* 1. UPLOAD VIEW */}
      {activeTab === 'UPLOAD' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {tr('નવો MP4 વિડિઓ લેક્ચર અપલોડ કરો', 'Upload New MP4 Video Lecture')}
              </h2>
              <p className="text-xs text-slate-400">
                {tr(
                  'ફક્ત સ્થાનિક MP4 વિડિઓ ફાઇલ અપલોડ કરો. લિંક્સ અથવા અન્ય ફોર્મેટ્સ સ્વીકારવામાં આવતા નથી.',
                  'Direct local MP4 file upload only. No external URLs or other video formats.'
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* Title Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {tr('લેક્ચર શીર્ષક (English)', 'Lecture Title (English) *')}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 1: Algebraic Expressions & Identities"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {tr('લેક્ચર શીર્ષક (ગુજરાતી)', 'Lecture Title (Gujarati)')}
                </label>
                <input
                  type="text"
                  value={titleGu}
                  onChange={(e) => setTitleGu(e.target.value)}
                  placeholder="દા.ત. પ્રકરણ ૧: બૈજિક પદાવલિઓ અને નિત્યસમ"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Standard and Subject Selectors (Existing standards only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {tr('શૈક્ષણિક ધોરણ પસંદ કરો *', 'Academic Standard *')}
                </label>
                <select
                  value={standard}
                  onChange={(e) => {
                    setStandard(e.target.value);
                    setSelectedSubjectId('');
                    setSelectedChapterId('');
                    setSelectedTopicId('');
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="Standard 8">Standard 8 (ધોરણ ૮)</option>
                  <option value="Standard 7">Standard 7 (ધોરણ ૭)</option>
                  <option value="Standard 6">Standard 6 (ધોરણ ૬)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {tr('વિષય પસંદ કરો *', 'Select Subject *')}
                </label>
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="">-- {tr('વિષય પસંદ કરો', 'Select Subject')} --</option>
                  {subjects
                    .filter(s => !s.standard || s.standard === standard)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {trSubject(s)}
                      </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chapter & Topic (Optional) */}
            {currentSubjectObj && currentSubjectObj.chapters && currentSubjectObj.chapters.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {tr('પ્રકરણ (વૈકલ્પિક)', 'Chapter (Optional)')}
                  </label>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => {
                      setSelectedChapterId(e.target.value);
                      setSelectedTopicId('');
                    }}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">-- {tr('બધા પ્રકરણો', 'All Chapters')} --</option>
                    {currentSubjectObj.chapters.map(c => (
                      <option key={c.id} value={c.id}>
                        {trItem(c.nameGu, c.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {tr('મુદ્દો / Topic (વૈકલ્પિક)', 'Topic (Optional)')}
                  </label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    disabled={!selectedChapterId || !currentChapterObj?.topics?.length}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">-- {tr('બધા મુદ્દાઓ', 'All Topics')} --</option>
                    {currentChapterObj?.topics?.map(t => (
                      <option key={t.id} value={t.id}>
                        {trItem(t.nameGu, t.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* DIRECT MP4 FILE UPLOAD DROPZONE */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {tr('MP4 વિડિઓ ફાઇલ પસંદ કરો (Strictly .mp4, No links) *', 'MP4 Video Lecture File (Strictly .mp4, No links) *')}
              </label>

              {!videoFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-500/40 hover:border-purple-500 bg-purple-500/5 hover:bg-purple-500/10 rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center border border-purple-500/30">
                    <FileVideo className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {tr('MP4 વિડિઓ ફાઇલ અપલોડ કરવા ક્લિક કરો અથવા ડ્રેગ કરો', 'Click or Drag & Drop MP4 Video File')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {tr(
                        'ફક્ત .mp4 ફાઇલો સ્વીકારવામાં આવે છે • મહત્તમ ગુણવત્તા • સરળ બફરિંગ અને પ્લેબેક',
                        'Only .mp4 video files accepted • High speed HTTP 206 streaming enabled'
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
                  >
                    {tr('ફાઇલ બ્રાઉઝ કરો', 'Browse MP4 File')}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,.mp4"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="bg-slate-800/80 border border-purple-500/40 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="w-10 h-10 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center shrink-0">
                        <FileVideo className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{videoFile.name}</p>
                        <p className="text-[11px] text-slate-400">{formatBytes(videoFile.size)} • MP4 Video</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                      title={tr('ફાઇલ હટાવો', 'Remove file')}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Local Video Preview Player */}
                  {videoFilePreviewUrl && (
                    <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-64 mx-auto border border-slate-700">
                      <video
                        src={videoFilePreviewUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {tr('વિગત / વિષયવસ્તુ (English)', 'Description (English)')}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key concepts covered, formulas, derivation points..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {tr('વિગત / વિષયવસ્તુ (ગુજરાતી)', 'Description (Gujarati)')}
                </label>
                <textarea
                  rows={3}
                  value={descriptionGu}
                  onChange={(e) => setDescriptionGu(e.target.value)}
                  placeholder="મુખ્ય ખ્યાલો, સૂત્રો, દાખલાની ગણતરી..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Progress Bar */}
            {submitting && (
              <div className="space-y-2 p-4 bg-purple-950/40 border border-purple-800/60 rounded-2xl">
                <div className="flex justify-between text-xs font-bold text-purple-300">
                  <span>{tr('MP4 વિડિઓ અપલોડ થઈ રહ્યો છે...', 'Uploading MP4 video file...')}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  clearSelectedFile();
                  setActiveTab('LECTURES');
                }}
                className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-all"
              >
                {tr('રદ કરો', 'Cancel')}
              </button>

              <button
                type="submit"
                disabled={submitting || !videoFile}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{tr('અપલોડ થઈ રહ્યું છે...', 'Uploading...')}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>{tr('વિડિઓ લેક્ચર પ્રકાશિત કરો', 'Publish Video Lecture')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. LECTURES LIST VIEW */}
      {activeTab === 'LECTURES' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr('શીર્ષક અથવા વિષય દ્વારા વિડિઓ શોધો...', 'Search lectures by title or topic...')}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Standard Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {['ALL', 'Standard 6', 'Standard 7', 'Standard 8'].map((std) => (
                  <button
                    key={std}
                    onClick={() => setStandardFilter(std)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      standardFilter === std
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {std === 'ALL' ? tr('બધા ધોરણો', 'All Standards') : std}
                  </button>
                ))}
              </div>

              {/* Subject Filter Dropdown */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-purple-400" />
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="ALL">-- {tr('બધા વિષયો', 'All Subjects')} --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {trSubject(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lectures Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredLectures.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto border border-purple-500/20">
                <Video className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {tr('કોઈ વિડિઓ લેક્ચર્સ મળ્યા નથી', 'No Video Lectures Found')}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {tr(
                    'તમે હજુ સુધી આ ધોરણ માટે કોઈ MP4 વિડિઓ લેક્ચર્સ અપલોડ કર્યા નથી.',
                    'No MP4 video lectures uploaded for the selected filter criteria.'
                  )}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('UPLOAD')}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-md inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{tr('પ્રથમ MP4 વિડિઓ અપલોડ કરો', 'Upload First MP4 Video')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLectures.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Video Player Card Header */}
                    <div
                      onClick={() => setActivePreviewLecture(item)}
                      className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video group cursor-pointer border border-slate-800 flex items-center justify-center"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />
                      
                      {/* Play Button Overlay */}
                      <div className="w-12 h-12 bg-purple-600 group-hover:bg-purple-500 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all z-20">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 bg-purple-500/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-md">
                          {item.standard}
                        </span>
                        <span className="px-2.5 py-1 bg-slate-900/90 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700/60 backdrop-blur-md">
                          {trSubject(item.subject)}
                        </span>
                      </div>

                      {/* Bottom Info */}
                      <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-center text-[11px] text-slate-300 font-medium">
                        <span className="truncate pr-2">{item.videoFileName}</span>
                        <span className="shrink-0 bg-black/60 px-2 py-0.5 rounded text-[10px]">
                          {formatBytes(item.fileSizeBytes)}
                        </span>
                      </div>
                    </div>

                    {/* Title and Details */}
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1 hover:text-purple-400 transition-colors">
                        {trItem(item.titleGu, item.title)}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {trItem(item.descriptionGu, item.description)}
                        </p>
                      )}
                    </div>

                    {/* Chapter & Topic Tags */}
                    {(item.chapter || item.topic) && (
                      <div className="text-[11px] text-slate-400 space-y-1 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                        {item.chapter && (
                          <p className="truncate">
                            <span className="text-slate-500">{tr('પ્રકરણ: ', 'Chapter: ')}</span>
                            <span className="text-slate-300 font-medium">
                              {trItem(item.chapter.nameGu, item.chapter.name)}
                            </span>
                          </p>
                        )}
                        {item.topic && (
                          <p className="truncate">
                            <span className="text-slate-500">{tr('મુદ્દો: ', 'Topic: ')}</span>
                            <span className="text-slate-300 font-medium">
                              {trItem(item.topic.nameGu, item.topic.name)}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        {item.viewsCount} {tr('વ્યુઝ', 'Views')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActivePreviewLecture(item)}
                        className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{tr('ચલાવો', 'Play')}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteLecture(item.id, item.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title={tr('લેક્ચર કાઢી નાખો', 'Delete Lecture')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {activePreviewLecture && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 truncate">
                <Video className="w-5 h-5 text-purple-400 shrink-0" />
                <h3 className="text-sm font-bold text-white truncate">
                  {trItem(activePreviewLecture.titleGu, activePreviewLecture.title)}
                </h3>
              </div>
              <button
                onClick={() => setActivePreviewLecture(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="px-4">
              <div className="rounded-2xl overflow-hidden bg-black aspect-video w-full border border-slate-800 relative flex items-center justify-center">
                <video
                  key={`${activePreviewLecture.id}-${previewRetryKey}`}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  className="w-full h-full object-contain"
                  onError={() => setPreviewVideoError(true)}
                  onLoadedData={() => setPreviewVideoError(false)}
                >
                  <source
                    src={`/api/video-lectures/${activePreviewLecture.id}/stream`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>

                {previewVideoError && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                    <AlertCircle className="w-10 h-10 text-rose-400" />
                    <p className="text-sm font-bold text-white">
                      {tr('વિડિઓ લોડ કરવામાં સમસ્યા આવી', 'Unable to play video lecture')}
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {tr(
                        'કૃપા કરીને ફરીથી પ્રયાસ કરો અથવા નવી ટેબમાં સીધું ખોલો.',
                        'The browser could not initialize the video stream. Please retry or open in a new tab.'
                      )}
                    </p>
                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        onClick={() => {
                          setPreviewVideoError(false);
                          setPreviewRetryKey(k => k + 1);
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
                      >
                        {tr('ફરી પ્રયાસ કરો', 'Retry Playback')}
                      </button>
                      <a
                        href={`/api/video-lectures/${activePreviewLecture.id}/stream`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
                      >
                        {tr('નવી ટેબમાં ખોલો', 'Open in New Tab')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Info */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 font-bold rounded-lg border border-purple-500/30">
                  {activePreviewLecture.standard}
                </span>
                <span>
                  {trSubject(activePreviewLecture.subject)}
                </span>
                <span>•</span>
                <span>{activePreviewLecture.videoFileName}</span>
              </div>
              <div>
                <span>{formatBytes(activePreviewLecture.fileSizeBytes)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherVideoLecturesPage;
