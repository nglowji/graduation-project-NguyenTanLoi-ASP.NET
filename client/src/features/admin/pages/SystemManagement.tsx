import React from 'react';
import {
  AlertCircle,
  BadgePercent,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
} from 'lucide-react';
import api from '../../../services/api';

type CommissionSetting = {
  key: string;
  percentage: number;
  description?: string;
};

type BookingHoldSetting = {
  key: string;
  minutes: number;
  description?: string;
};

const clampNumber = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const SystemManagement: React.FC = () => {
  const [commission, setCommission] = React.useState('10');
  const [bookingHold, setBookingHold] = React.useState('10');
  const [initialCommission, setInitialCommission] = React.useState('10');
  const [initialBookingHold, setInitialBookingHold] = React.useState('10');
  const [isLoading, setIsLoading] = React.useState(true);
  const [savingKey, setSavingKey] = React.useState<'commission' | 'bookingHold' | null>(null);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const fetchSettings = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const [commissionSetting, holdSetting] = await Promise.all([
        api.get('/admin/system/commission') as Promise<CommissionSetting>,
        api.get('/admin/system/booking-hold') as Promise<BookingHoldSetting>,
      ]);

      const nextCommission = String(Number(commissionSetting.percentage ?? 10));
      const nextHold = String(Number(holdSetting.minutes ?? 10));

      setCommission(nextCommission);
      setBookingHold(nextHold);
      setInitialCommission(nextCommission);
      setInitialBookingHold(nextHold);
    } catch (requestError: any) {
      setError(requestError?.message || 'Không thể tải cấu hình hệ thống.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveCommission = async () => {
    const percentage = clampNumber(Number(commission), 0, 100);

    setSavingKey('commission');
    setError('');
    setSuccess('');

    try {
      const result = await api.patch('/admin/system/commission', { percentage }) as CommissionSetting;
      const nextValue = String(Number(result.percentage ?? percentage));

      setCommission(nextValue);
      setInitialCommission(nextValue);
      setSuccess('Đã cập nhật tỷ lệ hoa hồng nền tảng.');
    } catch (requestError: any) {
      setError(requestError?.message || 'Không thể cập nhật tỷ lệ hoa hồng.');
    } finally {
      setSavingKey(null);
    }
  };

  const saveBookingHold = async () => {
    const minutes = Math.round(clampNumber(Number(bookingHold), 1, 60));

    setSavingKey('bookingHold');
    setError('');
    setSuccess('');

    try {
      const result = await api.patch('/admin/system/booking-hold', { minutes }) as BookingHoldSetting;
      const nextValue = String(Number(result.minutes ?? minutes));

      setBookingHold(nextValue);
      setInitialBookingHold(nextValue);
      setSuccess('Đã cập nhật thời gian giữ chỗ thanh toán.');
    } catch (requestError: any) {
      setError(requestError?.message || 'Không thể cập nhật thời gian giữ chỗ.');
    } finally {
      setSavingKey(null);
    }
  };

  const commissionNumber = clampNumber(Number(commission || 0), 0, 100);
  const holdNumber = Math.round(clampNumber(Number(bookingHold || 0), 1, 60));
  const commissionChanged = commission !== initialCommission;
  const holdChanged = bookingHold !== initialBookingHold;

  return (
    <main className="mx-auto max-w-[1200px] space-y-6 pb-16">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">CẤU HÌNH HỆ THỐNG</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Tham số nền tảng</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Quản lý hoa hồng nền tảng và thời gian giữ chỗ thanh toán.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </section>

      {(error || success) && (
        <section
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-bold ${
            error ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'
          }`}
        >
          {error ? <AlertCircle className="mt-0.5 shrink-0" size={18} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={18} />}
          <span>{error || success}</span>
        </section>
      )}

      {isLoading ? (
        <section className="grid min-h-80 place-items-center rounded-lg border border-slate-200 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto animate-spin text-blue-600" size={32} />
            <p className="mt-3 text-sm font-bold text-slate-500">Đang tải cấu hình...</p>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={BadgePercent}
              label="Hoa hồng"
              value={`${commissionNumber}%`}
              note="Tính trên tiền thuê sân"
              tone="bg-blue-50 text-blue-600"
            />
            <SummaryCard
              icon={Clock3}
              label="Giữ chỗ"
              value={`${holdNumber} phút`}
              note="Chờ thanh toán cọc"
              tone="bg-amber-50 text-amber-600"
            />
            <SummaryCard
              icon={CheckCircle2}
              label="Trạng thái"
              value={commissionChanged || holdChanged ? 'Chưa lưu' : 'Đã lưu'}
              note="Đồng bộ với backend"
              tone={commissionChanged || holdChanged ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <SettingCard
              icon={BadgePercent}
              title="Hoa hồng nền tảng"
              description="Tỷ lệ SmartSport thu trên tiền thuê sân của đơn đặt thành công."
              value={commission}
              unit="%"
              min={0}
              max={100}
              step="0.1"
              isSaving={savingKey === 'commission'}
              isChanged={commissionChanged}
              onChange={setCommission}
              onSave={saveCommission}
              onReset={() => setCommission(initialCommission)}
            />

            <SettingCard
              icon={Clock3}
              title="Thời gian giữ chỗ"
              description="Số phút hệ thống khóa slot trong khi khách thanh toán cọc."
              value={bookingHold}
              unit="phút"
              min={1}
              max={60}
              step="1"
              isSaving={savingKey === 'bookingHold'}
              isChanged={holdChanged}
              onChange={setBookingHold}
              onSave={saveBookingHold}
              onReset={() => setBookingHold(initialBookingHold)}
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-slate-950">Lưu ý</h2>
            <div className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-slate-500 md:grid-cols-2">
              <p>• Hoa hồng chỉ tính trên tiền thuê sân.</p>
              <p>• Không tự động tính trên dịch vụ phát sinh.</p>
              <p>• Thay đổi có hiệu lực sau khi lưu thành công.</p>
              <p>• Admin chỉ cấu hình nền tảng, không can thiệp kinh doanh của chủ sân.</p>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  note: string;
  tone: string;
}) => (
  <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className={`mb-3 w-fit rounded-lg p-2 ${tone}`}>
      <Icon size={20} />
    </div>
    <p className="text-xs font-semibold text-slate-600">{label}</p>
    <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    <p className="mt-2 text-xs font-semibold text-slate-400">{note}</p>
  </article>
);

const SettingCard = ({
  icon: Icon,
  title,
  description,
  value,
  unit,
  min,
  max,
  step,
  isSaving,
  isChanged,
  onChange,
  onSave,
  onReset,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  value: string;
  unit: string;
  min: number;
  max: number;
  step: string;
  isSaving: boolean;
  isChanged: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
}) => (
  <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={21} />
      </span>
      <div>
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{description}</p>
      </div>
    </div>

    <div className="mt-5 rounded-lg bg-slate-50 p-4">
      <label>
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Giá trị</span>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-12 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-base font-black text-slate-950 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
          />
          <span className="grid h-12 min-w-20 place-items-center rounded-lg bg-white px-3 text-sm font-black text-slate-600 ring-1 ring-slate-200">
            {unit}
          </span>
        </div>
      </label>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number(value || min)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-4 w-full accent-blue-600"
      />
    </div>

    <div className="mt-5 flex justify-end gap-3">
      <button
        type="button"
        onClick={onReset}
        disabled={isSaving || !isChanged}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw size={16} />
        Hoàn tác
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !isChanged}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
        Lưu
      </button>
    </div>
  </article>
);

export default SystemManagement;
