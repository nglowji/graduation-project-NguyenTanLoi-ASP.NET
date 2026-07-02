import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  Flag,
  Gift,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';

type BookingStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
type ServiceFilter = 'all' | 'booked' | 'incidental' | 'withoutService';

type BookingServiceItem = {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
  lineTotal: number;
  addedByName?: string;
  addedById?: string;
  source?: string;
  type?: string;
  isIncidental?: boolean;
  addedAfterBooking?: boolean;
};

type BookingRow = {
  id: string;
  customerName?: string;
  customerPhone?: string;
  user?: { fullName?: string; phoneNumber?: string; email?: string };
  pitchName?: string;
  pitchType?: string | number;
  type?: string | number;
  timeSlot?: {
    startTime?: string;
    endTime?: string;
    pitch?: { name?: string; type?: string; address?: string };
  };
  bookingDate?: string;
  date?: string;
  playDate?: string;
  scheduledDate?: string;
  createdAt?: string;
  createdDate?: string;
  updatedAt?: string;
  startTime?: string;
  endTime?: string;
  totalAmount?: number;
  totalPrice?: number;
  status?: string;
  checkInCode?: string;
  services?: BookingServiceItem[];
};

type ServiceItem = {
  id: string;
  name?: string;
  price?: number;
  stockQuantity?: number;
  isActive?: boolean;
};

type ApiResponse<T> =
  | T[]
  | {
      items?: T[];
      totalItems?: number;
      totalPages?: number;
      page?: number;
      pageSize?: number;
      data?: T[] | { items?: T[]; totalItems?: number; totalPages?: number; page?: number; pageSize?: number };
    };

type Suggestion = {
  tone: 'warning' | 'success' | 'info' | 'danger' | 'purple';
  title: string;
  desc: string;
  icon: React.ElementType;
  actionText: string;
  onClick?: () => void;
};

const PAGE_SIZE = 10;
const API_PAGE_SIZE = 100;
const SOON_MS = 1000 * 60 * 60 * 24 * 2;

const statusText: Record<BookingStatus, string> = {
  all: 'Tất cả',
  pending: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const pad = (value: number) => String(value).padStart(2, '0');
const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const unwrapItems = <T,>(response: unknown): T[] => {
  const raw = (response as { data?: ApiResponse<T> })?.data ?? response;
  const data = (raw as { data?: ApiResponse<T> })?.data ?? raw;
  if (Array.isArray((data as { items?: T[] })?.items)) return (data as { items: T[] }).items;
  if (Array.isArray((raw as { items?: T[] })?.items)) return (raw as { items: T[] }).items;
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(raw)) return raw as T[];
  return [];
};

const getTotalPages = (response: unknown) => {
  const raw = (response as { data?: ApiResponse<unknown> })?.data ?? response;
  const data = (raw as { data?: ApiResponse<unknown> })?.data ?? raw;
  return Number(
    (data as { totalPages?: number })?.totalPages ??
      (raw as { totalPages?: number })?.totalPages ??
      0,
  );
};

const uniqueById = <T extends { id: string }>(items: T[]) => {
  const map = new Map<string, T>();
  items.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
};

const Bookings: React.FC = () => {
  const [bootTimeMs] = useState(() => Date.now());
  const [todayKey] = useState(() => toIsoDate(new Date()));

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [filter, setFilter] = useState<BookingStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [serviceQty, setServiceQty] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchServices = async () => {
    try {
      const res = await api.get('/additional-services/my');
      setServices(unwrapItems<ServiceItem>(res));
    } catch {
      setServices([]);
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const first = await api.get('/bookings/owner', { params: { page: 1, pageSize: API_PAGE_SIZE } });
      const firstItems = unwrapItems<BookingRow>(first);
      const totalPages = getTotalPages(first);
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            api.get('/bookings/owner', { params: { page: index + 2, pageSize: API_PAGE_SIZE } }),
          ),
        );
        setBookings(uniqueById([firstItems, ...rest.map((res) => unwrapItems<BookingRow>(res))].flat()));
      } else {
        setBookings(uniqueById(firstItems));
      }
    } catch {
      try {
        const fallback = await api.get('/bookings/owner');
        setBookings(uniqueById(unwrapItems<BookingRow>(fallback)));
      } catch {
        setBookings([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchBookings();
    void fetchServices();
  }, []);

  const getName = (b: BookingRow) => b.customerName || b.user?.fullName || 'Khách hàng';
  const getPhone = (b: BookingRow) => b.customerPhone || b.user?.phoneNumber || b.user?.email || '---';
  const getStart = (b: BookingRow) => (b.startTime || b.timeSlot?.startTime || '--:--').substring(0, 5);
  const getEnd = (b: BookingRow) => (b.endTime || b.timeSlot?.endTime || '--:--').substring(0, 5);
  const getTotal = (b: BookingRow) => Number(b.totalAmount ?? b.totalPrice ?? 0);
  const getServices = (b: BookingRow) => (Array.isArray(b.services) ? b.services : []);

  const isIncidentalService = (service: BookingServiceItem) => {
    const source = String(service.source || service.type || '').toLowerCase();
    return Boolean(
      service.isIncidental ||
      service.addedAfterBooking ||
      service.addedByName ||
      service.addedById ||
      source.includes('incident') ||
      source.includes('extra') ||
      source.includes('manual') ||
      source.includes('owner') ||
      source.includes('staff'),
    );
  };

  const getBookedServices = (b: BookingRow) => getServices(b).filter((service) => !isIncidentalService(service));
  const getIncidentalServices = (b: BookingRow) => getServices(b).filter(isIncidentalService);

  const toDateKey = (value?: string) => {
    if (!value) return '';
    const text = String(value).trim();
    const raw = text.split('T')[0].split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const viDate = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (viDate) {
      const [, day, month, year] = viDate;
      return `${year}-${pad(Number(month))}-${pad(Number(day))}`;
    }
    const d = new Date(text);
    if (Number.isNaN(d.getTime())) return '';
    return toIsoDate(d);
  };

  const getBookingDateValue = (b: BookingRow) => b.bookingDate || b.playDate || b.scheduledDate || b.date || '';
  const getCreatedValue = (b: BookingRow) => b.createdAt || b.createdDate || b.updatedAt || '';
  const getBookingDateKey = (b: BookingRow) => toDateKey(getBookingDateValue(b));

  const getBookingSortTime = (b: BookingRow) => {
    const bookingDate = getBookingDateKey(b);
    const start = getStart(b);
    const bookingMs = new Date(`${bookingDate || '1970-01-01'}T${start || '00:00'}`).getTime();
    if (Number.isFinite(bookingMs)) return bookingMs;
    const created = getCreatedValue(b);
    const createdMs = created ? new Date(created).getTime() : Number.NaN;
    return Number.isFinite(createdMs) ? createdMs : 0;
  };

  const formatDate = (value?: string) => {
    const key = toDateKey(value);
    if (!key) return '--/--/----';
    const [y, m, d] = key.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatBookingDate = (b: BookingRow) => formatDate(getBookingDateValue(b));

  const getPitchName = (b: BookingRow) => {
    const type = String(b.pitchType ?? b.type ?? b.timeSlot?.pitch?.type ?? '');
    const map: Record<string, string> = {
      Football5: 'Sân bóng đá 5', Football7: 'Sân bóng đá 7', Football11: 'Sân bóng đá 11',
      Tennis: 'Sân tennis', Badminton: 'Sân cầu lông', Pickleball: 'Sân pickleball',
      Basketball: 'Sân bóng rổ', Volleyball: 'Sân bóng chuyền', TableTennis: 'Bóng bàn',
    };
    return b.pitchName || b.timeSlot?.pitch?.name || map[type] || 'Sân';
  };

  const normalizeStatus = (value?: string): Exclude<BookingStatus, 'all'> | 'other' => {
    const t = String(value || '').toLowerCase();
    if (t.includes('pending')) return 'pending';
    if (t.includes('confirm')) return 'confirmed';
    if (t.includes('complete')) return 'completed';
    if (t.includes('cancel')) return 'cancelled';
    return 'other';
  };

  const getStatusLabel = (value?: string) => {
    const s = normalizeStatus(value);
    return s === 'other' ? 'Khác' : statusText[s];
  };

  const statusTokens = (value?: string) => {
    const s = normalizeStatus(value);
    if (s === 'pending')   return { badge: 'bg-amber-100 text-amber-800',   iconBg: 'bg-amber-50 text-amber-500',   line: 'border-l-amber-400',   row: 'hover:bg-amber-50/30' };
    if (s === 'confirmed') return { badge: 'bg-blue-100 text-blue-800',     iconBg: 'bg-blue-50 text-blue-500',     line: 'border-l-blue-400',    row: 'hover:bg-blue-50/30' };
    if (s === 'completed') return { badge: 'bg-emerald-100 text-emerald-800', iconBg: 'bg-emerald-50 text-emerald-600', line: 'border-l-emerald-400', row: 'hover:bg-emerald-50/30' };
    if (s === 'cancelled') return { badge: 'bg-rose-100 text-rose-700',     iconBg: 'bg-rose-50 text-rose-500',     line: 'border-l-rose-400',    row: 'hover:bg-rose-50/30' };
    return { badge: 'bg-slate-100 text-slate-700', iconBg: 'bg-slate-50 text-slate-400', line: 'border-l-slate-200', row: 'hover:bg-slate-50' };
  };

  const isPending   = (b: BookingRow) => normalizeStatus(b.status) === 'pending';
  const isConfirmed = (b: BookingRow) => normalizeStatus(b.status) === 'confirmed';
  const isCompleted = (b: BookingRow) => normalizeStatus(b.status) === 'completed';
  const isCancelled = (b: BookingRow) => normalizeStatus(b.status) === 'cancelled';

  const counts = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(isPending).length,
    confirmed: bookings.filter(isConfirmed).length,
    completed: bookings.filter(isCompleted).length,
    cancelled: bookings.filter(isCancelled).length,
  }), [bookings]);

  const filtered = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    return bookings
      .filter((b) => {
        const matchKw = !kw || [b.id, b.checkInCode, getName(b), getPhone(b), getPitchName(b)].filter(Boolean).some((v) => String(v).toLowerCase().includes(kw));
        const matchDate = !dateFilter || getBookingDateKey(b) === dateFilter;
        const matchStatus = filter === 'all' || normalizeStatus(b.status) === filter;

        const bookedServices = getBookedServices(b);
        const incidentalServices = getIncidentalServices(b);

        const matchService =
          serviceFilter === 'all' ||
          (serviceFilter === 'booked' && bookedServices.length > 0) ||
          (serviceFilter === 'incidental' && incidentalServices.length > 0) ||
          (serviceFilter === 'withoutService' && bookedServices.length === 0 && incidentalServices.length === 0);

        return matchKw && matchDate && matchStatus && matchService;
      })
      .sort((a, b) => getBookingSortTime(b) - getBookingSortTime(a));
  }, [bookings, filter, searchTerm, dateFilter, serviceFilter]);

  const visibleBookings = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  useEffect(() => { setPage(1); }, [filter, searchTerm, dateFilter, serviceFilter]);
  useEffect(() => {
    const max = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
    if (page > max) setPage(max);
  }, [filtered.length, page]);

  const stats = useMemo(() => {
    const todayBookings = bookings.filter((b) => getBookingDateKey(b) === todayKey);
    const totalRevenue = filtered.reduce((s, b) => s + getTotal(b), 0);
    const pendingSoon = bookings.filter((b) => {
      if (!isPending(b)) return false;
      const t = new Date(`${getBookingDateKey(b)}T${getStart(b) || '00:00'}`).getTime();
      return Number.isFinite(t) && t - bootTimeMs < SOON_MS;
    }).length;
    const confirmedNoService = bookings.filter((b) => isConfirmed(b) && getServices(b).length === 0).length;
    return { todayBookings: todayBookings.length, totalRevenue, pendingSoon, confirmedNoService };
  }, [bookings, filtered, todayKey, bootTimeMs]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const r: Suggestion[] = [];
    if (stats.pendingSoon > 0) r.push({ tone: 'warning', icon: AlertTriangle, title: `${stats.pendingSoon} đơn cần xử lý sớm`, desc: 'Xác nhận thanh toán lịch đặt sắp đá.', actionText: 'Xem đơn', onClick: () => setFilter('pending') });
    if (stats.todayBookings > 0) r.push({ tone: 'info', icon: CalendarDays, title: `${stats.todayBookings} đơn trong ngày`, desc: 'Chuẩn bị sân, tiếp đón khách hàng.', actionText: 'Xem hôm nay', onClick: () => { setDateFilter(todayKey); setFilter('all'); } });
    if (stats.confirmedNoService >= 3 && services.length > 0) r.push({ tone: 'success', icon: Gift, title: `${stats.confirmedNoService} đơn chưa có dịch vụ`, desc: 'Mời khách sử dụng nước uống, thuê bóng phục vụ trận đấu.', actionText: 'Xem đơn', onClick: () => setFilter('confirmed') });
    return r.slice(0, 3);
  }, [services.length, stats, todayKey]);

  const handleStatusUpdate = async (id: string, newStatus: Exclude<BookingStatus, 'all'>) => {
    setUpdating(id);
    try {
      if (newStatus === 'confirmed') await api.patch(`/bookings/${id}/confirm`);
      if (newStatus === 'completed') await api.patch(`/bookings/${id}/complete`);
      if (newStatus === 'cancelled') await api.patch(`/bookings/${id}/cancel`, { reason: 'Owner cancelled' });
      await fetchBookings();
    } catch {
      alert('Không thể cập nhật trạng thái');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa đơn đặt sân này?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      await fetchBookings();
    } catch {
      alert('Không thể xóa đơn');
    }
  };

  const addServiceToBooking = async (bookingId: string) => {
    if (!serviceId || serviceQty <= 0) return;
    try {
      await api.post(`/bookings/${bookingId}/services`, [{ serviceId, quantity: serviceQty }]);
      setServiceId(''); setServiceQty(1);
      await Promise.all([fetchBookings(), fetchServices()]);
      alert('Đã thêm dịch vụ phát sinh sau khi đặt');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Không thể tạo hóa đơn phát sinh');
    }
  };

  const resetFilters = () => { setFilter('all'); setSearchTerm(''); setDateFilter(''); setServiceFilter('all'); };

  const kpis = [
    { label: 'Tổng đơn', value: String(counts.total), sub: `${filtered.length} đang lọc`, icon: CalendarDays, color: 'text-blue-600 bg-blue-50', onClick: () => setFilter('all') },
    { label: 'Hôm nay', value: String(stats.todayBookings), sub: 'Cần theo dõi', icon: Clock3, color: 'text-emerald-600 bg-emerald-50', onClick: () => { setDateFilter(todayKey); setFilter('all'); } },
    { label: 'Chờ thanh toán', value: String(counts.pending), sub: 'Cần xác nhận', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', onClick: () => setFilter('pending') },
    { label: 'Đã xác nhận', value: String(counts.confirmed), sub: 'Sẵn sàng phục vụ', icon: CheckCircle2, color: 'text-blue-600 bg-blue-50', onClick: () => setFilter('confirmed') },
    { label: 'Doanh thu đã lọc', value: money(stats.totalRevenue), sub: 'Tổng doanh số đơn', icon: Banknote, color: 'text-emerald-600 bg-emerald-50', onClick: () => {} },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-16">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">QUẢN LÝ ĐẶT SÂN</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Đơn đặt sân</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Theo dõi đơn đặt sân theo ngày chơi, trạng thái, có dịch vụ đi kèm và có hóa đơn phát sinh tại sân.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setDateFilter(todayKey); setFilter('all'); }} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"><CalendarDays size={16} /> Hôm nay</button>
          <button type="button" onClick={fetchBookings} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700"><RefreshCw size={16} /> Làm mới</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.button key={kpi.label} type="button" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={kpi.onClick} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg p-2 ${kpi.color}`}><Icon size={19} /></div>
                <span className="text-xs font-semibold text-slate-400">{kpi.sub}</span>
              </div>
              <p className="text-xs font-semibold text-slate-500">{kpi.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{kpi.value}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Gợi ý vận hành */}
      {suggestions.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 flex gap-3 items-start">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg shrink-0"><Icon size={15} /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 leading-4">{item.desc}</p>
                    <button type="button" onClick={item.onClick} className="mt-2 text-xs font-bold text-blue-600 hover:underline">{item.actionText}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bộ lọc & tìm kiếm */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm khách, SĐT, mã đơn, tên sân..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowFilters((v) => !v)} className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${showFilters ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><Filter size={15} /> Ngày</button>
            <select value={filter} onChange={(e) => setFilter(e.target.value as BookingStatus)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none">
              {Object.entries(statusText).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value as ServiceFilter)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none">
              <option value="all">Tất cả loại dịch vụ</option>
              <option value="booked">Có dịch vụ đi kèm</option>
              <option value="incidental">Có hóa đơn phát sinh</option>
              <option value="withoutService">Không dịch vụ</option>
            </select>
            {(searchTerm || dateFilter || filter !== 'all' || serviceFilter !== 'all') && (
              <button type="button" onClick={resetFilters} className="flex h-10 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-200"><X size={14} /> Đặt lại</button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-500">Lọc ngày:</span>
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none" />
                <span className="ml-0 text-xs font-bold text-slate-500 sm:ml-3">Loại dịch vụ:</span>
                {([
                  ['all', 'Tất cả'],
                  ['booked', 'Có dịch vụ đi kèm'],
                  ['incidental', 'Có hóa đơn phát sinh'],
                  ['withoutService', 'Không dịch vụ'],
                ] as [ServiceFilter, string][]).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setServiceFilter(value)} className={`h-9 rounded-lg px-3 text-xs font-bold transition ${serviceFilter === value ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{label}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Danh sách đơn */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-slate-900">Danh sách đơn đặt sân</h2>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as BookingStatus[]).map((s) => {
              const cnt = s === 'all' ? counts.total : counts[s as keyof typeof counts];
              const activeColor = s === 'completed' ? 'bg-emerald-600' : s === 'cancelled' ? 'bg-rose-600' : s === 'pending' ? 'bg-amber-500' : 'bg-blue-600';
              return (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-bold transition ${filter === s ? `${activeColor} text-white` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{statusText[s]}{cnt > 0 ? ` (${cnt})` : ''}</button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={38} />
            <p className="text-sm font-semibold text-slate-500">Đang tải lịch đặt sân...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <CalendarDays className="text-slate-200" size={48} />
            <p className="mt-3 text-sm font-bold text-slate-500">Không có đơn phù hợp</p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.4fr_1fr_0.85fr_0.75fr_56px] gap-4 border-b border-slate-100 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400 xl:grid">
              <span>Lịch sân</span><span>Khách hàng</span><span>Thanh toán</span><span>Trạng thái</span><span />
            </div>

            <div className="divide-y divide-slate-100">
              {visibleBookings.map((booking) => {
                const expanded = expandedId === booking.id;
                const tok = statusTokens(booking.status);
                const bookedSvcs = getBookedServices(booking);
                const incidentalSvcs = getIncidentalServices(booking);

                return (
                  <article key={booking.id} className={`border-l-[4px] bg-white transition ${tok.line}`}>
                    <button type="button" onClick={() => setExpandedId(expanded ? null : booking.id)} className={`grid w-full gap-4 px-5 py-4 text-left transition xl:grid-cols-[1.4fr_1fr_0.85fr_0.75fr_56px] xl:items-center ${tok.row}`}>
                      
                      {/* Lịch sân */}
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tok.iconBg}`}><CalendarDays size={16} /></div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{booking.checkInCode || booking.id.slice(0, 8).toUpperCase()}</p>
                          <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{getPitchName(booking)}</p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">Ngày đặt sân: {formatBookingDate(booking)} · {getStart(booking)}–{getEnd(booking)}</p>
                        </div>
                      </div>

                      {/* Khách hàng */}
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><UserRound size={13} className="text-slate-400 shrink-0" />{getName(booking)}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Phone size={12} className="shrink-0" />{getPhone(booking)}</p>
                      </div>

                      {/* Thanh toán - ĐÃ BỎ ĐẶT CỌC */}
                      <div>
                        <p className="text-sm font-bold text-slate-900">{money(getTotal(booking))}</p>
                      </div>

                      {/* Trạng thái + dịch vụ */}
                      <div>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${tok.badge}`}>{getStatusLabel(booking.status)}</span>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {bookedSvcs.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              <ShoppingBag size={10} />Có dịch vụ đi kèm
                            </span>
                          )}
                          {incidentalSvcs.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              <Receipt size={10} />Có hóa đơn phát sinh
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end text-slate-300">{expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</div>
                    </button>

                    {/* Expanded panel */}
                    <AnimatePresence>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100">
                          <div className="grid gap-4 bg-slate-50/60 p-5 xl:grid-cols-[1fr_1fr_auto]">

                            {/* Thông tin đơn */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><MapPin size={15} className="text-blue-600" />Thông tin đơn đặt sân</p>
                              <dl className="space-y-2 text-sm">
                                {[
                                  ['Sân', getPitchName(booking)],
                                  ['Địa chỉ', booking.timeSlot?.pitch?.address || '---'],
                                  ['Ngày đặt sân', formatBookingDate(booking)],
                                  ['Giờ đặt', `${getStart(booking)} – ${getEnd(booking)}`],
                                  ['Khách hàng', getName(booking)],
                                  ['Liên hệ', getPhone(booking)],
                                ].map(([label, value]) => (
                                  <div key={label} className="flex justify-between gap-4">
                                    <dt className="text-slate-400 shrink-0">{label}</dt>
                                    <dd className="font-semibold text-slate-900 text-right truncate">{value}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>

                            {/* Dịch vụ & thanh toán */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><Receipt size={15} className="text-blue-600" />Dịch vụ & Thanh toán</p>

                              {bookedSvcs.length > 0 && (
                                <div className="mb-3 rounded-lg bg-blue-50 px-3 py-2.5">
                                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-blue-700">
                                    <ShoppingBag size={11} />Có dịch vụ đi kèm hệ thống
                                  </p>
                                  <div className="space-y-1">
                                    {bookedSvcs.map((sv) => (
                                      <div key={sv.id} className="flex justify-between text-xs font-semibold text-slate-700">
                                        <span>{sv.serviceName} ×{sv.quantity}</span>
                                        <span>{money(sv.lineTotal)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {incidentalSvcs.length > 0 && (
                                <div className="mb-3 rounded-lg bg-amber-50/50 border border-dashed border-amber-200 px-3 py-2.5">
                                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-800">
                                    <Receipt size={11} />Có hóa đơn phát sinh tại sân
                                  </p>
                                  <div className="space-y-1">
                                    {incidentalSvcs.map((sv) => (
                                      <div key={sv.id} className="flex justify-between text-xs font-semibold text-slate-700">
                                        <span>{sv.serviceName} ×{sv.quantity}</span>
                                        <span>{money(sv.lineTotal)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="space-y-1.5 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                                <div className="flex justify-between font-bold text-slate-900">
                                  <span>Tổng tiền cần thu</span>
                                  <span>{money(getTotal(booking))}</span>
                                </div>
                              </div>
                            </div>

                            {/* Thao tác */}
                            <div className="flex min-w-[220px] flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <p className="text-sm font-bold text-slate-900 mb-1">Thao tác xử lý</p>

                              {isPending(booking) && (
                                <button type="button" disabled={updating === booking.id} onClick={() => handleStatusUpdate(booking.id, 'confirmed')} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
                                  {updating === booking.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Xác nhận đặt sân
                                </button>
                              )}

                              {isConfirmed(booking) && (
                                <>
                                  <button type="button" disabled={updating === booking.id} onClick={() => handleStatusUpdate(booking.id, 'completed')} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">
                                    {updating === booking.id ? <Loader2 className="animate-spin" size={14} /> : <Flag size={14} />} Hoàn thành & Thu tiền
                                  </button>

                                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                                    <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-800"><Plus size={13} />Thêm hóa đơn phát sinh tại sân</p>
                                    <div className="grid grid-cols-[1fr_52px] gap-1.5">
                                      <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold outline-none">
                                        <option value="">Chọn dịch vụ</option>
                                        {services.filter((sv) => sv.isActive !== false && Number(sv.stockQuantity || 0) > 0).map((sv) => (
                                          <option key={sv.id} value={sv.id}>{sv.name}</option>
                                        ))}
                                      </select>
                                      <input type="number" min={1} value={serviceQty} onChange={(e) => setServiceQty(Number(e.target.value))} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-bold outline-none" />
                                    </div>
                                    <button type="button" disabled={!serviceId || serviceQty <= 0} onClick={() => addServiceToBooking(booking.id)} className="mt-1.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">Thêm phát sinh</button>
                                  </div>
                                </>
                              )}

                              {(isPending(booking) || isConfirmed(booking)) && (
                                <button type="button" disabled={updating === booking.id} onClick={() => handleStatusUpdate(booking.id, 'cancelled')} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-60"><XCircle size={14} /> Hủy lịch đặt</button>
                              )}

                              <hr className="border-slate-100" />
                              <button type="button" onClick={() => handleDelete(booking.id)} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={13} /> Xóa đơn lịch sử</button>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                );
              })}
            </div>

            {filtered.length > PAGE_SIZE && (
              <div className="border-t border-slate-100 px-5 py-4">
                <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} label="đơn" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Bookings;