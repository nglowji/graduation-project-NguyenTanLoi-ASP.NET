import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Loader2,
  MapPin,
  PlusCircle,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

type OwnerStats = {
  totalRevenue: number;
  totalBookings: number;
  newCustomers: number;
  averageRating: number;
  revenueChange: number;
  bookingsChange: number;
};

type BookingRow = {
  id: string;
  customerName?: string;
  customerPhone?: string;
  pitchName?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  totalAmount?: number;
  totalPrice?: number;
  status?: string;
};

type PitchRow = {
  id: string;
  name?: string;
  pitchType?: string;
  todayBookings?: number;
  todayRevenue?: number;
  averageRating?: number;
};
const pitchTypeLabel = (type?: string) => ({ '1': 'Bóng đá 5 người', Football5: 'Bóng đá 5 người', '2': 'Bóng đá 7 người', Football7: 'Bóng đá 7 người', '3': 'Bóng đá 11 người', Football11: 'Bóng đá 11 người', '4': 'Tennis', Tennis: 'Tennis', '5': 'Cầu lông', Badminton: 'Cầu lông', '6': 'Pickleball', Pickleball: 'Pickleball', '7': 'Bóng rổ', Basketball: 'Bóng rổ', '8': 'Bóng chuyền', Volleyball: 'Bóng chuyền', '9': 'Bóng bàn', TableTennis: 'Bóng bàn' }[String(type || '')] || 'Chưa phân loại');

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === 4;
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [pitches, setPitches] = useState<PitchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const requests: Array<Promise<unknown>> = [
        api.get('/bookings/owner', { params: { pageSize: 8 } }),
      ];

      if (!isStaff) {
        requests.push(api.get('/dashboard/owner/stats'));
        requests.push(api.get('/pitches/my'));
      }

      const [bookingRes, statsRes, pitchesRes] = await Promise.allSettled(requests);

      if (bookingRes.status === 'fulfilled') {
        const value = bookingRes.value as any;
        setBookings(Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : []);
      }

      if (statsRes?.status === 'fulfilled') setStats(statsRes.value as OwnerStats);
      if (pitchesRes?.status === 'fulfilled') setPitches(Array.isArray(pitchesRes.value) ? pitchesRes.value as PitchRow[] : []);
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

  const statusLabel = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('pending')) return 'Chờ cọc';
    if (normalized.includes('confirm')) return 'Đã xác nhận';
    if (normalized.includes('complete')) return 'Hoàn thành';
    if (normalized.includes('cancel')) return 'Đã hủy';
    return 'Đang xử lý';
  };

  const statusClass = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('confirm')) return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    if (normalized.includes('pending')) return 'bg-amber-50 text-amber-700 ring-amber-100';
    if (normalized.includes('cancel')) return 'bg-red-50 text-red-700 ring-red-100';
    return 'bg-blue-50 text-blue-700 ring-blue-100';
  };

  const bookingSummary = useMemo(() => {
    const pending = bookings.filter((item) => String(item.status || '').toLowerCase().includes('pending')).length;
    const confirmed = bookings.filter((item) => String(item.status || '').toLowerCase().includes('confirm')).length;
    const completed = bookings.filter((item) => String(item.status || '').toLowerCase().includes('complete')).length;
    return { pending, confirmed, completed };
  }, [bookings]);

  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const todayBookings = bookings.filter((item) => String(item.bookingDate || '').slice(0, 10) === todayKey);
  const cancelledBookings = bookings.filter((item) => String(item.status || '').toLowerCase().includes('cancel')).length;
  const todayRevenue = todayBookings.reduce((total, item) => total + Number(item.totalAmount ?? item.totalPrice ?? 0), 0);
  const inactivePitches = pitches.filter((item: any) => String(item.status || '').toLowerCase().includes('inactive')).length;

  const urgentTasks = [
    bookingSummary.pending > 0 && {
      id: 'pending',
      title: `${bookingSummary.pending} đơn đang chờ thanh toán cọc`,
      description: 'Theo dõi để tránh giữ chỗ quá lâu.',
      tone: 'amber',
      action: () => navigate('/dashboard/owner/bookings'),
    },
    bookingSummary.confirmed > 0 && {
      id: 'confirmed',
      title: `${bookingSummary.confirmed} đơn đã xác nhận cần chuẩn bị sân`,
      description: 'Kiểm tra lịch vận hành và nhân sự trực sân.',
      tone: 'blue',
      action: () => navigate('/dashboard/owner/bookings'),
    },
    inactivePitches > 0 && {
      id: 'inactive',
      title: `${inactivePitches} sân đang tạm ngưng hoạt động`,
      description: 'Cập nhật trạng thái nếu sân đã sẵn sàng nhận lịch.',
      tone: 'red',
      action: () => navigate('/dashboard/owner/pitches'),
    },
  ].filter(Boolean) as Array<{ id: string; title: string; description: string; tone: string; action: () => void }>;

  const actionBookings = bookings.filter((item) => {
    const status = String(item.status || '').toLowerCase();
    return status.includes('pending') || status.includes('confirm');
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={42} />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải tổng quan</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
              {isStaff ? 'Staff workspace' : 'Owner overview'}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Tổng quan vận hành</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
              {isStaff
                ? 'Theo dõi lịch đặt sân và xử lý các đơn trong phạm vi được phân quyền.'
                : 'Theo dõi doanh thu, đơn đặt, sân và những việc cần xử lý ngay hôm nay.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/owner/bookings')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Xem lịch đặt sân
                <ArrowRight size={17} />
              </button>
              {!isStaff && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/owner/revenue')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  Xem doanh thu
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-widest text-amber-700">Cần xử lý ngay</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Activity size={18} />
              </span>
            </div>
            <p className="mt-3 text-4xl font-black text-slate-950">{actionBookings.length}</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">Đơn chờ cọc hoặc đã xác nhận cần theo dõi.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-amber-200 bg-white p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Chờ cọc</p>
                <p className="mt-1 text-xl font-black text-slate-950">{bookingSummary.pending}</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-white p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Xác nhận</p>
                <p className="mt-1 text-xl font-black text-slate-950">{bookingSummary.confirmed}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Vận hành hôm nay</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">Nhịp hoạt động trong ngày</h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarCheck size={20} />
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Lịch hôm nay</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{todayBookings.length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">đơn đặt sân</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Doanh thu hôm nay</p>
              <p className="mt-2 text-xl font-black text-slate-950">{formatMoney(todayRevenue)}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">từ lịch hiện có</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Chờ cọc</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{bookingSummary.pending}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">đơn cần theo dõi</p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700">Đã hủy</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{cancelledBookings}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">trong danh sách gần đây</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Thao tác nhanh</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">Đi thẳng tới công việc</h2>
            </div>
            <CircleDollarSign className="text-blue-600" size={22} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { label: 'Lịch đặt sân', icon: CalendarCheck, path: '/dashboard/owner/bookings', ownerOnly: false },
              { label: 'Quản lý sân', icon: MapPin, path: '/dashboard/owner/pitches', ownerOnly: true },
              { label: 'Doanh thu', icon: Wallet, path: '/dashboard/owner/revenue', ownerOnly: true },
              { label: 'Thêm sân mới', icon: PlusCircle, path: '/dashboard/owner/pitches/create', ownerOnly: true },
            ].filter((item) => !item.ownerOnly || !isStaff).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex min-h-20 flex-col items-start justify-between rounded-xl border border-blue-100 bg-blue-50 p-3 text-left transition hover:border-blue-300 hover:bg-blue-100"
              >
                <item.icon size={18} className="text-blue-600" />
                <span className="text-xs font-black text-slate-800">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Ưu tiên xử lý</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Việc cần làm ngay</h2>
          </div>
          <BellRing className="text-blue-600" size={22} />
        </div>
        {urgentTasks.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <p className="text-sm font-bold text-emerald-800">Không có việc cấp thiết. Hoạt động đang ổn định.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {urgentTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={task.action}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition hover:shadow-sm ${
                  task.tone === 'amber'
                    ? 'border-amber-100 bg-amber-50 hover:border-amber-300'
                    : task.tone === 'red'
                      ? 'border-red-100 bg-red-50 hover:border-red-300'
                      : 'border-blue-100 bg-blue-50 hover:border-blue-300'
                }`}
              >
                <AlertTriangle size={18} className={task.tone === 'amber' ? 'text-amber-600' : task.tone === 'red' ? 'text-red-600' : 'text-blue-600'} />
                <span>
                  <span className="block text-sm font-black text-slate-900">{task.title}</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{task.description}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {!isStaff && (
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Wallet size={22} /></span>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Doanh thu</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{formatMoney(stats?.totalRevenue)}</p>
            <p className="mt-1 text-xs font-bold text-blue-600">{stats?.revenueChange || 0}% so với kỳ trước</p>
          </div>
        )}
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarCheck size={22} /></span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn gần đây</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{stats?.totalBookings ?? bookings.length}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{bookingSummary.completed} đơn hoàn thành</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Clock size={22} /></span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang xử lý</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{actionBookings.length}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">Đơn cần theo dõi ngay</p>
        </div>
        {!isStaff && (
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Star size={22} /></span>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đánh giá</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{Number(stats?.averageRating || 0).toFixed(1)}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">{stats?.newCustomers || 0} khách hàng mới</p>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Lịch đặt sân gần đây</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Thông tin quan trọng để xử lý nhanh.</p>
            </div>
            <Activity className="text-blue-600" size={22} />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {bookings.length === 0 ? (
              <div className="p-10 text-center text-sm font-bold text-slate-400">Chưa có đơn đặt sân.</div>
            ) : bookings.map((booking) => (
              <div key={booking.id} className="grid gap-3 p-4 transition hover:bg-blue-50/50 md:grid-cols-[minmax(0,1fr)_170px_120px] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-white">{booking.customerName || 'Khách hàng'}</p>
                  <p className="mt-1 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                    <span>{booking.pitchName || 'Sân thể thao'}</span>
                    <span>{formatDate(booking.bookingDate)}</span>
                    <span>{booking.startTime?.substring(0, 5)} - {booking.endTime?.substring(0, 5)}</span>
                  </p>
                </div>
                <p className="text-sm font-black text-slate-950 dark:text-white">{formatMoney(booking.totalAmount ?? booking.totalPrice)}</p>
                <span className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-[10px] font-black uppercase tracking-widest ring-1 ${statusClass(booking.status)}`}>
                  {statusLabel(booking.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">{isStaff ? 'Quyền nhân viên' : 'Sân nổi bật'}</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">{isStaff ? 'Các phạm vi được phép thao tác.' : 'Tình hình sân của bạn.'}</p>
            </div>
            <TrendingUp className="text-emerald-600" size={22} />
          </div>

          {isStaff ? (
            <div className="space-y-3">
              {['Xem tổng quan vận hành', 'Xác nhận và hủy lịch đặt sân', 'Phản hồi đánh giá khách hàng'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <CheckCircle2 size={17} className="text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          ) : pitches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">Chưa có sân.</div>
          ) : (
            <div className="space-y-3">
              {pitches.slice(0, 5).map((pitch) => (
                <div key={pitch.id} className="flex items-center justify-between gap-4 rounded-xl border border-blue-50 bg-blue-50/60 p-3 transition hover:border-blue-200 dark:bg-slate-800">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">{pitchTypeLabel(pitch.pitchType)}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-400">
                      <MapPin size={12} />
                      {pitch.todayBookings || 0} đơn hôm nay
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-black text-blue-600">{formatMoney(pitch.todayRevenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OwnerDashboard;
