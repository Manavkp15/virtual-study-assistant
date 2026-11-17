import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem, getLocalizedStandardLabel } from '../utils/tr';
import { useAuth } from '../context/AuthContext';
import {
  TEACHER_SUBJECTS,
  getLocalizedSubjectName,
  getUserAssignedSubjects,
  formatUserSubjectsDisplay
} from '../utils/subjectConstants';
import {
  ShieldCheck,
  Plus,
  BookOpen,
  FileQuestion,
  Users,
  CheckCircle2,
  Filter,
  Edit2,
  Trash2,
  X,
  HelpCircle,
  Save,
  FileText,
  ClipboardCheck,
  Library,
  Video,
  TrendingUp,
  Award,
  AlertCircle,
  Clock,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [overview, setOverview] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [homeworkAnalytics, setHomeworkAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PERFORMANCE' | 'TEACHERS' | 'SUBJECTS' | 'QUESTION_BANK' | 'HOMEWORK_ANALYTICS'>('PERFORMANCE');

  // Synchronize active tab with URL query parameters for deep linking from sidebar menu
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const lower = tabParam.toLowerCase();
      if (['subjects', 'chapters', 'topics'].includes(lower)) {
        setActiveTab('SUBJECTS');
      } else if (['questions', 'question_bank'].includes(lower)) {
        setActiveTab('QUESTION_BANK');
      } else if (['teachers', 'teacher'].includes(lower)) {
        setActiveTab('TEACHERS');
      } else if (['students', 'users', 'performance'].includes(lower)) {
        setActiveTab('PERFORMANCE');
      } else if (['homework', 'homeworks', 'homework_analytics'].includes(lower)) {
        setActiveTab('HOMEWORK_ANALYTICS');
      }
    }
  }, [searchParams]);

  // Standard Filter State for Student Roster
  const [rosterStandardFilter, setRosterStandardFilter] = useState<string>('ALL');
  const [questionBankFilter, setQuestionBankFilter] = useState<string>('ALL');

  // New Subject Form State
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectStandard, setSubjectStandard] = useState('Standard 8');
  const [subjectDesc, setSubjectDesc] = useState('');

  // Edit Subject Modal State
  const [editingSubject, setEditingSubject] = useState<any | null>(null);

  // New Question Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [questionTopicId, setQuestionTopicId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionExplanation, setQuestionExplanation] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOptIdx, setCorrectOptIdx] = useState(0);

  // Edit Question Modal State
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Edit Teacher Subject Modal State
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [teacherNewSubjects, setTeacherNewSubjects] = useState<string[]>([]);
  const [updatingTeacherSubject, setUpdatingTeacherSubject] = useState<boolean>(false);

  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdateTeacherSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (teacherNewSubjects.length === 0) {
      setErrorMsg(tr('કૃપા કરીને ઓછામાં ઓછો એક વિષય પસંદ કરો.', 'Please select at least one subject.'));
      return;
    }
    setMsg('');
    setErrorMsg('');
    setUpdatingTeacherSubject(true);
    try {
      await api.put(`/admin/teachers/${editingTeacher.id}/subject`, {
        subjects: teacherNewSubjects
      });
      setMsg(tr(
        `શિક્ષક "${editingTeacher.name}" ના વિષયો સફળતાપૂર્વક અપડેટ થયા: ${formatUserSubjectsDisplay(teacherNewSubjects, i18n.language)}`,
        `Subjects for teacher "${editingTeacher.name}" updated successfully: ${formatUserSubjectsDisplay(teacherNewSubjects, i18n.language)}`
      ));
      setEditingTeacher(null);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || tr('શિક્ષકના વિષયો બદલવામાં નિષ્ફળ', 'Failed to update teacher subjects'));
    } finally {
      setUpdatingTeacherSubject(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [i18n.language]);

  const getStandardLabel = (std: string) => {
    return getLocalizedStandardLabel(std);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [overRes, subRes, qRes, hwRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/student/subjects'),
        api.get('/admin/questions'),
        api.get('/homework/admin/analytics').catch(() => ({ data: { analytics: null } }))
      ]);
      setOverview(overRes.data);
      setSubjects(subRes.data?.subjects || []);
      setQuestions(qRes.data?.questions || []);
      if (hwRes?.data?.analytics) {
        setHomeworkAnalytics(hwRes.data.analytics);
      }
    } catch (err: any) {
      console.error('Failed to load admin overview:', err);
      setFetchError(err.response?.data?.error || tr('શિક્ષક ડેશબોર્ડ ડેટા લોડ કરવામાં નિષ્ફળ. કૃપા કરીને ફરી પ્રયાસ કરો.', 'Failed to load teacher dashboard data. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // SUBJECT HANDLERS
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    try {
      await api.post('/admin/subjects', {
        name: subjectName,
        code: subjectCode,
        standard: subjectStandard,
        description: subjectDesc
      });
      setMsg(tr(
        `"${subjectName}" વિષય ${getStandardLabel(subjectStandard)} માટે સફળતાપૂર્વક બનાવવામાં આવ્યો!`,
        `Subject "${subjectName}" created successfully for ${subjectStandard}!`,
        `"${subjectName}" विषय ${getStandardLabel(subjectStandard)} के लिए सफलतापूर्वक बनाया गया!`
      ));
      setSubjectName('');
      setSubjectCode('');
      setSubjectDesc('');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || tr('વિષય બનાવવામાં નિષ્ફળ', 'Failed to create subject'));
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    setMsg('');
    setErrorMsg('');
    try {
      await api.put(`/admin/subjects/${editingSubject.id}`, {
        name: editingSubject.name,
        code: editingSubject.code,
        standard: editingSubject.standard,
        description: editingSubject.description
      });
      setMsg(tr(
        `"${editingSubject.name}" વિષય સફળતાપૂર્વક અપડેટ થયો!`,
        `Subject "${editingSubject.name}" updated successfully!`,
        `"${editingSubject.name}" विषय सफलतापूर्वक अपडेट हुआ!`
      ));
      setEditingSubject(null);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || tr('વિષય અપડેટ કરવામાં નિષ્ફળ', 'Failed to update subject'));
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    const confirmMsg = tr(`શું તમે ખરેખર "${name}" વિષય કાઢી નાખવા માંગો છો?`, `Are you sure you want to delete subject "${name}"?`, `क्या आप वाकई "${name}" विषय हटाना चाहते हैं?`);
    if (!window.confirm(confirmMsg)) return;
    setMsg('');
    setErrorMsg('');
    try {
      await api.delete(`/admin/subjects/${id}`);
      setMsg(tr(
        `"${name}" વિષય સફળતાપૂર્વક કાઢી નાખવામાં આવ્યો!`,
        `Subject "${name}" deleted successfully!`,
        `"${name}" विषय सफलतापूर्वक हटा दिया गया!`
      ));
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || tr('વિષય કાઢી નાખવામાં નિષ્ફળ', 'Failed to delete subject'));
    }
  };

  // STUDENT ROSTER HANDLERS
  const handleDeleteStudent = async (id: string, name: string) => {
    const confirmMsg = tr(`શું તમે ખરેખર વિદ્યાર્થી "${name}" ની પ્રોફાઇલ અને એકાઉન્ટ કાઢી નાખવા માંગો છો?`, `Are you sure you want to delete profile and credentials for student "${name}"?`, `क्या आप वाकई छात्र "${name}" की प्रोफ़ाइल और खाता हटाना चाहते हैं?`);
    if (!window.confirm(confirmMsg)) return;
    setMsg('');
    setErrorMsg('');
    try {
      await api.delete(`/admin/students/${id}`);
      setMsg(tr(
        `વિદ્યાર્થી "${name}" ની પ્રોફાઇલ સફળતાપૂર્વક કાઢી નાખવામાં આવી!`,
        `Student "${name}" profile and credentials deleted successfully!`,
        `छात्र "${name}" की प्रोफ़ाइल सफलतापूर्वक हटा दी गई!`
      ));
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || tr('વિદ્યાર્થી પ્રોફાઇલ કાઢી નાખવામાં નિષ્ફળ', 'Failed to delete student profile'));
    }
  };

  const handleClearProfiles = async () => {
    const filterLabel = rosterStandardFilter === 'ALL' ? tr('બધા ધોરણો', 'all standards') : getStandardLabel(rosterStandardFilter);
    const confirmMsg = tr(
      `ચેતવણી: શું તમે ખરેખર ${filterLabel} માટે તમામ વિદ્યાર્થી પ્રોફાઇલ્સ અને તેમના લોગિન ઈમેઇલ/પાસવર્ડ સાફ કરવા માંગો છો?`,
      `WARNING: Are you sure you want to clear all student profiles and user credentials for ${filterLabel}?`,
      `चेतावनी: क्या आप वाकई ${filterLabel} के लिए सभी छात्र प्रोफ़ाइल और उनके लॉगिन ईमेल/पासवर्ड साफ़ करना चाहते हैं?`
    );
    if (!window.confirm(confirmMsg)) return;

    setMsg('');
    setErrorMsg('');
    try {
      const res = await api.delete(`/admin/students${rosterStandardFilter !== 'ALL' ? `?standard=${encodeURIComponent(rosterStandardFilter)}` : ''}`);
      setMsg(res.data.message || tr('વિદ્યાર્થી પ્રોફાઇલ્સ સફળતાપૂર્વક સાફ કરવામાં આવી!', 'Student profiles cleared successfully!'));
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || tr('પ્રોફાઇલ્સ સાફ કરવામાં નિષ્ફળ', 'Failed to clear student profiles'));
    }
  };

  // QUESTION HANDLERS
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');

    if (!questionText || !optA || !optB) {
      setErrorMsg(tr(
        'કૃપા કરીને પ્રશ્ન લખાણ અને ઓછામાં ઓછા 2 વિકલ્પો (વિકલ્પ A અને વિકલ્પ B) દાખલ કરો',
        'Please enter Question Text and at least 2 Options (Option A & Option B)'
      ));
      return;
    }

    if (!questionTopicId && !selectedSubjectId) {
      setErrorMsg(tr(
        'કૃપા કરીને આ પ્રશ્ન માટે વિષય અથવા મુદ્દો પસંદ કરો',
        'Please select a Subject or Topic for this question'
      ));
      return;
    }

    try {
      const options = [
        { optionText: optA, isCorrect: correctOptIdx === 0 },
        { optionText: optB, isCorrect: correctOptIdx === 1 },
        { optionText: optC, isCorrect: correctOptIdx === 2 },
        { optionText: optD, isCorrect: correctOptIdx === 3 }
      ].filter(o => o.optionText.trim() !== '');

      await api.post('/admin/questions', {
        subjectId: selectedSubjectId,
        topicId: questionTopicId || undefined,
        questionText,
        explanation: questionExplanation,
        difficulty: 'MEDIUM',
        options
      });

      setMsg(tr(
        'પ્રશ્ન અને જવાબો સફળતાપૂર્વક પ્રશ્ન બેંકમાં ઉમેરાયા!',
        'Question & Answers added to bank successfully!'
      ));
      setQuestionText('');
      setQuestionExplanation('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setCorrectOptIdx(0);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || tr('પ્રશ્ન અને જવાબો ઉમેરવામાં નિષ્ફળ', 'Failed to add question & answers'));
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    setMsg('');
    setErrorMsg('');

    try {
      const options = editingQuestion.options.filter((o: any) => o.optionText.trim() !== '');
      if (options.length < 2) {
        setErrorMsg(tr(
          'કૃપા કરીને ઓછામાં ઓછા 2 ભરેલા વિકલ્પો પ્રદાન કરો',
          'Please provide at least 2 non-empty options'
        ));
        return;
      }

      await api.put(`/admin/questions/${editingQuestion.id}`, {
        questionText: editingQuestion.questionText,
        explanation: editingQuestion.explanation,
        difficulty: editingQuestion.difficulty || 'MEDIUM',
        options
      });

      setMsg(tr(
        'પ્રશ્ન સફળતાપૂર્વક અપડેટ થયો!',
        'Question updated successfully!'
      ));
      setEditingQuestion(null);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || tr('પ્રશ્ન અપડેટ કરવામાં નિષ્ફળ', 'Failed to update question'));
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm(tr('શું તમે ખરેખર આ પ્રશ્ન કાઢી નાખવા માંગો છો?', 'Are you sure you want to delete this question?'))) return;
    setMsg('');
    setErrorMsg('');
    try {
      await api.delete(`/admin/questions/${id}`);
      setMsg(tr(
        'પ્રશ્ન સફળતાપૂર્વક કાઢી નાખવામાં આવ્યો!',
        'Question deleted successfully!'
      ));
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || tr('પ્રશ્ન કાઢી નાખવામાં નિષ્ફળ', 'Failed to delete question'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError || !overview) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center max-w-md mx-auto my-12 space-y-4">
        <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {tr('શિક્ષક ડેશબોર્ડ લોડ થઈ શક્યું નથી', 'Unable to load Teacher Dashboard')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {fetchError || tr('ડેટા મેળવવામાં મુશ્કેલી પડી. કૃપા કરીને પુનઃપ્રયાસ બટન દબાવો.', 'There was an issue fetching dashboard data. Please try again.')}
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2 cursor-pointer"
        >
          <span>{tr('ફરી પ્રયાસ કરો', 'Try Again')}</span>
        </button>
      </div>
    );
  }

  // Filter students standard-wise
  const filteredStudents = overview.students.filter((st: any) => {
    if (rosterStandardFilter === 'ALL') return true;
    return (st.standard || 'Standard 8') === rosterStandardFilter;
  });

  // Topics for selected subject in Add Question form
  const currentSubjectObj = subjects.find(s => s.id === selectedSubjectId);
  const availableTopicsForSubject: any[] = [];
  if (currentSubjectObj && currentSubjectObj.chapters) {
    currentSubjectObj.chapters.forEach((c: any) => {
      c.topics?.forEach((t: any) => {
        availableTopicsForSubject.push({
          ...t,
          chapterName: trItem(c.nameGu, c.name),
          topicDisplayName: trItem(t.nameGu, t.name)
        });
      });
    });
  }

  // Filtered Question Bank
  const filteredQuestions = questions.filter(q => {
    if (questionBankFilter === 'ALL') return true;
    const std = q.topic?.chapter?.subject?.standard || 'Standard 8';
    return std === questionBankFilter;
  });

  return (
    <div className="space-y-8 pb-12">
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
              <span>{tr('શિક્ષક ડેશબોર્ડ', 'Teacher Dashboard')}</span>
            </h1>
            {/* Teacher Welcome & Subject Banner */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                {tr(`સ્વાગત છે, ${user?.name || 'શિક્ષક'}`, `Welcome, ${user?.name || 'Teacher'}`)}
              </span>
              {getUserAssignedSubjects(user).length > 0 && (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-xs shadow-sm">
                  <BookOpen className="w-3 h-3 text-purple-400" />
                  <span>
                    {formatUserSubjectsDisplay(getUserAssignedSubjects(user), i18n.language)}
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {tr(
                'ધોરણ-વાર વિષય સંચાલન, પ્રશ્ન બેંક સંપાદક અને વિદ્યાર્થી પ્રદર્શન યાદી',
                'Standard-wise subject management, question bank editor, and student performance roster'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. STUDENT PERFORMANCE VIEW */}
      {activeTab === 'PERFORMANCE' && (
        <div className="space-y-8">
          {/* Standard Selector Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <Filter className="w-4 h-4 text-purple-400" />
              <span>{tr('વિદ્યાર્થી પ્રદર્શન ધોરણ ફિલ્ટર:', 'Filter Student Performance Standard:')}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {['ALL', 'Standard 6', 'Standard 7', 'Standard 8'].map((std) => (
                <button
                  key={std}
                  onClick={() => setRosterStandardFilter(std)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    rosterStandardFilter === std
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  {getStandardLabel(std)}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {rosterStandardFilter === 'ALL'
                  ? tr('કુલ વિદ્યાર્થીઓ', 'Total Students')
                  : `${getStandardLabel(rosterStandardFilter)} ${tr('વિદ્યાર્થીઓ', 'Students')}`}
              </span>
              <p className="text-3xl font-extrabold text-white mt-2">{filteredStudents.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {tr('સક્રિય વિષયો', 'Active Subjects')}
              </span>
              <p className="text-3xl font-extrabold text-blue-400 mt-2">{overview.counts.subjectsCount}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {tr('કુલ ટેસ્ટ પ્રયાસો', 'Total Test Attempts')}
              </span>
              <p className="text-3xl font-extrabold text-purple-400 mt-2">{overview.counts.attemptsCount}</p>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <h3 className="font-bold text-base text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>
                    {tr('વિદ્યાર્થી યાદી', 'Student Roster')}{' '}
                    {rosterStandardFilter !== 'ALL' && `(${getStandardLabel(rosterStandardFilter)})`}
                  </span>
                </h3>
                <span className="text-xs font-semibold px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  {`${filteredStudents.length} ${tr('નોંધાયેલ', 'Enrolled')}`}
                </span>
              </div>

              {filteredStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearProfiles}
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {rosterStandardFilter === 'ALL'
                      ? tr('બધા ધોરણોની પ્રોફાઇલ સાફ કરો', 'Clear All Profiles (All Standards)')
                      : tr(`${getStandardLabel(rosterStandardFilter)} ની પ્રોફાઇલ સાફ કરો`, `Clear ${rosterStandardFilter} Profiles`)}
                  </span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">{tr('વિદ્યાર્થીનું નામ', 'Student Name')}</th>
                    <th className="px-4 py-3">{tr('ઈમેઇલ સરનામું', 'Email Address')}</th>
                    <th className="px-4 py-3">{tr('શૈક્ષણિક ધોરણ', 'Academic Standard')}</th>
                    <th className="px-4 py-3">{tr('નિયમિતતા', 'Streak')}</th>
                    <th className="px-4 py-3">{tr('આપેલ ટેસ્ટ', 'Tests Attempted')}</th>
                    <th className="px-4 py-3">{tr('સ્થિતિ', 'Status')}</th>
                    <th className="px-4 py-3 text-right">{tr('ક્રિયા', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        {tr(
                          `${getStandardLabel(rosterStandardFilter)} માટે કોઈ વિદ્યાર્થી મળ્યા નથી`,
                          `No students found for ${rosterStandardFilter}`,
                          `${getStandardLabel(rosterStandardFilter)} के लिए कोई विद्यार्थी नहीं मिला`
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st: any) => (
                      <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">
                          <span>{st.name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          <div>{st.email}</div>
                          {(st.mobileNumber || st.udiseCode) && (
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                              {st.mobileNumber && <span>📞 {st.mobileNumber}</span>}
                              {st.mobileNumber && st.udiseCode && <span>•</span>}
                              {st.udiseCode && <span>🏫 UDISE: {st.udiseCode}</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-400">📚 {getStandardLabel(st.standard || 'Standard 8')}</td>
                        <td className="px-4 py-3 font-bold text-amber-400">
                          {`${st.streakCount} ${tr('દિવસ 🔥', 'Days 🔥')}`}
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-400">
                          {`${st.testsAttempted} ${tr('ટેસ્ટ', 'Tests')}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-[10px]">
                            {tr('સક્રિય વિદ્યાર્થી', 'Active Student')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(st.id, st.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors inline-flex items-center space-x-1"
                            title={tr('વિદ્યાર્થી પ્રોફાઇલ કાઢી નાખો', 'Delete Student Profile')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{tr('કાઢી નાખો', 'Delete')}</span>
                          </button>
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

      {/* 2. TEACHERS TAB (TEACHER ROSTER & SUBJECT MANAGEMENT) */}
      {activeTab === 'TEACHERS' && (
        <div className="space-y-6">
          {/* Header & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {tr('કુલ શિક્ષકો', 'Total Teachers')}
              </span>
              <p className="text-3xl font-extrabold text-white mt-2">
                {overview.counts?.teachersCount ?? overview.teachers?.length ?? 0}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {tr('સક્રિય એકાઉન્ટ્સ', 'Active Accounts')}
              </span>
              <p className="text-3xl font-extrabold text-emerald-400 mt-2">
                {overview.teachers?.length ?? 0}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {tr('ઉપલબ્ધ વિષયો', 'Available Subjects')}
              </span>
              <p className="text-3xl font-extrabold text-purple-400 mt-2">
                {TEACHER_SUBJECTS.length}
              </p>
            </div>
          </div>

          {/* Teacher Roster Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <h3 className="font-bold text-base text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <span>{tr('શિક્ષક યાદી અને વિષય ફાળવણી', 'Teacher Roster & Subject Allocation')}</span>
                </h3>
                <span className="text-xs font-semibold px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  {`${overview.teachers?.length ?? 0} ${tr('નોંધાયેલ', 'Registered')}`}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">{tr('શિક્ષકનું નામ', 'Teacher Name')}</th>
                    <th className="px-4 py-3">{tr('ઈમેઇલ સરનામું', 'Email Address')}</th>
                    <th className="px-4 py-3">{tr('સોંપાયેલ વિષયો', 'Assigned Subjects')}</th>
                    <th className="px-4 py-3">{tr('ભૂમિકા', 'Role')}</th>
                    <th className="px-4 py-3">{tr('સ્થિતિ', 'Status')}</th>
                    <th className="px-4 py-3 text-right">{tr('ક્રિયા', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(!overview.teachers || overview.teachers.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        {tr('કોઈ શિક્ષકો નોંધાયેલા નથી', 'No teachers registered yet')}
                      </td>
                    </tr>
                  ) : (
                    overview.teachers.map((tc: any) => (
                      <tr key={tc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xs">
                              {tc.name?.charAt(0).toUpperCase() || 'T'}
                            </div>
                            <span>{tc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{tc.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {getUserAssignedSubjects(tc).map((subName: string) => (
                              <span key={subName} className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-[11px]">
                                <BookOpen className="w-2.5 h-2.5 shrink-0" />
                                <span>{getLocalizedSubjectName(subName, i18n.language)}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {tc.role === 'ADMIN' ? tr('એડમિન / શિક્ષક', 'Admin / Teacher') : tr('શિક્ષક', 'Teacher')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{tr('સક્રિય', 'Active')}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTeacher(tc);
                              const assigned = getUserAssignedSubjects(tc);
                              setTeacherNewSubjects(assigned.length > 0 ? assigned : [TEACHER_SUBJECTS[0].name]);
                            }}
                            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-all shadow-sm"
                            title={tr('વિષયો બદલો', 'Change Subjects')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{tr('વિષયો બદલો', 'Change Subjects')}</span>
                          </button>
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

      {/* 3. SUBJECTS TAB (ADD, EDIT, DELETE SUBJECTS) */}
      {activeTab === 'SUBJECTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Subject Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-purple-400" />
              <span>{tr('નવો ધોરણ-વાર વિષય ઉમેરો', 'Add New Standard-Wise Subject')}</span>
            </h3>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  {tr('શૈક્ષણિક ધોરણ પસંદ કરો', 'Select Target Academic Standard')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Standard 6', 'Standard 7', 'Standard 8'].map((std) => (
                    <button
                      key={std}
                      type="button"
                      onClick={() => setSubjectStandard(std)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        subjectStandard === std
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {getStandardLabel(std)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('વિષયનું નામ', 'Subject Name')}
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder={tr('દા.ત. વિજ્ઞાન અને ગતિ', 'e.g. Science & Motion')}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('વિષય કોડ', 'Subject Code')}
                </label>
                <input
                  type="text"
                  required
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder={tr('દા.ત. SCI101', 'e.g. SCI101')}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('વર્ણન', 'Description')}
                </label>
                <textarea
                  value={subjectDesc}
                  onChange={(e) => setSubjectDesc(e.target.value)}
                  placeholder={tr('અભ્યાસક્રમ રૂપરેખા અને વિગતો...', 'Course outline and syllabus details...')}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 h-20 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
              >
                {`${tr('માટે વિષય ઉમેરો', 'Add Subject for')} ${getStandardLabel(subjectStandard)}`}
              </button>
            </form>
          </div>

          {/* Subjects List with Edit & Delete */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>{tr('વર્તમાન વિષયો (સંપાદિત કરો અને કાઢી નાખો)', 'Current Subjects (Edit & Delete)')}</span>
            </h3>

            <div className="space-y-3">
              {subjects.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  {tr('હજુ સુધી કોઈ વિષય બનાવવામાં આવ્યો નથી', 'No subjects created yet')}
                </p>
              ) : (
                subjects.map((s) => (
                  <div key={s.id} className="p-4 bg-slate-800/60 border border-slate-700/70 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                        <span>{trSubject(s)}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-semibold">
                          {s.code}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        📚 {tr('ધોરણ: ', 'Standard: ')}
                        <span className="font-semibold text-slate-200">{getStandardLabel(s.standard || 'Standard 8')}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingSubject(s)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-purple-300 rounded-xl transition-all"
                        title={tr('વિષય સંપાદિત કરો', 'Edit Subject')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(s.id, trSubject(s))}
                        className="p-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 rounded-xl transition-all"
                        title={tr('વિષય કાઢી નાખો', 'Delete Subject')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. QUESTION BANK TAB (ADD, EDIT, DELETE QUESTIONS) */}
      {activeTab === 'QUESTION_BANK' && (
        <div className="space-y-8">
          {/* Add Question Form Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 max-w-3xl mx-auto">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-purple-400" />
              <span>{tr('નવો પ્રશ્ન અને જવાબો ઉમેરો (MCQ)', 'Add New Question & Answers (MCQ)')}</span>
            </h3>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {tr('વિષય પસંદ કરો', 'Select Subject')}
                  </label>
                  <select
                    required
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setQuestionTopicId('');
                    }}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">{tr('-- વિષય પસંદ કરો --', '-- Select Target Subject --')}</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        [{getStandardLabel(s.standard || 'Standard 8')}] {trSubject(s)} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {tr('ચોક્કસ મુદ્દો પસંદ કરો (વૈકલ્પિક)', 'Select Specific Topic (Optional)')}
                  </label>
                  <select
                    value={questionTopicId}
                    onChange={(e) => setQuestionTopicId(e.target.value)}
                    disabled={!selectedSubjectId}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  >
                    <option value="">{tr('સામાન્ય (મુખ્ય મુદ્દો)', 'Default (Core Topic)')}</option>
                    {availableTopicsForSubject.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.chapterName} → {t.topicDisplayName || t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('પ્રશ્ન લખાણ', 'Question Prompt')}
                </label>
                <textarea
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={tr('તમારો બહુવિકલ્પી પ્રશ્ન અહીં દાખલ કરો...', 'Enter your multiple-choice question here...')}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 h-20 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  {tr(
                    'જવાબ વિકલ્પો (સાચા જવાબ માટે રેડિયો બટન પસંદ કરો)',
                    'Answer Options (Select Radio Button for Correct Answer)',
                    'उत्तर विकल्प (सही उत्तर के लिए रेडियो बटन चुनें)'
                  )}
                </label>
                {[
                  { val: optA, setVal: setOptA, idx: 0, label: tr('વિકલ્પ A', 'Option A') },
                  { val: optB, setVal: setOptB, idx: 1, label: tr('વિકલ્પ B', 'Option B') },
                  { val: optC, setVal: setOptC, idx: 2, label: tr('વિકલ્પ C', 'Option C') },
                  { val: optD, setVal: setOptD, idx: 3, label: tr('વિકલ્પ D', 'Option D') },
                ].map(opt => (
                  <div key={opt.idx} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={correctOptIdx === opt.idx}
                      onChange={() => setCorrectOptIdx(opt.idx)}
                      className="w-4 h-4 text-purple-600 accent-purple-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={opt.val}
                      onChange={(e) => opt.setVal(e.target.value)}
                      placeholder={opt.label}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('સમજૂતી / ઉકેલ વિગતો', 'Explanation / Solution Details')}
                </label>
                <textarea
                  value={questionExplanation}
                  onChange={(e) => setQuestionExplanation(e.target.value)}
                  placeholder={tr(
                    'વિદ્યાર્થી ટેસ્ટ સબમિટ કર્યા પછી દર્શાવવામાં આવતી વિગતવાર ઉકેલ સમજૂતી...',
                    'Detailed solution explanation shown after student submits test...',
                    'विद्यार्थी द्वारा परीक्षा सबमिट करने के बाद दिखाई जाने वाली विस्तृत समाधान व्याख्या...'
                  )}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 h-16 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
              >
                {tr('પ્રશ્ન અને જવાબો પ્રશ્ન બેંકમાં સાચવો', 'Save Question & Answers to Question Bank')}
              </button>
            </form>
          </div>

          {/* Question Bank List View with Edit & Delete */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <FileQuestion className="w-5 h-5 text-purple-400" />
                <span>
                  {tr(
                    `હાલની પ્રશ્ન બેંક (${filteredQuestions.length} પ્રશ્નો)`,
                    `Existing Question Bank (${filteredQuestions.length} Questions)`,
                    `वर्तमान प्रश्न बैंक (${filteredQuestions.length} प्रश्न)`
                  )}
                </span>
              </h3>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">{tr('ધોરણ ફિલ્ટર:', 'Filter Standard:')}</span>
                <select
                  value={questionBankFilter}
                  onChange={(e) => setQuestionBankFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">{tr('બધા ધોરણો', 'All Standards')}</option>
                  <option value="Standard 6">{getStandardLabel('Standard 6')}</option>
                  <option value="Standard 7">{getStandardLabel('Standard 7')}</option>
                  <option value="Standard 8">{getStandardLabel('Standard 8')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  {tr(
                    'પસંદ કરેલ ધોરણ ફિલ્ટર માટે કોઈ પ્રશ્નો મળ્યા નથી',
                    'No questions found for the selected standard filter',
                    'चयनित कक्षा फ़िल्टर के लिए कोई प्रश्न नहीं मिला'
                  )}
                </p>
              ) : (
                filteredQuestions.map((q) => {
                  const subjectName = trSubject(q.topic?.chapter?.subject || { name: q.subjectName, nameGu: q.subjectNameGu }) || 'Subject';
                  const subjectStandard = q.topic?.chapter?.subject?.standard || 'Standard 8';
                  const topicName = trItem(q.topic?.nameGu, q.topic?.name) || tr('સામાન્ય', 'General');

                  return (
                    <div key={q.id} className="p-5 bg-slate-800/60 border border-slate-700/70 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                              📚 {getStandardLabel(subjectStandard)} • {subjectName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {tr('મુદ્દો: ', 'Topic: ')}{topicName}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-white">
                            {trItem(q.questionTextGu, q.questionText)}
                          </h4>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => setEditingQuestion(q)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 text-purple-300 rounded-xl transition-all"
                            title={tr('પ્રશ્ન સંપાદિત કરો', 'Edit Question')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 rounded-xl transition-all"
                            title={tr('પ્રશ્ન કાઢી નાખો', 'Delete Question')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options?.map((opt: any, idx: number) => (
                          <div
                            key={opt.id || idx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                              opt.isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                                : 'bg-slate-900/50 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span>{trItem(opt.optionTextGu, opt.optionText)}</span>
                            {opt.isCorrect && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                                {tr('સાચો જવાબ', 'Correct Answer')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {(q.explanation || q.explanationGu) && (
                        <p className="text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
                          💡 <span className="font-semibold text-slate-300">{tr('સમજૂતી: ', 'Explanation: ')}</span>
                          {trItem(q.explanationGu, q.explanation)}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. AI HOMEWORK CHECKING ANALYTICS VIEW */}
      {activeTab === 'HOMEWORK_ANALYTICS' && (
        <div className="space-y-8">
          {/* Header Action Banner */}
          <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 border border-purple-500/30 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-2 border border-purple-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{tr('AI આધારિત ગૃહકાર્ય ચકાસણી એનાલિટિક્સ', 'AI-Powered Homework Checking Intelligence', 'एआई-संचालित गृहकार्य विश्लेषण')}</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {tr('શાળા-સ્તરીય ગૃહકાર્ય રિપોર્ટ અને ભૂલોનું વિશ્લેષણ', 'School-Wide Homework Report & Misconception Insights', 'स्कूल-स्तरीय गृहकार्य रिपोर्ट और त्रुटि विश्लेषण')}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                {tr(
                  'કૃત્રિમ બુદ્ધિમત્તા દ્વારા તપાસાયેલ હસ્તલિખિત ગૃહકાર્યની પરિણામ સ્થિતિ, શિક્ષક મંજૂરી અહેવાલ અને વિદ્યાર્થીઓની વારંવાર થતી ભૂલો.',
                  'Real-time metrics on AI-checked handwritten submissions, teacher approval progress, subject averages, and top common mistakes detected across answers.',
                  'एआई द्वारा जांची गई हस्तलिखित गृहकार्य स्थिति, शिक्षक स्वीकृति रिपोर्ट और सामान्य त्रुटियाँ।'
                )}
              </p>
            </div>
            <button
              onClick={() => navigate('/teacher/homework')}
              className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 shrink-0 transition-all hover:scale-105"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>{tr('શિક્ષક ચકાસણી પોર્ટલ ખોલો', 'Open Teacher Checking Portal', 'शिक्षक जांच पोर्टल खोलें')}</span>
            </button>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Submissions */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {tr('કુલ સબમિશન્સ', 'Total Submissions', 'कुल सबमिशन')}
                </span>
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-extrabold text-white mt-3">
                {homeworkAnalytics?.totalSubmissions ?? overview?.counts?.attemptsCount ?? 0}
              </p>
              <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-400">
                <span className="text-emerald-400 font-bold">
                  {homeworkAnalytics?.approvedCount ?? 0} {tr('મંજૂર', 'Approved', 'स्वीकृत')}
                </span>
                <span>•</span>
                <span>{homeworkAnalytics?.totalHomework ?? 0} {tr('સોંપેલ ગૃહકાર્ય', 'Assignments', 'असाइनमेंट')}</span>
              </div>
            </div>

            {/* 2. Pending Teacher Approvals */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                  {tr('શિક્ષક મંજૂરી બાકી', 'Pending Approvals', 'शिक्षक अनुमोदन लंबित')}
                </span>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-extrabold text-amber-400 mt-3">
                {homeworkAnalytics?.pendingTeacherApprovals ?? 0}
              </p>
              <p className="mt-2 text-[11px] text-amber-300/80">
                {tr('શિક્ષકની સમીક્ષા અને અંતિમ મંજૂરી જરૂરી છે', 'Requires teacher review and sign-off', 'शिक्षक समीक्षा और अंतिम अनुमोदन आवश्यक')}
              </p>
            </div>

            {/* 3. School / Class Average */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {tr('શાળા સરેરાશ ગુણ', 'Average Score', 'औसत अंक')}
                </span>
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-extrabold text-purple-400 mt-3">
                {homeworkAnalytics?.classAverage ?? 0}%
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                {tr('મંજૂર સબમિશન્સ પર આધારિત', 'Based on approved graded homework', 'स्वीकृत गृहकार्य पर आधारित')}
              </p>
            </div>

            {/* 4. Completion Rate */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {tr('સબમિશન પૂર્ણતા દર', 'Completion Rate', 'पूर्णता दर')}
                </span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-400 mt-3">
                {homeworkAnalytics?.completionRate ?? 0}%
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                {tr('વિદ્યાર્થીઓ દ્વારા સમયસર સબમિશન', 'Active student submission ratio', 'छात्रों द्वारा समय पर सबमिशन दर')}
              </p>
            </div>
          </div>

          {/* Detailed Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject-Wise Performance */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>{tr('વિષયવાર સરેરાશ ગુણ', 'Subject-Wise Average Performance', 'विषयवार औसत प्रदर्शन')}</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  {homeworkAnalytics?.subjectAverages?.length || 0} {tr('વિષયો', 'Subjects', 'विषय')}
                </span>
              </div>

              {(!homeworkAnalytics?.subjectAverages || homeworkAnalytics.subjectAverages.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  {tr('હજુ સુધી કોઈ વિષયવાર સબમિશન ડેટા ઉપલબ્ધ નથી', 'No subject submission data available yet', 'अभी तक कोई विषय सबमिशन डेटा उपलब्ध नहीं है')}
                </div>
              ) : (
                <div className="space-y-4">
                  {homeworkAnalytics.subjectAverages.map((item: any, idx: number) => {
                    const avg = item.average || 0;
                    const barColor =
                      avg >= 75 ? 'bg-emerald-500' : avg >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                    const textColor =
                      avg >= 75 ? 'text-emerald-400' : avg >= 50 ? 'text-amber-400' : 'text-rose-400';

                    return (
                      <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">{item.subject}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] text-slate-400">
                              {item.submissions} {tr('સબમિશન્સ', 'submissions', 'सबमिशन')}
                            </span>
                            <span className={`font-extrabold ${textColor}`}>{avg}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.min(avg, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI-Identified Common Student Mistakes */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{tr('AI-શોધાયેલ સામાન્ય ભૂલો અને ખૂટતા મુદ્દાઓ', 'AI-Detected Common Misconceptions & Mistakes', 'एआई-पहचानी गई सामान्य गलतियाँ')}</span>
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                  {homeworkAnalytics?.topCommonMistakes?.length || 0} {tr('નોંધાયેલ', 'Detected', 'पहचाने गए')}
                </span>
              </div>

              {(!homeworkAnalytics?.topCommonMistakes || homeworkAnalytics.topCommonMistakes.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  {tr(
                    'હાલમાં વિદ્યાર્થીઓની જવાબોમાં કોઈ સામાન્ય ભૂલો નોંધાઈ નથી.',
                    'No recurring student mistakes detected yet. Great job!',
                    'फिलहाल छात्रों के उत्तरों में कोई सामान्य गलती नहीं पाई गई।'
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {homeworkAnalytics.topCommonMistakes.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-950/40 border border-rose-500/20 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{m.mistake}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {tr(
                              'રૂબ્રિક તપાસ દરમિયાન આ મહત્વપૂર્ણ મુદ્દો જવાબમાંથી ગેરહાજર હતો.',
                              'Frequently missed in rubric criteria across submissions.',
                              'रूब्रिक मानदंड के दौरान यह महत्वपूर्ण बिंदु उत्तर से गायब था।'
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-bold shrink-0 border border-slate-700">
                        {m.count} {tr('વિદ્યાર્થીઓ', 'cases', 'बार')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT SUBJECT MODAL */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                <span>{tr('વિષય વિગતો સંપાદિત કરો', 'Edit Subject Details')}</span>
              </h3>
              <button
                onClick={() => setEditingSubject(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('શૈક્ષણિક ધોરણ', 'Academic Standard')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Standard 6', 'Standard 7', 'Standard 8'].map((std) => (
                    <button
                      key={std}
                      type="button"
                      onClick={() => setEditingSubject({ ...editingSubject, standard: std })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        editingSubject.standard === std
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {getStandardLabel(std)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('વિષયનું નામ', 'Subject Name')}
                </label>
                <input
                  type="text"
                  required
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('વિષય કોડ', 'Subject Code')}
                </label>
                <input
                  type="text"
                  required
                  value={editingSubject.code}
                  onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('વર્ણન', 'Description')}
                </label>
                <textarea
                  value={editingSubject.description || ''}
                  onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 h-20"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="w-1/2 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  {tr('રદ કરો', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{tr('ફેરફારો સાચવો', 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT QUESTION MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                <span>{tr('પ્રશ્ન અને વિકલ્પો સંપાદિત કરો', 'Edit Question & Options')}</span>
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('પ્રશ્ન લખાણ', 'Question Prompt')}
                </label>
                <textarea
                  required
                  value={editingQuestion.questionText}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 h-20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  {tr(
                    'વિકલ્પો (સાચા જવાબ માટે રેડિયો બટન પસંદ કરો)',
                    'Options (Select Radio Button for Correct Answer)',
                    'विकल्प (सही उत्तर के लिए रेडियो बटन चुनें)'
                  )}
                </label>
                {editingQuestion.options.map((opt: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="editCorrectOpt"
                      checked={opt.isCorrect}
                      onChange={() => {
                        const newOpts = editingQuestion.options.map((o: any, i: number) => ({
                          ...o,
                          isCorrect: i === idx
                        }));
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      className="w-4 h-4 text-purple-600 accent-purple-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={opt.optionText}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[idx] = { ...newOpts[idx], optionText: e.target.value };
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      placeholder={tr(`વિકલ્પ ${idx + 1}`, `Option ${idx + 1}`)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {tr('સમજૂતી', 'Explanation')}
                </label>
                <textarea
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 h-16"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="w-1/2 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  {tr('રદ કરો', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{tr('પ્રશ્ન અપડેટ કરો', 'Update Question')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Teacher Subject Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <span>{tr('શિક્ષકના વિષયો બદલો', 'Change Teacher Subjects')}</span>
              </h3>
              <button
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacherSubject} className="space-y-4">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="text-slate-400">
                  <span className="font-medium">{tr('શિક્ષક:', 'Teacher:')}</span>{' '}
                  <strong className="text-white">{editingTeacher.name}</strong>
                </div>
                <div className="text-slate-400">
                  <span className="font-medium">{tr('ઈમેલ:', 'Email:')}</span>{' '}
                  <span className="text-slate-300">{editingTeacher.email}</span>
                </div>
                <div className="text-slate-400">
                  <span className="font-medium">{tr('હાલના વિષયો:', 'Current Subjects:')}</span>{' '}
                  <span className="text-purple-300 font-bold">
                    {formatUserSubjectsDisplay(getUserAssignedSubjects(editingTeacher), i18n.language)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    {tr('સોંપાયેલ વિષયો પસંદ કરો', 'Select Assigned Subjects')}
                  </label>
                  <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    {teacherNewSubjects.length} {tr('પસંદ કરેલ', 'Selected')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {TEACHER_SUBJECTS.map((subj) => {
                    const isChecked = teacherNewSubjects.includes(subj.name);
                    return (
                      <label
                        key={subj.name}
                        className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-purple-950/40 border-purple-500 text-purple-100 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setTeacherNewSubjects(prev =>
                              prev.includes(subj.name) ? prev.filter(x => x !== subj.name) : [...prev, subj.name]
                            );
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                        />
                        <span className="text-xs font-semibold">
                          {getLocalizedSubjectName(subj.name, i18n.language)}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {tr('શિક્ષક ઓછામાં ઓછો એક અથવા વધુ વિષયો ભણાવી શકે છે.', 'Teacher must have at least one subject assigned.')}
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  disabled={updatingTeacherSubject}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  {tr('રદ કરો', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updatingTeacherSubject || teacherNewSubjects.length === 0}
                  className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-purple-600/30"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {updatingTeacherSubject
                      ? tr('અપડેટ થઈ રહ્યું છે...', 'Updating...')
                      : tr('વિષયો સાચવો', 'Save Subjects')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboardPage;
