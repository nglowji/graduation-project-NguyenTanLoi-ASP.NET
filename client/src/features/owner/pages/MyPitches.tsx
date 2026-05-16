import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Edit2,
  MapPin,
  Plus,
  Search,
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

const MyPitches: React.FC = () => {
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<PitchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSport, setFilterSport] = useState<string>('all');
  const [filterIndoor, setFilterIndoor] = useState<'all' | 'indoor' | 'outdoor'>('all');

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
      const matchesSearch = !keyword ||
        String(pitch.name || '').toLowerCase().includes(keyword) ||
        String(pitch.address || '').toLowerCase().includes(keyword);
      const matchesSport = filterSport === 'all' || category?.id === filterSport;
      const matchesIndoor = filterIndoor === 'all' || (filterIndoor === 'indoor' ? pitch.isIndoor : !pitch.isIndoor);

      return matchesSearch && matchesSport && matchesIndoor;
    });
  }, [pitches, search, filterSport, filterIndoor]);

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
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto_auto] xl:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên sân hoặc địa chỉ..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <select
            value={filterSport}
            onChange={(event) => setFilterSport(event.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-black uppercase tracking-widest text-slate-600 outline-none transition focus:border-blue-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="all">Tất cả môn</option>
            {SPORT_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>

          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['all', 'indoor', 'outdoor'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterIndoor(mode)}
                className={`h-10 rounded-lg px-4 text-[10px] font-black uppercase tracking-widest transition ${
                  filterIndoor === mode
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode === 'all' ? 'Tất cả' : mode === 'indoor' ? 'Trong nhà' : 'Ngoài trời'}
              </button>
            ))}
          </div>
        </div>

        {(search || filterSport !== 'all' || filterIndoor !== 'all') && (
          <button
            type="button"
            onClick={() => { setSearch(''); setFilterSport('all'); setFilterIndoor('all'); }}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 transition hover:bg-red-600 hover:text-white"
          >
            <X size={14} />
            Xóa lọc
          </button>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPitches.map((pitch) => (
              <div key={pitch.id} className="grid gap-4 p-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 xl:grid-cols-[minmax(280px,1fr)_180px_160px_140px_120px] xl:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    <img src={getPitchImage(pitch)} alt={pitch.name || 'Sân'} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-950 dark:text-white">{pitch.name || 'Sân chưa đặt tên'}</p>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-bold text-slate-500">
                      <MapPin size={13} className="shrink-0 text-red-500" />
                      {pitch.address || 'Chưa cập nhật địa chỉ'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 ring-1 ring-blue-100">
                    {getPitchCategory(pitch)?.label || 'Thể thao'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {getPitchTypeLabel(pitch)}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giá từ</p>
                  <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{formatMoney(getMinPrice(pitch))}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${
                    pitch.isIndoor ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                  }`}>
                    {pitch.isIndoor ? 'Trong nhà' : 'Ngoài trời'}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-600">
                    <Star size={14} className="fill-current" />
                    {Number(pitch.averageRating || 0).toFixed(1)}
                  </div>
                </div>

                <div className="flex justify-start gap-2 xl:justify-end">
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
        )}
      </section>
    </div>
  );
};

export default MyPitches;
