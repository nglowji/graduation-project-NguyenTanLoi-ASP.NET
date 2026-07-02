import React from 'react';
import { Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SuggestionCard from './SuggestionCard';

type Suggestion = {
  type: 'warning' | 'info' | 'success';
  icon: LucideIcon;
  title: string;
  description: string;
  metric?: string;
  actionText?: string;
  onAction?: () => void;
};

type SuggestionsSectionProps = {
  title?: string;
  description?: string;
  suggestions: Suggestion[];
  themeColor?: 'blue' | 'emerald' | 'purple';
};

const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({
  title = 'Gợi ý thông minh',
  description = 'Insights và khuyến nghị dựa trên dữ liệu',
  suggestions,
  themeColor = 'blue',
}) => {
  if (suggestions.length === 0) return null;

  const colors = {
    blue: {
      border: 'border-blue-200',
      gradient: 'from-blue-50 via-white to-blue-50',
      iconBg: 'bg-blue-600',
    },
    emerald: {
      border: 'border-emerald-200',
      gradient: 'from-emerald-50 via-white to-emerald-50',
      iconBg: 'bg-emerald-600',
    },
    purple: {
      border: 'border-purple-200',
      gradient: 'from-purple-50 via-white to-purple-50',
      iconBg: 'bg-purple-600',
    },
  }[themeColor];

  return (
    <section className={`rounded-2xl border-2 ${colors.border} bg-gradient-to-br ${colors.gradient} p-6 shadow-sm`}>
      <div className="mb-6 flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.iconBg} text-white shadow-md`}>
          <Lightbulb size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((suggestion, index) => (
          <SuggestionCard key={index} {...suggestion} />
        ))}
      </div>
    </section>
  );
};

export default SuggestionsSection;
