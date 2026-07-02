import React from 'react';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
  description?: string;
  onClick?: () => void;
  isActive?: boolean;
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  colorClass,
  description,
  onClick,
  isActive = false,
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-2xl border-2 p-6 text-left transition ${
        onClick ? 'cursor-pointer hover:shadow-lg' : ''
      } ${
        isActive
          ? 'border-blue-300 bg-blue-50 shadow-md'
          : `border-slate-200 ${colorClass.includes('bg-') ? colorClass : `bg-${colorClass.split('-')[0]}-50`}`
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`rounded-xl p-3 ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className={`text-sm font-semibold ${colorClass.includes('text-') ? colorClass.split(' ').find(c => c.includes('text-')) : 'text-slate-600'}`}>
        {label}
      </p>
      <p className="mt-2 text-5xl font-bold text-slate-900">{value}</p>
      {description && (
        <p className="mt-3 text-xs font-semibold text-slate-500">{description}</p>
      )}
    </Component>
  );
};

export default StatCard;
