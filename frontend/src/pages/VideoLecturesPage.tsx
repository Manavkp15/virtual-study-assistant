import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Video,
  Search,
  Play,
  X,
  BookOpen,
  Sparkles,
  Layers,
  AlertCircle,
  Folder,
  FolderOpen,
  ArrowLeft,
  ChevronRight,
  Eye,
  Film,
  GraduationCap
} from 'lucide-react';

interface SubjectItem {
  id: string;
  name: string;
  nameGu?: string;
  code: string;
  standard?: string;
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
  subject?: { id: string; name: string; nameGu?: string; code: string; standard?: string };
  chapter?: { id: string; name: string; nameGu?: string };
  topic?: { id: string; name: string; nameGu?: string };
  teacher?: { id: string; name: string };
}

// Color palette mapping helper for subject folder cards
const getSubjectTheme = (subjectName: string) => {
  const name = subjectName.toLowerCase();
  if (name.includes('math') || name.includes('ગણિત')) {
    return {
      bgCard: 'from-blue-900/30 to-indigo-950/40 border-blue-500/30 hover:border-blue-400',
      folderBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40 group-hover:bg-blue-500/30',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30',
      accent: 'text-blue-400'
    };
  }
  if (name.includes('science') || name.includes('વિજ્ઞાન')) {
    return {
      bgCard: 'from-emerald-900/30 to-teal-950/40 border-emerald-500/30 hover:border-emerald-400',
      folderBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 group-hover:bg-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
      accent: 'text-emerald-400'
    };
  }
  if (name.includes('english') || name.includes('અંગ્રેજી')) {
    return {
      bgCard: 'from-amber-900/30 to-orange-950/40 border-amber-500/30 hover:border-amber-400',
      folderBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40 group-hover:bg-amber-500/30',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      btn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
      accent: 'text-amber-400'
    };
  }
  if (name.includes('social') || name.includes('સમાજ') || name.includes('સામાજિક')) {
    return {
      bgCard: 'from-rose-900/30 to-red-950/40 border-rose-500/30 hover:border-rose-400',
      folderBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40 group-hover:bg-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
      accent: 'text-rose-400'
    };
  }
  if (name.includes('gujarati') || name.includes('ગુજરાતી')) {
    return {
      bgCard: 'from-purple-900/30 to-violet-950/40 border-purple-500/30 hover:border-purple-400',
      folderBg: 'bg-purple-500/20 text-purple-400 border-purple-500/40 group-hover:bg-purple-500/30',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      btn: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
      accent: 'text-purple-400'
    };
  }
  if (name.includes('hindi') || name.includes('હિન્દી')) {
    return {
      bgCard: 'from-cyan-900/30 to-sky-950/40 border-cyan-500/30 hover:border-cyan-400',
      folderBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 group-hover:bg-cyan-500/30',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      btn: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30',
      accent: 'text-cyan-400'
    };
  }
  if (name.includes('sanskrit') || name.includes('સંસ્કૃત')) {
    return {
      bgCard: 'from-teal-900/30 to-emerald-950/40 border-teal-500/30 hover:border-teal-400',
      folderBg: 'bg-teal-500/20 text-teal-400 border-teal-500/40 group-hover:bg-teal-500/30',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      btn: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30',
      accent: 'text-teal-400'
    };
  }
  return {
    bgCard: 'from-slate-900 to-slate-950 border-slate-800 hover:border-blue-500/40',
    folderBg: 'bg-blue-600/20 text-blue-400 border-blue-500/30 group-hover:bg-blue-600/30',
    badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30',
    accent: 'text-blue-400'
  };
};

export const VideoLecturesPage: React.FC = () => {
  const { user, token } = useAuth();
  const { i18n } = useTranslation('common');

  const isTeacherOrAdmin = user?.role === 'ADMIN';
  // Existing student enrolled standard
  const userStandard = user?.profile?.standard || 'Standard 8';

  const [lectures, setLectures] = useState<VideoLectureItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [existingStandards, setExistingStandards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // For students: strictly lock activeStandard to their existing standard
  const [activeStandard, setActiveStandard] = useState<string>(userStandard);
  const [selectedFolderSubject, setSelectedFolderSubject] = useState<SubjectItem | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'FOLDERS' | 'ALL'>('FOLDERS');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Video Player Modal State
  const [activeLecture, setActiveLecture] = useState<VideoLectureItem | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [videoError, setVideoError] = useState(false);
  const [videoRetryKey, setVideoRetryKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchLectures();
    fetchSubjects(activeStandard);
  }, [activeStandard]);

  const fetchSubjects = async (std?: string) => {
    try {
      const res = await api.get('/student/subjects', {
        params: { standard: isTeacherOrAdmin ? (std || activeStandard) : userStandard }
      });
      setSubjects(res.data.subjects || []);
      if (res.data.existingStandards) {
        setExistingStandards(res.data.existingStandards);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const res = await api.get('/video-lectures/student', {
        params: {
          standard: isTeacherOrAdmin ? activeStandard : userStandard
        }
      });
      setLectures(res.data.lectures || []);
      if (res.data.existingStandards) {
        setExistingStandards(res.data.existingStandards);
      }
    } catch (err) {
      console.error('Failed to load student video lectures:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLecture = async (lecture: VideoLectureItem) => {
    setActiveLecture(lecture);
    setPlaybackSpeed(1);
    setVideoError(false);
    setVideoRetryKey(0);

    // Track video view
    try {
      await api.post(`/video-lectures/${lecture.id}/view`, { watchDurationSeconds: 1 });
      setLectures(prev =>
        prev.map(item => (item.id === lecture.id ? { ...item, viewsCount: item.viewsCount + 1 } : item))
      );
    } catch (err) {
      console.warn('Failed to track video view:', err);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  // Group lectures by subject ID for folder counts
  const lecturesCountBySubject = lectures.reduce((acc, l) => {
    acc[l.subjectId] = (acc[l.subjectId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Only show subjects that have uploaded video lectures
  const uploadedSubjects = subjects.filter(
    subject => (lecturesCountBySubject[subject.id] || 0) > 0
  );

  // Compute lectures inside current folder
  const currentFolderLectures = lectures.filter(item => {
    if (!selectedFolderSubject) return true;
    return item.subjectId === selectedFolderSubject.id;
  });

  // Extract distinct chapters in the selected folder
  const availableChaptersInFolder = Array.from(
    new Map(
      currentFolderLectures
        .filter(l => l.chapter && l.chapterId)
        .map(l => [l.chapterId!, l.chapter!])
    ).values()
  );

  // Filter lectures inside folder by chapter & search
  const filteredInFolderLectures = currentFolderLectures.filter(item => {
    if (selectedChapterId !== 'ALL' && item.chapterId !== selectedChapterId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle =
        item.title.toLowerCase().includes(q) ||
        (item.titleGu && item.titleGu.toLowerCase().includes(q));
      const matchSubj = item.subject?.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchSubj && !matchDesc) return false;
    }
    return true;
  });

  // Flat filtered lectures when in "ALL" view or searching across all folders
  const allFilteredLectures = lectures.filter(item => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle =
        item.title.toLowerCase().includes(q) ||
        (item.titleGu && item.titleGu.toLowerCase().includes(q));
      const matchSubj =
        item.subject?.name.toLowerCase().includes(q) ||
        (item.subject?.nameGu && item.subject.nameGu.toLowerCase().includes(q));
      const matchDesc = item.description?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchSubj && !matchDesc) return false;
    }
    return true;
  });

  // Open a specific subject folder
  const handleOpenFolder = (subject: SubjectItem) => {
    setSelectedFolderSubject(subject);
    setSelectedChapterId('ALL');
    setViewMode('FOLDERS');
  };

  // Close folder and return to folder list
  const handleBackToFolders = () => {
    setSelectedFolderSubject(null);
    setSelectedChapterId('ALL');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* TOP HERO BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            {/* Standard Badge: Displays strictly the student's existing standard */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-300">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>
                {tr(`તમારું ધોરણ: ${userStandard}`, `Your Academic Standard: ${userStandard}`)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-3">
              <Video className="w-8 h-8 text-blue-400" />
              <span>{tr('વિડિઓ લેક્ચર્સ લાયબ્રેરી', 'Video Lectures Library')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {tr(
                `શિક્ષકો દ્વારા અપલોડ કરાયેલા તમારા ધોરણ (${userStandard}) ના વિષયવાર વિડિઓ લેક્ચર્સ. કોઈપણ વિષયનું ફોલ્ડર ખોલીને સરળતાથી શીખો.`,
                `Video lectures for your grade (${userStandard}) organized cleanly into Subject Folders. Click any subject folder to access your lectures.`,
                `शिक्षकों द्वारा अपलोड किए गए आपकी कक्षा (${userStandard}) के विषयवार वीडियो लेक्चर्स। किसी भी विषय का फ़ोल्डर खोलकर आसानी से सीखें।`
              )}
            </p>
          </div>

          {/* For Teachers / Admins ONLY: Switcher for actually existing standards */}
          {isTeacherOrAdmin && existingStandards.length > 0 && (
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1.5 self-start md:self-auto">
              {existingStandards.map(std => (
                <button
                  key={std}
                  onClick={() => {
                    setActiveStandard(std);
                    setSelectedFolderSubject(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeStandard === std
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {std}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* VIEW SELECTOR & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                selectedFolderSubject
                  ? tr(
                      `${selectedFolderSubject.nameGu || selectedFolderSubject.name} ફોલ્ડરમાં વિડિઓ શોધો...`,
                      `Search inside ${selectedFolderSubject.name} folder...`,
                      `${trSubject(selectedFolderSubject)} फ़ोल्डर में वीडियो खोजें...`
                    )
                  : tr(
                      'વિડિઓ લેક્ચરનું શીર્ષક અથવા વિષય શોધો...',
                      'Search lectures by title, topic, or keyword...',
                      'वीडियो लेक्चर का शीर्षक या विषय खोजें...'
                    )
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setViewMode('FOLDERS');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                viewMode === 'FOLDERS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>{tr('વિષય ફોલ્ડર્સ', 'Subject Folders')}</span>
            </button>

            <button
              onClick={() => {
                setViewMode('ALL');
                setSelectedFolderSubject(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                viewMode === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>
                {tr(`બધા વિડિઓઝ (${lectures.length})`, `All Lectures (${lectures.length})`)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">
            {tr('વિડિઓ લેક્ચર્સ લોડ થઈ રહ્યા છે...', 'Loading video lectures...')} 
          </p>
        </div>
      ) : viewMode === 'FOLDERS' && !selectedFolderSubject && !searchQuery ? (
        /* ========================================================================= */
        /* VIEW 1: SUBJECT FOLDERS (EXISTING STANDARD & UPLOADED LECTURES ONLY)       */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Folder className="w-5 h-5 text-blue-400" />
                <span>
                  {tr(`${userStandard} - વિષયવાર ફોલ્ડર્સ`, `${userStandard} - Subject Folders`)}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {tr(
                  'જે વિષયના વિડિઓ લેક્ચર્સ અપલોડ થયેલા છે તે ફોલ્ડર પર ક્લિક કરો.',
                  'Click on any subject folder to view its uploaded video lectures.',
                  'जिस विषय के वीडियो लेक्चर्स अपलोड किए गए हैं उस फ़ोल्डर पर क्लिक करें।'
                )}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300 self-start sm:self-auto">
              {uploadedSubjects.length} {tr('વિષયોના લેક્ચર્સ ઉપલબ્ધ', 'Subjects Available')}
            </span>
          </div>

          {uploadedSubjects.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Folder className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">
                {tr('હજુ સુધી કોઈ વિડિઓ લેક્ચર અપલોડ થયેલ નથી', 'No Video Lectures Uploaded Yet')}
              </h3>
              <p className="text-xs text-slate-400">
                {tr(
                  `${userStandard} માટે શિક્ષકો દ્વારા વિડિઓ લેક્ચર અપલોડ કરવામાં આવશે ત્યારે અહીં દેખાશે.`,
                  `Uploaded video lectures for ${userStandard} will appear here.`,
                  `${userStandard} के लिए शिक्षकों द्वारा वीडियो लेक्चर अपलोड किए जाने पर यहाँ दिखाई देंगे।`
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {uploadedSubjects.map(subject => {
                const count = lecturesCountBySubject[subject.id] || 0;
                const theme = getSubjectTheme(subject.name);

                return (
                  <div
                    key={subject.id}
                    onClick={() => handleOpenFolder(subject)}
                    className={`group relative rounded-3xl p-6 bg-gradient-to-br ${theme.bgCard} border shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 hover:-translate-y-1`}
                  >
                    {/* Top Folder Header */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${theme.folderBg}`}
                      >
                        <Folder className="w-7 h-7" />
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${theme.badge}`}
                      >
                        {tr(`${count} લેક્ચર્સ`, `${count} Lectures`)}
                      </span>
                    </div>

                    {/* Subject Names */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-extrabold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                        {trSubject(subject)}
                      </h3>
                      {subject.nameGu && (
                        <p className="text-xs text-slate-400 font-medium">
                          {i18n.language === 'gu' ? subject.name : (i18n.language === 'hi' ? subject.name : subject.nameGu)}
                        </p>
                      )}
                    </div>

                    {/* Folder Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>{subject.standard || userStandard}</span>
                      </span>

                      <div className="flex items-center space-x-1 text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                        <span>{tr('ખોલો', 'Open')}</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : selectedFolderSubject ? (
        /* ========================================================================= */
        /* VIEW 2: INSIDE A SELECTED SUBJECT FOLDER                                  */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Breadcrumb & Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackToFolders}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700 shrink-0 flex items-center space-x-1.5 text-xs font-bold"
                title={tr('બધા ફોલ્ડર્સ પર પાછા જાઓ', 'Back to all folders')}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {tr('બધા ફોલ્ડર્સ', 'All Folders')}
                </span>
              </button>

              <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-400 font-medium overflow-hidden">
                <span
                  onClick={handleBackToFolders}
                  className="cursor-pointer hover:text-blue-400 transition-colors shrink-0"
                >
                  {tr('વિડિઓ લાયબ્રેરી', 'Video Library')}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <div className="flex items-center space-x-1.5 text-white font-bold truncate">
                  <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="truncate">
                    {trSubject(selectedFolderSubject)}
                  </span>
                </div>
              </div>
            </div>

            {/* Folder Count Badge */}
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5" />
                <span>
                  {currentFolderLectures.length}{' '}
                  {tr('વિડિઓ લેક્ચર્સ', 'Lectures in this folder')}
                </span>
              </span>
            </div>
          </div>

          {/* Chapter Filter Pills (if folder contains chapters) */}
          {availableChaptersInFolder.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center space-x-2 overflow-x-auto">
              <span className="text-xs text-slate-400 font-bold shrink-0 px-2 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5" />
                <span>{tr('પ્રકરણ:', 'Chapter:')}</span>
              </span>
              <button
                onClick={() => setSelectedChapterId('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedChapterId === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tr('બધા પ્રકરણો', 'All Chapters')}
              </button>
              {availableChaptersInFolder.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedChapterId === ch.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {trItem(ch.nameGu, ch.name)}
                </button>
              ))}
            </div>
          )}

          {/* Videos Grid for Selected Folder */}
          {filteredInFolderLectures.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
                <FolderOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {tr(
                    'આ ફોલ્ડરમાં હજુ કોઈ વિડિઓ લેક્ચર ઉપલબ્ધ નથી',
                    'No Video Lectures in this Folder Yet',
                    'इस फ़ोल्डर में अभी कोई वीडियो लेक्चर उपलब्ध नहीं है'
                  )}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {tr(
                    'શિક્ષકો ટૂંક સમયમાં આ વિષય માટે નવા વિડિઓ લેક્ચર્સ અપલોડ કરશે.',
                    'Teachers will upload lectures for this subject soon. Please check back later.',
                    'शिक्षक जल्द ही इस विषय के लिए नए वीडियो लेक्चर्स अपलोड करेंगे।'
                  )}
                </p>
              </div>
              <button
                onClick={handleBackToFolders}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{tr('અન્ય ફોલ્ડર પસંદ કરો', 'Browse Other Folders')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInFolderLectures.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-3xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Video Card Thumbnail Box */}
                    <div
                      onClick={() => handleOpenLecture(item)}
                      className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video cursor-pointer border border-slate-800 flex items-center justify-center group-hover:border-blue-500/50 transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent z-10" />

                      {/* Play Button */}
                      <div className="w-14 h-14 bg-blue-600 group-hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-all z-20">
                        <Play className="w-6 h-6 ml-1 fill-current" />
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 bg-blue-600/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-md shadow-md">
                          {item.standard}
                        </span>
                        <span className="px-2.5 py-1 bg-slate-900/90 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700/60 backdrop-blur-md">
                          {trSubject(item.subject)}
                        </span>
                      </div>

                      {/* Bottom Info */}
                      <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-center text-[11px] text-slate-300 font-medium">
                        <span className="truncate pr-2">{item.videoFileName}</span>
                        <span className="shrink-0 bg-black/70 px-2 py-0.5 rounded text-[10px] text-slate-300">
                          {formatBytes(item.fileSizeBytes)}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h3
                        onClick={() => handleOpenLecture(item)}
                        className="text-sm font-bold text-white cursor-pointer hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {trItem(item.titleGu, item.title)}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {trItem(item.descriptionGu, item.description)}
                        </p>
                      )}
                    </div>

                    {/* Chapter & Topic Details */}
                    {(item.chapter || item.topic) && (
                      <div className="text-[11px] text-slate-400 space-y-1 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                        {item.chapter && (
                          <p className="truncate">
                            <span className="text-slate-500">
                              {tr('પ્રકરણ: ', 'Chapter: ')}
                            </span>
                            <span className="text-slate-300 font-medium">
                              {trItem(item.chapter.nameGu, item.chapter.name)
                                ? item.chapter.nameGu
                                : item.chapter.name}
                            </span>
                          </p>
                        )}
                        {item.topic && (
                          <p className="truncate">
                            <span className="text-slate-500">
                              {tr('મુદ્દો: ', 'Topic: ')}
                            </span>
                            <span className="text-slate-300 font-medium">
                              {trItem(item.topic.nameGu, item.topic.name)
                                ? item.topic.nameGu
                                : item.topic.name}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        {item.viewsCount} {tr('વખત જોવાયેલ', 'Views')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenLecture(item)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{tr('વિડિઓ જુઓ', 'Watch Lecture')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 3: ALL LECTURES LIST / SEARCH RESULTS                                */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Video className="w-5 h-5 text-blue-400" />
                <span>
                  {searchQuery
                    ? tr(
                        `શોધ પરિણામો ("${searchQuery}")`,
                        `Search Results ("${searchQuery}")`,
                        `खोज परिणाम ("${searchQuery}")`
                      )
                    : tr(
                        `${userStandard} - તમામ વિડિઓ લેક્ચર્સ`,
                        `${userStandard} - All Video Lectures`,
                        `${userStandard} - सभी वीडियो लेक्चर्स`
                      )}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {tr(
                  `તમારા ધોરણ (${userStandard}) ના તમામ ઉપલબ્ધ વિડિઓ લેક્ચર્સ.`,
                  `All available video lectures for your grade (${userStandard}).`,
                  `आपकी कक्षा (${userStandard}) के सभी उपलब्ध वीडियो लेक्चर्स।`
                )}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300 self-start sm:self-auto">
              {allFilteredLectures.length} {tr('લેક્ચર્સ મળ્યા', 'Lectures Found')}
            </span>
          </div>

          {allFilteredLectures.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                <Video className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {tr('કોઈ વિડિઓ લેક્ચર્સ મળ્યા નથી', 'No Video Lectures Found')}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {searchQuery
                    ? tr(
                        `"${searchQuery}" માટે કોઈ પરિણામ મળ્યું નથી.`,
                        `No results found matching "${searchQuery}".`,
                        `"${searchQuery}" के लिए कोई परिणाम नहीं मिला।`
                      )
                    : tr(
                        `${userStandard} માટે કોઈ વિડિઓ લેક્ચર મળ્યા નથી.`,
                        `No video lectures found for ${userStandard}.`,
                        `${userStandard} के लिए कोई वीडियो लेक्चर नहीं मिला।`
                      )}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allFilteredLectures.map(item => {
                const matchedSubject = subjects.find(s => s.id === item.subjectId);

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-3xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Video Card Thumbnail Box */}
                      <div
                        onClick={() => handleOpenLecture(item)}
                        className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video cursor-pointer border border-slate-800 flex items-center justify-center group-hover:border-blue-500/50 transition-all"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent z-10" />

                        {/* Play Button */}
                        <div className="w-14 h-14 bg-blue-600 group-hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-all z-20">
                          <Play className="w-6 h-6 ml-1 fill-current" />
                        </div>

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 bg-blue-600/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-md shadow-md">
                            {item.standard}
                          </span>

                          {matchedSubject && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleOpenFolder(matchedSubject);
                              }}
                              className="px-2.5 py-1 bg-slate-900/90 hover:bg-blue-600 text-slate-200 hover:text-white text-[10px] font-bold rounded-lg border border-slate-700/60 backdrop-blur-md flex items-center space-x-1 transition-colors"
                              title={tr('વિષય ફોલ્ડર ખોલો', 'Open Subject Folder')}
                            >
                              <Folder className="w-3 h-3" />
                              <span>
                                {trSubject(item.subject)}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Bottom Info */}
                        <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-center text-[11px] text-slate-300 font-medium">
                          <span className="truncate pr-2">{item.videoFileName}</span>
                          <span className="shrink-0 bg-black/70 px-2 py-0.5 rounded text-[10px] text-slate-300">
                            {formatBytes(item.fileSizeBytes)}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <h3
                          onClick={() => handleOpenLecture(item)}
                          className="text-sm font-bold text-white cursor-pointer hover:text-blue-400 transition-colors line-clamp-1"
                        >
                          {trItem(item.titleGu, item.title)}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {trItem(item.descriptionGu, item.description)}
                          </p>
                        )}
                      </div>

                      {/* Chapter & Topic Details */}
                      {(item.chapter || item.topic) && (
                        <div className="text-[11px] text-slate-400 space-y-1 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                          {item.chapter && (
                            <p className="truncate">
                              <span className="text-slate-500">
                                {tr('પ્રકરણ: ', 'Chapter: ')}
                              </span>
                              <span className="text-slate-300 font-medium">
                                {trItem(item.chapter.nameGu, item.chapter.name)}
                              </span>
                            </p>
                          )}
                          {item.topic && (
                            <p className="truncate">
                              <span className="text-slate-500">
                                {tr('મુદ્દો: ', 'Topic: ')}
                              </span>
                              <span className="text-slate-300 font-medium">
                                {trItem(item.topic.nameGu, item.topic.name)}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>
                          {item.viewsCount} {tr('વખત જોવાયેલ', 'Views')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenLecture(item)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{tr('વિડિઓ જુઓ', 'Watch Lecture')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE VIDEO STREAMING PLAYER MODAL                                 */}
      {/* ========================================================================= */}
      {activeLecture && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-5xl w-full shadow-2xl space-y-4 my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-9 h-9 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {trItem(activeLecture.titleGu, activeLecture.title)}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeLecture.standard} •{' '}
                    {trSubject(activeLecture.subject)}
                    {activeLecture.teacher?.name
                      ? ` • By ${activeLecture.teacher.name}`
                      : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveLecture(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Box */}
            <div className="px-4 sm:px-6">
              <div className="rounded-2xl overflow-hidden bg-black aspect-video w-full border border-slate-800 shadow-2xl relative flex items-center justify-center">
                <video
                  key={`${activeLecture.id}-${videoRetryKey}`}
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  className="w-full h-full object-contain"
                  onError={() => setVideoError(true)}
                  onLoadedData={() => setVideoError(false)}
                >
                  <source
                    src={`/api/video-lectures/${activeLecture.id}/stream?token=${token || ''}`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>

                {videoError && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                    <AlertCircle className="w-10 h-10 text-rose-400" />
                    <p className="text-sm font-bold text-white">
                      {tr(
                        'વિડિઓ લોડ કરવામાં સમસ્યા આવી',
                        'Unable to play video lecture',
                        'वीडियो लोड करने में समस्या आई'
                      )}
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {tr(
                        'કૃપા કરીને ફરીથી પ્રયાસ કરો અથવા નવી ટેબમાં સીધું ખોલો.',
                        'The browser could not initialize the video stream. Please retry or open in a new tab.',
                        'कृपया पुनः प्रयास करें या सीधे नए टैब में खोलें।'
                      )}
                    </p>
                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        onClick={() => {
                          setVideoError(false);
                          setVideoRetryKey(k => k + 1);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
                      >
                        {tr('ફરી પ્રયાસ કરો', 'Retry Playback')}
                      </button>
                      <a
                        href={`/api/video-lectures/${activeLecture.id}/stream?token=${token || ''}`}
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

            {/* Controls Bar & Speed Select */}
            <div className="px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-400">
                <span>{tr('પ્લેબેક ઝડપ:', 'Speed:')}</span>
                {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                      playbackSpeed === speed
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              <div className="text-slate-400 text-xs flex items-center space-x-3">
                <span>{formatBytes(activeLecture.fileSizeBytes)} MP4</span>
                <span>•</span>
                <span>
                  {activeLecture.viewsCount} {tr('વ્યુઝ', 'Views')}
                </span>
              </div>
            </div>

            {/* Description & Context Footer */}
            {activeLecture.description && (
              <div className="p-4 sm:p-6 bg-slate-950/60 border-t border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {tr('લેક્ચર સારાંશ / વિગત', 'Lecture Details & Concepts')}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {trItem(activeLecture.descriptionGu, activeLecture.description)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLecturesPage;
