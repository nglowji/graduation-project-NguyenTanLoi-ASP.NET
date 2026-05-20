import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  Clock3,
  DollarSign,
  Dumbbell,
  Edit2,
  Filter,
  Home,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  SlidersHorizontal,
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
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'priceAsc' | 'priceDesc' | 'slotsDesc'>('newest');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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
      return matchesSearch && matchesSport && matchesType && matchesIndoor && matchesPrice && matchesSlots;
    }).sort((a, b) => {
      if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
      if (sortBy === 'priceAsc') return getMinPrice(a) - getMinPrice(b);
      if (sortBy === 'priceDesc') return getMinPrice(b) - getMinPrice(a);
      if (sortBy === 'slotsDesc') return getActiveSlotCount(b) - getActiveSlotCount(a);
      return 0;
    });
  }, [pitches, search, filterSport, filterType, filterIndoor, filterPrice, filterSlots, sortBy]);

  const stats = useMemo(() => {
    const total = pitches.length;
    const activeSlots = pitches.reduce((sum, pitch) => sum + getActiveSlotCount(pitch), 0);
    const indoor = pitches.filter((pitch) => pitch.isIndoor).length;
    return { total, activeSlots, indoor };
  }, [pitches]);

  const deletePitch = async (pitchId: string) => {
    if (!window.confirm('Xóa sân này?')) return;
    await api.delete(`/pitches/${pitchId}`);
    fetchPitches();
  };

  const isPitchActive = (pitch: PitchRow) => String(pitch.status || '').toLowerCase() === 'active';

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
  const hasFilters = search || filterSport !== 'all' || filterType !== 'all' || filterIndoor !== 'all' || filterPrice !== 'all' || filterSlots !== 'all' || sortBy !== 'newest';
  const activeFilterCount = [
    search,
    filterSport !== 'all',
    filterType !== 'all',
    filterIndoor !== 'all',
    filterPrice !== 'all',
    filterSlots !== 'all',
    sortBy !== 'newest',
  ].filter(Boolean).length;
  const resetFilters = () => {
    setSearch('');
    setFilterSport('all');
    setFilterType('all');
    setFilterIndoor('all');
    setFilterPrice('all');
    setFilterSlots('all');
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

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng số sân</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khung giờ mở</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{stats.activeSlots}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sân trong nhà</p>
          <p className="mt-2 text-2xl font-black text-indigo-600">{stats.indoor}</p>
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

          <p className="text-sm font-bold text-slate-400 lg:text-right">{filteredPitches.length} / {pitches.length} sân</p>
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

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
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
              ].map((group, index) => (
                <div key={index} className="rounded-xl bg-white p-1 dark:bg-slate-900">
                  <div className="mb-1 flex items-center gap-2 px-2 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="text-blue-600">{group.icon}</span>
                    {index === 0 ? 'Không gian' : 'Khung giờ'}
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

      <section className="overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
        ) : (
          <div className="min-w-[1220px]">
            <div className="grid grid-cols-[minmax(220px,1fr)_130px_130px_130px_120px_160px_118px] items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
              <span>Sân</span>
              <span>Môn</span>
              <span>Loại sân</span>
              <span>Giá từ</span>
              <span>Khung giờ</span>
              <span>Trạng thái</span>
              <span className="text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPitches.map((pitch) => (
              <div key={pitch.id} className="grid grid-cols-[minmax(220px,1fr)_130px_130px_130px_120px_160px_118px] items-center gap-4 px-5 py-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    <img src={getPitchImage(pitch)} alt={pitch.name || 'Sân'} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">{pitch.name || 'Sân chưa đặt tên'}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Mã sân {pitch.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="min-w-0">
                  <span className="max-w-full truncate rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 ring-1 ring-blue-100">
                    {getPitchCategory(pitch)?.label || 'Thể thao'}
                  </span>
                </div>

                <div className="min-w-0">
                  <span className="max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {getPitchTypeLabel(pitch)}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">{formatMoney(getMinPrice(pitch))}</p>
                </div>

                <div>
                  <p className="mt-1 text-sm font-black text-blue-600">{getActiveSlotCount(pitch)} mở</p>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <div className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${
                    isPitchActive(pitch) ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                  }`}>
                    {isPitchActive(pitch) ? 'Hoạt động' : 'Tạm ngưng'}
                  </div>
                  <div className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${
                    pitch.isIndoor ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                  }`}>
                    {pitch.isIndoor ? 'Trong nhà' : 'Ngoài trời'}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => togglePitchStatus(pitch)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                      isPitchActive(pitch)
                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                    }`}
                    title={isPitchActive(pitch) ? 'Tạm ngưng sân' : 'Kích hoạt sân'}
                  >
                    {isPitchActive(pitch) ? <PauseCircle size={17} /> : <PlayCircle size={17} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/owner/pitches/edit/${pitch.id}`)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800"
                    title="Sửa sân"
                  >
                    <Edit2 size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePitch(pitch.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:bg-slate-800"
                    title="Xóa sân"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyPitches;

