import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Globe, MapPin, Users, DollarSign, Navigation, Trophy, Check, ChevronDown, 
  Star, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pitchService } from '../../../services/pitchService';
import type { PitchResponse } from '../../../services/pitchService';
import { useVietnamLocations } from '../../../hooks/useVietnamLocations';
import { PitchCard } from '../components/PitchCard';

const CompactDropdown: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: string | number;
  options: { label: string, value: string | number }[];
  onChange: (value: any) => void;
  disabled?: boolean;
  className?: string;
}> = ({ label, icon, value, options, onChange, disabled, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(opt => opt.value === value)?.label || label;
  const hasValue = value !== '' && value !== undefined && value !== null;

  return (
    <div className={`relative ${className}`}>
      <button 
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
          ${disabled 
            ? 'opacity-20 cursor-not-allowed' 
            : isOpen 
              ? 'bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-500/10' 
              : hasValue
                ? 'bg-white border-slate-300 text-slate-900 shadow-sm'
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 shadow-sm'
          }`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="truncate flex-1 text-left">{selectedLabel}</span>
        <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 min-w-[220px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-slate-100 z-50 overflow-hidden p-2"
            >
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {options.map((opt) => (
                  <button
                    key={opt.value} type="button"
                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-bold transition-all mb-1 last:mb-0
                      ${value === opt.value ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {value === opt.value && <Check size={12} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterField: React.FC<{
  label: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, className, children }) => (
  <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    {children}
  </div>
);

const ExploreFields: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [province, setProvince] = useState('');
  const [provinceCode, setProvinceCode] = useState<number | undefined>(undefined);
  const [district, setDistrict] = useState('');
  const [districtCode, setDistrictCode] = useState<number | undefined>(undefined);
  const [sportType, setSportType] = useState('');
  const [pitchType, setPitchType] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('rating_desc');
  const [isNearMe, setIsNearMe] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  const { provinces, districts } = useVietnamLocations(provinceCode, districtCode);
  const [pitches, setPitches] = useState<PitchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    fetchPitches();
  }, [province, district, sportType, pitchType, minPrice, maxPrice, minRating, sortBy, isNearMe, coords, searchQuery, page]);

  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const result = await pitchService.search({
        searchTerm: searchQuery || undefined,
        province: province || undefined,
        district: district || undefined,
        sportType: sportType || undefined,
        type: pitchType || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
        sortBy: sortBy || undefined,
        latitude: isNearMe ? coords?.lat : undefined,
        longitude: isNearMe ? coords?.lng : undefined,
        radiusKm: isNearMe ? 10 : undefined,
        pageNumber: page,
        pageSize: pageSize
      }) as any;
      
      const items = result?.items || result?.Items || [];
      const total = result?.totalCount ?? result?.TotalCount ?? items.length;
      const totalP = result?.totalPages ?? result?.TotalPages ?? Math.ceil(total / pageSize);
      
      setPitches(items);
      setTotalCount(total);
      setTotalPages(totalP);
    } catch (error) {
      console.error("Failed to fetch pitches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNearMe = () => {
    if (!isNearMe) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setIsNearMe(true);
        }, (error) => console.error(error));
      }
    } else {
      setIsNearMe(false);
      setCoords(null);
    }
  };

  const sports = [
    { id: '', label: 'Tất cả' },
    { id: 'Football', label: 'Bóng đá' },
    { id: 'Badminton', label: 'Cầu lông' },
    { id: 'Tennis', label: 'Tennis' },
    { id: 'Pickleball', label: 'Pickleball' },
    { id: 'Basketball', label: 'Bóng rổ' },
    { id: 'Volleyball', label: 'Bóng chuyền' },
    { id: 'TableTennis', label: 'Bóng bàn' }
  ];

  const sportLabelById = sports.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.label;
    return acc;
  }, {});

  const pitchTypeLabelByValue: Record<string, string> = {
    Football5: 'Bóng đá 5',
    Football7: 'Bóng đá 7',
    Football11: 'Bóng đá 11',
    Badminton: 'Cầu lông',
    Tennis: 'Tennis',
    Pickleball: 'Pickleball',
    Basketball: 'Bóng rổ',
    Volleyball: 'Bóng chuyền',
    TableTennis: 'Bóng bàn'
  };

  const pitchTypeOptionsBySport: Record<string, { label: string; value: string }[]> = {
    '': [
      { label: 'Mọi quy mô', value: '' },
      { label: 'Bóng đá 5', value: 'Football5' },
      { label: 'Bóng đá 7', value: 'Football7' },
      { label: 'Bóng đá 11', value: 'Football11' },
      { label: 'Cầu lông', value: 'Badminton' },
      { label: 'Tennis', value: 'Tennis' },
      { label: 'Pickleball', value: 'Pickleball' },
      { label: 'Bóng rổ', value: 'Basketball' },
      { label: 'Bóng chuyền', value: 'Volleyball' },
      { label: 'Bóng bàn', value: 'TableTennis' }
    ],
    Football: [
      { label: 'Bóng đá 5', value: 'Football5' },
      { label: 'Bóng đá 7', value: 'Football7' },
      { label: 'Bóng đá 11', value: 'Football11' }
    ],
    Badminton: [
      { label: 'Cầu lông', value: 'Badminton' }
    ],
    Tennis: [
      { label: 'Tennis', value: 'Tennis' }
    ],
    Pickleball: [
      { label: 'Pickleball', value: 'Pickleball' }
    ],
    Basketball: [
      { label: 'Bóng rổ', value: 'Basketball' }
    ],
    Volleyball: [
      { label: 'Bóng chuyền', value: 'Volleyball' }
    ],
    TableTennis: [
      { label: 'Bóng bàn', value: 'TableTennis' }
    ]
  };

  const pitchTypeOptions = useMemo(
    () => pitchTypeOptionsBySport[sportType] ?? pitchTypeOptionsBySport[''],
    [sportType]
  );

  useEffect(() => {
    if (pitchType && !pitchTypeOptions.some(opt => opt.value === pitchType)) {
      setPitchType('');
    }
  }, [pitchType, pitchTypeOptions]);

  const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

  const minPriceOptions = [
    { label: 'Không giới hạn', value: '' },
    { label: 'Từ 200k', value: 200000 },
    { label: 'Từ 400k', value: 400000 },
    { label: 'Từ 600k', value: 600000 },
    { label: 'Từ 800k', value: 800000 },
    { label: 'Từ 1 triệu', value: 1000000 }
  ];

  const maxPriceOptions = [
    { label: 'Không giới hạn', value: '' },
    { label: 'Đến 200k', value: 200000 },
    { label: 'Đến 400k', value: 400000 },
    { label: 'Đến 600k', value: 600000 },
    { label: 'Đến 800k', value: 800000 },
    { label: 'Đến 1 triệu', value: 1000000 },
    { label: 'Đến 2 triệu', value: 2000000 }
  ];

  const handleMinPriceChange = (val: number | '') => {
    const nextValue = val === '' ? undefined : val;
    setMinPrice(nextValue);
    if (nextValue && maxPrice && nextValue > maxPrice) {
      setMaxPrice(undefined);
    }
    setPage(1);
  };

  const handleMaxPriceChange = (val: number | '') => {
    const nextValue = val === '' ? undefined : val;
    setMaxPrice(nextValue);
    if (nextValue && minPrice && nextValue < minPrice) {
      setMinPrice(undefined);
    }
    setPage(1);
  };

  const resetFilters = () => {
    setSportType('');
    setPitchType('');
    setProvinceCode(undefined);
    setProvince('');
    setDistrictCode(undefined);
    setDistrict('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinRating(undefined);
    setSearchQuery('');
    setIsNearMe(false);
    setCoords(null);
    setSortBy('rating_desc');
    setPage(1);
  };

  const activeFilters = [
    searchQuery ? { key: 'search', label: `Từ khóa: ${searchQuery}`, onClear: () => setSearchQuery('') } : null,
    sportType ? { key: 'sport', label: `Môn: ${sportLabelById[sportType]}`, onClear: () => setSportType('') } : null,
    pitchType ? { key: 'pitch', label: `Loại sân: ${pitchTypeLabelByValue[pitchType] || pitchType}`, onClear: () => setPitchType('') } : null,
    province ? { key: 'province', label: `Tỉnh/Thành: ${province}`, onClear: () => { setProvince(''); setProvinceCode(undefined); setDistrict(''); setDistrictCode(undefined); } } : null,
    district ? { key: 'district', label: `Quận/Huyện: ${district}`, onClear: () => { setDistrict(''); setDistrictCode(undefined); } } : null,
    minPrice ? { key: 'minPrice', label: `Từ ${formatPrice(minPrice)}đ`, onClear: () => setMinPrice(undefined) } : null,
    maxPrice ? { key: 'maxPrice', label: `Đến ${formatPrice(maxPrice)}đ`, onClear: () => setMaxPrice(undefined) } : null,
    minRating ? { key: 'rating', label: `Từ ${minRating.toFixed(1)} sao`, onClear: () => setMinRating(undefined) } : null,
    isNearMe ? { key: 'near', label: 'Gần tôi (10km)', onClear: () => { setIsNearMe(false); setCoords(null); } } : null
  ].filter(Boolean) as Array<{ key: string; label: string; onClear: () => void }>;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-20 pt-32">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <header className="mb-12 space-y-10">
          <div className="space-y-3">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.8] text-slate-900">Explore. <br/><span className="text-blue-600">SmartSport</span></h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em]">Hệ thống sân đấu tiêu chuẩn quốc tế</p>
          </div>

          <div className="space-y-8">
            <div className="relative group w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />
              <input 
                type="text" placeholder="Tìm tên sân, khu vực hoặc môn thể thao..." value={searchQuery} 
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-6 pl-16 pr-6 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Môn thể thao</p>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-visible scrollbar-hide py-2 px-1 -mx-1">
                {sports.map(sport => {
                  const isActive = sportType === sport.id;
                  return (
                    <button 
                      key={sport.id} onClick={() => { setSportType(sport.id); setPage(1); }}
                      aria-pressed={isActive}
                      className={`px-4 py-2 rounded-full font-bold text-xs transition-all border shrink-0
                        ${isActive 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'}`}
                    >
                      {sport.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{totalCount}</p>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Sân khả dụng</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <FilterField label="Tỉnh / Thành">
                <CompactDropdown 
                  label="Chọn tỉnh" icon={<Globe size={14} className="text-blue-500" />} value={provinceCode || ''}
                  options={[{ label: 'Toàn quốc', value: '' }, ...provinces.map(p => ({ label: p.name, value: p.code }))]}
                  onChange={(code) => {
                    const p = provinces.find(x => x.code === code);
                    setProvinceCode(code || undefined); setProvince(p?.name || '');
                    setDistrictCode(undefined); setDistrict(''); setPage(1);
                  }}
                />
              </FilterField>
              <FilterField label="Quận / Huyện">
                <CompactDropdown 
                  label="Chọn quận" icon={<MapPin size={14} className="text-red-500" />} disabled={!provinceCode} value={districtCode || ''}
                  options={[{ label: 'Mọi khu vực', value: '' }, ...districts.map(d => ({ label: d.name, value: d.code }))]}
                  onChange={(code) => {
                    const d = districts.find(x => x.code === code);
                    setDistrictCode(code || undefined); setDistrict(d?.name || ''); setPage(1);
                  }}
                />
              </FilterField>
              <FilterField label="Loại sân">
                <CompactDropdown 
                  label="Mọi loại" icon={<Users size={14} className="text-emerald-500" />} value={pitchType}
                  options={pitchTypeOptions}
                  onChange={(val) => { setPitchType(val); setPage(1); }}
                />
              </FilterField>
              <FilterField label="Giá tối thiểu">
                <CompactDropdown 
                  label="Không giới hạn" icon={<DollarSign size={14} className="text-amber-500" />} value={minPrice || ''}
                  options={minPriceOptions}
                  onChange={handleMinPriceChange}
                />
              </FilterField>
              <FilterField label="Giá tối đa">
                <CompactDropdown 
                  label="Không giới hạn" icon={<DollarSign size={14} className="text-amber-500" />} value={maxPrice || ''}
                  options={maxPriceOptions}
                  onChange={handleMaxPriceChange}
                />
              </FilterField>
              <FilterField label="Xếp hạng">
                <CompactDropdown 
                  label="Mọi đánh giá" icon={<Star size={14} className="text-yellow-500" />} value={minRating || ''}
                  options={[
                    { label: 'Mọi đánh giá', value: '' }, 
                    { label: 'Từ 4.0 sao', value: 4 }, 
                    { label: 'Từ 4.5 sao', value: 4.5 }, 
                    { label: 'Xuất sắc (5.0)', value: 5 }
                  ]}
                  onChange={(val) => { setMinRating(val || undefined); setPage(1); }}
                />
              </FilterField>
              <FilterField label="Sắp xếp">
                <CompactDropdown 
                  label="Hàng đầu" icon={<ArrowUpDown size={14} className="text-blue-600" />} value={sortBy}
                  options={[
                    { label: 'Hàng đầu', value: 'rating_desc' }, 
                    { label: 'Giá: Thấp - Cao', value: 'price_asc' }, 
                    { label: 'Giá: Cao - Thấp', value: 'price_desc' },
                    { label: 'Mới nhất', value: 'newest' }
                  ]}
                  onChange={(val) => { setSortBy(val); setPage(1); }}
                />
              </FilterField>
              <FilterField label="Vị trí">
                <button
                  type="button"
                  onClick={() => { toggleNearMe(); setPage(1); }}
                  aria-pressed={isNearMe}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all
                    ${isNearMe
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'}`}
                >
                  <Navigation size={14} />
                  Gần tôi (10km)
                </button>
              </FilterField>
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map(filter => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => { filter.onClear(); setPage(1); }}
                    aria-label={`Bỏ lọc: ${filter.label}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-all"
                  >
                    <span className="truncate max-w-[220px]">{filter.label}</span>
                    <span className="text-slate-400">x</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Grid */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 pt-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-6">
                <div className="aspect-[4/5] bg-slate-50 rounded-[2.5rem] animate-pulse" />
                <div className="h-4 bg-slate-50 rounded-full w-3/4 animate-pulse" />
              </div>
            ))
          ) : pitches.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {pitches.map((pitch, index) => (
                <motion.div 
                  key={pitch.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }}
                >
                  <PitchCard 
                    id={pitch.id} name={pitch.name} typeDisplay={pitch.typeDisplay} 
                    price={new Intl.NumberFormat('vi-VN').format(pitch.minPrice || 0)} 
                    rating={pitch.averageRating} reviews={pitch.totalReviews}
                    image={pitch.images?.find(img => img.isPrimary)?.imageUrl || pitch.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800"}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full py-40 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
              <Trophy size={64} className="mx-auto mb-6 text-slate-200" />
              <h3 className="text-3xl font-black text-slate-900 mb-2">Không tìm thấy sân</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm khác nhé!</p>
              <button 
                onClick={resetFilters} 
                className="mt-10 px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-600/20 hover:scale-105 transition-all"
              >
                Đặt lại toàn bộ lọc
              </button>
            </div>
          )}
        </main>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 py-24">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1} onClick={() => setPage(i + 1)}
                className={`w-12 h-12 rounded-2xl font-black text-xs transition-all border-2
                  ${page === i + 1 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-blue-500/20 hover:text-blue-500'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreFields;
