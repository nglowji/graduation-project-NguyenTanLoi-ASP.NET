import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Filter,
  Flag,
  Loader2,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  ShoppingCart,
  Trash2,
  XCircle,
} from 'lucide-react';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';

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
  pitchType?: string | number;
  type?: string | number;
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
  services?: BookingServiceItem[];
};
type ServiceItem = { id: string; name?: string; price?: number; stockQuantity?: number; isActive?: boolean };
type BookingServiceItem = { id: string; serviceId: string; serviceName: string; price: number; quantity: number; lineTotal: number; addedByName?: string };

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
  const [dateFilter, setDateFilter] = useState('');
  const [pitchFilter, setPitchFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'dateAsc' | 'dateDesc' | 'amountDesc'>('dateDesc');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    fetchBookings();
  }, [tab]);
  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/additional-services/my') as any;
      setServices(Array.isArray(res) ? res : []);
    } catch {
      setServices([]);
    }
  };

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
    setUpdatingBookingId(id);
    try {
      const normalized = newStatus.toLowerCase();
      if (normalized === 'confirmed') {
        await api.patch(`/bookings/${id}/confirm`);
      } else if (normalized === 'completed') {
        await api.patch(`/bookings/${id}/complete`);
      } else if (normalized === 'cancelled') {
        await api.patch(`/bookings/${id}/cancel`, { reason: 'Owner cancelled booking' });
      }
      await fetchBookings();
    } catch {
      alert('Không thể cập nhật trạng thái');
    } finally {
      setUpdatingBookingId(null);
    }
  };
  const addServiceToBooking = async (bookingId: string) => {
    const booking = bookings.find(item => item.id === bookingId);
    if (!booking || !isConfirmedBooking(booking)) {
      alert('Chỉ đơn đã xác nhận mới có thể thêm dịch vụ phát sinh.');
      return;
    }
    if (!serviceId || serviceQuantity <= 0) return;
    try {
      await api.post(`/bookings/${bookingId}/services`, [{ serviceId, quantity: serviceQuantity }]);
      setServiceId('');
      setServiceQuantity(1);
      await Promise.all([fetchBookings(), fetchServices()]);
      alert('Đã tạo hóa đơn phát sinh và cộng dịch vụ vào đơn.');
    } catch (error: any) {
      alert(error.message || 'Không thể tạo hóa đơn phát sinh. Vui lòng tải lại đơn và thử lại.');
    }
  };

  const getCustomerName = (booking: BookingRow) =>
    booking.customerName || booking.user?.fullName || 'Khách hàng';

  const getCustomerPhone = (booking: BookingRow) =>
    booking.customerPhone || booking.user?.phoneNumber || booking.user?.email || 'Chưa có liên hệ';

  const getPitchType = (booking: BookingRow) => {
    const type = String(booking.pitchType ?? booking.type ?? booking.timeSlot?.pitch?.type ?? '');
    return ({ Football5: 'Bóng đá 5 người', Football7: 'Bóng đá 7 người', Football11: 'Bóng đá 11 người', Tennis: 'Tennis', Badminton: 'Cầu lông', Pickleball: 'Pickleball', Basketball: 'Bóng rổ', Volleyball: 'Bóng chuyền', TableTennis: 'Bóng bàn', '1': 'Bóng đá 5 người', '2': 'Bóng đá 7 người', '3': 'Bóng đá 11 người', '4': 'Tennis', '5': 'Cầu lông', '6': 'Pickleball', '7': 'Bóng rổ', '8': 'Bóng chuyền', '9': 'Bóng bàn' } as Record<string, string>)[type] || booking.timeSlot?.pitch?.name || booking.pitchName || 'Chưa xác định loại sân';
  };

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

  const isPendingBooking = (booking: BookingRow) =>
    String(booking.status || '').toLowerCase().includes('pending');

  const isConfirmedBooking = (booking: BookingRow) =>
    String(booking.status || '').toLowerCase().includes('confirm');

  const isCompletedBooking = (booking: BookingRow) =>
    String(booking.status || '').toLowerCase().includes('complete');

  const isCancelledBooking = (booking: BookingRow) =>
    String(booking.status || '').toLowerCase().includes('cancel');

  const getRemaining = (booking: BookingRow) =>
    isCompletedBooking(booking) ? 0 : Math.max(getTotal(booking) - getDeposit(booking), 0);
  const getExtraServices = (booking: BookingRow) => Array.isArray(booking.services) ? booking.services : [];
  const getIncidentServices = (booking: BookingRow) => getExtraServices(booking).filter((item) => Boolean(item.addedByName));
  const getServiceTotal = (items: BookingServiceItem[]) => items.reduce((sum, item) => sum + Number(item.lineTotal || item.price * item.quantity || 0), 0);

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
    return bookings.filter((booking) => {
      const keywordMatch = !keyword || [
        getCustomerName(booking),
        getCustomerPhone(booking),
        getPitchType(booking),
        booking.checkInCode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
      const dateMatch = !dateFilter || String(booking.bookingDate || '').slice(0, 10) === dateFilter;
      const pitchMatch = pitchFilter === 'all' || getPitchType(booking) === pitchFilter;
      return keywordMatch && dateMatch && pitchMatch;
    }).sort((a, b) => {
      if (sortBy === 'amountDesc') return getTotal(b) - getTotal(a);
      const first = `${String(a.bookingDate || '').slice(0, 10)} ${getStartTime(a)}`;
      const second = `${String(b.bookingDate || '').slice(0, 10)} ${getStartTime(b)}`;
      return sortBy === 'dateDesc' ? second.localeCompare(first) : first.localeCompare(second);
    });
  }, [bookings, searchTerm, dateFilter, pitchFilter, sortBy]);
  const pagedBookings = filteredBookings.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [tab, searchTerm, dateFilter, pitchFilter, sortBy]);
  useEffect(() => {
    const maxPage = Math.max(Math.ceil(filteredBookings.length / pageSize), 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredBookings.length, page]);
  const pitchOptions = useMemo(() => Array.from(new Set(bookings.map(getPitchType))).sort((a, b) => a.localeCompare(b, 'vi')), [bookings]);

  const counts = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => String(b.status || '').toLowerCase().includes('pending')).length;
    const confirmed = bookings.filter((b) => String(b.status || '').toLowerCase().includes('confirm')).length;
    const completed = bookings.filter((b) => String(b.status || '').toLowerCase().includes('complete')).length;
    const cancelled = bookings.filter((b) => String(b.status || '').toLowerCase().includes('cancel')).length;
    return { total, pending, confirmed, completed, cancelled };
  }, [bookings]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <header className="flex flex-col gap-5 py-2 xl:flex-row xl:items-start xl:justify-between">
        <div><h1 className="text-3xl font-black tracking-tight text-slate-950">Lịch đặt sân</h1><p className="mt-2 text-sm font-semibold text-slate-500">Quản lý và cập nhật tất cả lịch đặt sân</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center"><label className="flex h-13 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:col-span-2 xl:w-70"><span className="grid h-full w-12 place-items-center border-r border-slate-200 text-blue-600"><ChevronLeft size={19} /></span><input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-full min-w-0 flex-1 bg-white px-3 text-center text-xs font-black text-slate-700 outline-none"/><span className="grid h-full w-12 place-items-center border-l border-slate-200 text-blue-600"><ChevronRight size={19} /></span></label><select value={pitchFilter} onChange={(event) => setPitchFilter(event.target.value)} className="h-13 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 outline-none focus:border-blue-400"><option value="all">Tất cả sân</option>{pitchOptions.map((pitch) => <option key={pitch} value={pitch}>{pitch}</option>)}</select><select value={tab} onChange={(event) => setTab(event.target.value)} className="h-13 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 outline-none focus:border-blue-400">{tabs.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[[CreditCard, 'Tổng đơn', counts.total, 'text-blue-600', 'bg-blue-50', 'all'], [Clock, 'Chờ xác nhận', counts.pending, 'text-amber-600', 'bg-amber-50', 'pendingdeposit'], [CheckCircle2, 'Đã xác nhận', counts.confirmed, 'text-emerald-600', 'bg-emerald-50', 'confirmed'], [CheckCircle2, 'Hoàn thành', counts.completed, 'text-slate-600', 'bg-slate-100', 'completed'], [XCircle, 'Đã hủy', counts.cancelled, 'text-red-600', 'bg-red-50', 'cancelled']].map(([Icon, label, count, tone, surface, status]) => { const StatIcon = Icon as React.ElementType; return <button key={label as string} type="button" onClick={() => setTab(status as string)} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"><span className={`grid h-12 w-12 place-items-center rounded-full ${surface as string} ${tone as string}`}><StatIcon size={25} /></span><span><span className="block text-xs font-bold text-slate-500">{label as string}</span><strong className={`mt-1 block text-3xl font-black ${tone as string}`}>{count as number}</strong></span></button>; })}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm khách hàng, SĐT, mã đơn..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3"><label className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600"><Filter size={15} className="text-blue-600" />Sắp xếp<select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="ml-1 bg-transparent outline-none"><option value="dateDesc">Mới nhất</option><option value="dateAsc">Cũ nhất</option><option value="amountDesc">Giá cao nhất</option></select></label>{(dateFilter || pitchFilter !== 'all' || sortBy !== 'dateDesc') && <button type="button" onClick={() => { setDateFilter(''); setPitchFilter('all'); setSortBy('dateDesc'); }} className="grid h-11 w-11 place-items-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100" title="Xóa bộ lọc"><XCircle size={17} /></button>}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={38} />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang đồng bộ lịch đặt</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <CalendarDays size={52} className="mb-4 text-slate-200" />
            <h3 className="text-lg font-black text-slate-800 ">Không có đơn phù hợp</h3>
            <p className="mt-2 text-sm font-semibold text-slate-400">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto"><div className="min-w-240 space-y-0">
            <div className="grid grid-cols-[minmax(220px,1fr)_minmax(270px,1.25fr)_145px_145px_52px] gap-4 rounded-t-xl border border-slate-200 bg-slate-50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-2"><Phone size={14} />Khách hàng</span><button type="button" onClick={() => setSortBy(sortBy === 'dateDesc' ? 'dateAsc' : 'dateDesc')} className="flex items-center gap-2 text-left hover:text-blue-700"><CalendarDays size={14} />Sân và khung giờ<ArrowUpDown size={13} /></button><button type="button" onClick={() => setSortBy('amountDesc')} className="flex items-center gap-2 text-left hover:text-blue-700">Tổng tiền<ArrowUpDown size={13} /></button><span>Trạng thái</span><span>Thao tác</span>
            </div>
            {pagedBookings.map((booking) => {
              const isExpanded = expandedBookingId === booking.id;

              return (
                <article key={booking.id} className={`overflow-hidden border-x border-b border-slate-200 bg-white transition hover:bg-blue-50/30 ${isExpanded ? 'bg-blue-50/30 ring-1 ring-inset ring-blue-300' : ''}`}>
                  <div className="grid grid-cols-[minmax(220px,1fr)_minmax(270px,1.25fr)_145px_145px_52px] items-center gap-4 px-6 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700 ">
                          {getCustomerName(booking).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 ">{getCustomerName(booking)}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <Phone size={12} />
                            {getCustomerPhone(booking)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-slate-900 ">
                        <Activity size={15} className="mr-2 inline text-blue-600" />
                        {getPitchType(booking)}
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
                        {getIncidentServices(booking).length > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 ring-1 ring-amber-100">
                            <ShoppingCart size={12} />
                            Có hóa đơn phát sinh
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng tiền</p>
                      <p className="mt-1 text-sm font-black text-slate-950 ">{formatMoney(getTotal(booking))}</p>
                    </div>

                    <span className={`inline-flex h-10 items-center justify-center rounded-xl px-3 text-[10px] font-black uppercase tracking-widest ${getStatusClass(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>

                    <button type="button" onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)} className={`grid h-10 w-10 place-items-center rounded-lg border transition ${isExpanded ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'}`} title={isExpanded ? 'Thu gọn đơn' : 'Mở xử lý đơn'}><MoreHorizontal size={19} /></button>
                  </div>

                  {isExpanded && (
                    <div className="grid gap-4 bg-slate-50/80 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]">
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <MapPin size={14} className="text-blue-600" />
                          Sân & khách
                        </p>
                        <dl className="space-y-2 text-xs font-bold">
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Mã đơn</dt>
                            <dd className="text-right text-slate-800 ">{booking.checkInCode || booking.id.substring(0, 8).toUpperCase()}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Địa chỉ</dt>
                            <dd className="max-w-[180px] truncate text-right text-slate-800 ">{getPitchAddress(booking)}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Liên hệ</dt>
                            <dd className="text-right text-slate-800 ">{getCustomerPhone(booking)}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <CreditCard size={14} className="text-emerald-600" />
                          Thanh toán
                        </p>
                        <dl className="space-y-2 text-xs font-bold">
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Tổng tiền</dt>
                            <dd className="text-right text-slate-800 ">{formatMoney(getTotal(booking))}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Hóa đơn phát sinh</dt>
                            <dd className="text-right text-amber-700">{getIncidentServices(booking).length ? formatMoney(getServiceTotal(getIncidentServices(booking))) : 'Chưa có'}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Tiền cọc</dt>
                            <dd className="text-right text-emerald-700">{formatMoney(getDeposit(booking))}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Còn lại</dt>
                            <dd className="text-right text-slate-800 ">{formatMoney(getRemaining(booking))}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Ghi nhận</dt>
                            <dd className="text-right text-slate-800 ">{isCompletedBooking(booking) ? 'Đã thanh toán đủ' : 'Còn thu tại sân'}</dd>
                          </div>
                        </dl>
                        {getExtraServices(booking).length > 0 && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-3">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Dịch vụ trong đơn</p>
                            <div className="space-y-2">
                              {getExtraServices(booking).map((service) => (
                                <div key={service.id} className="flex justify-between gap-3 text-xs font-bold text-slate-700">
                                  <span className="truncate">{service.serviceName} x{service.quantity}</span>
                                  <span className="shrink-0 text-right font-black">{formatMoney(service.lineTotal)}<small className="block font-bold text-slate-400">{service.addedByName ? `Phát sinh, thêm bởi ${service.addedByName}` : 'Chọn khi đặt sân'}</small></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600"><Flag size={14} />Xử lý đơn</p>
                        <select
                          value={booking.status || 'PendingDeposit'}
                          onChange={(event) => handleStatusUpdate(booking.id, event.target.value)}
                          disabled={isCompletedBooking(booking) || isCancelledBooking(booking)}
                          className={`hidden ${getStatusClass(booking.status)}`}
                        >
                          <option value={booking.status || 'PendingDeposit'}>{getStatusLabel(booking.status)}</option>
                          {isPendingBooking(booking) && <option value="Confirmed">Đã nhận cọc</option>}
                          {isConfirmedBooking(booking) && <option value="Completed">Hoàn tất, đã thu đủ</option>}
                          {(isPendingBooking(booking) || isConfirmedBooking(booking)) && <option value="Cancelled">Đã hủy</option>}
                        </select>
                        <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${getStatusClass(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                            {updatingBookingId === booking.id && <Loader2 size={15} className="animate-spin text-blue-600" />}
                          </div>
                          <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{isPendingBooking(booking) ? 'Xác nhận khi tiền cọc đã được ghi nhận.' : isConfirmedBooking(booking) ? 'Hoàn tất sau khi khách đã thanh toán đủ tại sân.' : isCompletedBooking(booking) ? 'Đơn đã hoàn tất, không thể đổi trạng thái.' : 'Đơn đã hủy, không thể đổi trạng thái.'}</p>
                          <div className="grid gap-2">
                            {isPendingBooking(booking) && (
                              <button type="button" disabled={updatingBookingId === booking.id} onClick={() => handleStatusUpdate(booking.id, 'Confirmed')} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
                                <CheckCircle2 size={16} /> Đã nhận cọc
                              </button>
                            )}
                            {isConfirmedBooking(booking) && (
                              <button type="button" disabled={updatingBookingId === booking.id} onClick={() => handleStatusUpdate(booking.id, 'Completed')} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                                <Flag size={16} /> Hoàn tất đơn
                              </button>
                            )}
                            {(isPendingBooking(booking) || isConfirmedBooking(booking)) && (
                              <button type="button" disabled={updatingBookingId === booking.id} onClick={() => handleStatusUpdate(booking.id, 'Cancelled')} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-black text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60">
                                <XCircle size={15} /> Hủy đơn này
                              </button>
                            )}
                            {(isCompletedBooking(booking) || isCancelledBooking(booking)) && (
                              <p className="rounded-xl bg-white px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 ring-1 ring-slate-200">
                                Không có thao tác thêm
                              </p>
                            )}
                          </div>
                        </div>
                        <button type="button" title="Xóa đơn" onClick={() => handleDelete(booking.id)} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-black text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={15} /> Xóa đơn
                        </button>
                        {isConfirmedBooking(booking) && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700"><ShoppingCart size={14} />Bán thêm dịch vụ</p>
                          <div className="grid grid-cols-[minmax(0,1fr)_68px] gap-2">
                            <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="h-11 min-w-0 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300"><option value="">Chọn dịch vụ</option>{services.filter(item => item.isActive !== false && Number(item.stockQuantity || 0) > 0).map(item => <option key={item.id} value={item.id}>{item.name} · {Number(item.stockQuantity || 0)} còn</option>)}</select>
                            <input type="number" min="1" value={serviceQuantity} onChange={(event) => setServiceQuantity(Number(event.target.value))} className="h-11 rounded-xl border border-blue-100 bg-blue-50 px-2 text-center text-xs font-black text-slate-700 outline-none focus:border-blue-300" />
                          </div>
                          <button type="button" disabled={!serviceId || serviceQuantity <= 0} onClick={() => addServiceToBooking(booking.id)} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-black text-white transition hover:bg-blue-700 disabled:bg-blue-300"><ShoppingCart size={15} />Tạo hóa đơn</button>
                        </div>}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            <Pagination page={page} totalItems={filteredBookings.length} pageSize={pageSize} onPageChange={setPage} label="đơn đặt sân" />
          </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Bookings;
