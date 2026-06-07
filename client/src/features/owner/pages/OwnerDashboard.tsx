import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck2, CheckCheck, Clock3, Loader2, MessageSquareReply, Sparkles, Star, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { getReadNotificationIds, saveReadNotificationIds } from '../../../utils/notifications';

type Booking = { id: string; customerName?: string; bookingDate?: string; startTime?: string; endTime?: string; status?: string; totalAmount?: number; totalPrice?: number; pitchType?: string; timeSlot?: { pitch?: { type?: string } } };
type Review = { id: string; userName: string; pitchType?: string; rating: number; comment?: string; reply?: string; createdAt: string };
type Revenue = { summary?: { totalRevenue: number; totalBookings: number; activePitches: number; occupancyRate: number }; recentBookings?: Array<{ id: string; userName: string; pitchType: string; bookingDate: string; timeRange: string; totalPrice: number; status: string }>; topCustomers?: Array<{ userId: string; userName: string; bookings: number; totalSpent: number; favoritePitchType?: string }>; pitchRevenue?: Array<{ pitchType: string; revenue: number; bookings: number }> };
type Stats = { totalRevenue: number; totalBookings: number; averageRating: number };

const sportLabel = (type?: string) => ({ Football5: 'Bóng đá 5 người', Football7: 'Bóng đá 7 người', Football11: 'Bóng đá 11 người', Tennis: 'Tennis', Badminton: 'Cầu lông', Pickleball: 'Pickleball', Basketball: 'Bóng rổ', Volleyball: 'Bóng chuyền', TableTennis: 'Bóng bàn', '1': 'Bóng đá 5 người', '2': 'Bóng đá 7 người', '3': 'Bóng đá 11 người', '4': 'Tennis', '5': 'Cầu lông', '6': 'Pickleball', '7': 'Bóng rổ', '8': 'Bóng chuyền', '9': 'Bóng bàn' } as Record<string, string>)[String(type || '')] || 'Thể thao';
const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const statusLabel = (status?: string) => { const value = String(status || '').toLowerCase(); if (value.includes('pending')) return 'Chờ cọc'; if (value.includes('confirm')) return 'Đã xác nhận'; if (value.includes('complete')) return 'Hoàn thành'; if (value.includes('cancel')) return 'Đã hủy'; return 'Đang xử lý'; };

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
      api.get('/dashboard/owner/revenue', { params: { fromDate: '2000-01-01', toDate: new Date().toISOString().slice(0, 10) } }),
      api.get('/dashboard/owner/stats'),
    ]).then(([bookingResult, reviewResult, revenueResult, statsResult]) => {
      if (bookingResult.status === 'fulfilled') { const value: any = bookingResult.value; setBookings(Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : []); }
      if (reviewResult.status === 'fulfilled') setReviews((Array.isArray(reviewResult.value) ? reviewResult.value as Review[] : []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      if (revenueResult.status === 'fulfilled') setRevenue(revenueResult.value as Revenue);
      if (statsResult.status === 'fulfilled') setStats(statsResult.value as unknown as Stats);
    }).finally(() => setLoading(false));
  }, []);

  const reminders = useMemo(() => {
    const pending = bookings.filter((item) => String(item.status).toLowerCase().includes('pending')).length;
    const confirmed = bookings.filter((item) => String(item.status).toLowerCase().includes('confirm')).length;
    const unanswered = reviews.filter((item) => !item.reply).length;
    return [
      { label: 'Chờ thanh toán cọc', value: pending, detail: 'Kiểm tra các slot sắp hết thời gian giữ chỗ.', tone: 'border-amber-200 bg-amber-50 text-amber-950', iconTone: 'bg-amber-400 text-amber-950', path: '/dashboard/owner/bookings', icon: Clock3 },
      { label: 'Lịch đã xác nhận', value: confirmed, detail: 'Chuẩn bị sân và nhân sự cho lịch sắp tới.', tone: 'border-blue-200 bg-blue-50 text-blue-950', iconTone: 'bg-blue-600 text-white', path: '/dashboard/owner/bookings', icon: CalendarCheck2 },
      { label: 'Đánh giá chưa phản hồi', value: unanswered, detail: 'Trả lời khách hàng để duy trì trải nghiệm tốt.', tone: 'border-rose-200 bg-rose-50 text-rose-950', iconTone: 'bg-rose-500 text-white', path: '/dashboard/owner/reviews', icon: MessageSquareReply },
    ];
  }, [bookings, reviews]);

  const topTypes = useMemo(() => Array.from((revenue.pitchRevenue || []).reduce((map, item) => {
    const label = sportLabel(item.pitchType); const current = map.get(label) || { label, bookings: 0, revenue: 0 };
    current.bookings += Number(item.bookings); current.revenue += Number(item.revenue); map.set(label, current); return map;
  }, new Map<string, { label: string; bookings: number; revenue: number }>()).values()).sort((a, b) => b.bookings - a.bookings).slice(0, 3), [revenue.pitchRevenue]);
  const unreadCount = bookings.slice(0, 5).filter((item) => !readIds.includes(item.id)).length;
  const markRead = (id: string) => setReadIds(saveReadNotificationIds([...readIds, id]));
  const markAllRead = () => setReadIds(saveReadNotificationIds([...readIds, ...bookings.slice(0, 5).map((item) => item.id)]));

  if (loading) return <div className="flex min-h-[500px] items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={42} /></div>;

  return <main className="mx-auto flex max-w-[1500px] flex-col gap-6 pb-16">
    <section className="-order-1">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-blue-600"><Sparkles size={15} /> Ưu tiên hôm nay</p><h2 className="mt-2 text-2xl font-black text-slate-950">Việc cần xử lý trước</h2></div><p className="text-xs font-bold text-slate-400">Cập nhật theo dữ liệu vận hành hiện tại</p></div>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.9fr_1.05fr]">{reminders.map((item, index) => { const Icon = item.icon; return <button key={item.label} onClick={() => navigate(item.path)} className={`group relative min-h-[190px] overflow-hidden rounded-2xl border p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg ${item.tone}`}>
        {item.value > 0 && <span className="absolute right-4 top-4 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600 shadow-sm">Mới</span>}
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${item.iconTone}`}><Icon size={21} /></span>
        <p className="mt-6 text-4xl font-black">{item.value}</p><p className="mt-1 text-sm font-black">{item.label}</p>
        <div className="mt-4 flex items-end justify-between gap-3"><p className="max-w-[30ch] text-xs font-semibold leading-5 opacity-70">{item.detail}</p><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white transition group-hover:translate-x-1"><ArrowRight size={16} /></span></div>
        {index === 0 && <span className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full border-[14px] border-amber-200/60" />}
      </button>; })}</div>
    </section>

    <section className="order-3 overflow-hidden rounded-2xl border border-blue-500 bg-blue-700 p-6 text-white shadow-xl shadow-blue-950/15">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Trung tâm vận hành</p><h1 className="mt-3 text-3xl font-black">Tổng quan chủ sân</h1><p className="mt-2 text-sm font-semibold text-blue-100">Thông tin cần biết và việc cần làm, theo thứ tự ưu tiên.</p></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/10 px-4 py-3"><b className="block text-xl">{stats?.totalBookings || 0}</b><span className="text-[10px] font-black uppercase text-blue-100">Đơn đặt</span></div><div className="rounded-xl bg-white/10 px-4 py-3"><b className="block text-xl">{Number(stats?.averageRating || 0).toFixed(1)}</b><span className="text-[10px] font-black uppercase text-blue-100">Điểm sao</span></div><div className="rounded-xl bg-white/10 px-4 py-3"><b className="block text-xl">{money(stats?.totalRevenue)}</b><span className="text-[10px] font-black uppercase text-blue-100">Doanh thu</span></div></div></div>
    </section>

    <section className="rounded-2xl border border-blue-100 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-blue-50 p-5"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Lịch đặt sân mới nhất</p><h2 className="mt-1 text-xl font-black">{unreadCount} thông báo chưa đọc</h2></div><button type="button" onClick={markAllRead} disabled={!unreadCount} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black text-white disabled:opacity-40"><CheckCheck size={16} />Đánh dấu tất cả đã đọc</button></div><div className="divide-y divide-slate-100">{bookings.slice(0, 5).map((item) => { const read = readIds.includes(item.id); return <button key={item.id} onClick={() => { markRead(item.id); navigate('/dashboard/owner/bookings'); }} className={`grid w-full gap-2 p-4 text-left transition hover:bg-blue-50 sm:grid-cols-[1fr_160px_120px] sm:items-center ${read ? 'bg-white' : 'bg-cyan-50/70'}`}><div><p className="flex items-center gap-2 text-sm font-black">{!read && <span className="h-2 w-2 rounded-full bg-blue-600" />}{sportLabel(item.pitchType ?? item.timeSlot?.pitch?.type)}</p><p className="mt-1 text-xs font-bold text-slate-400">{item.customerName || 'Khách hàng'} · {item.bookingDate} · {String(item.startTime || '').slice(0, 5)} - {String(item.endTime || '').slice(0, 5)}</p></div><span className="text-sm font-black">{money(item.totalAmount ?? item.totalPrice)}</span><span className="text-xs font-black text-blue-700">{read ? 'Đã đọc' : statusLabel(item.status)}</span></button>; })}</div></section>

    <section className="order-4 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Đánh giá mới</h2><p className="mt-1 text-xs font-bold text-slate-400">Phản hồi gần nhất từ khách hàng</p></div><button onClick={() => navigate('/dashboard/owner/reviews')} className="text-xs font-black text-blue-700">Xem tất cả</button></div><div className="mt-4 divide-y divide-slate-100">{reviews.slice(0, 4).map((review) => <div key={review.id} className="py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black">{review.userName} · {sportLabel(review.pitchType)}</p><span className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}</span></div><p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-500">{review.comment || 'Không có nhận xét.'}</p></div>)}</div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Users className="text-blue-600" /><h2 className="text-xl font-black">Top khách hàng</h2></div><div className="mt-4 space-y-3">{(revenue.topCustomers || []).slice(0, 3).map((item, index) => <div key={item.userId} className={`flex items-center gap-3 rounded-xl border p-3 ${index === 0 ? 'border-amber-200 bg-amber-50' : index === 1 ? 'border-slate-200 bg-slate-50' : 'border-orange-200 bg-orange-50'}`}><span className="grid h-9 w-9 place-items-center rounded-lg bg-white font-black">#{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.userName}</p><p className="text-xs font-bold text-slate-500">{item.bookings} đơn · {money(item.totalSpent)}</p></div></div>)}</div></div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Trophy className="text-amber-500" /><h2 className="text-xl font-black">Top 3 loại sân</h2></div><div className="mt-4 grid gap-3 md:grid-cols-3">{topTypes.map((item, index) => <div key={item.label} className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-black uppercase tracking-widest text-blue-600">Hạng {index + 1}</p><p className="mt-2 text-lg font-black">{item.label}</p><p className="mt-3 text-xs font-bold text-slate-500">{item.bookings} đơn · {money(item.revenue)}</p></div>)}</div></section>
  </main>;
};

export default OwnerDashboard;
