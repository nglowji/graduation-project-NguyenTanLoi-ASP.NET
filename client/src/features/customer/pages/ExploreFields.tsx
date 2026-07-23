import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, LocateFixed, RotateCcw, Search,
  SlidersHorizontal, Trophy, X, ChevronDown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { pitchService } from '../../../services/pitchService';
import type { PitchResponse } from '../../../services/pitchService';
import { normalizeLocationName, useVietnamLocations } from '../../../hooks/useVietnamLocations';
import { PitchCard } from '../components/PitchCard';
import exploreBanner from '../../../assets/banner-field.png';

/* ─── Sport config ─── */
const sports = [
  { id: '', label: 'Tất cả',    icon: '🏟️', active: 'bg-slate-900 text-white border-slate-900' },
  { id: 'Football',    label: 'Bóng đá',    icon: '⚽', active: 'bg-blue-600 text-white border-blue-600' },
  { id: 'Badminton',  label: 'Cầu lông',   icon: '🏸', active: 'bg-emerald-600 text-white border-emerald-600' },
  { id: 'Pickleball', label: 'Pickleball', icon: '🎾', active: 'bg-orange-500 text-white border-orange-500' },
  { id: 'Tennis',     label: 'Quần vợt',   icon: '🎾', active: 'bg-amber-500 text-white border-amber-500' },
  { id: 'Basketball', label: 'Bóng rổ',    icon: '🏀', active: 'bg-red-500 text-white border-red-500' },
  { id: 'Volleyball', label: 'Bóng chuyền',icon: '🏐', active: 'bg-cyan-600 text-white border-cyan-600' },
  { id: 'TableTennis',label: 'Bóng bàn',   icon: '🏓', active: 'bg-violet-600 text-white border-violet-600' },
];

const pitchTypes: Record<string, Array<{ value: string; label: string }>> = {
  '': [
    { value: '', label: 'Mọi loại sân' },
    { value: 'Football5', label: 'Bóng đá 5 người' },
    { value: 'Football7', label: 'Bóng đá 7 người' },
    { value: 'Football11', label: 'Bóng đá 11 người' },
    { value: 'Badminton', label: 'Cầu lông' },
    { value: 'Pickleball', label: 'Pickleball' },
    { value: 'Tennis', label: 'Tennis' },
    { value: 'Basketball', label: 'Bóng rổ' },
    { value: 'Volleyball', label: 'Bóng chuyền' },
    { value: 'TableTennis', label: 'Bóng bàn' },
  ],
  Football: [{ value: '', label: 'Mọi sân bóng đá' }, { value: 'Football5', label: '5 người' }, { value: 'Football7', label: '7 người' }, { value: 'Football11', label: '11 người' }],
  Badminton:   [{ value: '', label: 'Mọi sân' }, { value: 'Badminton', label: 'Cầu lông' }],
  Pickleball:  [{ value: '', label: 'Mọi sân' }, { value: 'Pickleball', label: 'Pickleball' }],
  Tennis:      [{ value: '', label: 'Mọi sân' }, { value: 'Tennis', label: 'Tennis' }],
  Basketball:  [{ value: '', label: 'Mọi sân' }, { value: 'Basketball', label: 'Bóng rổ' }],
  Volleyball:  [{ value: '', label: 'Mọi sân' }, { value: 'Volleyball', label: 'Bóng chuyền' }],
  TableTennis: [{ value: '', label: 'Mọi sân' }, { value: 'TableTennis', label: 'Bóng bàn' }],
};

const priceOptions = [
  { value: '', label: 'Không giới hạn' },
  { value: '100000', label: '100.000đ' },
  { value: '200000', label: '200.000đ' },
  { value: '400000', label: '400.000đ' },
  { value: '600000', label: '600.000đ' },
  { value: '1000000', label: '1.000.000đ' },
];


/* ─── Sub-components ─── */
const SelectField = ({ label, value, onChange, children, disabled = false }: React.PropsWithChildren<{
  label: string; value: string | number; onChange: (value: string) => void; disabled?: boolean;
}>) => (
  <label className="block">
    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
    >
      {children}
    </select>
  </label>
);

const SkeletonCard = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="aspect-[16/10] animate-pulse bg-slate-100" />
    <div className="space-y-3 p-4">
      <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
      <div className="h-4 animate-pulse rounded bg-slate-100" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-8 animate-pulse rounded bg-slate-100" />
    </div>
  </div>
);

/* ─── Main Component ─── */
const ExploreFields: React.FC = () => {
  const [searchQuery, setSearchQuery]   = useState('');
  const [province, setProvince]         = useState('');
  const [provinceCode, setProvinceCode] = useState<number>();
  const [district, setDistrict]         = useState('');
  const [districtCode, setDistrictCode] = useState<number>();
  const [sportType, setSportType]       = useState('');
  const [pitchType, setPitchType]       = useState('');
  const [minPrice, setMinPrice]         = useState('');
  const [maxPrice, setMaxPrice]         = useState('');
  const [minRating, setMinRating]       = useState('');
  const [sortBy, setSortBy]             = useState('rating_desc');
  const [coords, setCoords]             = useState<{ lat: number; lng: number }>();
  const [isNearMe, setIsNearMe]         = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [pitches, setPitches]           = useState<PitchResponse[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState('');
  const [page, setPage]                 = useState(1);
  const [totalCount, setTotalCount]     = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const pageSize = 8;

  const { provinces, districts } = useVietnamLocations(provinceCode, districtCode);
  const options = pitchTypes[sportType] || pitchTypes[''];

  const activeCount = [searchQuery, province, district, sportType, pitchType, minPrice, maxPrice, minRating, isNearMe].filter(Boolean).length;

  useEffect(() => {
    if (!options.some((o) => o.value === pitchType)) setPitchType('');
  }, [options, pitchType]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (isNearMe && !coords) return;
      setIsLoading(true);
      setError('');
      try {
        const result = await pitchService.search({
          searchTerm: searchQuery.trim() || undefined,
          province: province || undefined,
          district: district || undefined,
          sportType: sportType || undefined,
          type: pitchType || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          minRating: minRating || undefined,
          sortBy,
          latitude: isNearMe ? coords?.lat : undefined,
          longitude: isNearMe ? coords?.lng : undefined,
          radiusKm: isNearMe ? 10 : undefined,
          pageNumber: page,
          pageSize,
        });
        setPitches(result.items || []);
        setTotalCount(result.totalCount || 0);
        setTotalPages(Math.max(result.totalPages || 1, 1));
      } catch {
        setError('Không thể tải danh sách sân. Vui lòng thử lại sau ít phút.');
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery, province, district, sportType, pitchType, minPrice, maxPrice, minRating, sortBy, isNearMe, coords, page]);

  const chips = useMemo(() => [
    province   && { key: 'province', label: province, clear: () => { setProvince(''); setProvinceCode(undefined); setDistrict(''); setDistrictCode(undefined); } },
    district   && { key: 'district', label: district, clear: () => { setDistrict(''); setDistrictCode(undefined); } },
    pitchType  && { key: 'type',    label: options.find((o) => o.value === pitchType)?.label || pitchType, clear: () => setPitchType('') },
    minPrice   && { key: 'min',     label: `Từ ${Number(minPrice).toLocaleString('vi-VN')}đ`, clear: () => setMinPrice('') },
    maxPrice   && { key: 'max',     label: `Đến ${Number(maxPrice).toLocaleString('vi-VN')}đ`, clear: () => setMaxPrice('') },
    minRating  && { key: 'rating',  label: `Từ ${minRating} sao`, clear: () => setMinRating('') },
    isNearMe   && { key: 'near',    label: 'Gần tôi 10km', clear: () => { setIsNearMe(false); setCoords(undefined); } },
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>, [province, district, pitchType, minPrice, maxPrice, minRating, isNearMe, options]);

  const reset = () => {
    setSearchQuery(''); setProvince(''); setProvinceCode(undefined); setDistrict(''); setDistrictCode(undefined);
    setSportType(''); setPitchType(''); setMinPrice(''); setMaxPrice(''); setMinRating('');
    setSortBy('rating_desc'); setIsNearMe(false); setCoords(undefined); setPage(1); setError('');
  };

  const locate = () => {
    if (isNearMe) { setIsNearMe(false); setCoords(undefined); setPage(1); return; }
    if (!navigator.geolocation) { setError('Trình duyệt không hỗ trợ lấy vị trí.'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => { setCoords({ lat: c.latitude, lng: c.longitude }); setIsNearMe(true); setProvince(''); setProvinceCode(undefined); setDistrict(''); setDistrictCode(undefined); setPage(1); },
      () => setError('Không thể lấy vị trí. Vui lòng cấp quyền vị trí cho trình duyệt.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-20 text-slate-900">

      {/* ── Compact header ── */}
      <div className="relative overflow-hidden border-b border-blue-100 bg-cover bg-center px-4 py-18 sm:px-6 sm:py-24" style={{ backgroundImage: `url(${exploreBanner})` }}>
        <div className="relative mx-auto max-w-[1440px]">
          <div className="max-w-2xl">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600">
                <Trophy size={13} /> Khám phá sân thể thao
              </p>
              <h1 className="mt-2 max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Tìm sân, đặt lịch ngay
              </h1>
              <p className="mt-4 max-w-lg text-sm font-bold leading-6 text-slate-700 sm:text-base">Chọn đúng sân, xem lịch trống và giữ chỗ trong vài phút.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6">
        <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-1 shadow-sm">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Tìm theo tên sân, đường, quận hoặc tỉnh thành"
              className="h-14 w-full rounded-[14px] border border-transparent bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* ── Sport pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {sports.map((sport) => {
            const isActive = sportType === sport.id;
            return (
              <button
                key={sport.id}
                type="button"
                onClick={() => { setSportType(sport.id); setPage(1); }}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition-all ${
                  isActive ? sport.active + ' shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{sport.icon}</span>
                {sport.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chọn nhanh</span>
          <button type="button" onClick={() => { setMinRating('4'); setPage(1); }} className={`rounded-full px-3 py-1.5 text-xs font-black transition ${minRating === '4' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>Từ 4 sao</button>
          <button type="button" onClick={() => { setMaxPrice('200000'); setPage(1); }} className={`rounded-full px-3 py-1.5 text-xs font-black transition ${maxPrice === '200000' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>Dưới 200.000đ</button>
          <button type="button" onClick={() => { setSortBy('newest'); setPage(1); }} className={`rounded-full px-3 py-1.5 text-xs font-black transition ${sortBy === 'newest' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Sân mới</button>
          <button type="button" onClick={locate} className={`rounded-full px-3 py-1.5 text-xs font-black transition ${isNearMe ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>Gần tôi</button>
        </div>

        {/* ── Filter panel ── */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <SlidersHorizontal size={16} />
              </span>
              <span>
                <strong className="block text-sm font-black text-slate-900">Bộ lọc</strong>
                <span className="text-xs font-semibold text-slate-400">
                  {activeCount ? `${activeCount} điều kiện đang áp dụng` : 'Thu hẹp kết quả theo nhu cầu'}
                </span>
              </span>
              <ChevronDown size={16} className={`ml-auto text-slate-400 transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={locate}
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition ${
                  isNearMe ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LocateFixed size={14} />
                {isNearMe ? 'Gần tôi' : 'Sân gần tôi'}
              </button>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  title="Đặt lại"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid gap-4 border-t border-slate-100 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SelectField label="Tỉnh / Thành" value={provinceCode || ''} onChange={(v) => {
                    const code = Number(v) || undefined;
                    setProvinceCode(code);
                    setProvince(normalizeLocationName(provinces.find((p) => p.code === code)?.name));
                    setDistrict(''); setDistrictCode(undefined); setIsNearMe(false); setCoords(undefined); setPage(1);
                  }}>
                    <option value="">Toàn quốc</option>
                    {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </SelectField>

                  <SelectField label="Quận / Huyện" value={districtCode || ''} disabled={!provinceCode} onChange={(v) => {
                    const code = Number(v) || undefined;
                    setDistrictCode(code);
                    setDistrict(normalizeLocationName(districts.find((d) => d.code === code)?.name));
                    setIsNearMe(false); setCoords(undefined); setPage(1);
                  }}>
                    <option value="">Mọi khu vực</option>
                    {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                  </SelectField>

                  <SelectField label="Loại sân" value={pitchType} onChange={(v) => { setPitchType(v); setPage(1); }}>
                    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </SelectField>

                  <SelectField label="Đánh giá" value={minRating} onChange={(v) => { setMinRating(v); setPage(1); }}>
                    <option value="">Mọi đánh giá</option>
                    <option value="4">Từ 4.0 sao</option>
                    <option value="4.5">Từ 4.5 sao</option>
                    <option value="5">Đạt 5.0 sao</option>
                  </SelectField>

                  <SelectField label="Giá tối thiểu" value={minPrice} onChange={(v) => { setMinPrice(v); if (maxPrice && Number(v) > Number(maxPrice)) setMaxPrice(''); setPage(1); }}>
                    {priceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </SelectField>

                  <SelectField label="Giá tối đa" value={maxPrice} onChange={(v) => { setMaxPrice(v); if (minPrice && Number(v) < Number(minPrice)) setMinPrice(''); setPage(1); }}>
                    {priceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </SelectField>

                  <SelectField label="Sắp xếp" value={sortBy} onChange={(v) => { setSortBy(v); setPage(1); }}>
                    <option value="rating_desc">Đánh giá cao nhất</option>
                    <option value="price_asc">Giá thấp trước</option>
                    <option value="price_desc">Giá cao trước</option>
                    <option value="newest">Sân mới nhất</option>
                  </SelectField>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => { chip.clear(); setPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-700 hover:bg-blue-100 transition"
                >
                  {chip.label}
                  <X size={11} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* ── Results header ── */}
        <div className="mt-6 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Danh sách sân</p>
            <h2 className="mt-0.5 text-xl font-black text-slate-900">
              {isLoading ? 'Đang tìm...' : `${totalCount} sân phù hợp`}
            </h2>
          </div>
          <div className="flex items-center gap-3"><p className="text-xs font-semibold text-slate-400">Trang {page} / {totalPages}</p><select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 outline-none focus:border-blue-300"><option value="rating_desc">Điểm cao nhất</option><option value="price_asc">Giá thấp trước</option><option value="price_desc">Giá cao trước</option><option value="newest">Sân mới nhất</option></select></div>
        </div>

        {/* ── Grid ── */}
        <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : pitches.length
              ? pitches.map((pitch) => (
                  <PitchCard
                    key={pitch.id}
                    id={pitch.id}
                    name={pitch.name}
                    typeDisplay={pitch.typeDisplay}
                    price={Number(pitch.minPrice || 0).toLocaleString('vi-VN')}
                    rating={pitch.averageRating}
                    reviews={pitch.totalReviews}
                    address={pitch.address?.fullAddress}
                    image={
                      pitch.images?.find((img) => img.isPrimary)?.imageUrl ||
                      pitch.images?.[0]?.imageUrl ||
                      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80'
                    }
                  />
                ))
              : (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
                  <Trophy size={40} className="mx-auto text-slate-200" />
                  <h3 className="mt-4 text-lg font-black text-slate-900">Chưa tìm thấy sân phù hợp</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Thử bỏ bớt điều kiện hoặc tìm khu vực lân cận.</p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700"
                  >
                    <RotateCcw size={14} /> Đặt lại bộ lọc
                  </button>
                </div>
              )
          }
        </section>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Phân trang">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((v) => Math.max(v - 1, 1))}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 disabled:opacity-40"
            >
              <ArrowLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-10 min-w-[40px] rounded-xl px-3 text-xs font-black transition ${
                  page === p ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((v) => Math.min(v + 1, totalPages))}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 disabled:opacity-40"
            >
              <ArrowRight size={15} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default ExploreFields;
