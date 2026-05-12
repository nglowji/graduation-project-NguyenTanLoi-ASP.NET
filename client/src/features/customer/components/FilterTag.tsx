import React from 'react';
import { X } from 'lucide-react';

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

export const FilterTag: React.FC<FilterTagProps> = ({ label, onRemove }) => (
  <button 
    onClick={onRemove}
    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-black hover:bg-primary hover:text-white transition-all group"
  >
    <span>{label}</span>
    <X size={12} className="group-hover:scale-125 transition-transform" />
  </button>
);
