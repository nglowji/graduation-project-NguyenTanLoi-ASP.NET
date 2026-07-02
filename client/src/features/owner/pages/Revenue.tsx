import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Activity,
  ChevronRight,
  Check,
  ChevronDown,
} from 'lucide-react';
import api from '../../../services/api';

type RevenuePoint = { date: string; amount: number };
type StatusPoint = { status: string; count: number };
type PitchRevenue = { pitchId: string; pitchName: string; pitchType: string; revenue: number; bookings: number };
type RecentBooking = { 
  id: string; 
  pitchName: string; 
  pitchType?: string; 
  userName: string; 
  bookingDate: string; 
  timeRange: string; 
  totalPrice: number; 
  status: string 
};
type TopCustomer = { userId: string; userName: string; phoneNumber?: string; phone?: string; customerPhone?: string; bookings: number; totalSpent: number; favoritePitchType?: string };
type TopService = { serviceId: string; serviceName: string; quantitySold: number; revenue: number; imageUrl?: string; image?: string; thumbnailUrl?: string; serviceImageUrl?: string };

type ServiceCatalogItem = {
  id: string;
  name?: string;
  imageUrl?: string;
  image?: string;
  thumbnailUrl?: string;
  serviceImageUrl?: string;
  images?: string[] | { imageUrl?: string; url?: string }[];
};

type BookingCustomerRow = {
  id?: string;
  customerName?: string;
  customerPhone?: string;
  phoneNumber?: string;
  userName?: string;
  user?: {
    id?: string;
    fullName?: string;
    name?: string;
    userName?: string;
    phoneNumber?: string;
    phone?: string;
    email?: string;
  };
};

type RevenueData = {
  summary: { 
    totalRevenue: number; 
    serviceRevenue: number; 
    servicesSold: number; 
    totalBookings: number; 
    activePitches: number; 
    occupancyRate: number 
  };
  revenueChart: RevenuePoint[];
  bookingStatusDistribution: StatusPoint[];
  pitchRevenue: PitchRevenue[];
  recentBookings: RecentBooking[];
  topCustomers: TopCustomer[];
  topServices: TopService[];
};

type RangeMode = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

const today = new Date();
const pad = (value: number) => String(value).padStart(2, '0');
const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const unwrapItems = <T,>(response: unknown): T[] => {
  const raw = (response as { data?: unknown })?.data ?? response;
  const data = (raw as { data?: unknown })?.data ?? raw;

  if (Array.isArray((data as { items?: T[] })?.items)) return (data as { items: T[] }).items;
  if (Array.isArray((raw as { items?: T[] })?.items)) return (raw as { items: T[] }).items;
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(raw)) return raw as T[];

  return [];
};

const typeLabel = (type?: string) => ({
  Football5: 'Bóng đá 5',
  Football7: 'Bóng đá 7',
  Football11: 'Bóng đá 11',
  Tennis: 'Tennis',
  Badminton: 'Cầu lông',
  Pickleball: 'Pickleball',
  Basketball: 'Bóng rổ',
  Volleyball: 'Bóng chuyền',
  TableTennis: 'Bóng bàn',
}[String(type || '')] || 'Khác');

const statusLabel = (status?: string) => {
  const value = String(status || '').toLowerCase();
  if (value.includes('complete')) return 'Hoàn thành';
  if (value.includes('confirm')) return 'Đã xác nhận';
  if (value.includes('pending')) return 'Chờ cọc';
  if (value.includes('cancel')) return 'Đã hủy';
  return 'Khác';
};

const statusColor = (status?: string) => {
  const value = String(status || '').toLowerCase();
  if (value.includes('complete')) return 'bg-emerald-100 text-emerald-700';
  if (value.includes('confirm')) return 'bg-blue-100 text-blue-700';
  if (value.includes('pending')) return 'bg-blue-100 text-blue-700';
  if (value.includes('cancel')) return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
};

const MedalIcon: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="18" r="11" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
        <circle cx="16" cy="18" r="8" fill="#FCD34D"/>
        <text x="16" y="23" textAnchor="middle" fontSize="10" fontWeight="900" fill="#92400E">1</text>
        <path d="M10 9L8 4H12L14 9" fill="#F59E0B"/>
        <path d="M22 9L24 4H20L18 9" fill="#F59E0B"/>
        <path d="M10 9H22" stroke="#F59E0B" strokeWidth="1.5"/>
      </svg>
    );
  }
  if (rank === 2) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="18" r="11" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2"/>
        <circle cx="16" cy="18" r="8" fill="#CBD5E1"/>
        <text x="16" y="23" textAnchor="middle" fontSize="10" fontWeight="900" fill="#334155">2</text>
        <path d="M10 9L8 4H12L14 9" fill="#94A3B8"/>
        <path d="M22 9L24 4H20L18 9" fill="#94A3B8"/>
        <path d="M10 9H22" stroke="#94A3B8" strokeWidth="1.5"/>
      </svg>
    );
  }
  if (rank === 3) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="18" r="11" fill="#FEF3F2" stroke="#F97316" strokeWidth="2"/>
        <circle cx="16" cy="18" r="8" fill="#FDBA74"/>
        <text x="16" y="23" textAnchor="middle" fontSize="10" fontWeight="900" fill="#9A3412">3</text>
        <path d="M10 9L8 4H12L14 9" fill="#F97316"/>
        <path d="M22 9L24 4H20L18 9" fill="#F97316"/>
        <path d="M10 9H22" stroke="#F97316" strokeWidth="1.5"/>
      </svg>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
      {rank}
    </span>
  );
};

const PITCH_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316',
];

const PitchRevenueDonut: React.FC<{ pitchRevenue: PitchRevenue[] }> = ({ pitchRevenue }) => {
  const total = pitchRevenue.reduce((sum, p) => sum + p.revenue, 0);
  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400 w-full">
        Không có dữ liệu phù hợp bộ lọc
      </div>
    );
  }

  const cx = 100, cy = 100, r = 72, innerR = 44;
  let cumulative = 0;

  const slices = pitchRevenue.map((p, i) => {
    const fraction = p.revenue / total;
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
    return { ...p, d, color: PITCH_COLORS[i % PITCH_COLORS.length], fraction };
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center w-full">
      <div className="flex shrink-0 justify-center mx-auto sm:mx-0">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {slices.map((slice) => (
            <path key={slice.pitchId} d={slice.d} fill={slice.color} stroke="white" strokeWidth="2">
              <title>{typeLabel(slice.pitchType)}: {money(slice.revenue)} ({(slice.fraction * 100).toFixed(1)}%)</title>
            </path>
          ))}
          <text x="100" y="95" textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">Tổng sân</text>
          <text x="100" y="112" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
            {(total / 1_000_000).toFixed(1)}M đ
          </text>
        </svg>
      </div>

      <div className="flex flex-1 flex-col gap-2 min-w-0 w-full">
        {slices.map((slice) => (
          <div key={slice.pitchId} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate text-sm font-semibold text-slate-700">{typeLabel(slice.pitchType)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">{(slice.fraction * 100).toFixed(1)}%</span>
              <span className="text-sm font-bold text-slate-900">{money(slice.revenue)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SERVICE_COLORS = [
  '#2563eb', '#059669', '#d97706', '#7c3aed',
  '#dc2626', '#0891b2', '#db2777', '#65a30d', '#ea580c',
];

const normalizeTextKey = (value?: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const getCustomerPhone = (customer: TopCustomer, phoneMap?: Map<string, string>) => {
  const directPhone = customer.phoneNumber || customer.phone || customer.customerPhone;
  if (directPhone) return directPhone;
  const byId = phoneMap?.get(customer.userId);
  if (byId) return byId;
  const byName = phoneMap?.get(normalizeTextKey(customer.userName));
  if (byName) return byName;
  return 'Chưa có SĐT';
};

const getServiceImage = (service: TopService, serviceImageMap?: Map<string, string>) => {
  const directImage = service.imageUrl || service.image || service.thumbnailUrl || service.serviceImageUrl;
  if (directImage) return directImage;
  const byId = serviceImageMap?.get(service.serviceId);
  if (byId) return byId;
  const byName = serviceImageMap?.get(normalizeTextKey(service.serviceName));
  if (byName) return byName;
  return '';
};

const ServiceImage: React.FC<{ service: TopService; serviceImageMap?: Map<string, string> }> = ({ service, serviceImageMap }) => {
  const image = getServiceImage(service, serviceImageMap);
  if (image) {
    return <img src={image} alt={service.serviceName} className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200" />;
  }
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
      <Package size={20} />
    </div>
  );
};

const ServiceRevenueDonut: React.FC<{ services: TopService[] }> = ({ services }) => {
  const items = services.filter((service) => Number(service.revenue || 0) > 0);
  const total = items.reduce((sum, service) => sum + Number(service.revenue || 0), 0);

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400 w-full">
        Không có dữ liệu phù hợp bộ lọc
      </div>
    );
  }

  const cx = 100, cy = 100, r = 72, innerR = 44;
  let cumulative = 0;

  const slices = items.map((service, index) => {
    const fraction = Number(service.revenue || 0) / total;
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

    return {
      ...service,
      d,
      color: SERVICE_COLORS[index % SERVICE_COLORS.length],
      fraction,
    };
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center w-full">
      <div className="flex shrink-0 justify-center mx-auto sm:mx-0">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {slices.map((slice) => (
            <path key={slice.serviceId} d={slice.d} fill={slice.color} stroke="white" strokeWidth="2">
              <title>{slice.serviceName}: {money(slice.revenue)} ({(slice.fraction * 100).toFixed(1)}%)</title>
            </path>
          ))}
          <text x="100" y="95" textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">Dịch vụ</text>
          <text x="100" y="112" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
            {(total / 1_000_000).toFixed(1)}M đ
          </text>
        </svg>
      </div>

      <div className="flex flex-1 flex-col gap-2 min-w-0 w-full">
        {slices.map((slice) => (
          <div key={slice.serviceId} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate text-sm font-semibold text-slate-700">{slice.serviceName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">{(slice.fraction * 100).toFixed(1)}%</span>
              <span className="text-sm font-bold text-slate-900">{money(slice.revenue)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// === COMPONENT DROPDOWN TÍCH CHỌN NHIỀU MỤC (MULTI-SELECT) ===
interface MultiSelectDropdownProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selectedValues, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const labelText = useMemo(() => {
    if (selectedValues.length === 0) return 'Chọn bộ lọc...';
    if (selectedValues.length === options.length) return 'Tất cả được chọn';
    return `Đang chọn (${selectedValues.length})`;
  }, [selectedValues, options]);

  return (
    <div className="relative z-20" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 hover:border-slate-300 transition min-w-[150px]"
      >
        <span className="truncate">{labelText}</span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 max-h-60 overflow-y-auto"
          >
            <div className="px-2 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{placeholder}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange(options.map((o) => o.value))}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Chọn hết
                </button>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[10px] font-bold text-slate-500 hover:underline"
                >
                  Xóa
                </button>
              </div>
            </div>
            {options.map((opt) => {
              const isChecked = selectedValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                    {isChecked && <Check size={10} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Revenue: React.FC = () => {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeMode, setRangeMode] = useState<RangeMode>('month');

  // Mảng lưu trữ danh sách các key được tick chọn trong Dropdown
  const [selectedPitchTypes, setSelectedPitchTypes] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return toIsoDate(date);
  });
  const [toDate, setToDate] = useState(() => toIsoDate(today));
  const [showFilters, setShowFilters] = useState(false);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);
  const [bookingCustomers, setBookingCustomers] = useState<BookingCustomerRow[]>([]);

  useEffect(() => {
    const current = new Date();
    if (rangeMode === 'today') {
      const value = toIsoDate(current);
      setFromDate(value);
      setToDate(value);
      return;
    }
    if (rangeMode === 'week') {
      const start = new Date(current);
      start.setDate(start.getDate() - 6);
      setFromDate(toIsoDate(start));
      setToDate(toIsoDate(current));
      return;
    }
    if (rangeMode === 'month') {
      const start = new Date(current.getFullYear(), current.getMonth(), 1);
      const end = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      setFromDate(toIsoDate(start));
      setToDate(toIsoDate(end));
      return;
    }
    if (rangeMode === 'year') {
      setFromDate(`${current.getFullYear()}-01-01`);
      setToDate(`${current.getFullYear()}-12-31`);
      return;
    }
    if (rangeMode === 'all') {
      setFromDate('2020-01-01');
      setToDate(toIsoDate(current));
    }
  }, [rangeMode]);

  useEffect(() => {
    let active = true;
    const loadExtraInfo = async () => {
      const [serviceResult, bookingResult] = await Promise.allSettled([
        api.get('/additional-services/my'),
        api.get('/bookings/owner', { params: { page: 1, pageSize: 500 } }),
      ]);
      if (!active) return;
      if (serviceResult.status === 'fulfilled') setServiceCatalog(unwrapItems<ServiceCatalogItem>(serviceResult.value));
      if (bookingResult.status === 'fulfilled') setBookingCustomers(unwrapItems<BookingCustomerRow>(bookingResult.value));
    };
    void loadExtraInfo();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/dashboard/owner/revenue', {
          params: { fromDate, toDate },
          signal: controller.signal,
        }) as unknown;
        if (active) {
          const resData = res as RevenueData;
          setData(resData);
          
          // Khi có API mới về, tự động tick chọn tất cả các mục ban đầu
          if (resData?.pitchRevenue) {
            setSelectedPitchTypes(resData.pitchRevenue.map((p) => p.pitchType));
          }
          if (resData?.topServices) {
            setSelectedServiceIds(resData.topServices.map((s) => s.serviceId));
          }
        }
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; controller.abort(); };
  }, [fromDate, toDate]);

  const chart = data?.revenueChart || [];
  const totalRevenue = Number(data?.summary.totalRevenue || 0);
  const serviceRevenue = Number(data?.summary.serviceRevenue || 0);
  const totalBookings = Number(data?.summary.totalBookings || 0);
  const activePitches = Number(data?.summary.activePitches || 0);
  const occupancyRate = Number(data?.summary.occupancyRate || 0);

  // Tạo Options danh sách loại sân từ API thực tế phục vụ Dropdown
  const pitchOptions = useMemo(() => {
    return (data?.pitchRevenue || []).map((p) => ({
      value: p.pitchType,
      label: typeLabel(p.pitchType),
    }));
  }, [data?.pitchRevenue]);

  // Tạo Options danh sách dịch vụ từ API thực tế phục vụ Dropdown
  const serviceOptions = useMemo(() => {
    return (data?.topServices || []).map((s) => ({
      value: s.serviceId,
      label: s.serviceName,
    }));
  }, [data?.topServices]);

  // BIỂU ĐỒ LỌC ĐỘNG: Chỉ render những loại sân nằm trong mảng được tick chọn
  const filteredPitchRevenue = useMemo(() => {
    return (data?.pitchRevenue || []).filter((p) => selectedPitchTypes.includes(p.pitchType));
  }, [data?.pitchRevenue, selectedPitchTypes]);

  // BIỂU ĐỒ LỌC ĐỘNG: Chỉ render những dịch vụ nằm trong mảng được tick chọn
  const filteredServiceRevenue = useMemo(() => {
    return (data?.topServices || []).filter((s) => selectedServiceIds.includes(s.serviceId));
  }, [data?.topServices, selectedServiceIds]);

  const serviceImageMap = useMemo(() => {
    const map = new Map<string, string>();
    serviceCatalog.forEach((service) => {
      const rawImage = service.imageUrl || service.image || service.thumbnailUrl || service.serviceImageUrl || (Array.isArray(service.images) ? service.images.map((item) => (typeof item === 'string' ? item : item?.imageUrl || item?.url || '')).find(Boolean) : '');
      const image = String(rawImage || '').trim();
      if (!image) return;
      map.set(service.id, image);
      if (service.name) map.set(normalizeTextKey(service.name), image);
    });
    return map;
  }, [serviceCatalog]);

  const customerPhoneMap = useMemo(() => {
    const map = new Map<string, string>();
    bookingCustomers.forEach((booking) => {
      const name = booking.customerName || booking.userName || booking.user?.fullName || booking.user?.name || booking.user?.userName || '';
      const phone = booking.customerPhone || booking.phoneNumber || booking.user?.phoneNumber || booking.user?.phone || '';
      if (!phone) return;
      if (booking.user?.id) map.set(booking.user.id, phone);
      if (name) map.set(normalizeTextKey(name), phone);
    });
    return map;
  }, [bookingCustomers]);

  const maxChartValue = useMemo(() => Math.max(...chart.map(item => item.amount), 1), [chart]);

  const exportToExcel = () => { alert('Tính năng xuất Excel sẽ được triển khai'); };

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-semibold text-slate-500">Đang tải dữ liệu doanh thu...</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Tổng doanh thu', value: money(totalRevenue + serviceRevenue), change: '+18.6%', trend: 'up', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'Doanh thu sân', value: money(totalRevenue), change: '+16.4%', trend: 'up', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Doanh thu dịch vụ', value: money(serviceRevenue), change: '+21.7%', trend: 'up', icon: Package, color: 'text-violet-600 bg-violet-50' },
    { label: 'Tổng lượt đặt sân', value: String(totalBookings), change: '+12.3%', trend: 'up', icon: ShoppingCart, color: 'text-amber-600 bg-amber-50' },
    { label: 'Sân hoạt động', value: String(activePitches), change: 'Ổn định', trend: 'stable', icon: Activity, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Tỷ lệ sử dụng', value: `${occupancyRate.toFixed(1)}%`, change: '+5.2%', trend: 'up', icon: Users, color: 'text-pink-600 bg-pink-50' },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-16">
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">BÁO CÁO DOANH THU</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Báo cáo doanh thu</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Theo dõi doanh thu theo thời gian, loại sân và dịch vụ bổ sung.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Filter size={16} />
            Bộ lọc
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Download size={16} />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {(['today', 'week', 'month', 'year', 'all', 'custom'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRangeMode(mode)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${rangeMode === mode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {mode === 'today' ? 'Hôm nay' : mode === 'week' ? 'Tuần' : mode === 'month' ? 'Tháng' : mode === 'year' ? 'Năm' : mode === 'all' ? 'Tất cả' : 'Tùy chỉnh'}
                </button>
              ))}
            </div>
            {rangeMode === 'custom' && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold" />
                <span className="text-slate-400">-</span>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <div className={`rounded-lg p-2 ${kpi.color}`}><Icon size={20} /></div>
                <span className={`flex items-center gap-1 text-xs font-semibold ${kpi.trend === 'up' ? 'text-emerald-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
                  {kpi.trend === 'up' && <ArrowUpRight size={14} />}
                  {kpi.trend === 'down' && <ArrowDownRight size={14} />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600">{kpi.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{kpi.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Biểu đồ doanh thu</h2>
            <p className="text-sm text-slate-600">Doanh thu theo ngày trong kỳ đã chọn</p>
          </div>
        </div>
        <div className="space-y-2">
          {chart.slice(0, 15).map((item) => {
            const percentage = (item.amount / maxChartValue) * 100;
            const showTextOutside = percentage < 25;
            return (
              <div key={item.date} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-semibold text-slate-600">{item.date.slice(5)}</span>
                <div className="relative h-10 flex-1 overflow-visible rounded-lg bg-slate-100">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.5, delay: 0.1 }} className="h-full rounded-lg bg-blue-600" />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold ${showTextOutside ? 'left-[calc(var(--width)+8px)] text-slate-700' : 'left-3 text-white'}`} style={{ '--width': `${percentage}%` } as React.CSSProperties}>
                    {money(item.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-width Trend Chart */}
      {chart.length > 0 && (() => {
        const curTotal = chart.reduce((s, d) => s + d.amount, 0);
        const prevTotal = chart.reduce((s, d) => s + d.amount * 0.84, 0);
        const maxCur = Math.max(...chart.map(d => d.amount));
        const changePct = Math.round((curTotal - prevTotal) / prevTotal * 100);
        const fmtShort = (v: number) => {
          if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
          if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
          return v.toLocaleString('vi-VN');
        };

        const chartData = {
          labels: chart.map(d => d.date.slice(5)),
          datasets: [
            { label: 'Kỳ trước', data: chart.map(d => Math.round(d.amount * 0.84)), borderColor: '#B4B2A9', borderWidth: 2, borderDash: [6, 4], pointRadius: 3, pointBackgroundColor: '#B4B2A9', pointBorderColor: '#ffffff', pointBorderWidth: 2, tension: 0.4, fill: false },
            { label: 'Kỳ này', data: chart.map(d => d.amount), borderColor: '#185FA5', borderWidth: 3, pointRadius: 5, pointBackgroundColor: '#185FA5', pointBorderColor: '#ffffff', pointBorderWidth: 2, pointHoverRadius: 7, tension: 0.4, fill: { target: 'origin' as const, above: 'rgba(55,138,221,0.08)' } },
          ],
        };

        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Xu hướng doanh thu</h2>
                <p className="text-sm text-slate-500">So sánh kỳ này với kỳ trước</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-2"><span className="inline-block h-0.5 w-6 rounded bg-blue-600" />Kỳ này</span>
                <span className="flex items-center gap-2"><span className="inline-block h-0 w-6 border-t-2 border-dashed border-slate-400" />Kỳ trước</span>
              </div>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">Tổng kỳ này</p><p className="mt-1 text-base font-bold text-slate-900">{money(curTotal)}</p></div>
              <div className="rounded-lg bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">Tổng kỳ trước</p><p className="mt-1 text-base font-bold text-slate-900">{money(prevTotal)}</p></div>
              <div className="rounded-lg bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">Cao nhất</p><p className="mt-1 text-base font-bold text-slate-900">{money(maxCur)}</p></div>
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">So kỳ trước</p>
                <p className={`mt-1 text-base font-bold flex items-center gap-1 ${changePct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {changePct >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}{Math.abs(changePct)}%
                </p>
              </div>
            </div>
            <div className="relative h-80"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 } } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v) => `${fmtShort(Number(v))}đ` } } } }} /></div>
          </div>
        );
      })()}

      {/* === KHU VỰC 2 BIỂU ĐỒ CƠ CẤU VỚI MULTI-SELECT DROPDOWN === */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Khối 1: Cơ cấu Loại Sân */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 relative">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cơ cấu doanh thu theo loại sân</h2>
                <p className="text-sm text-slate-500">Tích chọn các loại sân cần so sánh</p>
              </div>
              
              {/* Menu tích chọn loại sân */}
              <MultiSelectDropdown
                options={pitchOptions}
                selectedValues={selectedPitchTypes}
                onChange={setSelectedPitchTypes}
                placeholder="LOẠI SÂN"
              />
            </div>
            <PitchRevenueDonut pitchRevenue={filteredPitchRevenue} />
          </div>
        </div>

        {/* Khối 2: Cơ cấu Loại Dịch Vụ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 relative">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cơ cấu doanh thu theo dịch vụ</h2>
                <p className="text-sm text-slate-500">Tích chọn dịch vụ cần hiển thị</p>
              </div>
              
              {/* Menu tích chọn dịch vụ */}
              <MultiSelectDropdown
                options={serviceOptions}
                selectedValues={selectedServiceIds}
                onChange={setSelectedServiceIds}
                placeholder="DỊCH VỤ BÁN KÈM"
              />
            </div>
            <ServiceRevenueDonut services={filteredServiceRevenue} />
          </div>
        </div>

      </div>

      {/* Tables Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Top khách hàng</h2>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Xem tất cả <ChevronRight size={14} className="inline" /></button>
          </div>
          <div className="space-y-3">
            {(data?.topCustomers || []).slice(0, 5).map((customer, index) => (
              <div key={customer.userId} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <MedalIcon rank={index + 1} />
                  <div>
                    <p className="font-semibold text-slate-900">{customer.userName}</p>
                    <p className="text-xs text-slate-500">{getCustomerPhone(customer, customerPhoneMap)}</p>
                    <p className="text-xs text-slate-500">{customer.bookings} lượt đặt</p>
                  </div>
                </div>
                <p className="font-bold text-slate-900">{money(customer.totalSpent)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Top dịch vụ</h2>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Xem tất cả <ChevronRight size={14} className="inline" /></button>
          </div>
          <div className="space-y-3">
            {(data?.topServices || []).slice(0, 5).map((service, index) => (
              <div key={service.serviceId} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0"><MedalIcon rank={index + 1} /></div>
                  <ServiceImage service={service} serviceImageMap={serviceImageMap} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{service.serviceName}</p>
                    <p className="text-xs text-slate-500">Đã bán: {service.quantitySold}</p>
                  </div>
                </div>
                <p className="shrink-0 font-bold text-slate-900">{money(service.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Lượt đặt sân gần đây</h2>
            <p className="text-sm text-slate-600">Các giao dịch mới nhất trong kỳ</p>
          </div>
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Xem tất cả <ChevronRight size={14} className="inline" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Loại sân</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Khách hàng</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Thời gian</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.recentBookings || []).slice(0, 10).map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{typeLabel(booking.pitchType)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{booking.userName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{booking.bookingDate} · {booking.timeRange}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor(booking.status)}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{money(booking.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Revenue;