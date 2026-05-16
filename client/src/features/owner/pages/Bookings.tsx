import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Flag,
  Loader2,
  MapPin,
  Phone,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import api from '../../../services/api';

type BookingRow = {
  id: string;
  customerName?: string;
  customerPhone?: string;
  user?: {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
  };
  pitchName?: string;
  timeSlot?: {
    startTime?: string;
    endTime?: string;
    pitch?: {
      name?: string;
      type?: string;
      address?: string;
    };
  };
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  totalAmount?: number;
  totalPrice?: number;
  depositAmount?: number;
  status?: string;
  checkInCode?: string;
};

const tabs = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pendingdeposit', label: 'Chờ cọc' },
  { id: 'confirmed', label: 'Đã xác nhận' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
];

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [tab, setTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [tab]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = tab === 'all' ? {} : { status: tab };
      const res = await api.get('/bookings/owner', { params }) as any;
      setBookings(Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa đơn đặt sân này?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchBookings();
    } catch {
      alert('Không thể xóa đơn đặt sân này');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const normalized = newStatus.toLowerCase();
      if (normalized === 'confirmed') {
        await api.patch(`/bookings/${id}/confirm`);
      } else if (normalized === 'completed') {
        await api.patch(`/bookings/${id}/complete`);
      } else if (normalized === 'cancelled') {
        await api.patch(`/bookings/${id}/cancel`, { reason: 'Owner cancelled booking' });
      }
      fetchBookings();
    } catch {
      alert('Không thể cập nhật trạng thái');
    }
  };

  const getCustomerName = (booking: BookingRow) =>
    booking.customerName || booking.user?.fullName || 'Khách hàng';

  const getCustomerPhone = (booking: BookingRow) =>
    booking.customerPhone || booking.user?.phoneNumber || booking.user?.email || 'Chưa có liên hệ';

  const getPitchName = (booking: BookingRow) =>
    booking.pitchName || booking.timeSlot?.pitch?.name || 'Sân thể thao';

  const getPitchAddress = (booking: BookingRow) =>
    booking.timeSlot?.pitch?.address || 'Chưa cập nhật địa chỉ';

  const getStartTime = (booking: BookingRow) =>
    (booking.startTime || booking.timeSlot?.startTime || '--:--').substring(0, 5);

  const getEndTime = (booking: BookingRow) =>
    (booking.endTime || booking.timeSlot?.endTime || '--:--').substring(0, 5);

  const formatDate = (value?: string) => {
    if (!value) return '--/--/----';
    const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
  };

  const formatMoney = (value?: number) =>
    `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const getTotal = (booking: BookingRow) =>
    Number(booking.totalAmount ?? booking.totalPrice ?? 0);

  const getDeposit = (booking: BookingRow) =>
    Number(booking.depositAmount ?? 0);

  const getStatusLabel = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('pending')) return 'Chờ cọc';
    if (normalized.includes('confirm')) return 'Đã xác nhận';
    if (normalized.includes('complete')) return 'Hoàn thành';
    if (normalized.includes('cancel')) return 'Đã hủy';
    if (normalized.includes('noshow')) return 'Không đến';
    return 'Khác';
  };

  const getStatusClass = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('confirm')) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100';
    if (normalized.includes('complete')) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-100';
    if (normalized.includes('pending')) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-100';
    if (normalized.includes('cancel') || normalized.includes('noshow')) return 'bg-red-50 text-red-700 ring-1 ring-red-100';
    return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  };

  const filteredBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return bookings;

    return bookings.filter((booking) =>
      [
        getCustomerName(booking),
        getCustomerPhone(booking),
        getPitchName(booking),
        booking.checkInCode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [bookings, searchTerm]);

  const counts = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => String(b.status || '').toLowerCase().includes('pending')).length;
    const confirmed = bookings.filter((b) => String(b.status || '').toLowerCase().includes('confirm')).length;
    return { total, pending, confirmed };
  }, [bookings]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Owner schedule</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Lịch đặt sân</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Theo dõi đơn, cọc, khung giờ và trạng thái xử lý trong một màn hình.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="px-4 py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng đơn</p>
            <p className="text-xl font-black text-slate-950 dark:text-white">{counts.total}</p>
          </div>
          <div className="px-4 py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chờ cọc</p>
            <p className="text-xl font-black text-amber-600">{counts.pending}</p>
          </div>
          <div className="px-4 py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Xác nhận</p>
            <p className="text-xl font-black text-emerald-600">{counts.confirmed}</p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition ${
                  tab === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative w-full xl:w-[360px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm khách, sân, mã đơn..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={38} />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang đồng bộ lịch đặt</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <CalendarDays size={52} className="mb-4 text-slate-200" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Không có đơn phù hợp</h3>
            <p className="mt-2 text-sm font-semibold text-slate-400">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredBookings.map((booking) => {
              const isExpanded = expandedBookingId === booking.id;

              return (
                <div key={booking.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <div className="grid gap-4 p-4 xl:grid-cols-[minmax(210px,1fr)_minmax(230px,1.1fr)_150px_145px_54px] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-500 dark:bg-slate-800">
                          {getCustomerName(booking).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{getCustomerName(booking)}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <Phone size={12} />
                            {getCustomerPhone(booking)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                        <Activity size={15} className="mr-2 inline text-blue-600" />
                        {getPitchName(booking)}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-blue-600" />
                          {formatDate(booking.bookingDate)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={13} className="text-blue-600" />
                          {getStartTime(booking)} - {getEndTime(booking)}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng tiền</p>
                      <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{formatMoney(getTotal(booking))}</p>
                    </div>

                    <span className={`inline-flex h-10 items-center justify-center rounded-xl px-3 text-[10px] font-black uppercase tracking-widest ${getStatusClass(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="grid gap-4 border-t border-slate-100 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40 md:grid-cols-[1fr_1fr_280px]">
                      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <MapPin size={14} className="text-blue-600" />
                          Sân & khách
                        </p>
                        <dl className="space-y-2 text-xs font-bold">
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Mã đơn</dt>
                            <dd className="text-right text-slate-800 dark:text-slate-200">{booking.checkInCode || booking.id.substring(0, 8).toUpperCase()}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Địa chỉ</dt>
                            <dd className="max-w-[180px] truncate text-right text-slate-800 dark:text-slate-200">{getPitchAddress(booking)}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Liên hệ</dt>
                            <dd className="text-right text-slate-800 dark:text-slate-200">{getCustomerPhone(booking)}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <CreditCard size={14} className="text-emerald-600" />
                          Thanh toán
                        </p>
                        <dl className="space-y-2 text-xs font-bold">
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Tổng tiền</dt>
                            <dd className="text-right text-slate-800 dark:text-slate-200">{formatMoney(getTotal(booking))}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Tiền cọc</dt>
                            <dd className="text-right text-emerald-700">{formatMoney(getDeposit(booking))}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Còn lại</dt>
                            <dd className="text-right text-slate-800 dark:text-slate-200">{formatMoney(Math.max(getTotal(booking) - getDeposit(booking), 0))}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Thao tác</p>
                        <select
                          value={booking.status || 'PendingDeposit'}
                          onChange={(event) => handleStatusUpdate(booking.id, event.target.value)}
                          className={`mb-3 h-10 w-full rounded-xl border-0 px-3 text-xs font-black uppercase tracking-widest outline-none ${getStatusClass(booking.status)}`}
                        >
                          <option value="PendingDeposit">Chờ cọc</option>
                          <option value="Confirmed">Đã xác nhận</option>
                          <option value="Completed">Hoàn thành</option>
                          <option value="Cancelled">Đã hủy</option>
                        </select>
                        <div className="grid grid-cols-4 gap-2">
                          <button type="button" title="Xác nhận" onClick={() => handleStatusUpdate(booking.id, 'Confirmed')} className="flex h-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white">
                            <CheckCircle2 size={17} />
                          </button>
                          <button type="button" title="Hoàn thành" onClick={() => handleStatusUpdate(booking.id, 'Completed')} className="flex h-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white">
                            <Flag size={17} />
                          </button>
                          <button type="button" title="Hủy đơn" onClick={() => handleStatusUpdate(booking.id, 'Cancelled')} className="flex h-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white">
                            <XCircle size={17} />
                          </button>
                          <button type="button" title="Xóa" onClick={() => handleDelete(booking.id)} className="flex h-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Bookings;
