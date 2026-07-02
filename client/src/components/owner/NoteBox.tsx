import React from 'react';
import { AlertCircle, Info, Lightbulb, CheckCircle } from 'lucide-react';

type NoteType = 'info' | 'warning' | 'success' | 'tip';

type NoteBoxProps = {
  type?: NoteType;
  title?: string;
  children: React.ReactNode;
};

const NoteBox: React.FC<NoteBoxProps> = ({ type = 'info', title, children }) => {
  const config = {
    info: {
      icon: Info,
      colors: 'border-blue-200 bg-blue-50 text-blue-900',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
    },
    warning: {
      icon: AlertCircle,
      colors: 'border-amber-200 bg-amber-50 text-amber-900',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
    },
    success: {
      icon: CheckCircle,
      colors: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      iconColor: 'text-emerald-600',
      titleColor: 'text-emerald-900',
    },
    tip: {
      icon: Lightbulb,
      colors: 'border-purple-200 bg-purple-50 text-purple-900',
      iconColor: 'text-purple-600',
      titleColor: 'text-purple-900',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className={`rounded-xl border-2 p-4 ${config.colors}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 shrink-0 ${config.iconColor}`} size={20} />
        <div className="min-w-0 flex-1">
          {title && (
            <p className={`text-sm font-bold ${config.titleColor}`}>{title}</p>
          )}
          <div className={`${title ? 'mt-1' : ''} text-sm leading-relaxed`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteBox;
