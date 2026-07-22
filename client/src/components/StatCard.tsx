import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  color?: string;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  color = 'from-brand-600 to-brand-400',
  badge
}) => {
  return (
    <div className="p-5 rounded-2xl bg-dark-card border border-dark-border hover:border-slate-700 transition-all duration-300 relative overflow-hidden group shadow-lg glass-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white tracking-tight font-mono">{value}</h3>

          {change && (
            <div className="flex items-center gap-1 mt-2 text-xs font-medium">
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>{change}</span>
              <span className="text-slate-500 font-normal">vs last week</span>
            </div>
          )}
        </div>

        <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${color} p-0.5 shadow-md flex items-center justify-center text-white`}>
          <div className="w-full h-full bg-dark-card rounded-[10px] flex items-center justify-center group-hover:bg-transparent transition-colors">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {badge && (
        <span className="absolute top-3 right-3 text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-accent border border-brand-500/20">
          {badge}
        </span>
      )}
    </div>
  );
};
