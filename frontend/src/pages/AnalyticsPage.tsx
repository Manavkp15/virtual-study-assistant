import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  Target,
  PieChart as PieIcon,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { t, i18n } = useTranslation(['analytics', 'common']);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [prediction, setPrediction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const isGu = i18n.language === 'gu';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analRes, predRes] = await Promise.all([
          api.get('/student/performance', { params: { lang: isGu ? 'gu' : 'en' } }),
          api.get('/student/predictions', { params: { lang: isGu ? 'gu' : 'en' } })
        ]);
        setAnalytics(analRes.data);
        setPrediction(predRes.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [i18n.language]);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Pie chart data for Correct vs Wrong vs Unanswered
  const pieData = [
    { name: t('correctAnswers'), value: analytics.totalCorrect, color: '#10b981' },
    { name: t('wrongAnswers'), value: analytics.totalWrong, color: '#ef4444' },
    { name: t('unansweredQuestions'), value: analytics.totalUnanswered, color: '#64748b' }
  ];

  const subjectPerformanceData = (analytics.subjectPerformance || []).map((sp: any) => ({
    ...sp,
    displayName: isGu ? (sp.subjectNameGu || sp.subjectName) : sp.subjectName
  }));

  const difficultyPerformanceData = (analytics.difficultyPerformance || []).map((dp: any) => ({
    ...dp,
    displayName: isGu ? t(`common:difficulty.${dp.difficulty}`, dp.difficulty) : dp.difficulty
  }));

  const getTrendLabel = (dir: string) => {
    if (isGu) {
      if (dir === 'IMPROVING') return 'સુધરી રહ્યો છે';
      if (dir === 'DECLINING') return 'ઘટી રહ્યો છે';
      return 'સ્થિર';
    }
    return dir;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
          <BarChart3 className="w-7 h-7 text-blue-400" />
          <span>{t('performanceAnalytics')}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isGu
            ? 'આંકડાકીય ટેલિમેટ્રી, ચોકસાઈ ટ્રેન્ડ્સ અને ગુણ પૂર્વાનુમાન'
            : 'Statistical telemetry, accuracy trends, and linear regression score forecasts'}
        </p>
      </div>

      {/* Top Prediction Summary Banner */}
      {prediction && (
        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-blue-900/40 border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>
                {isGu ? 'આંકડાકીય પ્રદર્શન પૂર્વાનુમાન' : 'Statistical Performance Prediction'}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-300 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
              {isGu ? 'વિશ્વાસ સ્કોર:' : 'Confidence:'} {prediction.confidenceScore}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold">
                {isGu ? 'આગામી ટેસ્ટના અપેક્ષિત ટકા' : 'Forecasted Next Test Percentage'}
              </span>
              <p className="text-3xl font-extrabold text-white">{prediction.predictedNextScore}%</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold">{t('performanceTrend')}</span>
              <p className={`text-xl font-bold ${
                prediction.trendDirection === 'IMPROVING' ? 'text-emerald-400' :
                prediction.trendDirection === 'DECLINING' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {prediction.trendDirectionGu || getTrendLabel(prediction.trendDirection)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold">
                {isGu ? 'ભલામણ સારાંશ' : 'Recommendation Summary'}
              </span>
              <p className="text-xs text-slate-300 italic">
                {isGu ? (prediction.recommendationSummaryGu || prediction.recommendationSummary) : prediction.recommendationSummary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid - 2 Cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Score & Accuracy Trend Over Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>{t('scoreTrend')} & {t('accuracyTrend')}</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.recentTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={3} name={t('scoreTrend')} />
                <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name={t('accuracyTrend')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Subject Performance Comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>{t('subjectPerformance')}</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayName" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend />
                <Bar dataKey="averagePercentage" fill="#6366f1" radius={[8, 8, 0, 0]} name={t('averageScore')} />
                <Bar dataKey="accuracy" fill="#3b82f6" radius={[8, 8, 0, 0]} name={t('averageAccuracy')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Correct vs Wrong vs Unanswered Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-emerald-400" />
            <span>{t('correctAnswers')} / {t('wrongAnswers')}</span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Difficulty-wise Accuracy Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span>{t('difficultyWisePerformance')}</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayName" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Bar dataKey="accuracy" fill="#8b5cf6" radius={[8, 8, 0, 0]} name={t('averageAccuracy')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
