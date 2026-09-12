import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { DashboardData } from '../types';
import { SummaryCard } from '../components/SummaryCard';
import { useTranslation } from 'react-i18next';
import {
  Trophy,
  Target,
  Percent,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Flame,
  Sparkles,
  BookOpen,
  ArrowRight,
  PlayCircle,
  BarChart2,
  Brain,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isGu = i18n.language === 'gu';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/student/dashboard', {
          params: { lang: isGu ? 'gu' : 'en' }
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [i18n.language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summaryCards, analyticsOverview, weakTopics, recommendedTests, aiGuidance, recentTestResults } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* AI Motivation Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGu ? 'AI માર્ગદર્શન એન્જિન' : 'AI Guidance Engine'}</span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {aiGuidance.personalizedFeedback}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {aiGuidance.motivationMessage}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center space-x-3">
            <button
              onClick={() => navigate('/ai-assistant')}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2"
            >
              <Brain className="w-4 h-4" />
              <span>{t('common:nav.aiAssistant')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <SummaryCard
          title={t('overallScore')}
          value={`${summaryCards.overallScore}%`}
          subtitle={isGu ? 'કુલ સંચિત ગુણ' : 'Total accumulated marks'}
          icon={Trophy}
          iconBgColor="bg-amber-500/10 border-amber-500/20"
          iconTextColor="text-amber-400"
        />
        <SummaryCard
          title={isGu ? 'સરેરાશ ગુણ' : 'Average Score'}
          value={`${summaryCards.averagePercentage}%`}
          subtitle={isGu ? 'બધા ટેસ્ટના સરેરાશ ગુણ' : 'Mean score across tests'}
          icon={Percent}
          iconBgColor="bg-blue-500/10 border-blue-500/20"
          iconTextColor="text-blue-400"
        />
        <SummaryCard
          title={t('accuracy')}
          value={`${summaryCards.accuracy}%`}
          subtitle={isGu ? 'સાચા / કુલ ગુણોત્તર' : 'Correct / Total Ratio'}
          icon={Target}
          iconBgColor="bg-emerald-500/10 border-emerald-500/20"
          iconTextColor="text-emerald-400"
        />
        <SummaryCard
          title={t('testsCompleted')}
          value={summaryCards.testsCompleted}
          subtitle={isGu ? 'કુલ આપેલ પરીક્ષાઓ' : 'Total submitted exams'}
          icon={CheckCircle2}
          iconBgColor="bg-purple-500/10 border-purple-500/20"
          iconTextColor="text-purple-400"
        />
        <SummaryCard
          title={t('strongTopics')}
          value={summaryCards.strongTopicsCount}
          subtitle={isGu ? 'ચોકસાઈ > ૭૫%' : 'Accuracy > 75%'}
          icon={TrendingUp}
          iconBgColor="bg-emerald-500/10 border-emerald-500/20"
          iconTextColor="text-emerald-400"
        />
        <SummaryCard
          title={t('weakTopics')}
          value={summaryCards.weakTopicsCount}
          subtitle={isGu ? 'પગલાં લેવાની જરૂર' : 'Action needed'}
          icon={AlertTriangle}
          iconBgColor="bg-red-500/10 border-red-500/20"
          iconTextColor="text-red-400"
        />
        <SummaryCard
          title={t('improvement')}
          value={`${summaryCards.improvementPercentage >= 0 ? '+' : ''}${summaryCards.improvementPercentage}%`}
          subtitle={isGu ? 'પ્રગતિ દર શિફ્ટ' : 'Trend rate shift'}
          icon={TrendingUp}
          iconBgColor="bg-indigo-500/10 border-indigo-500/20"
          iconTextColor="text-indigo-400"
          trend={`${Math.abs(summaryCards.improvementPercentage)}%`}
          trendPositive={summaryCards.improvementPercentage >= 0}
        />
        <SummaryCard
          title={t('studyStreak')}
          value={isGu ? `${summaryCards.studyStreak} દિવસ` : `${summaryCards.studyStreak} Days`}
          subtitle={isGu ? 'દૈનિક સક્રિય અભ્યાસ' : 'Active daily learning'}
          icon={Flame}
          iconBgColor="bg-amber-500/10 border-amber-500/20"
          iconTextColor="text-amber-400"
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2-Cols: Performance Charts & Weak Topics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Trend Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center space-x-2">
                  <BarChart2 className="w-5 h-5 text-blue-400" />
                  <span>{t('performanceOverview')}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isGu ? 'સમય સાથે ઐતિહાસિક ટેસ્ટ ટકાવારી ગુણ' : 'Historical test percentage scores over time'}
                </p>
              </div>
              <Link to="/analytics" className="text-xs text-blue-400 hover:underline font-semibold flex items-center space-x-1">
                <span>{isGu ? 'વિગતવાર વિશ્લેષણ જુઓ' : 'View Deep Analytics'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="h-64 w-full">
              {analyticsOverview.recentTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsOverview.recentTrends}>
                    <defs>
                      <linearGradient id="colorPerc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorPerc)"
                      name={isGu ? 'ટકાવારી %' : 'Percentage %'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  {isGu ? 'પ્રગતિ ચાર્ટ જોવા માટે ટેસ્ટ આપો' : 'Attempt test assessments to plot your progress chart'}
                </div>
              )}
            </div>
          </div>

          {/* Weak Topics Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>{t('weakTopics')}</span>
              </h3>
              <span className="text-xs text-red-400 font-semibold bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                {weakTopics.length} {isGu ? 'ધ્યાન આપવાની જરૂર' : 'Action Needed'}
              </span>
            </div>

            {weakTopics.length === 0 ? (
              <div className="p-6 bg-slate-800/40 rounded-2xl text-center text-slate-400 text-xs">
                {isGu ? '🎉 કોઈ ગંભીર નબળા વિષયો જણાયા નથી! અભ્યાસ ચાલુ રાખો!' : '🎉 No critical weak topics detected! Keep up your solid study streak!'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weakTopics.map((wt) => (
                  <div key={wt.topicId} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                          {isGu ? (wt.subjectNameGu || wt.subjectName) : wt.subjectName}
                        </span>
                        <h4 className="font-semibold text-sm text-slate-100">
                          {isGu ? (wt.topicNameGu || wt.topicName) : wt.topicName}
                        </h4>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${
                        wt.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isGu ? (t(`common:statusText.${wt.status}`, wt.status)) : wt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 border-t border-b border-slate-700/50 py-2">
                      <div>
                        <span>{t('accuracy')}: </span>
                        <span className="font-bold text-slate-200">{wt.accuracy}%</span>
                      </div>
                      <div>
                        <span>{isGu ? 'વારંવાર થયેલ ભૂલો: ' : 'Repeated Errors: '}</span>
                        <span className="font-bold text-red-400">{wt.repeatedMistakes}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{isGu ? (wt.recommendationGu || wt.recommendation) : wt.recommendation}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1-Col: Priorities & Recommended Tests */}
        <div className="space-y-8">
          {/* Priorities */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{t('todaysPlan')}</span>
            </h3>
            <div className="space-y-2.5">
              {aiGuidance.learningPriorities.map((pri, idx) => (
                <div key={idx} className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200 flex items-start space-x-2">
                  <span className="font-bold text-amber-400">{idx + 1}.</span>
                  <span>{pri}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/study-plan')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs rounded-xl border border-slate-700 transition-all text-center block"
            >
              {t('common:nav.studyPlan')}
            </button>
          </div>

          {/* Recommended Test */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>{t('recommendedTest')}</span>
            </h3>
            <div className="space-y-3">
              {recommendedTests.map((rt) => (
                <div key={rt.testId} className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      {isGu ? t(`common:difficulty.${rt.recommendedDifficulty}`, rt.recommendedDifficulty) : rt.recommendedDifficulty}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {rt.matchScore}% {isGu ? 'મેળ' : 'Match'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-100">
                    {isGu ? (rt.testTitleGu || rt.testTitle) : rt.testTitle}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isGu ? (rt.reasonGu || rt.reason) : rt.reason}
                  </p>
                  <button
                    onClick={() => navigate(`/tests/${rt.testId}`)}
                    className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-1"
                  >
                    <span>{isGu ? 'ટેસ્ટ શરૂ કરો' : 'Start Test'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Test Attempts */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>{t('recentTests')}</span>
            </h3>
            <div className="space-y-2.5">
              {recentTestResults.map((r) => (
                <div key={r.id} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200 truncate w-36">
                      {isGu ? (r.testTitleGu || r.testTitle) : r.testTitle}
                    </p>
                    <p className="text-[10px] text-slate-400">{new Date(r.completedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-blue-400 text-sm">{r.percentage}%</span>
                    <p className="text-[10px] text-slate-400">
                      {r.score}/{r.maxScore} {isGu ? 'ગુણ' : 'pts'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
