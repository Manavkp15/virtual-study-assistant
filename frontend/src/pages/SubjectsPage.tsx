import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BookOpen, Search, Layers, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const SubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['common']);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [studentStandard, setStudentStandard] = useState<string>(user?.profile?.standard || 'Standard 8');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  const isGu = i18n.language === 'gu';

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await api.get('/student/heatmap', {
          params: { lang: isGu ? 'gu' : 'en' }
        });
        setHeatmapData(res.data.heatmap || []);
        if (res.data.studentStandard) {
          setStudentStandard(res.data.studentStandard);
        }
      } catch (err) {
        console.error('Failed to load heatmap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, [i18n.language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredSubjects = heatmapData.filter(s => {
    if (selectedSubject !== 'ALL' && s.subjectId !== selectedSubject) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const sName = (isGu ? (s.subjectNameGu || s.subjectName) : s.subjectName).toLowerCase();
      return sName.includes(q) ||
        s.chapters.some((c: any) => {
          const cName = (isGu ? (c.chapterNameGu || c.chapterName) : c.chapterName).toLowerCase();
          return cName.includes(q) ||
            c.topics.some((tp: any) => {
              const tName = (isGu ? (tp.topicNameGu || tp.topicName) : tp.topicName).toLowerCase();
              return tName.includes(q);
            });
        });
    }
    return true;
  });

  const getStandardLabel = (std: string) => {
    const key = `standards.${std.toLowerCase().replace(' ', '')}`;
    return t(key, std);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
              <BookOpen className="w-7 h-7 text-blue-400" />
              <span>{isGu ? 'મારા ધોરણના વિષયો અને મુદ્દાઓની મેટ્રિક્સ' : 'My Standard Subjects & Topic Matrix'}</span>
            </h1>
            <span className="text-xs font-bold px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-blue-400" />
              <span>{getStandardLabel(studentStandard)} {isGu ? 'અભ્યાસક્રમ' : 'Curriculum'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isGu
              ? `ખાસ કરીને ${getStandardLabel(studentStandard)} માટે નોંધાયેલા વિષયો અને મુદ્દાવાર પ્રદર્શન મેટ્રિક્સ દર્શાવે છે`
              : `Showing enrolled subjects and topic-wise performance matrix specifically for ${studentStandard}`}
          </p>
        </div>

        {/* Filter and Search */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isGu ? 'મુદ્દો અથવા અધ્યાય શોધો...' : 'Search topic or chapter...'}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">
              {isGu ? `બધા ${getStandardLabel(studentStandard)} વિષયો` : `All ${studentStandard} Subjects`}
            </option>
            {heatmapData.map(s => (
              <option key={s.subjectId} value={s.subjectId}>
                {isGu ? (s.subjectNameGu || s.subjectName) : s.subjectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-6 text-xs text-slate-300">
        <span className="font-semibold text-slate-400">{isGu ? 'નિપુણતા માર્ગદર્શિકા:' : 'Mastery Legend:'}</span>
        <div className="flex items-center space-x-1.5">
          <span>🟢</span>
          <span>{isGu ? 'ઉત્કૃષ્ટ / મજબૂત (>૭૫%)' : 'Excellent / Strong (>75%)'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>🟡</span>
          <span>{isGu ? 'સામાન્ય (૬૦-૭૫%)' : 'Average (60-75%)'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>🟠</span>
          <span>{isGu ? 'સુધારાની જરૂર છે (૪૫-૬૦%)' : 'Needs Improvement (45-60%)'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>🔴</span>
          <span>{isGu ? 'અત્યંત નબળું (<૪૫% / વારંવાર ભૂલો)' : 'Critical (<45% / Repeated Errors)'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>⚪</span>
          <span>{isGu ? 'હજુ અભ્યાસ કર્યો નથી' : 'Unstudied'}</span>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="space-y-6">
        {filteredSubjects.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
            {isGu
              ? `${getStandardLabel(studentStandard)} માટે કોઈ વિષયો મળ્યા નથી. તમારા શિક્ષક ટૂંક સમયમાં નવા વિષયો સોંપશે!`
              : `No subjects found for ${studentStandard}. Your teacher will assign new subjects soon!`}
          </div>
        ) : (
          filteredSubjects.map(sub => (
            <div key={sub.subjectId} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white flex items-center space-x-2">
                      <span>{isGu ? (sub.subjectNameGu || sub.subjectName) : sub.subjectName}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-semibold">
                        {getStandardLabel(sub.standard || studentStandard)}
                      </span>
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">{sub.code}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                  {sub.chapters.length} {isGu ? 'અધ્યાયો' : 'Chapters'}
                </span>
              </div>

              {/* Chapters & Topics Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sub.chapters.map((ch: any) => (
                  <div key={ch.chapterId} className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 space-y-3">
                    <h4 className="font-bold text-sm text-slate-200 border-b border-slate-700/50 pb-2">
                      {isGu ? (ch.chapterNameGu || ch.chapterName) : ch.chapterName}
                    </h4>
                    <div className="space-y-2">
                      {ch.topics.map((t: any) => (
                        <div
                          key={t.topicId}
                          className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-all text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base leading-none">{t.badge}</span>
                            <span className="font-medium text-slate-200">
                              {isGu ? (t.topicNameGu || t.topicName) : t.topicName}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-100">{t.accuracy > 0 ? `${t.accuracy}%` : '-'}</span>
                            {t.repeatedMistakes > 0 && (
                              <span className="ml-2 text-[10px] text-red-400 font-bold">
                                ({t.repeatedMistakes} {isGu ? 'ભૂલો' : 'errors'})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
