import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  History,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  X,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr, trItem } from '../utils/tr';
import { RemedialHistoryItem } from '../types';

interface RemedialHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemedialHistoryModal: React.FC<RemedialHistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation(['tests', 'common']);
  const [history, setHistory] = useState<RemedialHistoryItem[]>([]);
  const [stats, setStats] = useState<{ totalSessions: number; improvedSessions: number; avgImprovement: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/remedial/history');
        setHistory(res.data.history || []);
        setStats(res.data.stats || null);
      } catch (err) {
        console.error('Failed to load remedial history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {tr('સુધારાત્મક અભ્યાસ ઇતિહાસ', 'Remedial Revision History')}
              </h2>
              <p className="text-xs text-slate-400">
                {tr('તમારી પ્રગતિ અને પ્રકરણવાર સુધારણાનો રેકોર્ડ', 'Track your revision progress and improvement history')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Summary Stats Cards */}
          {stats && stats.totalSessions > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {tr('કુલ સત્રો', 'Total Sessions')}
                </span>
                <p className="text-xl font-extrabold text-white mt-1">{stats.totalSessions}</p>
              </div>

              <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {tr('સુધરેલા સત્રો', 'Improved')}
                </span>
                <p className="text-xl font-extrabold text-emerald-400 mt-1">{stats.improvedSessions}</p>
              </div>

              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  {tr('સરેરાશ સુધારો', 'Avg Improvement')}
                </span>
                <p className="text-xl font-extrabold text-emerald-400 mt-1">
                  +{stats.avgImprovement}%
                </p>
              </div>
            </div>
          )}

          {/* List of Historical Sessions */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>{tr('ઇતિહાસ લોડ થઈ રહ્યો છે...', 'Loading history...')}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="p-4 bg-slate-800/60 rounded-3xl inline-flex text-slate-500">
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-400">
                {tr(
                  'હજુ સુધી કોઈ સુધારાત્મક સત્ર નોંધાયેલું નથી. તમે સારું પ્રદર્શન કરી રહ્યા છો!',
                  'No remedial sessions recorded yet. Keep up the high scores!'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>{trItem(item.chapterNameGu, item.chapterName)}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({trItem(item.subjectNameGu, item.subjectName)})
                        </span>
                      </h4>
                      <span className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(item.completedAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    {/* Improvement Delta Badge */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400 font-medium">
                        {item.initialPercentage}% ➔ <strong className="text-blue-400">{item.remedialPercentage}%</strong>
                      </span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg flex items-center space-x-0.5 ${
                        item.improvementPercentage > 0
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        <span>+{item.improvementPercentage}%</span>
                      </span>
                    </div>
                  </div>

                  {/* Encouragement message received */}
                  {item.encouragementMessage && (
                    <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-700/50">
                      "{trItem(item.encouragementMessageGu, item.encouragementMessage)}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
          >
            {tr('બંધ કરો (Close)', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
