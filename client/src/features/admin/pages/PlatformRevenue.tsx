import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  Download,
  Loader2,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import api from '../../../services/api';

type RevenueTrendPoint = {
  date: string;
  grossRevenue: number;
  commission: number;
  bookings: number;
};

type OwnerCommission = {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  grossRevenue: number;
  commission: number;
  bookings: number;
  uniqueCustomers: number;
};

type PitchTypeCommission = {
  pitchType: string;
  grossRevenue: number;
  commission: number;
  bookings: number;
};

type CommissionTransaction = {
  bookingId: string;
  bookingDate: string;
  customerName: string;
  customerEmail: string;
  pitchName: string;
  pitchType: string;
  sportCenterName: string;
  ownerName: string;
  ownerEmail: string;
  grossAmount: number;
  commission: number;
  status: string;
};

type RevenueReport = {
  grossRevenue: number;
  platformCommission: number;
  ownerRevenue: number;
  commissionRate: number;
  totalBookings: number;
  completedBookings: number;
  confirmedBookings: number;
  uniqueCustomers: number;
  activeOwners: number;
  commissionGrowth: number;
  trend: RevenueTrendPoint[];
  owners: OwnerCommission[];
  pitchTypes: PitchTypeCommission[];
  transactions: CommissionTransaction[];
};

const formatMoney = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

const formatDate = (value?: string) => {
  if (!value) return '--/--';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const statusLabel = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('complete')) return 'Hoàn thành';
  if (normalized.includes('confirm')) return 'Đã xác nhận';
  return status;
};

const LineChart: React.FC<{ data: RevenueTrendPoint[] }> = ({ data }) => {
  const width = 760;
  const height = 250;
  const padding = 26;
  const maxValue = Math.max(...data.map((item) => item.commission), 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (item.commission / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  if (data.length === 0) {
    return <div className="grid h-[250px] place-items-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400 dark:bg-slate-950">Chưa có doanh thu trong kỳ này</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[250px] w-full" role="img" aria-label="Biểu đồ hoa hồng theo ngày">
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="oklch(88% 0.02 250)" strokeWidth="1" />;
        })}
        <path d={path} fill="none" stroke="oklch(58% 0.23 250)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={`${point.date}-${point.commission}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="oklch(58% 0.23 250)" />
            <text x={point.x} y={height - 4} textAnchor="middle" className="fill-slate-400 text-[12px] font-bold">
              {formatDate(point.date)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const DonutChart: React.FC<{ data: PitchTypeCommission[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.commission, 0);
  let offset = 25;
  const colors = ['oklch(58% 0.23 250)', 'oklch(68% 0.18 45)', 'oklch(62% 0.16 160)', 'oklch(55% 0.18 285)'];

  if (!total) {
    return <div className="grid h-56 place-items-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400 dark:bg-slate-950">Chưa có cơ cấu doanh thu</div>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
      <svg viewBox="0 0 42 42" className="mx-auto h-52 w-52 rotate-[-90deg]" role="img" aria-label="Cơ cấu hoa hồng theo loại sân">
        <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="oklch(92% 0.01 250)" strokeWidth="7" />
        {data.map((item, index) => {
          const percentage = (item.commission / total) * 100;
          const dash = `${percentage} ${100 - percentage}`;
          const circle = (
            <circle
              key={item.pitchType}
              cx="21"
              cy="21"
              r="15.9"
              fill="transparent"
              stroke={colors[index % colors.length]}
              strokeWidth="7"
              strokeDasharray={dash}
              strokeDashoffset={offset}
            />
          );
          offset -= percentage;
          return circle;
        })}
      </svg>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.pitchType} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="truncate text-sm font-black text-slate-700 dark:text-slate-200">{item.pitchType}</span>
            </div>
            <span className="shrink-0 text-sm font-black text-slate-950 dark:text-white">{Math.round((item.commission / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlatformRevenue: React.FC = () => {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/admin/revenue', { params: { days } }) as RevenueReport;
      setReport(res);
    } catch {
      setError('Không thể tải dữ liệu doanh thu. Kiểm tra quyền admin và server API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [days]);

  const topTransactions = useMemo(() => report?.transactions.slice(0, 8) ?? [], [report]);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={42} />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải doanh thu thật từ API</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Admin revenue</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Quản lý doanh thu</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-500">
            Theo dõi tổng tiền đặt sân, hoa hồng nền tảng và nguồn thu theo chủ sân từ dữ liệu booking đã xác nhận hoặc hoàn thành.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {[7, 30, 90].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                className={`h-10 rounded-lg px-4 text-xs font-black transition ${
                  days === value ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'
                }`}
              >
                {value} ngày
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={fetchReport}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            <RefreshCw size={18} />
            Làm mới
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Hoa hồng nền tảng', value: formatMoney(report?.platformCommission), detail: `${report?.commissionGrowth || 0}% so với kỳ trước`, icon: <Wallet size={22} />, tone: 'text-indigo-600' },
          { label: 'Tổng tiền đặt sân', value: formatMoney(report?.grossRevenue), detail: `${report?.totalBookings || 0} booking hợp lệ`, icon: <CreditCard size={22} />, tone: 'text-blue-600' },
          { label: 'Doanh thu chủ sân', value: formatMoney(report?.ownerRevenue), detail: `${report?.activeOwners || 0} chủ sân có doanh thu`, icon: <Users size={22} />, tone: 'text-emerald-600' },
          { label: 'Tỷ lệ hoa hồng', value: `${Math.round((report?.commissionRate || 0) * 100)}%`, detail: `${report?.uniqueCustomers || 0} khách đã đặt sân`, icon: <TrendingUp size={22} />, tone: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 ${item.tone} dark:bg-slate-800`}>
              {item.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{item.value}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Hoa hồng theo ngày</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Dữ liệu từ `/dashboard/admin/revenue`.</p>
            </div>
            <CalendarDays className="text-indigo-600" size={24} />
          </div>
          <LineChart data={report?.trend ?? []} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Cơ cấu loại sân</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Tỷ trọng hoa hồng theo loại sân.</p>
            </div>
            <PieChart className="text-blue-600" size={24} />
          </div>
          <DonutChart data={report?.pitchTypes ?? []} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-5 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Top chủ sân theo hoa hồng</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">Xếp hạng theo phần nền tảng nhận được.</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(report?.owners ?? []).slice(0, 6).map((owner, index) => (
              <div key={owner.ownerId} className="grid grid-cols-[38px_minmax(0,1fr)_auto] gap-3 p-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">{index + 1}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-white">{owner.ownerName}</p>
                  <p className="mt-1 truncate text-xs font-bold text-slate-400">{owner.bookings} booking · {owner.uniqueCustomers} khách</p>
                </div>
                <p className="text-right text-sm font-black text-indigo-600">{formatMoney(owner.commission)}</p>
              </div>
            ))}
            {(report?.owners ?? []).length === 0 && <div className="p-8 text-center text-sm font-bold text-slate-400">Chưa có chủ sân phát sinh hoa hồng.</div>}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Giao dịch hoa hồng mới nhất</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Thể hiện người đặt, sân và chủ sân tương ứng.</p>
            </div>
            <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800" title="Xuất báo cáo">
              <Download size={18} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3">Người đặt</th>
                  <th className="px-4 py-3">Sân</th>
                  <th className="px-4 py-3">Chủ sân</th>
                  <th className="px-4 py-3 text-right">Tiền sân</th>
                  <th className="px-4 py-3 text-right">Hoa hồng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topTransactions.map((item) => (
                  <tr key={item.bookingId} className="text-sm">
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950 dark:text-white">{item.customerName}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(item.bookingDate)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-700 dark:text-slate-200">{item.pitchName}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{item.sportCenterName}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-700 dark:text-slate-200">{item.ownerName}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{item.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-4 text-right font-black text-slate-700 dark:text-slate-200">{formatMoney(item.grossAmount)}</td>
                    <td className="px-4 py-4 text-right font-black text-indigo-600">{formatMoney(item.commission)}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                        {statusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {topTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-slate-400">Chưa có giao dịch hoa hồng trong kỳ này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlatformRevenue;
