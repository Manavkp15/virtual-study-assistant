import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  trend?: string;
  trendPositive?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-500/10 border-blue-500/20',
  iconTextColor = 'text-blue-400',
  trend,
  trendPositive = true
}) => {
  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg backdrop-blur-sm hover:border-slate-600 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl border ${iconBgColor} ${iconTextColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-extrabold text-white tracking-tight">{value}</span>
        {trend && (
          <span className={`ml-2 text-xs font-bold ${trendPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>}
    </div>
  );
};
