import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Home,
  Loader2,
  Package,
  RefreshCw,
  Star,
  TrendingUp,
  Wallet,
  Wrench,
} from 'lucide-react';
import api from '../../../services/api';

type RecentBooking = {
  id: string;
  pitchName: string;
  pitchType?: string;
  customerName: string;
  startTime: string;
  endTime?: string;
  bookingDate: string;
  status: string;
  totalAmount: number;
};

type PitchStat = {
  pitchId: string;
  pitchName: string;
  pitchType: string;
  occupancyRate: number;
  revenue: number;
  status: string;
};

type WeeklyRevenue = { date: string; current: number; previous: number };
type TimeSlotOccupancy = { hour: string; rate: number };

type Recommendation = {
  type: 'priority' | 'suggestion' | 'info' | 'success';
  title: string;
  description: string;
  actionText?: string;
  actionPath?: string;
};

type DashboardData = {
  todayBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  todayRevenue: number;
  monthRevenue: number;
  monthTarget: number;
  activePitches: number;
  totalPitches: number;
  lowStockServices: number;
  avgRating: number;
  ratingCount: number;
  occupancyRate: number;
  recentBookings: RecentBooking[];
  pitchStats: PitchStat[];
  timeSlots: TimeSlotOccupancy[];
  weeklyRevenue: WeeklyRevenue[];
  recommendations: Recommendation[];
};

const pad = (value: number) => String(value).padStart(2, '0');
const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const shortMoney = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString('vi-VN');
};

const unwrapItems = <T,>(response: unknown): T[] => {
  const raw = (response as { data?: unknown })?.data ?? response;
  const data = (raw as { data?: unknown })?.data ?? raw;
  if (Array.isArray((data as { items?: T[] })?.items)) return (data as { items: T[] }).items;
  if (Array.isArray((raw as { items?: T[] })?.items)) return (raw as { items: T[] }).items;
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(raw)) return raw as T[];
  return [];
};

const unwrapObject = <T,>(response: unknown): T => {
  const raw = (response as { data?: unknown })?.data ?? response;
  const data = (raw as { data?: unknown })?.data ?? raw;
  return data as T;
};

const dateKey = (value?: string) => {
  if (!value) return '';
  const raw = String(value).trim().split('T')[0].split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const viDate = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (viDate) {
    const [, day, month, year] = viDate;
    return `${year}-${pad(Number(month))}-${pad(Number(day))}`;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : toIsoDate(parsed);
};

const normalizeStatus = (value?: string) => String(value || '').toLowerCase();
const isCompletedBooking = (booking: any) => normalizeStatus(booking.status).includes('complete') || normalizeStatus(booking.status).includes('confirm');
const isPendingBooking = (booking: any) => normalizeStatus(booking.status).includes('pending');
const isCancelledBooking = (booking: any) => normalizeStatus(booking.status).includes('cancel');
const bookingAmount = (booking: any) => Number(booking.totalAmount ?? booking.totalPrice ?? booking.amount ?? booking.finalAmount ?? booking.payment?.amount ?? 0);
const getBookingDateValue = (booking: any) => booking.bookingDate || booking.date || booking.playDate || booking.scheduledDate || booking.createdAt || '';
const getBookingStart = (booking: any) => String(booking.startTime || booking.timeSlot?.startTime || booking.timeRange?.split('–')?.[0] || '').substring(0, 5);
const getBookingEnd = (booking: any) => String(booking.endTime || booking.timeSlot?.endTime || booking.timeRange?.split('–')?.[1] || '').substring(0, 5);
const isPitchActive = (pitch: any) => normalizeStatus(pitch.status) === 'active' || pitch.isActive === true;
const getActiveSlotCount = (pitch: any) => (pitch.timeSlots || []).filter((slot: any) => slot.isActive !== false).length;
const getServiceStock = (service: any) => Number(service.stockQuantity ?? service.quantityInStock ?? service.quantity ?? service.stock ?? 0);

const statusLabel = (status?: string) => {
  const value = normalizeStatus(status);
  if (value.includes('complet')) return 'Hoàn thành';
  if (value.includes('confirm')) return 'Xác nhận';
  if (value.includes('pending')) return 'Chờ xử lý';
  if (value.includes('cancel')) return 'Đã hủy';
  return 'Khác';
};

const statusClass = (status?: string) => {
  const value = normalizeStatus(status);
  if (value.includes('complet')) return 'bg-emerald-100 text-emerald-700';
  if (value.includes('confirm')) return 'bg-blue-100 text-blue-700';
  if (value.includes('pending')) return 'bg-amber-100 text-amber-700';
  if (value.includes('cancel')) return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
};

const pitchTypeLabel = (type?: string) =>
  ({
    Football5: 'Bóng đá 5',
    Football7: 'Bóng đá 7',
    Football11: 'Bóng đá 11',
    Tennis: 'Tennis',
    Badminton: 'Cầu lông',
    Pickleball: 'Pickleball',
    Basketball: 'Bóng rổ',
    Volleyball: 'Bóng chuyền',
    TableTennis: 'Bóng bàn',
  }[String(type || '')] || 'Sân');

const initials = (name: string) =>
  String(name || 'K')
    .split(' ')
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

const buildDashboard = (bookings: any[], revenue: any, pitches: any[], services: any[]): DashboardData => {
  const now = new Date();
  const todayStr = toIsoDate(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthStartStr = toIsoDate(monthStart);
  const monthEndStr = toIsoDate(monthEnd);

  const validBookings = bookings.filter((booking) => !isCancelledBooking(booking));
  const todayList = validBookings.filter((booking) => dateKey(getBookingDateValue(booking)) === todayStr);
  const pending = bookings.filter(isPendingBooking);
  const confirmedToday = todayList.filter((booking) => normalizeStatus(booking.status).includes('confirm'));
  const monthBookings = validBookings.filter((booking) => {
    const key = dateKey(getBookingDateValue(booking));
    return key >= monthStartStr && key <= monthEndStr;
  });

  const todayRevenue = todayList.filter(isCompletedBooking).reduce((sum, booking) => sum + bookingAmount(booking), 0);
  const computedMonthRevenue = monthBookings.filter(isCompletedBooking).reduce((sum, booking) => sum + bookingAmount(booking), 0);
  const revenueSummary = revenue?.summary || {};
  const monthRevenue = Number(revenueSummary.totalRevenue ?? computedMonthRevenue);
  const monthTarget = Math.max(100_000_000, monthRevenue > 0 ? Math.ceil((monthRevenue * 1.2) / 10_000_000) * 10_000_000 : 100_000_000);
  const activePitches = pitches.filter(isPitchActive).length;
  const totalPitches = pitches.length;
  const activeSlots = pitches.reduce((sum, pitch) => sum + getActiveSlotCount(pitch), 0);
  const inactivePitches = Math.max(totalPitches - activePitches, 0);
  const lowStock = services.filter((service) => {
    const stock = getServiceStock(service);
    return stock > 0 && stock <= 5;
  }).length;

  const ratings = pitches.map((pitch) => ({ avg: Number(pitch.averageRating || 0), count: Number(pitch.totalReviews || 0) })).filter((item) => item.count > 0 && item.avg > 0);
  const ratingCount = ratings.reduce((sum, item) => sum + item.count, 0);
  const avgRating = ratingCount > 0 ? ratings.reduce((sum, item) => sum + item.avg * item.count, 0) / ratingCount : 0;
  const occupancyRate = Number(revenueSummary.occupancyRate ?? (activePitches > 0 && activeSlots > 0 ? Math.min(100, (todayList.length / Math.max(activeSlots, 1)) * 100) : 0));

  const recommendations: Recommendation[] = [];
  if (pending.length > 0) recommendations.push({ type: 'priority', title: `${pending.length} đơn đặt sân đang chờ xử lý`, description: 'Nên xác nhận sớm để giữ lịch cho khách và tránh trống khung giờ đẹp.', actionText: 'Xử lý đơn', actionPath: '/dashboard/owner/bookings' });
  if (lowStock > 0) recommendations.push({ type: 'suggestion', title: `${lowStock} dịch vụ sắp hết hàng`, description: 'Kiểm tra tồn kho nước uống, thuê vợt hoặc bóng trước khung giờ cao điểm.', actionText: 'Kiểm tra kho', actionPath: '/dashboard/owner/services' });
  if (todayList.length < activeSlots * 0.4) recommendations.push({ type: 'info', title: 'Tỷ lệ lấp đầy hôm nay còn thấp', description: 'Có thể nhắc khách quen, đẩy sân trống hoặc tạo gói giờ thấp điểm.', actionText: 'Xem doanh thu', actionPath: '/dashboard/owner/revenue' });
  if (inactivePitches > 0) recommendations.push({ type: 'suggestion', title: `${inactivePitches} sân đang tạm ngưng`, description: 'Kiểm tra bảo trì để mở lại sân kịp thời, nhất là trước cuối tuần.', actionText: 'Quản lý sân', actionPath: '/dashboard/owner/pitches' });
  if (recommendations.length === 0) recommendations.push({ type: 'success', title: 'Vận hành ổn định', description: 'Không có cảnh báo lớn. Tiếp tục theo dõi đơn mới và chất lượng sân.' });

  const revenueChart: any[] = Array.isArray(revenue?.revenueChart) ? revenue.revenueChart : [];
  const last7Keys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    return toIsoDate(date);
  });

  const weeklyRevenue = last7Keys.map((key) => {
    const fromApi = revenueChart.find((item) => dateKey(item.date) === key);
    const current = Number(fromApi?.amount ?? validBookings.filter((booking) => dateKey(getBookingDateValue(booking)) === key && isCompletedBooking(booking)).reduce((sum, booking) => sum + bookingAmount(booking), 0));
    const previousDate = new Date(key);
    previousDate.setDate(previousDate.getDate() - 7);
    const previousKey = toIsoDate(previousDate);
    const previous = validBookings.filter((booking) => dateKey(getBookingDateValue(booking)) === previousKey && isCompletedBooking(booking)).reduce((sum, booking) => sum + bookingAmount(booking), 0);
    return { date: key, current, previous };
  });

  const pitchRevenueMap = new Map<string, number>();
  validBookings.filter(isCompletedBooking).forEach((booking) => {
    const pitchId = booking.pitchId || booking.timeSlot?.pitchId || booking.timeSlot?.pitch?.id || booking.pitch?.id || '';
    if (!pitchId) return;
    pitchRevenueMap.set(pitchId, (pitchRevenueMap.get(pitchId) || 0) + bookingAmount(booking));
  });

  const pitchStats = pitches.slice(0, 6).map((pitch, index) => {
    const pitchId = pitch.id || String(index);
    const pitchBookings = validBookings.filter((booking) => {
      const bookingPitchId = booking.pitchId || booking.timeSlot?.pitchId || booking.timeSlot?.pitch?.id || booking.pitch?.id || '';
      return bookingPitchId === pitchId;
    });
    const slotCount = Math.max(getActiveSlotCount(pitch), 1);
    const occupancy = Math.min(100, Math.round((pitchBookings.length / slotCount) * 100));
    return {
      pitchId,
      pitchName: pitch.name || `Sân ${index + 1}`,
      pitchType: pitch.type || pitch.pitchType || '',
      occupancyRate: isPitchActive(pitch) ? occupancy : 0,
      revenue: pitchRevenueMap.get(pitchId) || 0,
      status: pitch.status || (isPitchActive(pitch) ? 'Active' : 'Inactive'),
    };
  });

  const timeBuckets = [
    { hour: '06–08h', start: 6, end: 8 }, { hour: '08–10h', start: 8, end: 10 },
    { hour: '10–12h', start: 10, end: 12 }, { hour: '12–14h', start: 12, end: 14 },
    { hour: '14–16h', start: 14, end: 16 }, { hour: '16–18h', start: 16, end: 18 },
    { hour: '18–20h', start: 18, end: 20 }, { hour: '20–22h', start: 20, end: 22 },
  ];

  const timeSlots = timeBuckets.map((bucket) => {
    const count = todayList.filter((booking) => {
      const start = Number(getBookingStart(booking).split(':')[0]);
      return Number.isFinite(start) && start >= bucket.start && start < bucket.end;
    }).length;
    const capacity = Math.max(activePitches, 1);
    return { hour: bucket.hour, rate: Math.min(100, Math.round((count / capacity) * 100)) };
  });

  return {
    todayBookings: todayList.length, pendingBookings: pending.length, confirmedBookings: confirmedToday.length,
    todayRevenue, monthRevenue, monthTarget, activePitches, totalPitches, lowStockServices: lowStock,
    avgRating, ratingCount, occupancyRate, weeklyRevenue, recommendations,
    recentBookings: [...validBookings].sort((a, b) => `${dateKey(getBookingDateValue(b))} ${getBookingStart(b)}`.localeCompare(`${dateKey(getBookingDateValue(a))} ${getBookingStart(a)}`)).slice(0, 6).map((booking) => ({
      id: booking.id,
      pitchName: booking.timeSlot?.pitch?.name || booking.pitch?.name || booking.pitchName || 'Sân trống',
      pitchType: booking.timeSlot?.pitch?.type || booking.timeSlot?.pitch?.pitchType || booking.pitchType,
      customerName: booking.user?.fullName || booking.customerName || booking.userName || 'Khách vãng lai',
      startTime: getBookingStart(booking), endTime: getBookingEnd(booking),
      bookingDate: dateKey(getBookingDateValue(booking)), status: booking.status, totalAmount: bookingAmount(booking),
    })),
    pitchStats,
    timeSlots,
  };
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);

    try {
      const [bookings, revenue, pitches, services] = await Promise.all([
        api.get('/bookings/owner') as any,
        api.get('/dashboard/owner/revenue') as any,
        api.get('/pitches/my') as any,
        api.get('/additional-services/my') as any,
      ]);

      setData(buildDashboard(unwrapItems<any>(bookings), unwrapObject<any>(revenue), unwrapItems<any>(pitches), unwrapItems<any>(services)));
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-blue-600" size={36} />
        <p className="text-sm font-semibold text-slate-500">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center gap-4">
        <p className="text-sm font-semibold text-slate-500">Không thể tải dữ liệu tổng quan.</p>
        <button type="button" onClick={fetchDashboard} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          <RefreshCw size={16} /> Tải lại
        </button>
      </div>
    );
  }

  const now = new Date();
  const dateLabel = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const currentWeekTotal = data.weeklyRevenue.reduce((sum, item) => sum + item.current, 0);
  const previousWeekTotal = data.weeklyRevenue.reduce((sum, item) => sum + item.previous, 0);
  const weekChange = previousWeekTotal > 0 ? Math.round(((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100) : 0;
  const monthPercent = Math.min(Math.round((data.monthRevenue / Math.max(data.monthTarget, 1)) * 100), 100);
  const maxChartValue = Math.max(...data.weeklyRevenue.flatMap((item) => [item.current, item.previous]), 1);

  const kpis = [
    { label: 'Đơn hôm nay', value: data.todayBookings, note: `${data.confirmedBookings} đã xác nhận`, icon: Calendar, color: 'text-blue-600 bg-blue-50', onClick: () => navigate('/dashboard/owner/bookings') },
    { label: 'Doanh thu hôm nay', value: money(data.todayRevenue), note: `${monthPercent}% mục tiêu tháng`, icon: Wallet, color: 'text-emerald-600 bg-emerald-50', onClick: () => navigate('/dashboard/owner/revenue') },
    { label: 'Sân hoạt động', value: `${data.activePitches}/${data.totalPitches}`, note: `${data.occupancyRate.toFixed(1)}% lấp đầy`, icon: Home, color: 'text-violet-600 bg-violet-50', onClick: () => navigate('/dashboard/owner/pitches') },
    { label: 'Cần xử lý', value: data.pendingBookings + data.lowStockServices, note: `${data.pendingBookings} đơn, ${data.lowStockServices} tồn kho`, icon: AlertCircle, color: 'text-amber-600 bg-amber-50', onClick: () => navigate('/dashboard/owner/bookings') },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">TỔNG QUAN VẬN HÀNH</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Dashboard chủ sân</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">Theo dõi doanh thu, lịch đặt, hiệu suất sân và các việc cần xử lý trong ngày.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">Hôm nay: {dateLabel}</span>
          <button type="button" onClick={fetchDashboard} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button key={item.label} type="button" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} onClick={item.onClick} className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:shadow-md">
              <div className="mb-3 flex items-center justify-between"><div className={`rounded-lg p-2 ${item.color}`}><Icon size={20} /></div></div>
              <p className="text-xs font-semibold text-slate-600">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{item.note}</p>
            </motion.button>
          );
        })}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Khuyến nghị vận hành</h2>
          <p className="text-sm text-slate-600">Những việc nên xử lý dựa trên dữ liệu hiện tại.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {data.recommendations.slice(0, 3).map((item) => (
            <button key={item.title} type="button" onClick={() => item.actionPath && navigate(item.actionPath)} className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50 hover:shadow-sm">
              <div className="flex gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${item.type === 'priority' ? 'bg-red-50 text-red-600' : item.type === 'success' ? 'bg-emerald-50 text-emerald-600' : item.type === 'suggestion' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                  {item.type === 'priority' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.description}</p>
                  {item.actionText && <p className="mt-2 text-xs font-bold text-blue-600">{item.actionText}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div><h2 className="text-lg font-bold text-slate-900">Doanh thu 7 ngày</h2><p className="text-sm text-slate-600">So sánh tuần này với tuần trước</p></div>
            <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${weekChange >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              <ArrowUpRight size={14} /> {Math.abs(weekChange)}%
            </span>
          </div>
          <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />Tuần này: <b className="text-slate-800">{shortMoney(currentWeekTotal)}đ</b></span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />Tuần trước: <b className="text-slate-800">{shortMoney(previousWeekTotal)}đ</b></span>
          </div>
          <div className="flex h-72 items-end gap-3 border-b border-slate-100 pb-4">
            {data.weeklyRevenue.map((item) => {
              const p = item.date.split('-');
              const previousHeight = Math.max((item.previous / maxChartValue) * 100, item.previous > 0 ? 4 : 0);
              const currentHeight = Math.max((item.current / maxChartValue) * 100, item.current > 0 ? 4 : 0);
              return (
                <div key={item.date} className="flex h-full flex-1 flex-col justify-end gap-2">
                  <div className="flex flex-1 items-end justify-center gap-1">
                    <div className="w-3 rounded-t bg-slate-300" style={{ height: `${previousHeight}%` }} />
                    <div className="w-3 rounded-t bg-blue-600" style={{ height: `${currentHeight}%` }} />
                  </div>
                  <p className="text-center text-[10px] font-semibold text-slate-400">{p[2]}/{p[1]}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-slate-600">Mục tiêu tháng</span><span className="font-bold text-slate-900">{money(data.monthRevenue)} / {money(data.monthTarget)}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${monthPercent}%` }} /></div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-bold text-slate-900">Đơn đặt gần đây</h2><p className="text-sm text-slate-600">Các lịch đặt mới nhất của trung tâm</p></div>
          <div className="divide-y divide-slate-100">
            {data.recentBookings.length === 0 ? <div className="px-5 py-12 text-center"><Calendar className="mx-auto text-slate-300" size={42} /><p className="mt-3 text-sm font-bold text-slate-700">Chưa có đơn đặt sân</p></div> : data.recentBookings.map((booking) => (
              <article key={booking.id} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">{initials(booking.customerName)}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{booking.customerName}</p><p className="mt-1 truncate text-xs font-semibold text-slate-500">{booking.pitchName} · {booking.startTime}{booking.endTime ? ` - ${booking.endTime}` : ''}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-slate-900">{money(booking.totalAmount)}</p><span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(booking.status)}`}>{statusLabel(booking.status)}</span></div>
              </article>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-4"><button type="button" onClick={() => navigate('/dashboard/owner/bookings')} className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">Xem tất cả đơn <ChevronRight size={16} /></button></div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4"><h2 className="text-lg font-bold text-slate-900">Phân bổ khung giờ</h2><p className="text-sm text-slate-600">Tỷ lệ lấp đầy theo từng khung giờ hôm nay</p></div>
          <div className="space-y-3">
            {data.timeSlots.map((slot) => <div key={slot.hour} className="grid grid-cols-[70px_1fr_48px] items-center gap-3"><span className="text-xs font-bold text-slate-500">{slot.hour}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${slot.rate >= 80 ? 'bg-emerald-500' : slot.rate >= 40 ? 'bg-blue-500' : 'bg-slate-300'}`} style={{ width: `${slot.rate}%` }} /></div><span className="text-right text-xs font-bold text-slate-700">{slot.rate}%</span></div>)}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-lg font-bold text-slate-900">Hiệu năng từng sân</h2><p className="text-sm text-slate-600">Theo dõi lấp đầy và doanh thu từng sân</p></div><button type="button" onClick={() => navigate('/dashboard/owner/pitches')} className="text-sm font-bold text-blue-600 hover:text-blue-700">Quản lý sân</button></div>
          <div className="divide-y divide-slate-100">
            {data.pitchStats.length === 0 ? <p className="px-5 py-10 text-center text-sm font-semibold text-slate-400">Chưa có dữ liệu sân</p> : data.pitchStats.map((pitch) => {
              const active = normalizeStatus(pitch.status) === 'active';
              return <article key={pitch.pitchId} className="grid gap-3 px-5 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_120px_120px_100px] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{pitch.pitchName}</p><p className="mt-1 text-xs font-semibold text-slate-500">{pitchTypeLabel(pitch.pitchType)}</p></div><div><span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{active ? 'Đang hoạt động' : 'Tạm ngưng'}</span></div><div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${pitch.occupancyRate}%` }} /></div><p className="mt-1 text-xs font-bold text-slate-500">{pitch.occupancyRate}% lấp đầy</p></div><p className="text-sm font-bold text-slate-900 sm:text-right">{money(pitch.revenue)}</p></article>;
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[{ title: 'Quản lý lịch đặt', desc: 'Xem đơn, xác nhận cọc và xử lý trạng thái.', icon: Calendar, path: '/dashboard/owner/bookings' }, { title: 'Quản lý dịch vụ', desc: 'Theo dõi tồn kho và dịch vụ phát sinh.', icon: Package, path: '/dashboard/owner/services' }, { title: 'Bảo trì sân', desc: 'Kiểm tra sân tạm ngưng và chất lượng vận hành.', icon: Wrench, path: '/dashboard/owner/pitches' }].map((item) => {
          const Icon = item.icon;
          return <button key={item.title} type="button" onClick={() => navigate(item.path)} className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50 hover:shadow-sm"><div className="mb-3 w-fit rounded-lg bg-blue-50 p-2 text-blue-600"><Icon size={20} /></div><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.desc}</p></button>;
        })}
      </section>

      {data.avgRating > 0 && <section className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-slate-900">Chất lượng trung tâm</h2><p className="text-sm text-slate-600">Đánh giá trung bình từ khách hàng</p></div><div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-amber-700"><Star size={20} fill="currentColor" /><span className="text-xl font-black">{data.avgRating.toFixed(1)}</span><span className="text-sm font-semibold">/ {data.ratingCount} đánh giá</span></div></div></section>}
    </div>
  );
};

export default Dashboard;
