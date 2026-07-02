import React from 'react';

type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<object>, State> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    return { hasError: true, error: normalizedError };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log the error to the console and optionally to an external service
    // This makes the error visible during development and helps debugging in production if needed
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-white text-slate-900">
          <div className="max-w-xl rounded-lg border border-red-200 bg-red-50 p-6 text-left">
            <h2 className="mb-2 text-xl font-bold text-red-700">Đã xảy ra lỗi</h2>
            <p className="mb-4 text-sm text-red-600">Ứng dụng gặp lỗi khi khởi tạo. Vui lòng kiểm tra console để biết chi tiết.</p>
            <details className="text-xs text-slate-700">
              <summary className="cursor-pointer text-sm font-semibold">Chi tiết lỗi</summary>
              <pre className="mt-2 whitespace-pre-wrap text-[12px]">{this.state.error?.stack || String(this.state.error)}</pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
