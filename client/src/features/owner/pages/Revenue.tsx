import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Award, BarChart3, CalendarDays, CreditCard, Download, Filter, Loader2, Medal, Package, TrendingUp, Trophy, Wallet } from 'lucide-react';
import api from '../../../services/api';

type FilterMode = 'all' | 'week' | 'month' | 'year';
type RevenuePoint = { date: string; amount: number };
type StatusPoint = { status: string; count: number };
type PitchRevenue = { pitchId: string; pitchName: string; pitchType: string; revenue: number; bookings: number };
type RecentBooking = { id: string; pitchName: string; pitchType?: string; userName: string; bookingDate: string; timeRange: string; totalPrice: number; status: string };
type TopCustomer = { userId: string; userName: string; bookings: number; totalSpent: number; favoritePitchType?: string };
type TopService = { serviceId: string; serviceName: string; quantitySold: number; revenue: number };
type RevenueData = { summary: { totalRevenue: number; serviceRevenue: number; servicesSold: number; totalBookings: number; activePitches: number; occupancyRate: number }; revenueChart: RevenuePoint[]; bookingStatusDistribution: StatusPoint[]; pitchRevenue: PitchRevenue[]; recentBookings: RecentBooking[]; topCustomers: TopCustomer[]; topServices: TopService[] };

const today = new Date();
const pad = (value: number) => String(value).padStart(2, '0');
const iso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const compactMoney = (value: number) => value >= 1000000 ? `${(value / 1000000).toFixed(value % 1000000 ? 1 : 0)}tr` : value >= 1000 ? `${Math.round(value / 1000)}k` : String(value);
const typeLabel = (type?: string) => ({ '1': 'Bóng đá 5 người', Football5: 'Bóng đá 5 người', '2': 'Bóng đá 7 người', Football7: 'Bóng đá 7 người', '3': 'Bóng đá 11 người', Football11: 'Bóng đá 11 người', '4': 'Tennis', Tennis: 'Tennis', '5': 'Cầu lông', Badminton: 'Cầu lông', '6': 'Pickleball', Pickleball: 'Pickleball', '7': 'Bóng rổ', Basketball: 'Bóng rổ', '8': 'Bóng chuyền', Volleyball: 'Bóng chuyền', '9': 'Bóng bàn', TableTennis: 'Bóng bàn' }[String(type || '')] || 'Chưa phân loại');
const statusLabel = (status?: string) => { const value = String(status || '').toLowerCase(); if (value.includes('complete')) return 'Hoàn thành'; if (value.includes('confirm')) return 'Đã xác nhận'; if (value.includes('pending')) return 'Chờ cọc'; if (value.includes('cancel')) return 'Đã hủy'; return status || 'Khác'; };
const statusClass = (status?: string) => { const value = String(status || '').toLowerCase(); if (value.includes('complete')) return 'bg-blue-50 text-blue-700'; if (value.includes('confirm')) return 'bg-emerald-50 text-emerald-700'; if (value.includes('pending')) return 'bg-amber-50 text-amber-700'; if (value.includes('cancel')) return 'bg-rose-50 text-rose-700'; return 'bg-slate-100 text-slate-600'; };
const colors = ['#2563eb', '#059669', '#f59e0b', '#7c3aed', '#e11d48', '#0891b2', '#ea580c'];
const bars = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-500', 'bg-violet-600', 'bg-rose-600', 'bg-cyan-600', 'bg-orange-600'];

const Revenue: React.FC = () => {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FilterMode>('month');
  const [week, setWeek] = useState(() => { const date = new Date(); date.setDate(date.getDate() - 6); return iso(date); });
  const [month, setMonth] = useState(() => iso(today).slice(0, 7));
  const [year, setYear] = useState(String(today.getFullYear()));
  const range = () => {
    if (mode === 'all') return { fromDate: '2000-01-01', toDate: iso(today) };
    if (mode === 'week') { const start = new Date(`${week}T00:00:00`); const end = new Date(start); end.setDate(end.getDate() + 6); return { fromDate: iso(start), toDate: iso(end) }; }
    if (mode === 'month') { const start = new Date(`${month}-01T00:00:00`); return { fromDate: iso(start), toDate: iso(new Date(start.getFullYear(), start.getMonth() + 1, 0)) }; }
    return { fromDate: `${year}-01-01`, toDate: `${year}-12-31` };
  };
  useEffect(() => { setLoading(true); api.get('/dashboard/owner/revenue', { params: range() }).then((res: any) => setData(res)).finally(() => setLoading(false)); }, [mode, week, month, year]);

  const chart = data?.revenueChart || [];
  const statuses = data?.bookingStatusDistribution || [];
  const recent = data?.recentBookings || [];
  const topCustomers = data?.topCustomers || [];
  const topServices = data?.topServices || [];
  const byType = useMemo(() => Array.from((data?.pitchRevenue || []).reduce((map, pitch) => {
    const label = typeLabel(pitch.pitchType); const item = map.get(label) || { label, revenue: 0, bookings: 0 };
    item.revenue += Number(pitch.revenue); item.bookings += Number(pitch.bookings); map.set(label, item); return map;
  }, new Map<string, { label: string; revenue: number; bookings: number }>()).values()).sort((a, b) => b.revenue - a.revenue), [data?.pitchRevenue]);
  const fullChart = useMemo(() => {
    if (mode === 'all' || mode === 'year') {
      const chartYear = mode === 'year' ? year : String(today.getFullYear());
      return Array.from({ length: 12 }, (_, index) => { const key = `${chartYear}-${pad(index + 1)}`; return { date: key, amount: chart.filter(item => item.date.startsWith(key)).reduce((sum, item) => sum + Number(item.amount || 0), 0) }; });
    }
    const map = new Map(chart.map(item => [item.date.slice(0, 10), Number(item.amount || 0)]));
    const { fromDate, toDate } = range(); const points = []; const end = new Date(`${toDate}T00:00:00`);
    for (let date = new Date(`${fromDate}T00:00:00`); date <= end; date.setDate(date.getDate() + 1)) { const key = iso(date); points.push({ date: key, amount: map.get(key) || 0 }); }
    return points;
  }, [chart, mode, week, month, year]);
  const total = Number(data?.summary.totalRevenue || 0);
  const maxType = Math.max(...byType.map(item => item.revenue), 1);
  const maxChart = Math.max(Math.ceil(Math.max(...fullChart.map(item => item.amount), 1) / 100000) * 100000, 100000);
  const maxStatus = Math.max(...statuses.map(item => item.count), 1);
  const chartWidth = 760; const chartHeight = 230; const left = 54; const right = 12; const top = 14; const bottom = 34;
  const plotWidth = chartWidth - left - right; const plotHeight = chartHeight - top - bottom;
  const points = fullChart.map((item, index) => `${left + (fullChart.length === 1 ? plotWidth / 2 : index / (fullChart.length - 1) * plotWidth)},${top + plotHeight - item.amount / maxChart * plotHeight}`).join(' ');
  const circumference = 2 * Math.PI * 46;
  let donutOffset = 0;
  const donut = byType.map((item, index) => { const share = total ? item.revenue / total : 0; const segment = { ...item, color: colors[index % colors.length], dash: share * circumference, offset: -donutOffset }; donutOffset += share * circumference; return segment; });

  if (loading) return <div className="flex min-h-[560px] flex-col items-center justify-center gap-5"><Loader2 className="animate-spin text-blue-600" size={44} /><p className="text-xs font-black uppercase tracking-widest text-slate-400">Đang tổng hợp doanh thu</p></div>;
  return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-[1500px] flex-col gap-5 overflow-hidden pb-16">
    <header className="grid gap-5 overflow-hidden rounded-2xl bg-blue-700 p-6 text-white shadow-xl shadow-blue-950/10 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30"><BarChart3 size={26} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">Báo cáo vận hành</p><h1 className="mt-2 text-3xl font-black text-white">Doanh thu sân</h1><p className="mt-2 text-sm font-semibold text-slate-300">Theo dõi tiền thu, đơn đặt và hiệu quả theo từng loại sân.</p></div></div>
      <div className="flex flex-wrap items-end gap-5"><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng thu trong kỳ</p><p className="mt-2 text-3xl font-black text-white">{money(total)}</p></div><button className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-900 transition hover:bg-blue-50"><Download size={16} />Xuất báo cáo</button></div>
    </header>
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700"><Filter size={15} />Bộ lọc báo cáo</p><p className="mt-2 text-xs font-bold text-slate-400">Chọn khoảng thời gian để cập nhật toàn bộ số liệu bên dưới.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">{([['all', 'Tất cả'], ['week', 'Theo tuần'], ['month', 'Theo tháng'], ['year', 'Theo năm']] as const).map(([id, label]) => <button key={id} onClick={() => setMode(id)} className={`h-9 rounded-lg px-3 text-xs font-black transition ${mode === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}</div>
          {mode === 'week' && <input type="date" value={week} onChange={event => setWeek(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-400" />}
          {mode === 'month' && <input type="month" value={month} onChange={event => setMonth(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-400" />}
          {mode === 'year' && <input type="number" min="2000" max="2100" value={year} onChange={event => setYear(event.target.value)} className="h-11 w-28 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-400" />}
        </div>
      </div>
    </section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[
      { label: 'Doanh thu hoàn thành', value: money(total), icon: Wallet, tone: 'bg-blue-50 text-blue-700' },
      { label: 'Đơn trong kỳ', value: String(data?.summary.totalBookings || 0), icon: CreditCard, tone: 'bg-emerald-50 text-emerald-700' },
      { label: 'Loại sân có doanh thu', value: String(byType.length), icon: Activity, tone: 'bg-amber-50 text-amber-700' },
      { label: 'Doanh thu dịch vụ', value: money(data?.summary.serviceRevenue), icon: TrendingUp, tone: 'bg-violet-50 text-violet-700' },
      { label: 'Sản phẩm đã bán', value: String(data?.summary.servicesSold || 0), icon: Package, tone: 'bg-orange-50 text-orange-700' },
      { label: 'Giá trị trung bình đơn', value: money((data?.summary.totalBookings || 0) ? total / Number(data?.summary.totalBookings || 1) : 0), icon: Award, tone: 'bg-cyan-50 text-cyan-700' },
    ].map((item, index) => <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} key={item.label} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.tone}`}><item.icon size={20} /></span><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</p><p className="mt-1 truncate text-2xl font-black text-slate-950">{item.value}</p></div></motion.article>)}</section>
    <section className="grid min-w-0 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <article className="min-w-0 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h2 className="text-lg font-black">Xu hướng doanh thu</h2><p className="mt-1 text-xs font-bold text-slate-400">Doanh thu hoàn thành theo thời gian</p><div className="mt-5 w-full overflow-hidden"><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="block h-auto w-full min-w-0" role="img" aria-label="Biểu đồ xu hướng doanh thu">{[0, .25, .5, .75, 1].map(value => <g key={value}><line x1={left} x2={chartWidth - right} y1={top + plotHeight * value} y2={top + plotHeight * value} stroke="#dbeafe" strokeDasharray="4 5" /><text x={left - 8} y={top + plotHeight * value + 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#94a3b8">{compactMoney(maxChart * (1 - value))}</text></g>)}<line x1={left} x2={left} y1={top} y2={top + plotHeight} stroke="#bfdbfe" /><line x1={left} x2={chartWidth - right} y1={top + plotHeight} y2={top + plotHeight} stroke="#bfdbfe" /><motion.polyline initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }} points={points} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{fullChart.map((item, index) => { const x = left + (fullChart.length === 1 ? plotWidth / 2 : index / (fullChart.length - 1) * plotWidth); const y = top + plotHeight - item.amount / maxChart * plotHeight; const showLabel = fullChart.length <= 12 || index % Math.ceil(fullChart.length / 8) === 0 || index === fullChart.length - 1; return <g key={item.date}><circle cx={x} cy={y} r="4" fill="white" stroke={item.amount ? '#2563eb' : '#cbd5e1'} strokeWidth="3"><title>{item.date}: {money(item.amount)}</title></circle>{showLabel && <text x={x} y={chartHeight - 10} textAnchor="middle" fontSize="9" fontWeight="700" fill="#94a3b8">{item.date.slice(5)}</text>}</g>; })}</svg></div></article>
      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h2 className="text-lg font-black">Trạng thái đơn</h2><p className="mt-1 text-xs font-bold text-slate-400">Phân bổ booking trong kỳ</p><div className="mt-6 space-y-5">{statuses.map((item, index) => <div key={item.status}><div className="mb-2 flex justify-between gap-3 text-xs font-black"><span>{statusLabel(item.status)}</span><span className="shrink-0 text-slate-400">{item.count} đơn</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><motion.div initial={{ width: 0 }} animate={{ width: `${item.count / maxStatus * 100}%` }} className={`h-full rounded-full ${bars[index % bars.length]}`} /></div></div>)}</div></article>
    </section>
    <section className="grid min-w-0 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <article className="min-w-0 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h2 className="text-lg font-black">Doanh thu theo loại sân</h2><p className="mt-1 text-xs font-bold text-slate-400">So sánh doanh thu và số đơn hoàn thành</p><div className="mt-6 space-y-5">{byType.map((item, index) => <div key={item.label}><div className="mb-2 flex flex-wrap justify-between gap-2 text-xs font-black"><span>{item.label}</span><span className="text-slate-400">{item.bookings} đơn · {money(item.revenue)}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><motion.div initial={{ width: 0 }} animate={{ width: `${item.revenue / maxType * 100}%` }} className={`h-full rounded-full ${bars[index % bars.length]}`} /></div></div>)}</div>{!byType.length && <p className="mt-6 text-sm font-bold text-slate-400">Chưa có doanh thu trong kỳ đã chọn.</p>}</article>
      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><h2 className="text-lg font-black">Cơ cấu doanh thu</h2><p className="mt-1 text-xs font-bold text-slate-400">Tỷ trọng theo loại sân</p><div className="mt-5 grid gap-5 sm:grid-cols-[170px_1fr] sm:items-center"><div className="relative mx-auto h-40 w-40"><svg viewBox="0 0 120 120" className="-rotate-90"><circle cx="60" cy="60" r="46" fill="none" stroke="#eff6ff" strokeWidth="16" />{donut.map(item => <circle key={item.label} cx="60" cy="60" r="46" fill="none" stroke={item.color} strokeWidth="16" strokeDasharray={`${item.dash} ${circumference - item.dash}`} strokeDashoffset={item.offset} />)}</svg><div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-base font-black">{money(total)}</p><p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Tổng thu</p></div></div></div><div className="space-y-3">{donut.map(item => <div key={item.label} className="flex items-center justify-between gap-2 text-xs font-black"><span className="flex min-w-0 items-center gap-2"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate">{item.label}</span></span><span className="shrink-0 text-slate-400">{total ? Math.round(item.revenue / total * 100) : 0}%</span></div>)}</div></div></article>
    </section>
    <section className="order-9 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black">Giao dịch gần đây</h2><p className="mt-1 text-xs font-bold text-slate-400">Đối soát nhanh các đơn mới nhất</p></div><CalendarDays className="shrink-0 text-blue-600" size={21} /></div><div className="mt-4 hidden grid-cols-[minmax(180px,1fr)_minmax(150px,.8fr)_210px_125px_135px] gap-3 rounded-xl bg-blue-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-800 sm:grid"><span>Loại sân</span><span>Khách hàng</span><span>Thời gian</span><span>Trạng thái</span><span className="text-right">Tổng tiền</span></div><div className="divide-y divide-slate-100">{recent.slice(0, 8).map(item => <div key={item.id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(180px,1fr)_minmax(150px,.8fr)_210px_125px_135px] sm:items-center"><p className="truncate font-black">{typeLabel(item.pitchType)}</p><p className="truncate text-xs font-bold text-slate-600">{item.userName}</p><span className="whitespace-nowrap text-xs font-bold text-slate-500">{item.bookingDate} · {item.timeRange}</span><span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${statusClass(item.status)}`}>{statusLabel(item.status)}</span><span className="font-black sm:text-right">{money(item.totalPrice)}</span></div>)}</div>{!recent.length && <p className="mt-5 text-sm font-bold text-slate-400">Chưa có giao dịch trong kỳ đã chọn.</p>}<div className="mt-4 flex justify-center border-t border-slate-100 pt-4"><button type="button" onClick={() => window.location.assign('/dashboard/owner/bookings')} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-blue-700 transition hover:border-blue-200 hover:bg-blue-50">Xem tất cả giao dịch</button></div></section>
    <section className="order-7 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-black">Khách hàng thân thiết</h2><p className="mt-1 text-xs font-bold text-slate-400">Toàn bộ khách hàng trong kỳ, xếp hạng theo số đơn và tổng chi tiêu</p></div>
        <Trophy className="text-amber-500" size={22} />
      </div>
      {topCustomers.length ? <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {topCustomers.map((customer, index) => {
          const rank = index;
          const RankIcon = rank === 0 ? Trophy : rank === 1 ? Medal : Award;
          const tone = rank === 0 ? 'border-amber-300 bg-amber-50 text-amber-700' : rank === 1 ? 'border-slate-300 bg-slate-50 text-slate-700' : rank === 2 ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-blue-100 bg-white text-blue-700';
          return <article key={customer.userId} className={`rounded-2xl border p-4 ${tone}`}>
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white shadow-sm"><RankIcon size={20} /></span><div className="min-w-0"><p className="truncate text-sm font-black text-slate-950">{customer.userName}</p><p className="mt-1 text-[10px] font-black uppercase tracking-widest">{typeLabel(customer.favoritePitchType)}</p></div></div><span className="text-xl font-black">#{rank + 1}</span></div>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-current/10 pt-3"><div><p className="text-2xl font-black text-slate-950">{customer.bookings}</p><p className="text-[10px] font-black uppercase tracking-widest">đơn hoàn thành</p></div><p className="text-sm font-black text-slate-950">{money(customer.totalSpent)}</p></div>
          </article>;
        })}
      </div> : <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-400">Chưa có khách hàng hoàn thành đơn trong kỳ đã chọn.</p>}
    </section>
    <section className="order-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Dịch vụ bán chạy</h2><p className="mt-1 text-xs font-bold text-slate-400">Số lượng và doanh thu dịch vụ từ các đơn hợp lệ trong kỳ</p></div><div className="flex gap-2"><span className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">{data?.summary.servicesSold || 0} sản phẩm</span><span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">{money(data?.summary.serviceRevenue)}</span></div></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{topServices.slice(0, 6).map((service, index) => <article key={service.serviceId} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-xs font-black text-amber-700">#{index + 1}</span><p className="text-sm font-black text-emerald-700">{money(service.revenue)}</p></div><p className="mt-4 truncate text-sm font-black">{service.serviceName}</p><p className="mt-1 text-xs font-bold text-slate-400">{service.quantitySold} sản phẩm đã bán</p></article>)}</div>
      {!topServices.length && <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-400">Chưa có dịch vụ được bán trong kỳ đã chọn.</p>}
    </section>
  </motion.div>;
};
export default Revenue;
