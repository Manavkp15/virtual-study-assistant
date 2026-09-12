import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
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
  Save
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isGu = i18n.language === 'gu';

  const [overview, setOverview] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PERFORMANCE' | 'SUBJECTS' | 'QUESTION_BANK'>('PERFORMANCE');

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

  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [i18n.language]);

  const getStandardLabel = (std: string) => {
    if (std === 'ALL') return isGu ? 'બધા ધોરણો' : 'All Standards';
    const key = `standards.${std.toLowerCase().replace(' ', '')}`;
    return t(`common:${key}`, std);
  };

  const fetchAdminData = async () => {
    try {
      const [overRes, subRes, qRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/student/subjects'),
        api.get('/admin/questions')
      ]);
      setOverview(overRes.data);
      setSubjects(subRes.data.subjects || []);
      setQuestions(qRes.data.questions || []);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
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
      setMsg(isGu
        ? `"${subjectName}" વિષય ${getStandardLabel(subjectStandard)} માટે સફળતાપૂર્વક બનાવવામાં આવ્યો!`
        : `Subject "${subjectName}" created successfully for ${subjectStandard}!`
      );
      setSubjectName('');
      setSubjectCode('');
      setSubjectDesc('');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || (isGu ? 'વિષય બનાવવામાં નિષ્ફળ' : 'Failed to create subject'));
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
      setMsg(isGu
        ? `"${editingSubject.name}" વિષય સફળતાપૂર્વક અપડેટ થયો!`
        : `Subject "${editingSubject.name}" updated successfully!`
      );
      setEditingSubject(null);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || (isGu ? 'વિષય અપડેટ કરવામાં નિષ્ફળ' : 'Failed to update subject'));
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!window.confirm(isGu ? `શું તમે ખરેખર "${name}" વિષય કાઢી નાખવા માંગો છો?` : `Are you sure you want to delete subject "${name}"?`)) return;
    setMsg('');
    setErrorMsg('');
    try {
      await api.delete(`/admin/subjects/${id}`);
      setMsg(isGu
        ? `"${name}" વિષય સફળતાપૂર્વક કાઢી નાખવામાં આવ્યો!`
        : `Subject "${name}" deleted successfully!`
      );
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || (isGu ? 'વિષય કાઢી નાખવામાં નિષ્ફળ' : 'Failed to delete subject'));
    }
  };

  // QUESTION HANDLERS
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');

    if (!questionText || !optA || !optB) {
      setErrorMsg(isGu
        ? 'કૃપા કરીને પ્રશ્ન લખાણ અને ઓછામાં ઓછા 2 વિકલ્પો (વિકલ્પ A અને વિકલ્પ B) દાખલ કરો'
        : 'Please enter Question Text and at least 2 Options (Option A & Option B)'
      );
      return;
    }

    if (!questionTopicId && !selectedSubjectId) {
      setErrorMsg(isGu
        ? 'કૃપા કરીને આ પ્રશ્ન માટે વિષય અથવા મુદ્દો પસંદ કરો'
        : 'Please select a Subject or Topic for this question'
      );
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

      setMsg(isGu
        ? 'પ્રશ્ન અને જવાબો સફળતાપૂર્વક પ્રશ્ન બેંકમાં ઉમેરાયા!'
        : 'Question & Answers added to bank successfully!'
      );
      setQuestionText('');
      setQuestionExplanation('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setCorrectOptIdx(0);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || (isGu ? 'પ્રશ્ન અને જવાબો ઉમેરવામાં નિષ્ફળ' : 'Failed to add question & answers'));
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
        setErrorMsg(isGu
          ? 'કૃપા કરીને ઓછામાં ઓછા 2 ભરેલા વિકલ્પો પ્રદાન કરો'
          : 'Please provide at least 2 non-empty options'
        );
        return;
      }

      await api.put(`/admin/questions/${editingQuestion.id}`, {
        questionText: editingQuestion.questionText,
        explanation: editingQuestion.explanation,
        difficulty: editingQuestion.difficulty || 'MEDIUM',
        options
      });

      setMsg(isGu
        ? 'પ્રશ્ન સફળતાપૂર્વક અપડેટ થયો!'
        : 'Question updated successfully!'
      );
      setEditingQuestion(null);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || (isGu ? 'પ્રશ્ન અપડેટ કરવામાં નિષ્ફળ' : 'Failed to update question'));
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm(isGu ? 'શું તમે ખરેખર આ પ્રશ્ન કાઢી નાખવા માંગો છો?' : 'Are you sure you want to delete this question?')) return;
    setMsg('');
    setErrorMsg('');
    try {
      await api.delete(`/admin/questions/${id}`);
      setMsg(isGu
        ? 'પ્રશ્ન સફળતાપૂર્વક કાઢી નાખવામાં આવ્યો!'
        : 'Question deleted successfully!'
      );
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || (isGu ? 'પ્રશ્ન કાઢી નાખવામાં નિષ્ફળ' : 'Failed to delete question'));
    }
  };

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
          chapterName: (isGu && c.nameGu) ? c.nameGu : c.name,
          topicDisplayName: (isGu && t.nameGu) ? t.nameGu : t.name
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
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <ShieldCheck className="w-7 h-7 text-purple-400" />
            <span>{isGu ? 'શિક્ષક ડેશબોર્ડ' : 'Teacher Dashboard'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isGu
              ? 'ધોરણ-વાર વિષય સંચાલન, પ્રશ્ન બેંક સંપાદક અને વિદ્યાર્થી પ્રદર્શન યાદી'
              : 'Standard-wise subject management, question bank editor, and student performance roster'
            }
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl overflow-x-auto">
          <button
            onClick={() => { setActiveTab('PERFORMANCE'); setMsg(''); setErrorMsg(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'PERFORMANCE'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isGu ? 'વિદ્યાર્થી પ્રદર્શન' : 'Student Performance'}</span>
          </button>

          <button
            onClick={() => { setActiveTab('SUBJECTS'); setMsg(''); setErrorMsg(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'SUBJECTS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isGu ? 'વિષયો અને સંપાદન' : 'Subjects & Edit'}</span>
          </button>

          <button
            onClick={() => { setActiveTab('QUESTION_BANK'); setMsg(''); setErrorMsg(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'QUESTION_BANK'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            <span>{isGu ? 'પ્રશ્ન બેંક અને ઉમેરો/સંપાદિત કરો' : 'Question Bank & Add/Edit'}</span>
          </button>
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
              <span>{isGu ? 'વિદ્યાર્થી પ્રદર્શન ધોરણ ફિલ્ટર:' : 'Filter Student Performance Standard:'}</span>
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
                  ? (isGu ? 'કુલ વિદ્યાર્થીઓ' : 'Total Students')
                  : (isGu ? `${getStandardLabel(rosterStandardFilter)} વિદ્યાર્થીઓ` : `${rosterStandardFilter} Students`)}
              </span>
              <p className="text-3xl font-extrabold text-white mt-2">{filteredStudents.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {isGu ? 'સક્રિય વિષયો' : 'Active Subjects'}
              </span>
              <p className="text-3xl font-extrabold text-blue-400 mt-2">{overview.counts.subjectsCount}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {isGu ? 'કુલ ટેસ્ટ પ્રયાસો' : 'Total Test Attempts'}
              </span>
              <p className="text-3xl font-extrabold text-purple-400 mt-2">{overview.counts.attemptsCount}</p>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span>
                  {isGu ? 'વિદ્યાર્થી યાદી' : 'Student Roster'}{' '}
                  {rosterStandardFilter !== 'ALL' && `(${getStandardLabel(rosterStandardFilter)})`}
                </span>
              </h3>
              <span className="text-xs font-semibold px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                {isGu ? `${filteredStudents.length} નોંધાયેલ` : `${filteredStudents.length} Enrolled`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">{isGu ? 'વિદ્યાર્થીનું નામ' : 'Student Name'}</th>
                    <th className="px-4 py-3">{isGu ? 'ઈમેઇલ સરનામું' : 'Email Address'}</th>
                    <th className="px-4 py-3">{isGu ? 'શૈક્ષણિક ધોરણ' : 'Academic Standard'}</th>
                    <th className="px-4 py-3">{isGu ? 'નિયમિતતા' : 'Streak'}</th>
                    <th className="px-4 py-3">{isGu ? 'આપેલ ટેસ્ટ' : 'Tests Attempted'}</th>
                    <th className="px-4 py-3">{isGu ? 'સ્થિતિ' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        {isGu
                          ? `${getStandardLabel(rosterStandardFilter)} માટે કોઈ વિદ્યાર્થી મળ્યા નથી`
                          : `No students found for ${rosterStandardFilter}`
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st: any) => (
                      <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">{st.name}</td>
                        <td className="px-4 py-3 text-slate-400">{st.email}</td>
                        <td className="px-4 py-3 font-bold text-blue-400">📚 {getStandardLabel(st.standard || 'Standard 8')}</td>
                        <td className="px-4 py-3 font-bold text-amber-400">
                          {isGu ? `${st.streakCount} દિવસ 🔥` : `${st.streakCount} Days 🔥`}
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-400">
                          {isGu ? `${st.testsAttempted} ટેસ્ટ` : `${st.testsAttempted} Tests`}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-[10px]">
                            {isGu ? 'સક્રિય વિદ્યાર્થી' : 'Active Student'}
                          </span>
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

      {/* 2. SUBJECTS TAB (ADD, EDIT, DELETE SUBJECTS) */}
      {activeTab === 'SUBJECTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Subject Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-purple-400" />
              <span>{isGu ? 'નવો ધોરણ-વાર વિષય ઉમેરો' : 'Add New Standard-Wise Subject'}</span>
            </h3>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  {isGu ? 'શૈક્ષણિક ધોરણ પસંદ કરો' : 'Select Target Academic Standard'}
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
                  {isGu ? 'વિષયનું નામ' : 'Subject Name'}
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder={isGu ? 'દા.ત. વિજ્ઞાન અને ગતિ' : 'e.g. Science & Motion'}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {isGu ? 'વિષય કોડ' : 'Subject Code'}
                </label>
                <input
                  type="text"
                  required
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder={isGu ? 'દા.ત. SCI101' : 'e.g. SCI101'}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {isGu ? 'વર્ણન' : 'Description'}
                </label>
                <textarea
                  value={subjectDesc}
                  onChange={(e) => setSubjectDesc(e.target.value)}
                  placeholder={isGu ? 'અભ્યાસક્રમ રૂપરેખા અને વિગતો...' : 'Course outline and syllabus details...'}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 h-20 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
              >
                {isGu ? `${getStandardLabel(subjectStandard)} માટે વિષય ઉમેરો` : `Add Subject for ${subjectStandard}`}
              </button>
            </form>
          </div>

          {/* Subjects List with Edit & Delete */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>{isGu ? 'વર્તમાન વિષયો (સંપાદિત કરો અને કાઢી નાખો)' : 'Current Subjects (Edit & Delete)'}</span>
            </h3>

            <div className="space-y-3">
              {subjects.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  {isGu ? 'હજુ સુધી કોઈ વિષય બનાવવામાં આવ્યો નથી' : 'No subjects created yet'}
                </p>
              ) : (
                subjects.map((s) => (
                  <div key={s.id} className="p-4 bg-slate-800/60 border border-slate-700/70 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                        <span>{(isGu && s.nameGu) ? s.nameGu : s.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-semibold">
                          {s.code}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        📚 {isGu ? 'ધોરણ: ' : 'Standard: '}
                        <span className="font-semibold text-slate-200">{getStandardLabel(s.standard || 'Standard 8')}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingSubject(s)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-purple-300 rounded-xl transition-all"
                        title={isGu ? 'વિષય સંપાદિત કરો' : 'Edit Subject'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(s.id, (isGu && s.nameGu) ? s.nameGu : s.name)}
                        className="p-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 rounded-xl transition-all"
                        title={isGu ? 'વિષય કાઢી નાખો' : 'Delete Subject'}
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
              <span>{isGu ? 'નવો પ્રશ્ન અને જવાબો ઉમેરો (MCQ)' : 'Add New Question & Answers (MCQ)'}</span>
            </h3>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {isGu ? 'વિષય પસંદ કરો' : 'Select Subject'}
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
                    <option value="">{isGu ? '-- વિષય પસંદ કરો --' : '-- Select Target Subject --'}</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        [{getStandardLabel(s.standard || 'Standard 8')}] {(isGu && s.nameGu) ? s.nameGu : s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {isGu ? 'ચોક્કસ મુદ્દો પસંદ કરો (વૈકલ્પિક)' : 'Select Specific Topic (Optional)'}
                  </label>
                  <select
                    value={questionTopicId}
                    onChange={(e) => setQuestionTopicId(e.target.value)}
                    disabled={!selectedSubjectId}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  >
                    <option value="">{isGu ? 'સામાન્ય (મુખ્ય મુદ્દો)' : 'Default (Core Topic)'}</option>
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
                  {isGu ? 'પ્રશ્ન લખાણ' : 'Question Prompt'}
                </label>
                <textarea
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={isGu ? 'તમારો બહુવિકલ્પી પ્રશ્ન અહીં દાખલ કરો...' : 'Enter your multiple-choice question here...'}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 h-20 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  {isGu
                    ? 'જવાબ વિકલ્પો (સાચા જવાબ માટે રેડિયો બટન પસંદ કરો)'
                    : 'Answer Options (Select Radio Button for Correct Answer)'
                  }
                </label>
                {[
                  { val: optA, setVal: setOptA, idx: 0, label: isGu ? 'વિકલ્પ A' : 'Option A' },
                  { val: optB, setVal: setOptB, idx: 1, label: isGu ? 'વિકલ્પ B' : 'Option B' },
                  { val: optC, setVal: setOptC, idx: 2, label: isGu ? 'વિકલ્પ C' : 'Option C' },
                  { val: optD, setVal: setOptD, idx: 3, label: isGu ? 'વિકલ્પ D' : 'Option D' },
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
                  {isGu ? 'સમજૂતી / ઉકેલ વિગતો' : 'Explanation / Solution Details'}
                </label>
                <textarea
                  value={questionExplanation}
                  onChange={(e) => setQuestionExplanation(e.target.value)}
                  placeholder={isGu
                    ? 'વિદ્યાર્થી ટેસ્ટ સબમિટ કર્યા પછી દર્શાવવામાં આવતી વિગતવાર ઉકેલ સમજૂતી...'
                    : 'Detailed solution explanation shown after student submits test...'
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 h-16 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
              >
                {isGu ? 'પ્રશ્ન અને જવાબો પ્રશ્ન બેંકમાં સાચવો' : 'Save Question & Answers to Question Bank'}
              </button>
            </form>
          </div>

          {/* Question Bank List View with Edit & Delete */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <FileQuestion className="w-5 h-5 text-purple-400" />
                <span>
                  {isGu
                    ? `હાલની પ્રશ્ન બેંક (${filteredQuestions.length} પ્રશ્નો)`
                    : `Existing Question Bank (${filteredQuestions.length} Questions)`
                  }
                </span>
              </h3>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">{isGu ? 'ધોરણ ફિલ્ટર:' : 'Filter Standard:'}</span>
                <select
                  value={questionBankFilter}
                  onChange={(e) => setQuestionBankFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">{isGu ? 'બધા ધોરણો' : 'All Standards'}</option>
                  <option value="Standard 6">{getStandardLabel('Standard 6')}</option>
                  <option value="Standard 7">{getStandardLabel('Standard 7')}</option>
                  <option value="Standard 8">{getStandardLabel('Standard 8')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  {isGu
                    ? 'પસંદ કરેલ ધોરણ ફિલ્ટર માટે કોઈ પ્રશ્નો મળ્યા નથી'
                    : 'No questions found for the selected standard filter'
                  }
                </p>
              ) : (
                filteredQuestions.map((q) => {
                  const rawSubjectName = q.topic?.chapter?.subject?.name || q.subjectName || 'Subject';
                  const subjectName = (isGu && (q.topic?.chapter?.subject?.nameGu || q.subjectNameGu))
                    ? (q.topic?.chapter?.subject?.nameGu || q.subjectNameGu)
                    : rawSubjectName;
                  const subjectStandard = q.topic?.chapter?.subject?.standard || 'Standard 8';
                  const topicName = (isGu && q.topic?.nameGu)
                    ? q.topic.nameGu
                    : (q.topic?.name || (isGu ? 'સામાન્ય' : 'General'));

                  return (
                    <div key={q.id} className="p-5 bg-slate-800/60 border border-slate-700/70 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                              📚 {getStandardLabel(subjectStandard)} • {subjectName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isGu ? 'મુદ્દો: ' : 'Topic: '}{topicName}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-white">
                            {(isGu && q.questionTextGu) ? q.questionTextGu : q.questionText}
                          </h4>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => setEditingQuestion(q)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 text-purple-300 rounded-xl transition-all"
                            title={isGu ? 'પ્રશ્ન સંપાદિત કરો' : 'Edit Question'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 rounded-xl transition-all"
                            title={isGu ? 'પ્રશ્ન કાઢી નાખો' : 'Delete Question'}
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
                            <span>{(isGu && opt.optionTextGu) ? opt.optionTextGu : opt.optionText}</span>
                            {opt.isCorrect && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                                {isGu ? 'સાચો જવાબ' : 'Correct Answer'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {(q.explanation || q.explanationGu) && (
                        <p className="text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
                          💡 <span className="font-semibold text-slate-300">{isGu ? 'સમજૂતી: ' : 'Explanation: '}</span>
                          {(isGu && q.explanationGu) ? q.explanationGu : q.explanation}
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

      {/* EDIT SUBJECT MODAL */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                <span>{isGu ? 'વિષય વિગતો સંપાદિત કરો' : 'Edit Subject Details'}</span>
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
                  {isGu ? 'શૈક્ષણિક ધોરણ' : 'Academic Standard'}
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
                  {isGu ? 'વિષયનું નામ' : 'Subject Name'}
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
                  {isGu ? 'વિષય કોડ' : 'Subject Code'}
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
                  {isGu ? 'વર્ણન' : 'Description'}
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
                  {isGu ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isGu ? 'ફેરફારો સાચવો' : 'Save Changes'}</span>
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
                <span>{isGu ? 'પ્રશ્ન અને વિકલ્પો સંપાદિત કરો' : 'Edit Question & Options'}</span>
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
                  {isGu ? 'પ્રશ્ન લખાણ' : 'Question Prompt'}
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
                  {isGu
                    ? 'વિકલ્પો (સાચા જવાબ માટે રેડિયો બટન પસંદ કરો)'
                    : 'Options (Select Radio Button for Correct Answer)'
                  }
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
                      placeholder={isGu ? `વિકલ્પ ${idx + 1}` : `Option ${idx + 1}`}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {isGu ? 'સમજૂતી' : 'Explanation'}
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
                  {isGu ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isGu ? 'પ્રશ્ન અપડેટ કરો' : 'Update Question'}</span>
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
