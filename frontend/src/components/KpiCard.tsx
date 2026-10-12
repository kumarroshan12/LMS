import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  iconColor?: string;
  iconBg?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  iconColor = 'text-[#0F766E]',
  iconBg = 'bg-[#0F766E]/10',
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between transition-all hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-[#14243A] tracking-tight">{value}</div>
        {subtext && <div className="text-xs text-slate-500 mt-1 font-medium">{subtext}</div>}
      </div>
    </div>
  );
};
