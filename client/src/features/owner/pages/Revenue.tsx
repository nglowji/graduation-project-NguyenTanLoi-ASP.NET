import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  Loader2,
  PieChart,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import api from '../../../services/api';

type RevenuePoint = { date: string; amount: number };
type StatusPoint = { status: string; count: number };
type RecentBooking = {
  id: string;
  pitchName: string;
  userName: string;
  bookingDate: string;
  timeRange: string;
  totalPrice: number;
  status: string;
};

type OwnerRevenueResponse = {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    activePitches: number;
    occupancyRate: number;
  };
  revenueChart: RevenuePoint[];
  bookingStatusDistribution: StatusPoint[];
  recentBookings: RecentBooking[];
};

type OwnerStatsResponse = Partial<OwnerRevenueResponse>;
type FilterMode = 'week' | 'month' | 'year';
type ChartPoint = RevenuePoint & { label: string; shortLabel: string };

const today = new Date();
const currentYear = String(today.getFullYear());
const pad = (value: number) => String(value).padStart(2, '0');
const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const normalizeRevenueData = (payload?: OwnerStatsResponse | null): OwnerRevenueResponse => ({
  summary: {
    totalRevenue: Number(payload?.summary?.totalRevenue || 0),
    totalBookings: Number(payload?.summary?.totalBookings || 0),
    activePitches: Number(payload?.summary?.activePitches || 0),
    occupancyRate: Number(payload?.summary?.occupancyRate || 0),
  },
  revenueChart: payload?.revenueChart || [],
  bookingStatusDistribution: payload?.bookingStatusDistribution || [],
  recentBookings: payload?.recentBookings || [],
});

const statusLabel = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('pending')) return 'Chờ cọc';
  if (normalized.includes('confirm')) return 'Đã xác nhận';
  if (normalized.includes('complete')) return 'Hoàn thành';
  if (normalized.includes('cancel')) return 'Đã hủy';
  if (normalized.includes('noshow')) return 'Không đến';
  return status || 'Khác';
};

const statusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('complete')) return 'bg-blue-500';
  if (normalized.includes('confirm')) return 'bg-emerald-500';
  if (normalized.includes('pending')) return 'bg-amber-500';
  if (normalized.includes('cancel') || normalized.includes('noshow')) return 'bg-red-500';
  return 'bg-slate-400';
};

const statusColorValue = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('complete')) return '#2563eb';
  if (normalized.includes('confirm')) return '#10b981';
  if (normalized.includes('pending')) return '#f59e0b';
  if (normalized.includes('cancel') || normalized.includes('noshow')) return '#ef4444';
  return '#94a3b8';
};

const Revenue: React.FC = () => {
  const [data, setData] = useState<OwnerRevenueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [weekStart, setWeekStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return toIsoDate(date);
  });
  const [month, setMonth] = useState(() => toIsoDate(today).slice(0, 7));
  const [year, setYear] = useState(currentYear);

  const getDateRange = () => {
    if (filterMode === 'week') {
      const start = new Date(`${weekStart}T00:00:00`);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { fromDate: toIsoDate(start), toDate: toIsoDate(end) };
    }

    if (filterMode === 'month') {
      const start = new Date(`${month}-01T00:00:00`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return { fromDate: toIsoDate(start), toDate: toIsoDate(end) };
    }

    return { fromDate: `${year}-01-01`, toDate: `${year}-12-31` };
  };

  useEffect(() => {
    fetchRevenue();
  }, [filterMode, weekStart, month, year]);

  const fetchRevenue = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await api.get('/dashboard/owner/revenue', { params: getDateRange() }) as OwnerRevenueResponse;
      setData(normalizeRevenueData(res));
    } catch (revenueError) {
      try {
        const stats = await api.get('/dashboard/owner/stats') as OwnerStatsResponse;
        setData(normalizeRevenueData(stats));
        setError('API doanh thu theo bộ lọc chưa phản hồi. Đang hiển thị dữ liệu tổng quan hiện có.');
      } catch {
        console.error('Failed to load owner revenue', revenueError);
        setData(null);
        setError('Không tải được dữ liệu doanh thu. Kiểm tra server đã restart và tài khoản có quyền chủ sân.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const formatDate = (value?: string) => {
    if (!value) return '--/--/----';
    const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
  };

  const revenueChart = data?.revenueChart || [];
  const statusDistribution = data?.bookingStatusDistribution || [];
  const recentBookings = data?.recentBookings || [];
  const summary = data?.summary;
  const totalStatus = Math.max(statusDistribution.reduce((sum, item) => sum + item.count, 0), 1);
  const averageOrder = summary?.totalBookings ? (summary.totalRevenue || 0) / summary.totalBookings : 0;

  const chartPoints = useMemo<ChartPoint[]>(() => {
    const map = new Map(revenueChart.map((point) => [point.date.slice(0, 10), Number(point.amount || 0)]));

    if (filterMode === 'year') {
      return Array.from({ length: 12 }, (_, index) => {
        const monthKey = `${year}-${pad(index + 1)}`;
        const amount = revenueChart
          .filter((point) => point.date.startsWith(monthKey))
          .reduce((sum, point) => sum + Number(point.amount || 0), 0);
        return {
          date: `${monthKey}-01`,
          label: `Tháng ${index + 1}`,
          shortLabel: `T${index + 1}`,
          amount,
        };
      });
    }

    const { fromDate, toDate } = getDateRange();
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);
    const points: ChartPoint[] = [];

    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const key = toIsoDate(cursor);
      points.push({
        date: key,
        label: cursor.toLocaleDateString('vi-VN'),
        shortLabel: `${cursor.getDate()}/${cursor.getMonth() + 1}`,
        amount: map.get(key) || 0,
      });
    }

    return points;
  }, [filterMode, revenueChart, weekStart, month, year]);

  const cumulativePoints = useMemo(() => {
    let running = 0;
    return chartPoints.map((point) => {
      running += point.amount;
      return { ...point, amount: running };
    });
  }, [chartPoints]);

  const maxRevenue = Math.max(...chartPoints.map((point) => point.amount), 1);
  const maxCumulative = Math.max(...cumulativePoints.map((point) => point.amount), 1);
  const totalFilteredRevenue = chartPoints.reduce((sum, point) => sum + point.amount, 0);

  const linePoints = useMemo(() => {
    if (cumulativePoints.length === 0) return '';
    return cumulativePoints
      .map((point, index) => {
        const x = cumulativePoints.length === 1 ? 50 : 6 + (index / (cumulativePoints.length - 1)) * 88;
        const y = 88 - (point.amount / maxCumulative) * 72;
        return `${x},${y}`;
      })
      .join(' ');
  }, [cumulativePoints, maxCumulative]);

  const areaPoints = useMemo(() => {
    if (!linePoints) return '';
    return `6,88 ${linePoints} 94,88`;
  }, [linePoints]);

  const donutGradient = useMemo(() => {
    if (statusDistribution.length === 0) return 'conic-gradient(#e2e8f0 0% 100%)';
    const total = Math.max(statusDistribution.reduce((sum, item) => sum + item.count, 0), 1);
    let cursor = 0;
    const segments = statusDistribution.map((segment) => {
      const portion = (segment.count / total) * 100;
      const start = cursor;
      const end = cursor + portion;
      cursor = end;
      return `${statusColorValue(segment.status)} ${start}% ${end}%`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }, [statusDistribution]);

  const topRecentPitches = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; count: number }>();
    recentBookings.forEach((booking) => {
      const current = map.get(booking.pitchName) || { name: booking.pitchName, revenue: 0, count: 0 };
      current.revenue += booking.totalPrice;
      current.count += 1;
      map.set(booking.pitchName, current);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [recentBookings]);

  const quarterlyRevenue = useMemo(() => {
    const quarters = [
      { label: 'Quý 1', amount: 0 },
      { label: 'Quý 2', amount: 0 },
      { label: 'Quý 3', amount: 0 },
      { label: 'Quý 4', amount: 0 },
    ];

    chartPoints.forEach((point) => {
      const monthIndex = new Date(`${point.date}T00:00:00`).getMonth();
      if (!Number.isNaN(monthIndex)) quarters[Math.floor(monthIndex / 3)].amount += point.amount;
    });

    return quarters;
  }, [chartPoints]);

  const maxQuarterRevenue = Math.max(...quarterlyRevenue.map((item) => item.amount), 1);
  const maxPitchRevenue = Math.max(...topRecentPitches.map((pitch) => pitch.revenue), 1);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-40">
        <Loader2 className="animate-spin text-blue-600" size={42} />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải API doanh thu</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Financial analytics</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Doanh thu & tài chính</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            KPI doanh thu là tổng tiền của mọi đơn đã hoàn thành. Bộ lọc tuần, tháng, năm dùng cho biểu đồ phân tích.
          </p>
        </div>

        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-black uppercase tracking-widest text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
          <Download size={17} />
          Xuất báo cáo
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {([
              ['week', 'Tuần'],
              ['month', 'Tháng'],
              ['year', 'Năm'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`h-10 rounded-lg px-4 text-xs font-black uppercase tracking-widest transition ${
                  filterMode === mode ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {filterMode === 'week' && (
              <input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            )}
            {filterMode === 'month' && (
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            )}
            {filterMode === 'year' && (
              <input type="number" min="2020" max="2100" value={year} onChange={(event) => setYear(event.target.value)} className="h-11 w-32 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p>{error}</p>
            <p className="mt-1 text-xs font-semibold opacity-80">Nếu vừa cập nhật backend, hãy chạy lại server API.</p>
          </div>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Doanh thu hoàn thành', value: formatMoney(summary?.totalRevenue), icon: <Wallet size={21} />, color: 'text-blue-600' },
          { label: 'Doanh thu kỳ lọc', value: formatMoney(totalFilteredRevenue), icon: <BarChart3 size={21} />, color: 'text-emerald-600' },
          { label: 'Tổng đơn trong kỳ', value: String(summary?.totalBookings || 0), icon: <CreditCard size={21} />, color: 'text-amber-600' },
          { label: 'Trung bình đơn', value: formatMoney(averageOrder), icon: <TrendingUp size={21} />, color: 'text-indigo-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 ${item.color} dark:bg-slate-800`}>
              {item.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Doanh thu theo {filterMode === 'year' ? 'tháng' : 'ngày'}</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Có đủ cột cho cả mốc không phát sinh đơn</p>
            </div>
            <BarChart3 className="text-blue-600" size={24} />
          </div>

          <div className="flex h-80 items-end gap-2 overflow-x-auto rounded-xl bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 p-4 dark:bg-slate-950/40">
            {chartPoints.map((point) => (
              <div key={point.date} className="flex h-full min-w-[30px] flex-1 flex-col justify-end gap-2">
                <p className="truncate text-center text-[10px] font-black text-slate-500">{point.amount > 0 ? formatMoney(point.amount) : '0đ'}</p>
                <div className="group relative flex flex-1 items-end">
                  <div
                    className={`w-full rounded-t-lg transition ${point.amount > 0 ? 'bg-gradient-to-t from-blue-700 via-blue-600 to-cyan-400 shadow-[0_-6px_14px_rgba(37,99,235,0.25)]' : 'bg-slate-200 dark:bg-slate-800'}`}
                    style={{ height: `${point.amount > 0 ? Math.max((point.amount / maxRevenue) * 100, 5) : 2}%` }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-slate-950 px-2 py-1 text-[10px] font-black text-white group-hover:block">
                    {point.label}: {formatMoney(point.amount)}
                  </div>
                </div>
                <p className="truncate text-center text-[10px] font-black text-slate-400">{point.shortLabel}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Doanh thu lũy kế</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Đường này cộng dồn doanh thu trong kỳ lọc</p>
            </div>
            <TrendingUp className="text-indigo-600" size={24} />
          </div>

          <div className="h-80 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:bg-slate-950/40">
            <div className="mb-3 flex items-center justify-between text-xs font-black text-slate-500">
              <span>0đ</span>
              <span>{formatMoney(maxCumulative)}</span>
            </div>
            <svg viewBox="0 0 100 100" className="h-[230px] w-full overflow-visible">
              <defs>
                <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="6" y1="88" x2="94" y2="88" stroke="#cbd5e1" strokeWidth="0.8" />
              <line x1="6" y1="16" x2="6" y2="88" stroke="#cbd5e1" strokeWidth="0.8" />
              {areaPoints && <polygon points={areaPoints} fill="url(#revenueArea)" />}
              <polyline points={linePoints} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {linePoints.split(' ').filter(Boolean).map((point, index) => {
                const [x, y] = point.split(',');
                return <circle key={`${point}-${index}`} cx={x} cy={y} r="2.2" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />;
              })}
            </svg>
            <div className="mt-1 flex justify-between text-[10px] font-black text-slate-400">
              <span>{chartPoints[0]?.shortLabel}</span>
              <span>{chartPoints[chartPoints.length - 1]?.shortLabel}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Doanh thu theo quý</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Tổng hợp từ kỳ đang xem</p>
            </div>
            <CalendarDays className="text-amber-600" size={24} />
          </div>
          <div className="flex h-64 items-end gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/40">
            {quarterlyRevenue.map((quarter) => (
              <div key={quarter.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                <p className="truncate text-center text-[10px] font-black text-slate-500">{formatMoney(quarter.amount)}</p>
                <div className="rounded-t-xl bg-amber-500" style={{ height: `${quarter.amount > 0 ? Math.max((quarter.amount / maxQuarterRevenue) * 100, 5) : 2}%` }} />
                <p className="text-center text-[10px] font-black text-slate-500">{quarter.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Trạng thái đơn</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Tỷ lệ đơn theo trạng thái</p>
            </div>
            <PieChart className="text-emerald-600" size={24} />
          </div>
          {statusDistribution.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm font-bold text-slate-400">Chưa có trạng thái đơn</div>
          ) : (
            <div className="space-y-5">
              <div className="mx-auto grid h-40 w-40 place-items-center rounded-full" style={{ background: donutGradient }}>
                <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center dark:bg-slate-900">
                  <span className="text-2xl font-black text-slate-950 dark:text-white">{totalStatus}</span>
                </div>
              </div>
              <div className="space-y-3">
                {statusDistribution.map((segment) => (
                  <div key={segment.status}>
                    <div className="mb-1 flex items-center justify-between text-xs font-black">
                      <span className="text-slate-600 dark:text-slate-300">{statusLabel(segment.status)}</span>
                      <span className="text-slate-400">{segment.count} đơn</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full rounded-full ${statusColor(segment.status)}`} style={{ width: `${(segment.count / totalStatus) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Treemap sân</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Tỷ trọng doanh thu đơn gần đây</p>
            </div>
            <Activity className="text-blue-600" size={24} />
          </div>
          {topRecentPitches.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm font-bold text-slate-400">Chưa có dữ liệu sân</div>
          ) : (
            <div className="grid h-64 grid-cols-2 gap-2">
              {topRecentPitches.map((pitch, index) => (
                <div
                  key={pitch.name}
                  className={`overflow-hidden rounded-xl p-3 text-white ${index % 3 === 0 ? 'bg-blue-600' : index % 3 === 1 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                  style={{ minHeight: `${Math.max((pitch.revenue / maxPitchRevenue) * 100, 34)}%` }}
                >
                  <p className="truncate text-xs font-black">{pitch.name}</p>
                  <p className="mt-1 text-[10px] font-bold opacity-80">{pitch.count} đơn</p>
                  <p className="mt-3 text-sm font-black">{formatMoney(pitch.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Đơn gần đây</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">Các đơn mới nhất trong kỳ lọc.</p>
          </div>
          <CreditCard className="text-emerald-600" size={24} />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-400">
              Chưa có đơn gần đây trong kỳ lọc
            </div>
          ) : recentBookings.map((booking) => (
            <div key={booking.id} className="grid gap-3 py-3 md:grid-cols-[minmax(220px,1fr)_180px_160px_140px] md:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950 dark:text-white">{booking.pitchName}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{booking.userName} · {formatDate(booking.bookingDate)}</p>
              </div>
              <span className="text-xs font-bold text-slate-500">{booking.timeRange || 'Chưa có giờ'}</span>
              <span className="text-xs font-black text-slate-700 dark:text-slate-200">{statusLabel(booking.status)}</span>
              <p className="text-sm font-black text-slate-900 dark:text-white md:text-right">{formatMoney(booking.totalPrice)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Revenue;
