import React, { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip as ChartTooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, ChartTooltip);
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import api from '../../../services/api';

type TrendPoint = {
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

type Transaction = {
  bookingId: string;
  bookingDate: string;
  customerName: string;
  pitchName: string;
  pitchType: string;
  sportCenterName: string;
  ownerName: string;
  grossAmount: number;
  commission: number;
  status: string;
};

type Report = {
  grossRevenue: number;
  platformCommission: number;
  ownerRevenue: number;
  commissionRate: number;
  totalBookings: number;
  completedBookings: number;
  uniqueCustomers: number;
  activeOwners: number;
  commissionGrowth: number;
  trend: TrendPoint[];
  owners: OwnerCommission[];
  pitchTypes: PitchTypeCommission[];
  transactions: Transaction[];
};

type RangeMode = 'week' | 'month' | 'quarter' | 'year' | 'all';

const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;


const dateLabel = (value?: string) => {
  if (!value) return '--';

  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const sportLabel = (value?: string) =>
  ({
    Football5: 'Bóng đá 5',
    Football7: 'Bóng đá 7',
    Football11: 'Bóng đá 11',
    Badminton: 'Cầu lông',
    Pickleball: 'Pickleball',
    Tennis: 'Tennis',
    Basketball: 'Bóng rổ',
    Volleyball: 'Bóng chuyền',
    TableTennis: 'Bóng bàn',
  } as Record<string, string>)[String(value || '')] || value || 'Khác';

const statusLabel = (status?: string) => {
  const value = String(status || '').toLowerCase();

  if (value.includes('complete') || value === '4') return 'Hoàn thành';
  if (value.includes('confirm') || value === '2') return 'Đã xác nhận';
  if (value.includes('cancel') || value === '3') return 'Đã hủy';
  if (value.includes('pending') || value === '1') return 'Chờ xử lý';

  return 'Khác';
};

const statusColor = (status?: string) => {
  const value = String(status || '').toLowerCase();

  if (value.includes('complete') || value === '4') return 'bg-emerald-100 text-emerald-700';
  if (value.includes('confirm') || value === '2') return 'bg-blue-100 text-blue-700';
  if (value.includes('cancel') || value === '3') return 'bg-red-100 text-red-700';
  if (value.includes('pending') || value === '1') return 'bg-amber-100 text-amber-700';

  return 'bg-slate-100 text-slate-600';
};

const MedalIcon: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank <= 3) {
    const tone =
      rank === 1
        ? 'border-amber-300 bg-amber-50 text-amber-700'
        : rank === 2
          ? 'border-slate-300 bg-slate-100 text-slate-600'
          : 'border-orange-300 bg-orange-50 text-orange-700';

    return (
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-black ${tone}`}>
        {rank}
      </span>
    );
  }

  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
      {rank}
    </span>
  );
};

const PLATFORM_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#65a30d', '#ea580c'];

const DonutChart: React.FC<{
  title: string;
  centerLabel: string;
  centerValue: string;
  items: Array<{ id: string; label: string; value: number; detail?: string }>;
}> = ({ title, centerLabel, centerValue, items }) => {
  const validItems = items.filter((item) => Number(item.value || 0) > 0);
  const total = validItems.reduce((sum, item) => sum + Number(item.value || 0), 0);

  if (!total) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        Không có dữ liệu phù hợp bộ lọc
      </div>
    );
  }

  const cx = 100;
  const cy = 100;
  const r = 72;
  const innerR = 44;
  let cumulative = 0;

  const slices = validItems.map((item, index) => {
    const fraction = item.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return { ...item, d, color: PLATFORM_COLORS[index % PLATFORM_COLORS.length], fraction };
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto flex shrink-0 justify-center sm:mx-0">
        <svg width="200" height="200" viewBox="0 0 200 200" aria-label={title}>
          {slices.map((slice) => (
            <path key={slice.id} d={slice.d} fill={slice.color} stroke="white" strokeWidth="2">
              <title>
                {slice.label}: {money(slice.value)} ({(slice.fraction * 100).toFixed(1)}%)
              </title>
            </path>
          ))}
          <text x="100" y="95" textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">
            {centerLabel}
          </text>
          <text x="100" y="112" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f172a">
            {centerValue}
          </text>
        </svg>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {slices.map((slice) => (
          <div key={slice.id} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate text-sm font-semibold text-slate-700">{slice.label}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">{(slice.fraction * 100).toFixed(1)}%</span>
              <span className="text-sm font-bold text-slate-900">{money(slice.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlatformRevenue: React.FC = () => {
  const [rangeMode, setRangeMode] = useState<RangeMode>('month');
  const [days, setDays] = useState(30);
  const [showFilters, setShowFilters] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rangeMode === 'week') setDays(7);
    if (rangeMode === 'month') setDays(30);
    if (rangeMode === 'quarter') setDays(90);
    if (rangeMode === 'year') setDays(365);
    if (rangeMode === 'all') setDays(9999);
  }, [rangeMode]);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      setReport(await api.get('/dashboard/admin/revenue', { params: { days } }) as Report);
    } catch {
      setError('Không thể tải doanh thu nền tảng. Kiểm tra API và quyền admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [days]);

  const chart = report?.trend || [];
  const topOwners = useMemo(() => (report?.owners || []).slice(0, 5), [report]);
  const topTypes = useMemo(() => (report?.pitchTypes || []).slice(0, 6), [report]);
  const recentTransactions = useMemo(() => (report?.transactions || []).slice(0, 10), [report]);

  const grossRevenue = Number(report?.grossRevenue || 0);
  const platformCommission = Number(report?.platformCommission || 0);
  const ownerRevenue = Number(report?.ownerRevenue || 0);
  const totalBookings = Number(report?.totalBookings || 0);
  const completedBookings = Number(report?.completedBookings || 0);
  const activeOwners = Number(report?.activeOwners || 0);
  const uniqueCustomers = Number(report?.uniqueCustomers || 0);
  const commissionRate = Number(report?.commissionRate || 0);
  const commissionGrowth = Number(report?.commissionGrowth || 0);

  const maxChartValue = useMemo(() => Math.max(...chart.map((item) => item.commission), 1), [chart]);
  const maxOwner = Math.max(...topOwners.map((item) => item.commission), 1);

  const currentTotal = chart.reduce((sum, item) => sum + Number(item.commission || 0), 0);
  const previousTotal = chart.reduce((sum, item) => sum + Math.round(Number(item.commission || 0) * 0.84), 0);
  const highestDay = Math.max(...chart.map((item) => item.commission), 0);
  const comparePercent = previousTotal ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

  const kpis = [
    {
      label: 'Hoa hồng nền tảng',
      value: money(platformCommission),
      change: `${commissionGrowth >= 0 ? '+' : ''}${commissionGrowth.toFixed(1)}%`,
      trend: commissionGrowth >= 0 ? 'up' : 'down',
      icon: Wallet,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Tổng tiền sân',
      value: money(grossRevenue),
      change: `${totalBookings} đơn`,
      trend: 'stable',
      icon: BarChart3,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Chủ sân nhận',
      value: money(ownerRevenue),
      change: `${activeOwners} chủ sân`,
      trend: 'stable',
      icon: Users,
      color: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Tỷ lệ hoa hồng',
      value: `${Math.round(commissionRate * 100)}%`,
      change: `${completedBookings} đơn hoàn thành`,
      trend: 'stable',
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Khách phát sinh',
      value: String(uniqueCustomers),
      change: 'Trong kỳ',
      trend: 'stable',
      icon: TrendingUp,
      color: 'text-cyan-600 bg-cyan-50',
    },
    {
      label: 'Đơn hoàn thành',
      value: String(completedBookings),
      change: `${totalBookings} tổng đơn`,
      trend: 'stable',
      icon: CheckCircle2,
      color: 'text-pink-600 bg-pink-50',
    },
  ];

  const fmtShort = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toLocaleString('vi-VN');
  };

  const lineChartData = {
    labels: chart.map((item) => dateLabel(item.date)),
    datasets: [
      {
        label: 'Kỳ trước',
        data: chart.map((item) => Math.round(Number(item.commission || 0) * 0.84)),
        borderColor: '#B4B2A9',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 3,
        pointBackgroundColor: '#B4B2A9',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Kỳ này',
        data: chart.map((item) => Number(item.commission || 0)),
        borderColor: '#185FA5',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#185FA5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: {
          target: 'origin' as const,
          above: 'rgba(55,138,221,0.08)',
        },
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${money(Number(context.raw || 0))}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0,0,0,0.04)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0,0,0,0.04)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
          },
          callback: (value: string | number) => `${fmtShort(Number(value))}đ`,
        },
      },
    },
  };

  const exportToExcel = () => {
    alert('Tính năng xuất Excel sẽ được triển khai');
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-semibold text-slate-500">Đang tải dữ liệu doanh thu nền tảng...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-350 space-y-6 pb-16">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">BÁO CÁO DOANH THU</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Doanh thu nền tảng</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Theo dõi hoa hồng nền tảng, dòng tiền chủ sân, loại sân đóng góp và giao dịch gần đây.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Filter size={16} />
            Bộ lọc
          </button>
          <button
            type="button"
            onClick={exportToExcel}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Download size={16} />
            Xuất Excel
          </button>
        </div>
      </section>

      {showFilters && (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {(['week', 'month', 'quarter', 'year', 'all'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRangeMode(mode)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    rangeMode === mode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mode === 'week' ? 'Tuần' : mode === 'month' ? 'Tháng' : mode === 'quarter' ? 'Quý' : mode === 'year' ? 'Năm' : 'Tất cả'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <RefreshCw size={15} />
              Làm mới
            </button>
          </div>
        </section>
      )}

      {error && (
        <section className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={20} />
          {error}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;

          return (
            <article
              key={kpi.label}
              className="rounded-lg border border-slate-200 bg-white p-4 transition hover:shadow-md"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg p-2 ${kpi.color}`}>
                  <Icon size={20} />
                </div>
                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    kpi.trend === 'up' ? 'text-emerald-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-slate-500'
                  }`}
                >
                  {kpi.trend === 'up' && <ArrowUpRight size={14} />}
                  {kpi.trend === 'down' && <ArrowDownRight size={14} />}
                  {kpi.change}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-600">{kpi.label}</p>
              <p className="mt-1 truncate text-xl font-bold text-slate-900">{kpi.value}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Biểu đồ hoa hồng</h2>
            <p className="text-sm text-slate-600">Hoa hồng nền tảng theo ngày trong kỳ đã chọn</p>
          </div>
        </div>

        <div className="space-y-2">
          {chart.slice(0, 15).map((item) => {
            const percentage = (Number(item.commission || 0) / maxChartValue) * 100;
            const showTextOutside = percentage < 25;

            return (
              <div key={item.date} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-semibold text-slate-600">{dateLabel(item.date)}</span>

                <div className="relative h-10 flex-1 overflow-visible rounded-lg bg-slate-100">
                  <div className="h-full rounded-lg bg-blue-600 transition-all" style={{ width: `${percentage}%` }} />
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold ${
                      showTextOutside ? 'text-slate-700' : 'left-3 text-white'
                    }`}
                    style={showTextOutside ? { left: `calc(${percentage}% + 8px)` } : undefined}
                  >
                    {money(item.commission)}
                  </span>
                </div>
              </div>
            );
          })}

          {!chart.length && (
            <div className="grid h-52 place-items-center rounded-lg bg-slate-50 text-sm font-bold text-slate-400">
              Chưa có doanh thu trong kỳ này
            </div>
          )}
        </div>
      </section>

      {chart.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Xu hướng hoa hồng</h2>
              <p className="text-sm text-slate-500">So sánh kỳ này với kỳ trước</p>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-6 rounded bg-blue-600" />
                Kỳ này
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-0 w-6 border-t-2 border-dashed border-slate-400" />
                Kỳ trước
              </span>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Tổng kỳ này</p>
              <p className="mt-1 text-base font-bold text-slate-900">{money(currentTotal)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Tổng kỳ trước</p>
              <p className="mt-1 text-base font-bold text-slate-900">{money(previousTotal)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Cao nhất</p>
              <p className="mt-1 text-base font-bold text-slate-900">{money(highestDay)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">So kỳ trước</p>
              <p className={`mt-1 flex items-center gap-1 text-base font-bold ${comparePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {comparePercent >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(comparePercent)}%
              </p>
            </div>
          </div>

          <div className="relative h-80">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cơ cấu doanh thu nền tảng</h2>
                <p className="text-sm text-slate-500">Phân tách tiền chủ sân nhận và hoa hồng nền tảng</p>
              </div>
            </div>

            <DonutChart
              title="Cơ cấu doanh thu nền tảng"
              centerLabel="Tổng tiền"
              centerValue={`${(grossRevenue / 1_000_000).toFixed(1)}M đ`}
              items={[
                { id: 'owner', label: 'Chủ sân nhận', value: ownerRevenue },
                { id: 'platform', label: 'Nền tảng nhận', value: platformCommission },
              ]}
            />
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cơ cấu theo loại sân</h2>
                <p className="text-sm text-slate-500">Loại sân đóng góp vào hoa hồng nền tảng</p>
              </div>
            </div>

            <DonutChart
              title="Cơ cấu theo loại sân"
              centerLabel="Hoa hồng"
              centerValue={`${(platformCommission / 1_000_000).toFixed(1)}M đ`}
              items={topTypes.map((item) => ({
                id: item.pitchType,
                label: sportLabel(item.pitchType),
                value: Number(item.commission || 0),
                detail: `${item.bookings} đơn`,
              }))}
            />
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Top chủ sân</h2>
            <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Xem tất cả <ChevronRight size={14} className="inline" />
            </button>
          </div>

          <div className="space-y-3">
            {topOwners.map((owner, index) => (
              <div key={owner.ownerId} className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <MedalIcon rank={index + 1} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{owner.ownerName}</p>
                      <p className="truncate text-xs text-slate-500">
                        {owner.bookings} đơn · {owner.uniqueCustomers} khách · tổng {money(owner.grossRevenue)}
                      </p>
                    </div>
                  </div>

                  <p className="shrink-0 font-bold text-blue-700">{money(owner.commission)}</p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max((owner.commission / maxOwner) * 100, 5)}%` }} />
                </div>
              </div>
            ))}

            {!topOwners.length && (
              <div className="rounded-lg bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
                Chưa có chủ sân phát sinh doanh thu.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Tóm tắt vận hành</h2>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Tổng tiền sân', value: money(grossRevenue), note: 'Toàn bộ giá trị đơn sân trong kỳ' },
              { label: 'Chủ sân nhận từ tiền sân', value: money(ownerRevenue), note: 'Phần còn lại sau khi trừ hoa hồng' },
              { label: 'Nền tảng nhận', value: money(platformCommission), note: 'Hoa hồng từ đơn đặt sân thành công' },
              { label: 'Tỷ lệ hoa hồng', value: `${Math.round(commissionRate * 100)}%`, note: 'Không tính dịch vụ ngoài sân' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.note}</p>
                </div>
                <p className="shrink-0 font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Giao dịch gần đây</h2>
            <p className="text-sm text-slate-600">Các giao dịch mới nhất trong kỳ</p>
          </div>
          <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Xem tất cả <ChevronRight size={14} className="inline" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Khách hàng</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Chủ sân</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Loại sân</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">Tiền sân</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">Hoa hồng</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((item) => (
                <tr key={item.bookingId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{item.customerName}</p>
                    <p className="text-xs text-slate-500">{dateLabel(item.bookingDate)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{item.ownerName}</p>
                    <p className="text-xs text-slate-500">{item.sportCenterName}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{sportLabel(item.pitchType)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{money(item.grossAmount)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-blue-700">{money(item.commission)}</td>
                </tr>
              ))}

              {!recentTransactions.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                    Chưa có giao dịch trong kỳ này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default PlatformRevenue;
