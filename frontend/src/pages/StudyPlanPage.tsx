import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StudyPlan, StudyTask, ActivityType } from '../types';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import {
  CalendarCheck,
  Clock,
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  RefreshCw,
  BookOpen,
  CheckSquare,
  AlertCircle,
  FlaskConical,
  Trophy,
  Calendar,
  Layers
} from 'lucide-react';

export const StudyPlanPage: React.FC = () => {
  const { t, i18n } = useTranslation(['studyPlan', 'common']);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Active View Tab: Daily vs 7-Day Weekly
  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  // Form states
  const [hours, setHours] = useState<number>(3.0);
  const [targetDate, setTargetDate] = useState<string>('');
  const [targetPercentage, setTargetPercentage] = useState<number>(85.0);

  useEffect(() => {
    fetchPlan();
  }, [i18n.language]);

  const fetchPlan = async () => {
    try {
      const res = await api.get('/study-plan/today', {
        params: { lang: i18n.language || 'en' }
      });
      setPlan(res.data.plan);
      if (res.data.plan) {
        setHours(res.data.plan.availableMinutes / 60);
        if (res.data.plan.examDate) {
          setTargetDate(new Date(res.data.plan.examDate).toISOString().split('T')[0]);
        }
        setTargetPercentage(res.data.plan.targetPercentage || 85.0);
      }
    } catch (err) {
      console.error('Failed to load study plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/study-plan/generate', {
        availableHoursPerDay: hours,
        examDate: targetDate || undefined,
        targetPercentage
      });
      setPlan(res.data.plan);
    } catch (err) {
      console.error('Failed to generate study plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await api.patch(`/study-plan/tasks/${taskId}/toggle`);
      const updatedTask = res.data.task;
      setPlan(prev => prev ? {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, isCompleted: updatedTask.isCompleted } : t)
      } : null);
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Activity Helper Function with Translated Labels
  const getActivityBadge = (type?: ActivityType) => {
    switch (type) {
      case 'CONCEPT_REVIEW':
        return {
          label: t('activities.conceptReview'),
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <BookOpen className="w-3.5 h-3.5 text-blue-400" />
        };
      case 'MCQ_PRACTICE':
        return {
          label: t('activities.mcqPractice'),
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
        };
      case 'MISTAKE_REVISION':
        return {
          label: t('activities.mistakeRevision'),
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        };
      case 'FORMULA_DRILL':
        return {
          label: t('activities.formulaDrill'),
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
        };
      case 'MOCK_QUIZ':
        return {
          label: t('activities.mockQuiz'),
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          icon: <Trophy className="w-3.5 h-3.5 text-rose-400" />
        };
      default:
        return {
          label: t('activities.conceptReview'),
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <BookOpen className="w-3.5 h-3.5 text-blue-400" />
        };
    }
  };

  const getPriorityLabel = (priority: string) => {
    if (priority === 'HIGH') return t('high');
    if (priority === 'MEDIUM') return t('medium');
    return t('low');
  };

  const tasksList = plan?.tasks || [];
  const selectedDayTasks = tasksList.filter(t => (t.dayNumber || 1) === selectedDayNumber);

  const completedCount = selectedDayTasks.filter(t => t.isCompleted).length;
  const totalCount = selectedDayTasks.length;
  const progressPerc = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalWeeklyCompleted = tasksList.filter(t => t.isCompleted).length;
  const totalWeeklyTasks = tasksList.length;
  const weeklyProgress = totalWeeklyTasks > 0 ? Math.round((totalWeeklyCompleted / totalWeeklyTasks) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <CalendarCheck className="w-7 h-7 text-blue-400" />
            <span>{t('myStudyPlan')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {tr('વિષય પ્રાથમિકતા સ્કોરની ગણતરી કરે છે, અભ્યાસ પ્રવૃત્તિઓ બદલે છે અને તમારી ૭-દિવસની યોજના બનાવે છે', 'Calculates topic priority scores, alternates study activity types, and builds your 7-day schedule', 'विषय प्राथमिकता स्कोर की गणना करता है, अध्ययन गतिविधियों को बदलता है और आपकी 7-दिवसीय योजना बनाता है')}
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('DAILY')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'DAILY'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t('todaysPlan')}</span>
          </button>

          <button
            onClick={() => setActiveTab('WEEKLY')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'WEEKLY'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('weeklyPlan')}</span>
          </button>
        </div>
      </div>

      {/* 5 Study Phases Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          {tr('૫ મુખ્ય અભ્યાસ તબક્કા', '5 Core Learning Phases')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-1">
            <span className="block font-bold text-blue-400 text-[11px] uppercase tracking-wider">{tr('તબક્કો ૧', 'Phase 1')}</span>
            <span className="text-slate-100 font-bold block text-sm">{t('phases.learning')}</span>
            <p className="text-[11px] text-slate-400 leading-snug">
              {tr('ખ્યાલોને સમજો અને જરૂરી અભ્યાસ સામગ્રી પૂર્ણ કરો.', 'Understand the concepts and complete the required learning material.')}
            </p>
          </div>
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1">
            <span className="block font-bold text-emerald-400 text-[11px] uppercase tracking-wider">{tr('તબક્કો ૨', 'Phase 2')}</span>
            <span className="text-slate-100 font-bold block text-sm">{t('phases.practice')}</span>
            <p className="text-[11px] text-slate-400 leading-snug">
              {tr('પ્રેક્ટિસ પ્રશ્નો ઉકેલીને તમારી સમજને મજબૂત બનાવો.', 'Strengthen your understanding by solving practice questions.')}
            </p>
          </div>
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1">
            <span className="block font-bold text-amber-400 text-[11px] uppercase tracking-wider">{tr('તબક્કો ૩', 'Phase 3')}</span>
            <span className="text-slate-100 font-bold block text-sm">{t('phases.weaknessRemoval')}</span>
            <p className="text-[11px] text-slate-400 leading-snug">
              {tr('જે વિષયોમાં તમારું પ્રદર્શન નબળું રહ્યું છે તેના પર ધ્યાન આપો.', 'Focus on topics where your performance has been low.')}
            </p>
          </div>
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-1">
            <span className="block font-bold text-purple-400 text-[11px] uppercase tracking-wider">{tr('તબક્કો ૪', 'Phase 4')}</span>
            <span className="text-slate-100 font-bold block text-sm">{t('phases.finalRevision')}</span>
            <p className="text-[11px] text-slate-400 leading-snug">
              {tr('પરીક્ષા પહેલાં મહત્વપૂર્ણ ખ્યાલો, સૂત્રો અને નોંધોનું પુનરાવર્તન કરો.', 'Review important concepts, formulas, and notes before exams.')}
            </p>
          </div>
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
            <span className="block font-bold text-rose-400 text-[11px] uppercase tracking-wider">{tr('તબક્કો ૫', 'Phase 5')}</span>
            <span className="text-slate-100 font-bold block text-sm">{t('phases.mockTest')}</span>
            <p className="text-[11px] text-slate-400 leading-snug">
              {tr('તમારી એકંદર તૈયારીનું મૂલ્યાંકન કરવા માટે સંપૂર્ણ પરીક્ષા-શૈલીની ટેસ્ટ આપો.', 'Take a complete exam-style test to assess your overall preparation.')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & Priority Engine Info */}
        <div className="space-y-6">
          {/* Target Form Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>{t('regenerate')}</span>
            </h3>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('dailyStudyTime')}: <span className="text-blue-400 font-bold">{hours} {t('hoursPerDay')} ({hours * 60} {tr('મિનિટ', 'mins')})</span>
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="8.0"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('examDate')}
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('targetPercentage')}: <span className="text-blue-400 font-bold">{targetPercentage}%</span>
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={targetPercentage}
                  onChange={(e) => setTargetPercentage(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? t('common:saving') : t('generatePlan')}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Columns: Daily / Weekly Schedule View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Day Selector Tabs (Days 1 to 7) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between gap-2 overflow-x-auto shadow-xl">
            {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
              const dayTasks = tasksList.filter(t => (t.dayNumber || 1) === dayNum);
              const dayDone = dayTasks.filter(t => t.isCompleted).length;
              const isSelected = selectedDayNumber === dayNum;

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDayNumber(dayNum)}
                  className={`flex-1 py-3 px-3 rounded-2xl text-center transition-all min-w-[70px] border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider">
                    {dayNum === 1 ? `${t('day')} 1 (${t('today')})` : `${t('day')} ${dayNum}`}
                  </span>
                  <span className="block text-xs font-bold mt-1">
                    {dayDone}/{dayTasks.length} {t('completed')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Daily Schedule Task List Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center space-x-2">
                  <span>{t('day')} {selectedDayNumber} {t('todaysPlan')}</span>
                  <span className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-semibold">
                    {plan?.availableMinutes} {tr('મિનિટ ફાળવેલ', 'Mins Allocated')}
                  </span>
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-semibold">{completedCount} / {totalCount} {t('completed')}</span>
                  <div className="w-36 bg-slate-800 rounded-full h-2 mt-1">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPerc}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Task Checklist */}
            <div className="space-y-3">
              {selectedDayTasks.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  {tr(`દિવસ ${selectedDayNumber} માટે કોઈ કાર્ય નિર્ધારિત નથી. તમારી યોજના બનાવવા માટે "નવી 7-દિવસની યોજના બનાવો" પર ક્લિક કરો!`, `No tasks scheduled for ${t('day')} ${selectedDayNumber}. Click "${t('generatePlan')}" to build your schedule!`, `दिन ${selectedDayNumber} के लिए कोई कार्य निर्धारित नहीं है। अपना शेड्यूल बनाने के लिए "नई 7-दिवसीय योजना बनाएं" पर क्लिक करें!`)}
                </p>
              ) : (
                selectedDayTasks.map((task) => {
                  const activity = getActivityBadge(task.activityType);

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        task.isCompleted
                          ? 'bg-slate-800/30 border-slate-800/80 opacity-65'
                          : 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600 shadow-md'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        <button className="text-slate-400 hover:text-emerald-400 transition-colors mt-0.5">
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                              📚 {trSubject(task)}
                            </span>

                            {/* Varied Activity Badge */}
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border flex items-center space-x-1 ${activity.color}`}>
                              {activity.icon}
                              <span>{activity.label}</span>
                            </span>
                          </div>

                          <h4 className={`font-bold text-sm ${task.isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                            {trItem(task.topicNameGu, task.topicName)}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
                        <div className="flex items-center space-x-1 text-slate-300 text-xs font-semibold px-2.5 py-1 bg-slate-900/60 rounded-xl border border-slate-700">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>{task.durationMinutes} {tr('મિનિટ', 'mins')}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase ${
                          task.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          task.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {getPriorityLabel(task.priority)} {t('priority')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Weekly Summary Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>{t('overallProgress')}</span>
              </h4>
              <span className="text-xs font-bold text-emerald-400">{weeklyProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-3 rounded-full transition-all duration-500" style={{ width: `${weeklyProgress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
