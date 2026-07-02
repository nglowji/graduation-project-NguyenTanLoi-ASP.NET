import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Clock3,
  Edit2,
  Eye,
  MapPin,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

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

type StatusFilter = 'all' | 'active' | 'inactive' | 'pending';
type IndoorFilter = 'all' | 'indoor' | 'outdoor';
type PriceFilter = 'all' | 'under200' | '200to400' | 'over400';
type SortBy = 'newest' | 'name' | 'priceAsc' | 'priceDesc' | 'slotsDesc';

const STANDARD_TYPE_FILTER = 'standard';

const SPORT_CATEGORIES = [
  {
    id: 'football',
    label: 'Bóng đá',
    types: [
      { id: '1', label: 'Sân 5' },
      { id: '2', label: 'Sân 7' },
      { id: '3', label: 'Sân 11' },
    ],
  },
  { id: 'tennis', label: 'Tennis', types: [{ id: '4', label: 'Sân chuẩn' }] },
  { id: 'badminton', label: 'Cầu lông', types: [{ id: '5', label: 'Sân chuẩn' }] },
  { id: 'pickleball', label: 'Pickleball', types: [{ id: '6', label: 'Sân chuẩn' }] },
  { id: 'basketball', label: 'Bóng rổ', types: [{ id: '7', label: 'Sân chuẩn' }] },
  { id: 'volleyball', label: 'Bóng chuyền', types: [{ id: '8', label: 'Sân chuẩn' }] },
  { id: 'table_tennis', label: 'Bóng bàn', types: [{ id: '9', label: 'Bàn chuẩn' }] },
];

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

const MyPitches: React.FC = () => {
  const navigate = useNavigate();

  const [pitches, setPitches] = useState<PitchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [filterSport, setFilterSport] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterIndoor, setFilterIndoor] = useState<IndoorFilter>('all');
  const [filterPrice, setFilterPrice] = useState<PriceFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const fetchPitches = async () => {
    setIsLoading(true);

    try {
      const response = await api.get('/pitches/my') as any;
      const raw = response?.data ?? response;
      const data = raw?.data ?? raw;
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setPitches(items);
    } catch {
      setPitches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPitches();
  }, []);

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
    const typeId = getPitchTypeId(pitch);
    return SPORT_CATEGORIES.find((category) => category.types.some((type) => type.id === typeId));
  };

  const getPitchTypeLabel = (pitch: PitchRow) => {
    const typeId = getPitchTypeId(pitch);
    return SPORT_CATEGORIES.flatMap((category) => category.types).find((type) => type.id === typeId)?.label || 'Tiêu chuẩn';
  };

  const isStandardPitchType = (pitch: PitchRow) => getPitchTypeLabel(pitch) === 'Sân chuẩn';

  const getPitchImage = (pitch: PitchRow) => {
    const firstImage = pitch.images?.[0];

    if (typeof firstImage === 'string') return firstImage;

    return firstImage?.imageUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=640&auto=format&fit=crop';
  };

  const getActiveSlotCount = (pitch: PitchRow) =>
    (pitch.timeSlots || []).filter((slot) => slot.isActive !== false).length;

  const getMinPrice = (pitch: PitchRow) => {
    if (pitch.minPrice) return Number(pitch.minPrice);

    const prices = (pitch.timeSlots || [])
      .map((slot) => Number(slot.price || 0))
      .filter((price) => price > 0);

    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const formatMoney = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const normalizeText = (value?: string | number | null) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const compactText = (value?: string | number | null) => normalizeText(value).replace(/\s+/g, '');

  const levenshteinDistance = (left: string, right: string) => {
    const a = compactText(left);
    const b = compactText(right);

    if (!a || !b) return Math.max(a.length, b.length);
    if (a === b) return 0;

    const matrix = Array.from({ length: a.length + 1 }, (_, row) => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[a.length][b.length];
  };

  const fuzzyIncludes = (source: string, keyword: string) => {
    const normalizedSource = normalizeText(source);
    const normalizedKeyword = normalizeText(keyword);
    const sourceCompact = compactText(source);
    const keywordCompact = compactText(keyword);

    if (!normalizedKeyword) return true;
    if (normalizedSource.includes(normalizedKeyword) || sourceCompact.includes(keywordCompact)) return true;

    const words = normalizedSource.split(' ').filter(Boolean);
    const tokens = normalizedKeyword.split(' ').filter(Boolean);

    return tokens.every((token) => {
      if (words.some((word) => word.includes(token) || token.includes(word))) return true;
      return words.some((word) => levenshteinDistance(word, token) <= (token.length <= 4 ? 1 : 2));
    });
  };


  const isPitchActive = (pitch: PitchRow) => String(pitch.status || '').toLowerCase() === 'active';

  const isPitchPendingApproval = (pitch: PitchRow) =>
    String(pitch.status || '').toLowerCase().includes('pendingapproval');

  const getPitchStatusLabel = (pitch: PitchRow) => {
    if (isPitchPendingApproval(pitch)) return 'Chờ duyệt';
    if (isPitchActive(pitch)) return 'Hoạt động';
    return 'Tạm ngưng';
  };

  const getPitchStatusClass = (pitch: PitchRow) => {
    if (isPitchPendingApproval(pitch)) return 'border-amber-100 bg-amber-50 text-amber-700';
    if (isPitchActive(pitch)) return 'border-emerald-100 bg-emerald-50 text-emerald-700';
    return 'border-slate-200 bg-slate-100 text-slate-500';
  };

  const allPitchTypes = [
    { id: '1', label: 'Sân 5' },
    { id: '2', label: 'Sân 7' },
    { id: '3', label: 'Sân 11' },
    { id: STANDARD_TYPE_FILTER, label: 'Sân chuẩn' },
    { id: '9', label: 'Bàn chuẩn' },
  ];

  const availablePitchTypes =
    filterSport === 'all'
      ? allPitchTypes
      : SPORT_CATEGORIES.find((category) => category.id === filterSport)?.types || [];

  useEffect(() => {
    if (filterType !== 'all' && !availablePitchTypes.some((type) => type.id === filterType)) {
      setFilterType('all');
    }
  }, [filterSport, filterType, availablePitchTypes]);

  const filteredPitches = useMemo(() => {
    const keyword = search.trim();

    return pitches
      .filter((pitch) => {
        const category = getPitchCategory(pitch);
        const typeId = getPitchTypeId(pitch);
        const price = getMinPrice(pitch);
        const slotCount = getActiveSlotCount(pitch);

        const searchableText = [
          pitch.name,
          pitch.address,
          category?.label,
          getPitchTypeLabel(pitch),
          pitch.isIndoor ? 'trong nhà có mái che indoor' : 'ngoài trời outdoor',
        ].join(' ');

        const matchesSearch = !keyword || fuzzyIncludes(searchableText, keyword);

        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'active' && isPitchActive(pitch)) ||
          (filterStatus === 'inactive' && !isPitchActive(pitch) && !isPitchPendingApproval(pitch)) ||
          (filterStatus === 'pending' && isPitchPendingApproval(pitch));

        const matchesSport = filterSport === 'all' || category?.id === filterSport;

        const matchesType =
          filterType === 'all' ||
          typeId === filterType ||
          (filterType === STANDARD_TYPE_FILTER && isStandardPitchType(pitch));

        const matchesIndoor =
          filterIndoor === 'all' ||
          (filterIndoor === 'indoor' ? pitch.isIndoor === true : pitch.isIndoor === false);

        const matchesPrice =
          filterPrice === 'all' ||
          (filterPrice === 'under200' && price > 0 && price < 200000) ||
          (filterPrice === '200to400' && price >= 200000 && price <= 400000) ||
          (filterPrice === 'over400' && price > 400000);

        return matchesSearch && matchesStatus && matchesSport && matchesType && matchesIndoor && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
        if (sortBy === 'priceAsc') return getMinPrice(a) - getMinPrice(b);
        if (sortBy === 'priceDesc') return getMinPrice(b) - getMinPrice(a);
        if (sortBy === 'slotsDesc') return getActiveSlotCount(b) - getActiveSlotCount(a);
        return 0;
      });
  }, [pitches, search, filterStatus, filterSport, filterType, filterIndoor, filterPrice, sortBy]);

  const stats = useMemo(() => {
    const total = pitches.length;
    const active = pitches.filter(isPitchActive).length;
    const pending = pitches.filter(isPitchPendingApproval).length;
    const inactive = total - active - pending;

    return { total, active, inactive, pending };
  }, [pitches]);

  const paginatedPitches = filteredPitches.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(Math.ceil(filteredPitches.length / pageSize), 1);

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterSport, filterType, filterIndoor, filterPrice, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterSport('all');
    setFilterType('all');
    setFilterIndoor('all');
    setFilterPrice('all');
    setSortBy('newest');
  };

  const hasFilters =
    search ||
    filterStatus !== 'all' ||
    filterSport !== 'all' ||
    filterType !== 'all' ||
    filterIndoor !== 'all' ||
    filterPrice !== 'all' ||
    sortBy !== 'newest';

  const togglePitchStatus = async (pitch: PitchRow) => {
    if (isPitchPendingApproval(pitch)) {
      window.alert('Sân đang chờ admin duyệt nên chưa thể kích hoạt.');
      return;
    }

    const nextActive = !isPitchActive(pitch);
    await api.patch(`/pitches/${pitch.id}/status`, { isActive: nextActive });

    setPitches((current) =>
      current.map((item) => (item.id === pitch.id ? { ...item, status: nextActive ? 'Active' : 'Inactive' } : item)),
    );
  };

  const deletePitch = async (pitchId: string) => {
    if (!window.confirm('Xóa sân này?')) return;

    await api.delete(`/pitches/${pitchId}`);
    await fetchPitches();
  };

  const iconButtonClass =
    'group relative grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900';

  const renderTooltip = (label: string) => (
    <span className="pointer-events-none absolute -top-8 right-0 z-10 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
      {label}
    </span>
  );

  return (
    <main className="mx-auto max-w-[1400px] space-y-6 pb-16">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">QUẢN LÝ SÂN</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Danh sách sân</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Theo dõi trạng thái sân, giá thuê và các thông tin cần thiết để nhận đặt sân.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchPitches}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard/owner/pitches/create')}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Thêm sân
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Tổng sân',
            value: stats.total,
            note: 'Tổng số sân đang quản lý',
            icon: Building2,
            color: 'text-blue-600 bg-blue-50',
            onClick: () => setFilterStatus('all'),
          },
          {
            label: 'Đang hoạt động',
            value: stats.active,
            note: 'Có thể nhận đặt sân',
            icon: PlayCircle,
            color: 'text-emerald-600 bg-emerald-50',
            onClick: () => setFilterStatus('active'),
          },
          {
            label: 'Tạm ngưng',
            value: stats.inactive,
            note: 'Đã tắt hoặc đang bảo trì',
            icon: PauseCircle,
            color: 'text-red-600 bg-red-50',
            onClick: () => setFilterStatus('inactive'),
          },
          {
            label: 'Chờ duyệt',
            value: stats.pending,
            note: 'Đang chờ admin phê duyệt',
            icon: Clock3,
            color: 'text-amber-600 bg-amber-50',
            onClick: () => setFilterStatus('pending'),
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:shadow-md"
            >
              <div className={`mb-3 w-fit rounded-lg p-2 ${item.color}`}>
                <Icon size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-600">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{item.note}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên sân hoặc địa chỉ... Ví dụ: san 7, bong da, caulong"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as StatusFilter)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
              <option value="pending">Chờ duyệt</option>
            </select>

            <select
              value={filterSport}
              onChange={(event) => setFilterSport(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="all">Tất cả môn</option>
              {SPORT_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="all">Tất cả quy mô</option>
              {availablePitchTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={filterIndoor}
              onChange={(event) => setFilterIndoor(event.target.value as IndoorFilter)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="all">Mọi hình thức</option>
              <option value="indoor">Trong nhà</option>
              <option value="outdoor">Ngoài trời</option>
            </select>

            <select
              value={filterPrice}
              onChange={(event) => setFilterPrice(event.target.value as PriceFilter)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="all">Mọi mức giá</option>
              <option value="under200">Dưới 200k</option>
              <option value="200to400">200k - 400k</option>
              <option value="over400">Trên 400k</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="name">Tên A-Z</option>
              <option value="priceAsc">Giá thấp</option>
              <option value="priceDesc">Giá cao</option>
              <option value="slotsDesc">Nhiều lịch</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-10 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Sân của bạn</h2>
            <p className="text-sm text-slate-600">{filteredPitches.length} sân phù hợp bộ lọc hiện tại</p>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            Trang {page}/{totalPages}
          </span>
        </div>

        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-blue-600" size={34} />
            <p className="text-sm font-semibold text-slate-500">Đang tải danh sách sân...</p>
          </div>
        ) : filteredPitches.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <Building2 className="text-slate-200" size={52} />
            <p className="mt-4 text-sm font-bold text-slate-500">Không có sân phù hợp</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">Thử đổi bộ lọc hoặc thêm sân mới.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="hidden grid-cols-[1.4fr_0.75fr_0.65fr_0.65fr_0.7fr_120px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 xl:grid">
              <span>Sân</span>
              <span>Loại</span>
              <span>Giá từ</span>
              <span>Lịch</span>
              <span>Trạng thái</span>
              <span className="text-right">Thao tác</span>
            </div>

            {paginatedPitches.map((pitch) => {
              const category = getPitchCategory(pitch);
              const price = getMinPrice(pitch);
              const slots = getActiveSlotCount(pitch);
              const shortAddress = pitch.address || 'Chưa cập nhật địa chỉ';

              return (
                <article
                  key={pitch.id}
                  className="grid gap-4 px-5 py-4 transition hover:bg-slate-50 xl:grid-cols-[1.4fr_0.75fr_0.65fr_0.65fr_0.7fr_120px] xl:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <img src={getPitchImage(pitch)} alt={pitch.name || 'Sân'} className="h-full w-full object-cover" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {pitch.name || category?.label || 'Sân thể thao'}
                      </p>

                      <p className="mt-1 flex max-w-[360px] items-center gap-1.5 truncate text-xs font-semibold text-slate-500" title={shortAddress}>
                        <MapPin size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{shortAddress}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">{category?.label || 'Khác'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {getPitchTypeLabel(pitch)} · {pitch.isIndoor ? 'Trong nhà' : 'Ngoài trời'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-blue-600">{price ? formatMoney(price) : 'Chưa có giá'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Giá thấp nhất</p>
                  </div>

                  <div>
                    <p className={`text-sm font-bold ${slots > 0 ? 'text-slate-900' : 'text-amber-600'}`}>
                      {slots > 0 ? `${slots} lịch` : 'Chưa có'}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{slots > 0 ? 'Đang mở lịch' : 'Cần thiết lập'}</p>
                  </div>

                  <div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getPitchStatusClass(pitch)}`}>
                      {getPitchStatusLabel(pitch)}
                    </span>
                  </div>

                  <div className="flex justify-start gap-1 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/field/${pitch.id}`)}
                      className={iconButtonClass}
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết"
                    >
                      <Eye size={17} />
                      {renderTooltip('Xem chi tiết')}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/owner/pitches/edit/${pitch.id}`)}
                      className={iconButtonClass}
                      title="Chỉnh sửa"
                      aria-label="Chỉnh sửa"
                    >
                      <Edit2 size={17} />
                      {renderTooltip('Chỉnh sửa')}
                    </button>

                    {!isPitchPendingApproval(pitch) && (
                      <button
                        type="button"
                        onClick={() => togglePitchStatus(pitch)}
                        className={`group relative grid h-9 w-9 place-items-center rounded-lg transition ${
                          isPitchActive(pitch)
                            ? 'text-amber-500 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={isPitchActive(pitch) ? 'Tạm ngưng' : 'Mở lại'}
                        aria-label={isPitchActive(pitch) ? 'Tạm ngưng' : 'Mở lại'}
                      >
                        {isPitchActive(pitch) ? <PauseCircle size={17} /> : <PlayCircle size={17} />}
                        {renderTooltip(isPitchActive(pitch) ? 'Tạm ngưng' : 'Mở lại')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deletePitch(pitch.id)}
                      className="group relative grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Xóa sân"
                      aria-label="Xóa sân"
                    >
                      <Trash2 size={17} />
                      {renderTooltip('Xóa sân')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {filteredPitches.length > pageSize && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredPitches.length)} / {filteredPitches.length} sân
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Trước
              </button>

              <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{page}/{totalPages}</span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default MyPitches;
