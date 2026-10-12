import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['SANCTIONED', 'DISBURSED', 'CLOSED', 'ACTIVE', 'APPROVED'].includes(normalized)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (['APPLIED', 'PENDING', 'UNDER_REVIEW', 'LEAD'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200/80';
  } else if (['REJECTED', 'FAILED', 'BLOCKED'].includes(normalized)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
  }

  const paddingClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border tracking-wide uppercase ${paddingClasses} ${colorClasses}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          ['SANCTIONED', 'DISBURSED', 'CLOSED', 'ACTIVE', 'APPROVED'].includes(normalized)
            ? 'bg-emerald-500'
            : ['APPLIED', 'PENDING', 'UNDER_REVIEW', 'LEAD'].includes(normalized)
            ? 'bg-amber-500'
            : ['REJECTED', 'FAILED', 'BLOCKED'].includes(normalized)
            ? 'bg-rose-500'
            : 'bg-slate-400'
        }`}
      />
      {status}
    </span>
  );
};
