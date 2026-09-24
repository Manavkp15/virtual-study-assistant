import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { TestCatalogItem } from '../types';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import { FileCheck2, Clock, Award, Play, Filter, Sparkles } from 'lucide-react';

export const TestsPage: React.FC = () => {
  const { t, i18n } = useTranslation(['tests', 'common']);
  const [tests, setTests] = useState<TestCatalogItem[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, dashRes] = await Promise.all([
          api.get('/tests', { params: { lang: i18n.language || 'en' } }),
          api.get('/student/dashboard', { params: { lang: i18n.language || 'en' } })
        ]);
        setTests(testsRes.data.tests || []);
        setRecommended(dashRes.data.recommendedTests || []);
      } catch (err) {
        console.error('Failed to load test catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [i18n.language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredTests = tests.filter(tItem => {
    if (selectedDifficulty !== 'ALL' && tItem.difficulty !== selectedDifficulty) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <FileCheck2 className="w-7 h-7 text-blue-400" />
            <span>{t('catalogTitle')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('catalogSubtitle')}
          </p>
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{t('common:all')} {t('difficulty')}</option>
            <option value="BASIC">{tr('મૂળભૂત પ્રેક્ટિસ', 'BASIC Practice')}</option>
            <option value="MEDIUM">{tr('મધ્યમ પ્રેક્ટિસ', 'MEDIUM Practice')}</option>
            <option value="ADVANCED">{tr('અદ્યતન પ્રેક્ટિસ', 'ADVANCED Practice')}</option>
            <option value="CHALLENGE">{tr('પડકારરૂપ પરીક્ષા', 'CHALLENGE Exam')}</option>
            <option value="REVISION">{tr('પુનરાવર્તન ટેસ્ટ', 'REVISION Test')}</option>
          </select>
        </div>
      </div>

      {/* Recommended Test Highlight Banner */}
      {recommended.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-blue-900/40 border border-emerald-500/30 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{tr('AI ભલામણ કરેલ આગામી ટેસ્ટ', 'AI Recommended Next Test')}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                {trItem(recommended[0].testTitleGu, recommended[0].testTitle)}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {trItem(recommended[0].reasonGu, recommended[0].reason)}
              </p>
            </div>
            <button
              onClick={() => navigate(`/tests/${recommended[0].testId}`)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 flex-shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{t('startTest')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Test Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <div key={test.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  {trSubject(test.subject)}
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                  test.difficulty === 'BASIC' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  test.difficulty === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  test.difficulty === 'ADVANCED' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {t(`common:difficulty.${test.difficulty}`, test.difficulty)}
                </span>
              </div>

              <h3 className="font-bold text-base text-white">
                {trItem(test.titleGu, test.title)}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {trItem(test.descriptionGu, test.description)}
              </p>

              <div className="flex items-center space-x-4 text-xs text-slate-400 border-t border-b border-slate-800 py-3">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{test.durationMinutes} {t('mins')}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-slate-500" />
                  <span>{t('passPercentage')}: {test.passPercentage}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/tests/${test.id}`)}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{t('startTest')}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
