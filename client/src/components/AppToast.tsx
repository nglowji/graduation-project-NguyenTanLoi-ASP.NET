import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { APP_TOAST_EVENT, type AppToastPayload, type AppToastType } from '../utils/appToast';

type ToastState = Required<AppToastPayload> & {
  id: number;
};

const TOAST_DURATION_MS = 3000;

const typeConfig: Record<AppToastType, {
  Icon: typeof Info;
  iconClass: string;
  barClass: string;
}> = {
  success: {
    Icon: CheckCircle2,
    iconClass: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    barClass: 'bg-emerald-500',
  },
  error: {
    Icon: AlertCircle,
    iconClass: 'bg-rose-50 text-rose-600 ring-rose-100',
    barClass: 'bg-rose-500',
  },
  info: {
    Icon: Info,
    iconClass: 'bg-sky-50 text-sky-600 ring-sky-100',
    barClass: 'bg-sky-500',
  },
};

const inferToastType = (message: string): AppToastType => {
  const normalized = message.toLowerCase();

  if (/(không thể|thất bại|lỗi|error|failed|hủy|xóa)/i.test(normalized)) {
    return 'error';
  }

  if (/(đã|thành công|hoàn tất|tạo|cập nhật|thêm)/i.test(normalized)) {
    return 'success';
  }

  return 'info';
};

const AppToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearToastTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const showToast = (message: unknown, type?: AppToastType) => {
      const text = String(message ?? '').trim();
      if (!text) return;

      clearToastTimer();
      setToast({
        id: Date.now(),
        message: text,
        type: type ?? inferToastType(text),
      });
      timerRef.current = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    };

    const handleToast = (event: Event) => {
      const { detail } = event as CustomEvent<AppToastPayload>;
      showToast(detail?.message, detail?.type);
    };

    const nativeAlert = window.alert;
    window.alert = (message?: unknown) => showToast(message);
    window.addEventListener(APP_TOAST_EVENT, handleToast);

    return () => {
      clearToastTimer();
      window.alert = nativeAlert;
      window.removeEventListener(APP_TOAST_EVENT, handleToast);
    };
  }, []);

  if (!toast) return null;

  const { Icon, iconClass, barClass } = typeConfig[toast.type];

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] grid place-items-center px-4 py-8">
      <div
        key={toast.id}
        className="pointer-events-auto w-full max-w-md animate-toast-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-4 px-5 py-4">
          <div className={`grid size-11 shrink-0 place-items-center rounded-full ring-1 ${iconClass}`}>
            <Icon className="size-5" />
          </div>
          <p className="min-w-0 flex-1 whitespace-pre-line text-sm font-semibold leading-6 text-slate-800">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="grid size-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng thông báo"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="h-1 bg-slate-100">
          <div className={`h-full animate-toast-progress ${barClass}`} />
        </div>
      </div>
    </div>
  );
};

export default AppToast;
