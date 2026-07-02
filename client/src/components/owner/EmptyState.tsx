import React from 'react';
import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
        <Icon size={48} className="text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 hover:shadow-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
