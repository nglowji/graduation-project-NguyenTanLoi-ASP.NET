import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label?: string;
};

const Pagination: React.FC<PaginationProps> = ({ page, totalItems, pageSize, onPageChange, label = 'mục' }) => {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  if (totalItems <= pageSize) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
      <p className="text-xs font-bold text-slate-400">
        {Math.min((page - 1) * pageSize + 1, totalItems)}-{Math.min(page * pageSize, totalItems)} / {totalItems} {label}
      </p>
      <nav className="flex items-center gap-1.5" aria-label="Phân trang">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-900">
          <ChevronLeft size={16} />
        </button>
        {pages.map((value, index) => (
          <React.Fragment key={value}>
            {index > 0 && pages[index - 1] !== value - 1 && <span className="px-1 text-xs font-black text-slate-300">...</span>}
            <button type="button" onClick={() => onPageChange(value)} className={`h-9 min-w-9 rounded-xl px-2 text-xs font-black transition ${page === value ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900'}`}>
              {value}
            </button>
          </React.Fragment>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-900">
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
