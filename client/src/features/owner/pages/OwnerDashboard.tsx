import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarCheck2,
  CheckCheck,
  Clock3,
  ClipboardList,
  Loader2,
  MessageSquareReply,
  Star,
  Trophy,
  Users,
  WalletCards,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { getReadNotificationIds, saveReadNotificationIds } from '../../../utils/notifications';

type Booking = {
  id: string;
  customerName?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  totalAmount?: number;
  totalPrice?: number;
  pitchType?: string;
  timeSlot?: { pitch?: { type?: string } };
};

type Review = {
  id: string;
  userName: string;
  pitchType?: string;
  rating: number;
  comment?: string;
  reply?: string;
  createdAt: string;
};

type Revenue = {
  summary?: {
    totalRevenue: number;
    totalBookings: number;
    activePitches: number;
    occupancyRate: number;
  };
  topCustomers?: Array<{
    userId: string;
    userName: string;
    bookings: number;
    totalSpent: number;
    favoritePitchType?: string;
  }>;
  pitchRevenue?: Array<{ pitchType: string; revenue: number; bookings: number }>;
};

type Stats = {
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
};

const sportLabel = (type?: string) =>
  ({
    Football5: 'Bóng đá 5 người',
    Football7: 'Bóng đá 7 người',
    Football11: 'Bóng đá 11 người',
    Tennis: 'Tennis',
    Badminton: 'Cầu lông',
    Pickleball: 'Pickleball',
    Basketball: 'Bóng rổ',
    Volleyball: 'Bóng chuyền',
    TableTennis: 'Bóng bàn',
    '1': 'Bóng đá 5 người',
    '2': 'Bóng đá 7 người',
    '3': 'Bóng đá 11 người',
    '4': 'Tennis',
    '5': 'Cầu lông',
    '6': 'Pickleball',
    '7': 'Bóng rổ',
    '8': 'Bóng chuyền',
    '9': 'Bóng bàn',
  } as Record<string, string>)[String(type || '')] || 'Thể thao';

const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const statusLabel = (status?: string) => {
  const value = String(status || '').toLowerCase();
  if (value.includes('pending')) return 'Chờ cọc';
  if (value.includes('confirm')) return 'Đã xác nhận';
  if (value.includes('complete')) return 'Hoàn thành';
  if (value.includes('cancel')) return 'Đã hủy';
  return 'Đang xử lý';
};

const statusClass = (status?: string) => {
  const value = String(status || '').toLowerCase();
  if (value.includes('pending')) return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (value.includes('confirm')) return 'bg-blue-50 text-blue-700 ring-blue-200';
  if (value.includes('complete')) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (value.includes('cancel')) return 'bg-rose-50 text-rose-700 ring-rose-200';
  return 'bg-slate-50 text-slate-600 ring-slate-200';
};

const shortTime = (time?: string) => String(time || '').slice(0, 5) || '--:--';

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
    <p className="text-sm font-black text-slate-700">{title}</p>
    <p className="mt-1 text-xs font-semibold text-slate-400">{description}</p>
  </div>
);

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [revenue, setRevenue] = useState<Revenue>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<string[]>(() => getReadNotificationIds());

  useEffect(() => {
    Promise.allSettled([
      api.get('/bookings/owner', { params: { pageSize: 20 } }),
      api.get('/owner/reviews'),
      api.get('/dashboard/owner/revenue', {
        params: { fromDate: '2000-01-01', toDate: new Date().toISOString().slice(0, 10) },
      }),
      api.get('/dashboard/owner/stats'),
    ])
      .then(([bookingResult, reviewResult, revenueResult, statsResult]) => {
        if (bookingResult.status === 'fulfilled') {
          const value = bookingResult.value as { items?: Booking[] } | Booking[];
          setBookings(Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : []);
        }

        if (reviewResult.status === 'fulfilled') {
          const value = Array.isArray(reviewResult.value) ? (reviewResult.value as Review[]) : [];
          setReviews(value.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }

        if (revenueResult.status === 'fulfilled') setRevenue(revenueResult.value as Revenue);
        if (statsResult.status === 'fulfilled') setStats(statsResult.value as unknown as Stats);
      })
      .finally(() => setLoading(false));
  }, []);

  const actionItems = useMemo(() => {
    const pending = bookings.filter((item) => String(item.status).toLowerCase().includes('pending')).length;
    const confirmed = bookings.filter((item) => String(item.status).toLowerCase().includes('confirm')).length;
    const unanswered = reviews.filter((item) => !item.reply).length;

    return [
      {
        label: 'Chờ thanh toán cọc',
        value: pending,
        detail: 'Kiểm tra các đơn giữ sân chưa hoàn tất thanh toán.',
        path: '/dashboard/owner/bookings',
        icon: Clock3,
        tone: 'bg-amber-50 text-amber-700 ring-amber-200',
      },
      {
        label: 'Lịch đã xác nhận',
        value: confirmed,
        detail: 'Chuẩn bị sân và nhân sự cho lịch sắp tới.',
        path: '/dashboard/owner/bookings',
        icon: CalendarCheck2,
        tone: 'bg-blue-50 text-blue-700 ring-blue-200',
      },
      {
        label: 'Đánh giá chưa phản hồi',
        value: unanswered,
        detail: 'Trả lời khách hàng để giữ trải nghiệm tốt.',
        path: '/dashboard/owner/reviews',
        icon: MessageSquareReply,
        tone: 'bg-rose-50 text-rose-700 ring-rose-200',
      },
    ];
  }, [bookings, reviews]);

  const topTypes = useMemo(() => {
    const grouped = (revenue.pitchRevenue || []).reduce((map, item) => {
      const label = sportLabel(item.pitchType);
      const current = map.get(label) || { label, bookings: 0, revenue: 0 };
      current.bookings += Number(item.bookings || 0);
      current.revenue += Number(item.revenue || 0);
      map.set(label, current);
      return map;
    }, new Map<string, { label: string; bookings: number; revenue: number }>());

    return Array.from(grouped.values()).sort((a, b) => b.bookings - a.bookings).slice(0, 3);
  }, [revenue.pitchRevenue]);

  const recentBookings = bookings.slice(0, 5);
  const unreadCount = recentBookings.filter((item) => !readIds.includes(item.id)).length;
  const totalBookings = stats?.totalBookings ?? revenue.summary?.totalBookings ?? 0;
  const totalRevenue = stats?.totalRevenue ?? revenue.summary?.totalRevenue ?? 0;
  const averageRating = Number(stats?.averageRating || 0).toFixed(1);

  const markRead = (id: string) => setReadIds(saveReadNotificationIds([...readIds, id]));
  const markAllRead = () => setReadIds(saveReadNotificationIds([...readIds, ...recentBookings.map((item) => item.id)]));

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={42} />
      </div>
    );
  }

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 pb-16">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Trung tâm vận hành</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Tổng quan</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Theo dõi doanh thu, lịch đặt sân và các việc cần xử lý trong ngày.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/owner/bookings')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
          >
            Xem lịch đặt sân
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Doanh thu</span>
              <WalletCards size={18} className="text-emerald-600" />
            </div>
            <p className="mt-3 text-2xl font-black text-slate-950">{money(totalRevenue)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Đơn đặt</span>
              <ClipboardList size={18} className="text-blue-600" />
            </div>
            <p className="mt-3 text-2xl font-black text-slate-950">{totalBookings}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Đánh giá</span>
              <Star size={18} className="text-amber-500" />
            </div>
            <p className="mt-3 text-2xl font-black text-slate-950">{averageRating}/5</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Sân hoạt động</span>
              <Trophy size={18} className="text-indigo-600" />
            </div>
            <p className="mt-3 text-2xl font-black text-slate-950">{revenue.summary?.activePitches ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">Ưu tiên hôm nay</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Việc cần xử lý trước</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
              {actionItems.reduce((sum, item) => sum + item.value, 0)} việc
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {actionItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="group grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${item.tone}`}>
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-950">{item.label}</span>
                    <span className="mt-1 block truncate text-xs font-semibold text-slate-500">{item.detail}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <b className="text-xl font-black text-slate-950">{item.value}</b>
                    <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">Lịch đặt sân mới nhất</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{unreadCount} thông báo chưa đọc</h2>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={!unreadCount}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck size={16} />
              Đánh dấu đã đọc
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentBookings.length ? (
              recentBookings.map((item) => {
                const read = readIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      markRead(item.id);
                      navigate('/dashboard/owner/bookings');
                    }}
                    className={`grid w-full gap-3 p-4 text-left transition hover:bg-blue-50 md:grid-cols-[minmax(0,1fr)_150px_120px] md:items-center ${
                      read ? 'bg-white' : 'bg-cyan-50/70'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-black text-slate-950">
                        {!read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                        {sportLabel(item.pitchType ?? item.timeSlot?.pitch?.type)}
                      </span>
                      <span className="mt-1 block truncate text-xs font-bold text-slate-400">
                        {item.customerName || 'Khách hàng'} · {item.bookingDate || 'Chưa có ngày'} · {shortTime(item.startTime)} - {shortTime(item.endTime)}
                      </span>
                    </span>
                    <span className="text-sm font-black text-slate-950">{money(item.totalAmount ?? item.totalPrice)}</span>
                    <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-black ring-1 ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-5">
                <EmptyState title="Chưa có lịch đặt mới" description="Khi khách đặt sân, thông tin sẽ xuất hiện tại đây." />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">Đánh giá mới</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Phản hồi gần nhất từ khách hàng</p>
            </div>
            <button type="button" onClick={() => navigate('/dashboard/owner/reviews')} className="text-xs font-black text-blue-700">
              Xem tất cả
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {reviews.length ? (
              reviews.slice(0, 4).map((review) => (
                <div key={review.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-black text-slate-950">
                      {review.userName} · {sportLabel(review.pitchType)}
                    </p>
                    <span className="flex shrink-0 gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                    {review.comment || 'Khách hàng chưa để lại nhận xét.'}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState title="Chưa có đánh giá" description="Các đánh giá mới của khách hàng sẽ hiển thị tại đây." />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={22} />
            <h2 className="text-xl font-black text-slate-950">Top khách hàng</h2>
          </div>

          <div className="mt-4 space-y-3">
            {revenue.topCustomers?.length ? (
              revenue.topCustomers.slice(0, 3).map((item, index) => (
                <div key={item.userId} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-sm font-black text-blue-700 ring-1 ring-slate-200">
                    #{index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">{item.userName}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-500">
                      {item.bookings} đơn · {money(item.totalSpent)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Chưa có dữ liệu khách hàng" description="Dữ liệu sẽ được cập nhật sau khi có đơn hoàn tất." />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={22} />
            <h2 className="text-xl font-black text-slate-950">Top loại sân</h2>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Theo số đơn đặt</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {topTypes.length ? (
            topTypes.map((item, index) => (
              <div key={item.label} className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">Hạng {index + 1}</p>
                <p className="mt-2 text-lg font-black text-slate-950">{item.label}</p>
                <p className="mt-3 text-xs font-bold text-slate-500">
                  {item.bookings} đơn · {money(item.revenue)}
                </p>
              </div>
            ))
          ) : (
            <div className="md:col-span-3">
              <EmptyState title="Chưa có loại sân nổi bật" description="Bảng xếp hạng sẽ xuất hiện khi có dữ liệu doanh thu." />
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default OwnerDashboard;
