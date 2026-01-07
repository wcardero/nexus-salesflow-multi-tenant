import React from 'react';

interface ReportCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    positive: boolean;
    label: string;
  };
}

const ReportCard: React.FC<ReportCardProps> = ({ title, value, icon, trend }) => {
  return (
    <div className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-2">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`material-symbols-outlined text-sm ${
                trend.positive ? 'text-success-600' : 'text-danger-600'
              }`}>
                {trend.positive ? 'trending_up' : 'trending_down'}
              </span>
              <span className={`text-sm font-medium ${
                trend.positive ? 'text-success-600' : 'text-danger-600'
              }`}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">vs {trend.label}</span>
            </div>
          )}
        </div>
        <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
          <span className="material-symbols-outlined text-2xl text-primary-600 dark:text-primary-400">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
