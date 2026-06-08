import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUpDown, ChevronDown, LocateFixed,
  RotateCcw, Search, SlidersHorizontal, Trophy, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { pitchService } from '../../../services/pitchService';
import type { PitchResponse } from '../../../services/pitchService';
import { useVietnamLocations } from '../../../hooks/useVietnamLocations';
import { PitchCard } from '../components/PitchCard';
import exploreSportsBanner from '../../../assets/explore-sports-banner.png';

const sports = [
  { id: '', label: 'Tất cả', tone: 'bg-slate-900 text-white' },
  { id: 'Football', label: 'Bóng đá', tone: 'bg-blue-600 text-white' },
  { id: 'Badminton', label: 'Cầu lông', tone: 'bg-emerald-600 text-white' },
  { id: 'Pickleball', label: 'Pickleball', tone: 'bg-orange-500 text-white' },
  { id: 'Tennis', label: 'Tennis', tone: 'bg-amber-400 text-slate-900' },
  { id: 'Basketball', label: 'Bóng rổ', tone: 'bg-red-500 text-white' },
  { id: 'Volleyball', label: 'Bóng chuyền', tone: 'bg-cyan-600 text-white' },
  { id: 'TableTennis', label: 'Bóng bàn', tone: 'bg-violet-600 text-white' },
];

const pitchTypes: Record<string, Array<{ value: string; label: string }>> = {
  '': [
    { value: '', label: 'Mọi loại sân' }, { value: 'Football5', label: 'Bóng đá 5 người' },
    { value: 'Football7', label: 'Bóng đá 7 người' }, { value: 'Football11', label: 'Bóng đá 11 người' },
    { value: 'Badminton', label: 'Cầu lông' }, { value: 'Pickleball', label: 'Pickleball' },
    { value: 'Tennis', label: 'Tennis' }, { value: 'Basketball', label: 'Bóng rổ' },
    { value: 'Volleyball', label: 'Bóng chuyền' }, { value: 'TableTennis', label: 'Bóng bàn' },
  ],
  Football: [{ value: '', label: 'Mọi sân bóng đá' }, { value: 'Football5', label: 'Bóng đá 5 người' }, { value: 'Football7', label: 'Bóng đá 7 người' }, { value: 'Football11', label: 'Bóng đá 11 người' }],
  Badminton: [{ value: '', label: 'Mọi sân cầu lông' }, { value: 'Badminton', label: 'Cầu lông' }],
  Pickleball: [{ value: '', label: 'Mọi sân pickleball' }, { value: 'Pickleball', label: 'Pickleball' }],
  Tennis: [{ value: '', label: 'Mọi sân tennis' }, { value: 'Tennis', label: 'Tennis' }],
  Basketball: [{ value: '', label: 'Mọi sân bóng rổ' }, { value: 'Basketball', label: 'Bóng rổ' }],
  Volleyball: [{ value: '', label: 'Mọi sân bóng chuyền' }, { value: 'Volleyball', label: 'Bóng chuyền' }],
  TableTennis: [{ value: '', label: 'Mọi sân bóng bàn' }, { value: 'TableTennis', label: 'Bóng bàn' }],
};

const priceOptions = [
  { value: '', label: 'Không giới hạn' }, { value: '100000', label: '100.000đ' },
  { value: '200000', label: '200.000đ' }, { value: '400000', label: '400.000đ' },
  { value: '600000', label: '600.000đ' }, { value: '1000000', label: '1.000.000đ' },
];

const normalizeLocationName = (value?: string) =>
  String(value || '')
    .replace(/^(Tỉnh|Thành phố|TP\.?|Quận|Huyện|Thị xã)\s+/i, '')
    .trim();

const SelectField = ({ label, value, onChange, children, disabled = false }: React.PropsWithChildren<{
  label: string; value: string | number; onChange: (value: string) => void; disabled?: boolean;
}>) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
    <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300">
      {children}
    </select>
  </label>
);

const ExploreFields: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [province, setProvince] = useState('');
  const [provinceCode, setProvinceCode] = useState<number>();
  const [district, setDistrict] = useState('');
  const [districtCode, setDistrictCode] = useState<number>();
  const [sportType, setSportType] = useState('');
  const [pitchType, setPitchType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>();
  const [isNearMe, setIsNearMe] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pitches, setPitches] = useState<PitchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 8;
  const { provinces, districts } = useVietnamLocations(provinceCode, districtCode);

  const options = pitchTypes[sportType] || pitchTypes[''];
  const activeCount = [searchQuery, province, district, sportType, pitchType, minPrice, maxPrice, minRating, isNearMe].filter(Boolean).length;

  useEffect(() => {
    if (!options.some((option) => option.value === pitchType)) setPitchType('');
  }, [options, pitchType]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (isNearMe && !coords) return;
      setIsLoading(true);
      setError('');
      try {
        const result = await pitchService.search({
          searchTerm: searchQuery.trim() || undefined, province: province || undefined, district: district || undefined,
          sportType: sportType || undefined, type: pitchType || undefined,
          minPrice: minPrice || undefined, maxPrice: maxPrice || undefined, minRating: minRating || undefined,
          sortBy, latitude: isNearMe ? coords?.lat : undefined, longitude: isNearMe ? coords?.lng : undefined,
          radiusKm: isNearMe ? 10 : undefined, pageNumber: page, pageSize,
        });
        setPitches(result.items || []);
        setTotalCount(result.totalCount || 0);
        setTotalPages(Math.max(result.totalPages || 1, 1));
      } catch {
        setError('Không thể tải danh sách sân. Vui lòng thử lại sau ít phút.');
      } finally {
        setIsLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery, province, district, sportType, pitchType, minPrice, maxPrice, minRating, sortBy, isNearMe, coords, page]);

  const chips = useMemo(() => [
    province && { key: 'province', label: province, clear: () => { setProvince(''); setProvinceCode(undefined); setDistrict(''); setDistrictCode(undefined); } },
    district && { key: 'district', label: district, clear: () => { setDistrict(''); setDistrictCode(undefined); } },
    pitchType && { key: 'type', label: options.find((item) => item.value === pitchType)?.label || pitchType, clear: () => setPitchType('') },
    minPrice && { key: 'min', label: `Từ ${Number(minPrice).toLocaleString('vi-VN')}đ`, clear: () => setMinPrice('') },
    maxPrice && { key: 'max', label: `Đến ${Number(maxPrice).toLocaleString('vi-VN')}đ`, clear: () => setMaxPrice('') },
    minRating && { key: 'rating', label: `Từ ${minRating} sao`, clear: () => setMinRating('') },
    isNearMe && { key: 'near', label: 'Gần tôi 10km', clear: () => { setIsNearMe(false); setCoords(undefined); } },
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>, [province, district, pitchType, minPrice, maxPrice, minRating, isNearMe, options]);

  const reset = () => {
    setSearchQuery(''); setProvince(''); setProvinceCode(undefined); setDistrict(''); setDistrictCode(undefined);
    setSportType(''); setPitchType(''); setMinPrice(''); setMaxPrice(''); setMinRating('');
    setSortBy('rating_desc'); setIsNearMe(false); setCoords(undefined); setPage(1); setError('');
  };

  const locate = () => {
    if (isNearMe) { setIsNearMe(false); setCoords(undefined); setPage(1); return; }
    if (!navigator.geolocation) { setError('Trình duyệt không hỗ trợ lấy vị trí hiện tại.'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords: current }) => {
        setCoords({ lat: current.latitude, lng: current.longitude });
        setIsNearMe(true);
        setProvince('');
        setProvinceCode(undefined);
        setDistrict('');
        setDistrictCode(undefined);
        setPage(1);
      },
      () => setError('Không thể lấy vị trí. Vui lòng cấp quyền vị trí cho trình duyệt.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24 text-slate-900">
      <header className="border-b border-cyan-100 bg-cyan-50">
        <div className="mx-auto grid max-w-[1680px] gap-8 px-6 py-10 xl:grid-cols-[0.66fr_1.34fr] xl:items-center xl:py-14">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700"><Trophy size={16} /> Khám phá sân thể thao</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 sm:text-6xl">Tìm sân phù hợp.<br /><span className="text-blue-700">Đặt lịch thật nhanh.</span></h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600">Tìm theo tên sân, địa chỉ hoặc khu vực. Bộ lọc phía dưới giúp bạn chọn đúng bộ môn, loại sân và mức giá mong muốn.</p>
            <div className="relative mt-7 rounded-2xl border border-blue-100 bg-white p-2 shadow-xl shadow-blue-950/10">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-700" size={20} />
            <input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }} placeholder="Tìm tên sân, đường, quận hoặc tỉnh thành..." className="h-14 w-full rounded-xl border-0 bg-blue-50 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none ring-blue-200 placeholder:text-slate-400 focus:bg-white focus:ring-4" />
          </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/10">
            <img src={exploreSportsBanner} alt="Đa dạng sân thể thao trên SmartSport" className="block h-auto w-full object-contain" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6">
        <section className="flex gap-2 overflow-x-auto pb-2">
          {sports.map((sport) => <button type="button" key={sport.id} onClick={() => { setSportType(sport.id); setPage(1); }} className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-black transition ${sportType === sport.id ? sport.tone : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'}`}>{sport.label}</button>)}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button type="button" onClick={() => setShowFilters((value) => !value)} className="flex items-center justify-between gap-3 text-left">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><SlidersHorizontal size={18} /></span>
              <span className="flex-1"><strong className="block text-sm">Bộ lọc tìm sân</strong><span className="text-xs font-semibold text-slate-400">{activeCount ? `${activeCount} điều kiện đang áp dụng` : 'Thu hẹp kết quả theo nhu cầu'}</span></span>
              <ChevronDown size={17} className={`text-slate-400 transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={locate} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black transition ${isNearMe ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}><LocateFixed size={15} />{isNearMe ? 'Đang lọc gần tôi' : 'Sân gần tôi'}</button>
              {activeCount > 0 && <button type="button" onClick={reset} title="Đặt lại bộ lọc" className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100"><RotateCcw size={16} /></button>}
            </div>
          </div>
          <AnimatePresence initial={false}>
            {showFilters && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <SelectField label="Tỉnh / Thành" value={provinceCode || ''} onChange={(value) => { const code = Number(value) || undefined; setProvinceCode(code); setProvince(normalizeLocationName(provinces.find((item) => item.code === code)?.name)); setDistrict(''); setDistrictCode(undefined); setIsNearMe(false); setCoords(undefined); setPage(1); }}><option value="">Toàn quốc</option>{provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</SelectField>
              <SelectField label="Quận / Huyện" value={districtCode || ''} disabled={!provinceCode} onChange={(value) => { const code = Number(value) || undefined; setDistrictCode(code); setDistrict(normalizeLocationName(districts.find((item) => item.code === code)?.name)); setIsNearMe(false); setCoords(undefined); setPage(1); }}><option value="">Mọi khu vực</option>{districts.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</SelectField>
              <SelectField label="Loại sân" value={pitchType} onChange={(value) => { setPitchType(value); setPage(1); }}>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectField>
              <SelectField label="Đánh giá" value={minRating} onChange={(value) => { setMinRating(value); setPage(1); }}><option value="">Mọi đánh giá</option><option value="4">Từ 4.0 sao</option><option value="4.5">Từ 4.5 sao</option><option value="5">Đạt 5.0 sao</option></SelectField>
              <SelectField label="Giá tối thiểu" value={minPrice} onChange={(value) => { setMinPrice(value); if (maxPrice && Number(value) > Number(maxPrice)) setMaxPrice(''); setPage(1); }}>{priceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectField>
              <SelectField label="Giá tối đa" value={maxPrice} onChange={(value) => { setMaxPrice(value); if (minPrice && Number(value) < Number(minPrice)) setMinPrice(''); setPage(1); }}>{priceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectField>
              <SelectField label="Sắp xếp" value={sortBy} onChange={(value) => { setSortBy(value); setPage(1); }}><option value="rating_desc">Đánh giá cao nhất</option><option value="price_asc">Giá thấp trước</option><option value="price_desc">Giá cao trước</option><option value="newest">Sân mới nhất</option></SelectField>
            </div></motion.div>}
          </AnimatePresence>
          {chips.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{chips.map((chip) => <button type="button" key={chip.key} onClick={() => { chip.clear(); setPage(1); }} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">{chip.label}<X size={13} /></button>)}</div>}
        </section>

        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Danh sách sân</p><h2 className="mt-1 text-2xl font-black">Chọn sân cho trận đấu tiếp theo</h2></div><p className="flex items-center gap-2 text-xs font-bold text-slate-500"><ArrowUpDown size={14} />{totalCount} kết quả, trang {page}/{totalPages}</p></div>

        <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? Array.from({ length: 8 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="aspect-[16/10] animate-pulse bg-slate-200" /><div className="space-y-3 p-4"><div className="h-4 animate-pulse rounded bg-slate-100" /><div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-8 animate-pulse rounded bg-slate-100" /></div></div>) :
          pitches.length ? pitches.map((pitch) => <PitchCard key={pitch.id} id={pitch.id} name={pitch.name} typeDisplay={pitch.typeDisplay} price={Number(pitch.minPrice || 0).toLocaleString('vi-VN')} rating={pitch.averageRating} reviews={pitch.totalReviews} address={pitch.address?.fullAddress} image={pitch.images?.find((item) => item.isPrimary)?.imageUrl || pitch.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80'} />) :
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center"><Trophy size={48} className="mx-auto text-slate-300" /><h3 className="mt-4 text-xl font-black">Chưa tìm thấy sân phù hợp</h3><p className="mt-2 text-sm font-semibold text-slate-500">Thử bỏ bớt điều kiện hoặc tìm kiếm khu vực lân cận.</p><button type="button" onClick={reset} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-xs font-black text-white hover:bg-blue-800"><RotateCcw size={15} />Đặt lại bộ lọc</button></div>}
        </section>

        {totalPages > 1 && <nav className="mt-9 flex items-center justify-center gap-2" aria-label="Phân trang"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40"><ArrowLeft size={16} /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => <button type="button" key={value} onClick={() => setPage(value)} className={`h-10 min-w-10 rounded-xl px-3 text-xs font-black ${page === value ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{value}</button>)}<button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40"><ArrowRight size={16} /></button></nav>}
      </main>
    </div>
  );
};

export default ExploreFields;
