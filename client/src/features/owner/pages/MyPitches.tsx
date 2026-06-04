import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarClock,
  ChevronDown,
  Clock3,
  DollarSign,
  Dumbbell,
  Edit2,
  Eye,
  Filter,
  Home,
  LayoutGrid,
  List,
  MapPin,
  Settings,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const SPORT_CATEGORIES = [
  { id: 'football', label: 'Bóng đá', types: [
    { id: '1', label: 'Sân 5' },
    { id: '2', label: 'Sân 7' },
    { id: '3', label: 'Sân 11' },
  ] },
  { id: 'volleyball', label: 'Bóng chuyền', types: [{ id: '8', label: 'Sân chuẩn' }] },
  { id: 'basketball', label: 'Bóng rổ', types: [{ id: '7', label: 'Sân chuẩn' }] },
  { id: 'badminton', label: 'Cầu lông', types: [{ id: '5', label: 'Sân chuẩn' }] },
  { id: 'tennis', label: 'Tennis', types: [{ id: '4', label: 'Sân chuẩn' }] },
  { id: 'table_tennis', label: 'Bóng bàn', types: [{ id: '9', label: 'Bàn chuẩn' }] },
  { id: 'pickleball', label: 'Pickleball', types: [{ id: '6', label: 'Sân chuẩn' }] },
];

type PitchRow = {
  id: string;
  name?: string;
  address?: string;
  description?: string;
  pitchType?: string | number;
  type?: string | number;
  status?: string;
  isIndoor?: boolean;
  minPrice?: number;
  averageRating?: number;
  totalReviews?: number;
  timeSlots?: Array<{ id?: string; isActive?: boolean; price?: number }>;
  images?: Array<{ imageUrl?: string } | string>;
};

const PITCH_TYPE_NAME_TO_ID: Record<string, string> = {
  Football5: '1',
  Football7: '2',
  Football11: '3',
  Tennis: '4',
  Badminton: '5',
  Pickleball: '6',
  Basketball: '7',
  Volleyball: '8',
  TableTennis: '9',
};

const STANDARD_TYPE_FILTER = 'standard';

const MyPitches: React.FC = () => {
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<PitchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSport, setFilterSport] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterIndoor, setFilterIndoor] = useState<'all' | 'indoor' | 'outdoor'>('all');
  const [filterPrice, setFilterPrice] = useState<'all' | 'under200' | '200to400' | 'over400'>('all');
  const [filterSlots, setFilterSlots] = useState<'all' | 'available' | 'empty'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterRating, setFilterRating] = useState<'all' | 'rated' | 'unrated'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'priceAsc' | 'priceDesc' | 'slotsDesc'>('newest');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [expandedPitchId, setExpandedPitchId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/pitches/my') as any;
      setPitches(Array.isArray(res) ? res : []);
    } catch {
      setPitches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizePitchTypeId = (rawType: unknown) => {
    if (typeof rawType === 'number') return rawType > 0 ? rawType.toString() : '1';
    if (typeof rawType === 'string') {
      if (PITCH_TYPE_NAME_TO_ID[rawType]) return PITCH_TYPE_NAME_TO_ID[rawType];
      const numericType = Number(rawType);
      if (Number.isFinite(numericType) && numericType > 0) return numericType.toString();
    }
    return '1';
  };

  const getPitchTypeId = (pitch: PitchRow) => normalizePitchTypeId(pitch.pitchType ?? pitch.type);

  const getPitchCategory = (pitch: PitchRow) => {
    const pitchTypeId = getPitchTypeId(pitch);
    return SPORT_CATEGORIES.find((category) => category.types.some((type) => type.id === pitchTypeId));
  };

  const getPitchTypeLabel = (pitch: PitchRow) => {
    const pitchTypeId = getPitchTypeId(pitch);
    return SPORT_CATEGORIES.flatMap((category) => category.types).find((type) => type.id === pitchTypeId)?.label || 'Tiêu chuẩn';
  };

  const isStandardPitchType = (pitch: PitchRow) => getPitchTypeLabel(pitch) === 'Sân chuẩn';

  const getPitchImage = (pitch: PitchRow) => {
    const firstImage = pitch.images?.[0];
    if (typeof firstImage === 'string') return firstImage;
    return firstImage?.imageUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=320';
  };

  const getActiveSlotCount = (pitch: PitchRow) =>
    (pitch.timeSlots || []).filter((slot) => slot.isActive !== false).length;

  const getMinPrice = (pitch: PitchRow) => {
    if (pitch.minPrice) return pitch.minPrice;
    const prices = (pitch.timeSlots || [])
      .map((slot) => Number(slot.price || 0))
      .filter((price) => price > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const formatMoney = (value?: number) =>
    `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const isPitchActive = (pitch: PitchRow) => String(pitch.status || '').toLowerCase() === 'active';

  const filteredPitches = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return pitches.filter((pitch) => {
      const category = getPitchCategory(pitch);
      const pitchTypeId = getPitchTypeId(pitch);
      const price = getMinPrice(pitch);
      const slotCount = getActiveSlotCount(pitch);
      const matchesSearch = !keyword ||
        String(pitch.name || '').toLowerCase().includes(keyword) ||
        String(pitch.address || '').toLowerCase().includes(keyword);
      const matchesSport = filterSport === 'all' || category?.id === filterSport;
      const matchesType =
        filterType === 'all' ||
        pitchTypeId === filterType ||
        (filterType === STANDARD_TYPE_FILTER && isStandardPitchType(pitch));
      const matchesIndoor = filterIndoor === 'all' || (filterIndoor === 'indoor' ? pitch.isIndoor : !pitch.isIndoor);
      const matchesPrice =
        filterPrice === 'all' ||
        (filterPrice === 'under200' && price > 0 && price < 200000) ||
        (filterPrice === '200to400' && price >= 200000 && price <= 400000) ||
        (filterPrice === 'over400' && price > 400000);
      const matchesSlots =
        filterSlots === 'all' ||
        (filterSlots === 'available' && slotCount > 0) ||
        (filterSlots === 'empty' && slotCount === 0);
      const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? isPitchActive(pitch) : !isPitchActive(pitch));
      const matchesRating = filterRating === 'all' || (filterRating === 'rated' ? Number(pitch.totalReviews || 0) > 0 : Number(pitch.totalReviews || 0) === 0);
      return matchesSearch && matchesSport && matchesType && matchesIndoor && matchesPrice && matchesSlots && matchesStatus && matchesRating;
    }).sort((a, b) => {
      if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
      if (sortBy === 'priceAsc') return getMinPrice(a) - getMinPrice(b);
      if (sortBy === 'priceDesc') return getMinPrice(b) - getMinPrice(a);
      if (sortBy === 'slotsDesc') return getActiveSlotCount(b) - getActiveSlotCount(a);
      return 0;
    });
  }, [pitches, search, filterSport, filterType, filterIndoor, filterPrice, filterSlots, filterStatus, filterRating, sortBy]);

  const stats = useMemo(() => {
    const total = pitches.length;
    const activeSlots = pitches.reduce((sum, pitch) => sum + getActiveSlotCount(pitch), 0);
    const indoor = pitches.filter((pitch) => pitch.isIndoor).length;
    const active = pitches.filter(isPitchActive).length;
    const needsSlots = pitches.filter((pitch) => getActiveSlotCount(pitch) === 0).length;
    return { total, activeSlots, indoor, active, needsSlots };
  }, [pitches]);

  const deletePitch = async (pitchId: string) => {
    if (!window.confirm('Xóa sân này?')) return;
    await api.delete(`/pitches/${pitchId}`);
    fetchPitches();
  };

  const togglePitchStatus = async (pitch: PitchRow) => {
    const nextActive = !isPitchActive(pitch);
    await api.patch(`/pitches/${pitch.id}/status`, { isActive: nextActive });
    setPitches((current) => current.map((item) => (
      item.id === pitch.id ? { ...item, status: nextActive ? 'Active' : 'Inactive' } : item
    )));
  };

  const allPitchTypes = [
    { id: '1', label: 'Sân 5' },
    { id: '2', label: 'Sân 7' },
    { id: '3', label: 'Sân 11' },
    { id: STANDARD_TYPE_FILTER, label: 'Sân chuẩn' },
    { id: '9', label: 'Bàn chuẩn' },
  ];
  const hasFilters = search || filterSport !== 'all' || filterType !== 'all' || filterIndoor !== 'all' || filterPrice !== 'all' || filterSlots !== 'all' || filterStatus !== 'all' || filterRating !== 'all' || sortBy !== 'newest';
  const activeFilterCount = [
    search,
    filterSport !== 'all',
    filterType !== 'all',
    filterIndoor !== 'all',
    filterPrice !== 'all',
    filterSlots !== 'all',
    filterStatus !== 'all',
    filterRating !== 'all',
    sortBy !== 'newest',
  ].filter(Boolean).length;
  const resetFilters = () => {
    setSearch('');
    setFilterSport('all');
    setFilterType('all');
    setFilterIndoor('all');
    setFilterPrice('all');
    setFilterSlots('all');
    setFilterStatus('all');
    setFilterRating('all');
    setSortBy('newest');
  };

  const selectFilters = [
    {
      icon: <Dumbbell size={16} />,
      label: 'Môn',
      value: filterSport,
      onChange: (value: string) => setFilterSport(value),
      options: [{ value: 'all', label: 'Tất cả môn' }, ...SPORT_CATEGORIES.map((category) => ({ value: category.id, label: category.label }))],
    },
    {
      icon: <Building2 size={16} />,
      label: 'Loại',
      value: filterType,
      onChange: (value: string) => setFilterType(value),
      options: [{ value: 'all', label: 'Tất cả loại' }, ...allPitchTypes.map((type) => ({ value: type.id, label: type.label }))],
    },
    {
      icon: <DollarSign size={16} />,
      label: 'Giá',
      value: filterPrice,
      onChange: (value: string) => setFilterPrice(value as typeof filterPrice),
      options: [
        { value: 'all', label: 'Mọi mức giá' },
        { value: 'under200', label: '< 200.000đ' },
        { value: '200to400', label: '200-400k' },
        { value: 'over400', label: '> 400.000đ' },
      ],
    },
    {
      icon: <SlidersHorizontal size={16} />,
      label: 'Sắp xếp',
      value: sortBy,
      onChange: (value: string) => setSortBy(value as typeof sortBy),
      options: [
        { value: 'newest', label: 'Mới nhất' },
        { value: 'name', label: 'Tên A-Z' },
        { value: 'priceAsc', label: 'Giá thấp' },
        { value: 'priceDesc', label: 'Giá cao' },
        { value: 'slotsDesc', label: 'Nhiều giờ' },
      ],
    },
  ];
  const pageSize = viewMode === 'table' ? 8 : 6;
  const totalPages = Math.max(Math.ceil(filteredPitches.length / pageSize), 1);
  const paginatedPitches = filteredPitches.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [search, filterSport, filterType, filterIndoor, filterPrice, filterSlots, filterStatus, filterRating, sortBy, viewMode]);
  const renderActions = (pitch: PitchRow) => (
    <div className="relative">
      <button type="button" onClick={() => setOpenActionId((current) => current === pitch.id ? null : pitch.id)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800" title="Thao tác">
        <Settings size={17} />
      </button>
      {openActionId === pitch.id && (
        <div className="absolute right-0 top-12 z-30 max-h-60 w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <button type="button" onClick={() => navigate(`/field/${pitch.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-bold text-blue-700 hover:bg-blue-50"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50"><Eye size={15} /></span>Xem chi tiết</button>
          <button type="button" onClick={() => navigate(`/dashboard/owner/pitches/edit/${pitch.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-bold text-indigo-700 hover:bg-indigo-50"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50"><Edit2 size={15} /></span>Chỉnh sửa sân</button>
          <button type="button" onClick={() => togglePitchStatus(pitch)} className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-bold ${isPitchActive(pitch) ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${isPitchActive(pitch) ? 'bg-amber-50' : 'bg-emerald-50'}`}>{isPitchActive(pitch) ? <PauseCircle size={15} /> : <PlayCircle size={15} />}</span>{isPitchActive(pitch) ? 'Tạm ngưng sân' : 'Kích hoạt sân'}</button>
          <div className="my-1 border-t border-slate-100" />
          <button type="button" onClick={() => deletePitch(pitch.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50"><span className="grid h-8 w-8 place-items-center rounded-lg bg-red-50"><Trash2 size={15} /></span>Xóa sân</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Pitch inventory</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Sân của tôi</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Quản lý sân, giá khởi điểm và khung giờ đang mở bán.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/owner/pitches/create')}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} strokeWidth={3} />
          Thêm sân
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng số sân</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{stats.total}</p></div></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><PlayCircle size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang hoạt động</p><p className="mt-1 text-2xl font-black text-emerald-600">{stats.active}</p></div></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Clock3 size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khung giờ mở</p><p className="mt-1 text-2xl font-black text-blue-600">{stats.activeSlots}</p></div></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Home size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trong nhà</p><p className="mt-1 text-2xl font-black text-indigo-600">{stats.indoor}</p></div></div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-amber-600"><CalendarClock size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Cần mở giờ</p><p className="mt-1 text-2xl font-black text-amber-700">{stats.needsSlots}</p></div></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên sân hoặc địa chỉ..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsFiltersOpen((value) => !value)}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-widest transition ${
              isFiltersOpen || activeFilterCount > 0
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:text-blue-700'
            }`}
          >
            <Filter size={16} />
            Lọc
            {activeFilterCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[10px] text-white">{activeFilterCount}</span>
            )}
            <ChevronDown size={15} className={`transition ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center justify-end gap-3">
            <p className="text-sm font-bold text-slate-400">{filteredPitches.length} / {pitches.length} sân</p>
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button type="button" title="Dạng bảng" onClick={() => setViewMode('table')} className={`grid h-8 w-8 place-items-center rounded-lg ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900' : 'text-slate-400'}`}><List size={16} /></button>
              <button type="button" title="Dạng card" onClick={() => setViewMode('cards')} className={`grid h-8 w-8 place-items-center rounded-lg ${viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
            </div>
          </div>
        </div>

        {isFiltersOpen && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {selectFilters.map((field) => (
                <label key={field.label} className="min-w-0">
                  <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="text-blue-600">{field.icon}</span>
                    {field.label}
                  </span>
                  <div className="relative">
                    <select
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-xs font-black uppercase tracking-widest text-slate-600 outline-none transition focus:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-4">
              {[
                {
                  icon: <Home size={15} />,
                  value: filterIndoor,
                  onChange: (value: string) => setFilterIndoor(value as typeof filterIndoor),
                  items: [
                    ['all', 'Tất cả'],
                    ['indoor', 'Trong nhà'],
                    ['outdoor', 'Ngoài trời'],
                  ],
                },
                {
                  icon: <Clock3 size={15} />,
                  value: filterSlots,
                  onChange: (value: string) => setFilterSlots(value as typeof filterSlots),
                  items: [
                    ['all', 'Mọi khung'],
                    ['available', 'Có giờ mở'],
                    ['empty', 'Chưa có giờ'],
                  ],
                },
                {
                  icon: <PlayCircle size={15} />,
                  value: filterStatus,
                  onChange: (value: string) => setFilterStatus(value as typeof filterStatus),
                  items: [
                    ['all', 'Tất cả'],
                    ['active', 'Đang mở'],
                    ['inactive', 'Tạm ngưng'],
                  ],
                },
                {
                  icon: <Star size={15} />,
                  value: filterRating,
                  onChange: (value: string) => setFilterRating(value as typeof filterRating),
                  items: [
                    ['all', 'Tất cả'],
                    ['rated', 'Có đánh giá'],
                    ['unrated', 'Chưa đánh giá'],
                  ],
                },
              ].map((group, index) => (
                <div key={index} className="rounded-xl bg-white p-1 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-2 px-2 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="text-blue-600">{group.icon}</span>
                    {['Không gian', 'Khung giờ', 'Trạng thái', 'Đánh giá'][index]}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {group.items.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => group.onChange(value)}
                        className={`h-10 rounded-lg px-2 text-[10px] font-black uppercase tracking-widest transition ${
                          group.value === value
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                            : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 transition hover:bg-red-600 hover:text-white"
          >
            <X size={14} />
            Xóa lọc
          </button>
        )}
      </section>

      <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${viewMode === 'table' ? 'overflow-x-auto overflow-y-hidden' : 'p-4'}`}>
        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4">
            <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-500" />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải danh sách sân</p>
          </div>
        ) : filteredPitches.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <Building2 size={54} className="mb-4 text-slate-200" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Không có sân phù hợp</h3>
            <p className="mt-2 text-sm font-semibold text-slate-400">Thử đổi bộ lọc hoặc thêm sân mới.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-[minmax(240px,1fr)_120px_110px_130px_110px_150px_64px] items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
              <span>Sân</span>
              <span>Môn</span>
              <span>Thông tin</span>
              <span>Giá từ</span>
              <span className="whitespace-nowrap">Khung giờ</span>
              <span>Trạng thái</span>
              <span className="whitespace-nowrap text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedPitches.map((pitch) => (
              <div key={pitch.id}>
              <div className="grid grid-cols-[minmax(240px,1fr)_120px_110px_130px_110px_150px_64px] items-center gap-2 px-4 py-3 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    <img src={getPitchImage(pitch)} alt={pitch.name || 'Sân'} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">{pitch.name || 'Sân chưa đặt tên'}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{getPitchTypeLabel(pitch)} · {pitch.isIndoor ? 'Trong nhà' : 'Ngoài trời'}</p>
                  </div>
                </div>

                <div className="min-w-0">
                  <span className="max-w-full truncate text-xs font-black text-slate-700">
                    {getPitchCategory(pitch)?.label || 'Thể thao'}
                  </span>
                </div>

                <div><button type="button" onClick={() => setExpandedPitchId((current) => current === pitch.id ? null : pitch.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-50"><Eye size={13} />Chi tiết</button></div>

                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{formatMoney(getMinPrice(pitch))}</p>
                </div>

                <div>
                  <p className="mt-1 text-sm font-black text-blue-600">{getActiveSlotCount(pitch)} mở</p>
                </div>

                <div>
                  <span className={`inline-flex rounded-lg px-2.5 py-2 text-[10px] font-black uppercase tracking-widest ${
                    isPitchActive(pitch) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isPitchActive(pitch) ? 'Hoạt động' : 'Tạm ngưng'}
                  </span>
                </div>

                <div className="flex justify-end">{renderActions(pitch)}</div>
              </div>
              {expandedPitchId === pitch.id && <div className="grid gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 md:grid-cols-3 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300"><p className="flex items-center gap-2"><MapPin size={14} className="text-blue-600" />{pitch.address || 'Chưa cập nhật địa chỉ'}</p><p className="flex items-center gap-2"><Star size={14} className="text-amber-500" />{Number(pitch.averageRating || 0).toFixed(1)} điểm · {pitch.totalReviews || 0} đánh giá</p><p className="flex items-center gap-2"><Building2 size={14} className="text-indigo-600" />{getPitchTypeLabel(pitch)} · {pitch.isIndoor ? 'Trong nhà' : 'Ngoài trời'}</p></div>}
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedPitches.map((pitch) => (
              <article key={pitch.id} className="relative rounded-xl border border-slate-200 bg-white transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <img src={getPitchImage(pitch)} alt={pitch.name || 'Sân'} className="h-36 w-full rounded-t-xl object-cover" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-black text-slate-950 dark:text-white">{pitch.name || 'Sân chưa đặt tên'}</h3><p className="mt-2 flex items-center gap-1 truncate text-xs font-semibold text-slate-400"><MapPin size={13} />{pitch.address || 'Chưa cập nhật địa chỉ'}</p></div>{renderActions(pitch)}</div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{getPitchCategory(pitch)?.label || 'Thể thao'}</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{getActiveSlotCount(pitch)} giờ mở</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700"><Star size={11} className="mr-1 inline" />{Number(pitch.averageRating || 0).toFixed(1)}</span></div>
                  <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giá từ</p><p className="mt-1 text-lg font-black text-blue-600">{formatMoney(getMinPrice(pitch))}</p></div><span className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isPitchActive(pitch) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{isPitchActive(pitch) ? 'Hoạt động' : 'Tạm ngưng'}</span></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {!isLoading && filteredPitches.length > 0 && <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span>Trang {page} / {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} className="rounded-lg bg-slate-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-800">Trước</button><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))} className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-40">Sau</button></div></div>}
    </div>
  );
};

export default MyPitches;

