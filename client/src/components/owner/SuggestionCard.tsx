import React from 'react';
import type { LucideIcon } from 'lucide-react';

type SuggestionType = 'warning' | 'info' | 'success';

type SuggestionCardProps = {
  type: SuggestionType;
  icon: LucideIcon;
  title: string;
  description: string;
  metric?: string;
  actionText?: string;
  onAction?: () => void;
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  type,
  icon: Icon,
  title,
  description,
  metric,
  actionText,
  onAction,
}) => {
  const colors = {
    warning: {
      container: 'border-amber-200 bg-amber-50',
      iconBg: 'bg-amber-100 text-amber-700',
      text: 'text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      metric: 'text-amber-700',
    },
    info: {
      container: 'border-blue-200 bg-blue-50',
      iconBg: 'bg-blue-100 text-blue-700',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      metric: 'text-blue-700',
    },
    success: {
      container: 'border-emerald-200 bg-emerald-50',
      iconBg: 'bg-emerald-100 text-emerald-700',
      text: 'text-emerald-700',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      metric: 'text-emerald-700',
    },
  }[type];

  return (
    <div className={`rounded-xl border-2 p-5 ${colors.container}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.iconBg}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-bold ${colors.text}`}>{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
          {metric && (
            <p className={`mt-2 text-2xl font-bold ${colors.metric}`}>{metric}</p>
          )}
        </div>
      </div>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-bold transition ${colors.button}`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default SuggestionCard;
