import React from 'react';
import { Loader2 } from 'lucide-react';

type LoadingStateProps = {
  message?: string;
  minHeight?: string;
};

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Đang tải dữ liệu...',
  minHeight = '400px',
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4"
      style={{ minHeight }}
    >
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="text-sm font-bold text-slate-600">{message}</p>
    </div>
  );
};

export default LoadingState;
