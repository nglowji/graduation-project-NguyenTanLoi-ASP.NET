import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, BarChart3, CalendarDays, CircleDollarSign, Loader2, RefreshCw, ShieldCheck, Users, Wallet } from 'lucide-react';
import api from '../../../services/api';

type TrendPoint = { date: string; grossRevenue: number; commission: number; bookings: number };
type OwnerCommission = { ownerId: string; ownerName: string; ownerEmail: string; grossRevenue: number; commission: number; bookings: number; uniqueCustomers: number };
type PitchTypeCommission = { pitchType: string; grossRevenue: number; commission: number; bookings: number };
type Transaction = { bookingId: string; bookingDate: string; customerName: string; pitchName: string; pitchType: string; sportCenterName: string; ownerName: string; grossAmount: number; commission: number; status: string };
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

const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const shortMoney = (value?: number) => {
  const amount = Number(value || 0);
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount % 1_000_000 ? 1 : 0)}tr`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return `${amount}`;
};
const dateLabel = (value?: string) => {
  if (!value) return '--';
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};
const sportLabel = (value?: string) => ({
  Football5: 'Bóng đá 5 người',
  Football7: 'Bóng đá 7 người',
  Football11: 'Bóng đá 11 người',
  Badminton: 'Cầu lông',
  Pickleball: 'Pickleball',
  Tennis: 'Tennis',
  Basketball: 'Bóng rổ',
  Volleyball: 'Bóng chuyền',
  TableTennis: 'Bóng bàn',
} as Record<string, string>)[String(value || '')] || value || 'Loại sân';

const TrendChart: React.FC<{ data: TrendPoint[] }> = ({ data }) => {
  const width = 860;
  const height = 280;
  const pad = { top: 22, right: 22, bottom: 38, left: 58 };
  const max = Math.max(...data.map((item) => item.commission), 1);
  const points = data.map((item, index) => ({
    ...item,
    x: data.length <= 1 ? width / 2 : pad.left + (index / (data.length - 1)) * (width - pad.left - pad.right),
    y: height - pad.bottom - (item.commission / max) * (height - pad.top - pad.bottom),
  }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');

  if (!data.length) return <div className="grid h-72 place-items-center rounded-xl bg-slate-50 text-sm font-bold text-slate-400">Chưa có doanh thu trong kỳ này</div>;

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full" role="img" aria-label="Biểu đồ hoa hồng nền tảng">
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = height - pad.bottom - tick * (height - pad.top - pad.bottom);
          return <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="oklch(88% 0.018 250)" strokeDasharray="5 7" /><text x={12} y={y + 4} className="fill-slate-400 text-[12px] font-bold">{shortMoney(max * tick)}</text></g>;
        })}
        <line x1={pad.left} x2={pad.left} y1={pad.top} y2={height - pad.bottom} stroke="oklch(74% 0.055 250)" />
        <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} stroke="oklch(74% 0.055 250)" />
        <path d={path} fill="none" stroke="oklch(55% 0.23 255)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <g key={`${point.date}-${index}`}>
            <circle cx={point.x} cy={point.y} r="6" fill="oklch(98% 0.006 250)" stroke="oklch(55% 0.23 255)" strokeWidth="4" />
            {(index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 6) === 0) && <text x={point.x} y={height - 10} textAnchor="middle" className="fill-slate-500 text-[12px] font-black">{dateLabel(point.date)}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
};

const PlatformRevenue: React.FC = () => {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => { load(); }, [days]);

  const topOwners = useMemo(() => (report?.owners || []).slice(0, 5), [report]);
  const topTypes = useMemo(() => (report?.pitchTypes || []).slice(0, 6), [report]);
  const maxOwner = Math.max(...topOwners.map((item) => item.commission), 1);
  const maxType = Math.max(...topTypes.map((item) => item.commission), 1);

  if (loading) return <div className="grid min-h-[420px] place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-blue-700" size={42} /><p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Đang tải doanh thu nền tảng</p></div></div>;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700"><CircleDollarSign size={18} /> Doanh thu nền tảng</div>
            <h1 className="mt-3 text-3xl font-black text-slate-950">Theo dõi hoa hồng và dòng tiền</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Tập trung vào phần nền tảng nhận được, chủ sân tạo doanh thu, loại sân đóng góp và các giao dịch mới nhất.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {[7, 30, 90].map((value) => <button key={value} onClick={() => setDays(value)} className={`h-10 rounded-lg px-4 text-sm font-black transition ${days === value ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{value} ngày</button>)}
            <button onClick={load} className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white"><RefreshCw size={17} />Làm mới</button>
          </div>
        </div>
      </header>

      {error && <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertCircle size={20} />{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Hoa hồng', value: money(report?.platformCommission), detail: `${Number(report?.commissionGrowth || 0).toFixed(1)}% so kỳ trước`, icon: Wallet, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Tổng tiền sân', value: money(report?.grossRevenue), detail: `${report?.totalBookings || 0} lượt đặt`, icon: BarChart3, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Chủ sân có doanh thu', value: `${report?.activeOwners || 0}`, detail: `${report?.uniqueCustomers || 0} khách phát sinh`, icon: Users, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Tỷ lệ hoa hồng', value: `${Math.round((report?.commissionRate || 0) * 100)}%`, detail: `${report?.completedBookings || 0} đơn hoàn thành`, icon: ShieldCheck, tone: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
        ].map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-5 grid h-12 w-12 place-items-center rounded-xl border ${tone}`}><Icon size={22} /></div><p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{detail}</p></article>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black">Biến động hoa hồng</h2><p className="mt-1 text-xs font-bold text-slate-400">Có trục tung, trục hoành và mốc tiền rõ ràng.</p></div><CalendarDays className="text-blue-700" size={24} /></div>
          <TrendChart data={report?.trend || []} />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Top chủ sân</h2>
          <p className="mt-1 text-xs font-bold text-slate-400">Xếp theo hoa hồng nền tảng nhận được.</p>
          <div className="mt-5 space-y-4">
            {topOwners.map((owner, index) => <div key={owner.ownerId} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-black text-slate-950">#{index + 1} {owner.ownerName}</p><p className="mt-1 text-xs font-bold text-slate-500">{owner.bookings} đơn · {owner.uniqueCustomers} khách</p></div><p className="shrink-0 font-black text-blue-700">{money(owner.commission)}</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max((owner.commission / maxOwner) * 100, 5)}%` }} /></div></div>)}
            {!topOwners.length && <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">Chưa có chủ sân phát sinh doanh thu.</div>}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Loại sân đóng góp</h2>
          <p className="mt-1 text-xs font-bold text-slate-400">Không dùng tên sân, chỉ thống kê theo loại sân.</p>
          <div className="mt-5 space-y-4">
            {topTypes.map((item) => <div key={item.pitchType}><div className="mb-2 flex items-center justify-between gap-3 text-sm font-black"><span>{sportLabel(item.pitchType)}</span><span className="text-blue-700">{money(item.commission)}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max((item.commission / maxType) * 100, 5)}%` }} /></div><p className="mt-1 text-xs font-bold text-slate-400">{item.bookings} đơn · tổng {money(item.grossRevenue)}</p></div>)}
            {!topTypes.length && <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">Chưa có dữ liệu loại sân.</div>}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5"><h2 className="text-xl font-black">Giao dịch gần đây</h2><p className="mt-1 text-xs font-bold text-slate-400">Hiển thị tối đa 8 giao dịch mới nhất.</p></div>
          <div className="divide-y divide-slate-100">
            {(report?.transactions || []).slice(0, 8).map((item) => <div key={item.bookingId} className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="min-w-0"><p className="truncate font-black text-slate-950">{item.customerName} · {sportLabel(item.pitchType)}</p><p className="mt-1 truncate text-xs font-bold text-slate-500">{item.sportCenterName} · {item.ownerName} · {dateLabel(item.bookingDate)}</p></div><div className="flex items-center gap-4 md:justify-end"><span className="text-sm font-black text-slate-600">{money(item.grossAmount)}</span><span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-700">{money(item.commission)}</span><ArrowUpRight className="text-slate-300" size={18} /></div></div>)}
            {!(report?.transactions || []).length && <div className="p-10 text-center text-sm font-bold text-slate-400">Chưa có giao dịch trong kỳ này.</div>}
          </div>
        </article>
      </section>
    </div>
  );
};

export default PlatformRevenue;
