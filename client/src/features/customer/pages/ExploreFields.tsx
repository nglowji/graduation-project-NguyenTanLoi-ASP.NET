import React, { useState, useEffect } from 'react';
import { Search, Globe, MapPin, Users, DollarSign, Navigation, Trophy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pitchService } from '../../../services/pitchService';
import type { PitchResponse } from '../../../services/pitchService';
import { useVietnamLocations } from '../../../hooks/useVietnamLocations';
import { PitchCard } from '../components/PitchCard';

const CustomDropdown: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: string | number;
  options: { label: string, value: string | number }[];
  onChange: (value: any) => void;
  disabled?: boolean;
}> = ({ label, icon, value, options, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(opt => opt.value === value)?.label || label;

  return (
    <div className="relative flex-1 min-w-[200px]">
      <button 
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 border-2
          ${disabled 
            ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed' 
            : isOpen 
              ? 'bg-white border-blue-500 text-blue-600 shadow-2xl shadow-blue-500/10' 
              : 'bg-white dark:bg-[#11131a] border-slate-100 dark:border-white/5 text-slate-500 hover:border-blue-500/30 hover:text-blue-500'
          }`}
      >
        <div className="flex items-center gap-3">
          <span className={isOpen ? 'text-blue-500' : 'text-slate-400'}>{icon}</span>
          <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#1a1c26] rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/5 z-50 overflow-hidden"
            >
              <div className="max-h-[350px] overflow-y-auto p-3 custom-scrollbar">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-sm transition-all
                      ${value === opt.value 
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                        : 'text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                  >
                    {opt.label}
                    {value === opt.value && <Check size={16} strokeWidth={3} />}
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

const ExploreFields: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [province, setProvince] = useState('');
  const [provinceCode, setProvinceCode] = useState<number | undefined>(undefined);
  const [district, setDistrict] = useState('');
  const [districtCode, setDistrictCode] = useState<number | undefined>(undefined);
  const [sportType, setSportType] = useState('');
  const [pitchType, setPitchType] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
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
  }, [province, district, sportType, pitchType, maxPrice, minRating, isNearMe, coords, searchQuery, page]);

  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const result = await pitchService.search({
        searchTerm: searchQuery || undefined,
        province: province || undefined,
        district: district || undefined,
        sportType: sportType || undefined,
        type: pitchType || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
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
      setTimeout(() => setIsLoading(false), 500);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b10] animate-in fade-in duration-1000">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,_rgba(37,99,235,0.08),transparent),_radial-gradient(circle_at_20%_80%,_rgba(16,185,129,0.05),transparent)]" />
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
                Discovery <span className="text-blue-600">Pitches</span>
              </h1>
              <p className="text-xl font-bold text-slate-400 uppercase tracking-[0.3em] mb-12">Hệ thống sân đấu tiêu chuẩn quốc tế</p>
            </motion.div>

            <div className="relative group">
              <form 
                onSubmit={(e) => { e.preventDefault(); setPage(1); fetchPitches(); }} 
                className="flex items-center bg-white dark:bg-[#11131a] p-3 rounded-[3rem] shadow-2xl shadow-blue-500/10 border-2 border-slate-100 dark:border-white/5 group-focus-within:border-blue-500/30 transition-all"
              >
                <div className="flex-1 flex items-center pl-8">
                  <Search size={28} className="text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Tìm tên sân, khu vực hoặc môn thể thao..." 
                    value={searchQuery} 
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="w-full bg-transparent border-none px-6 py-6 text-xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none"
                  />
                </div>
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-12 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-600/20"
                >
                  Tìm ngay
                </button>
              </form>
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              {[
                { id: '', label: 'Tất cả', icon: '🌟' },
                { id: 'Football', label: 'Bóng đá', icon: '⚽' },
                { id: 'Badminton', label: 'Cầu lông', icon: '🏸' },
                { id: 'Tennis', label: 'Tennis', icon: '🎾' },
                { id: 'Pickleball', label: 'Pickleball', icon: '🥒' },
                { id: 'Basketball', label: 'Bóng rổ', icon: '🏀' }
              ].map(sport => (
                <button 
                  key={sport.id} 
                  onClick={() => { setSportType(sport.id); setPage(1); }} 
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2
                    ${sportType === sport.id 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20' 
                      : 'bg-white dark:bg-[#11131a] text-slate-500 dark:text-white/40 border-slate-100 dark:border-white/5 hover:border-blue-500/30 hover:text-blue-500'}`}
                >
                  <span className="text-xl">{sport.icon}</span> {sport.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Section */}
      <main className="max-w-[1600px] mx-auto px-6 py-12 space-y-16">
        {/* Filters Ribbon */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 p-4 bg-white dark:bg-[#11131a] rounded-[3.5rem] border-2 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5">
          <div className="flex-1 flex flex-wrap items-center gap-4">
            <CustomDropdown 
              label="Tỉnh / Thành phố"
              icon={<Globe size={18} />}
              value={provinceCode || ''}
              options={[{ label: 'Toàn quốc', value: '' }, ...provinces.map(p => ({ label: p.name, value: p.code }))]}
              onChange={(code) => {
                const p = provinces.find(x => x.code === code);
                setProvinceCode(code || undefined);
                setProvince(p?.name || '');
                setDistrictCode(undefined);
                setDistrict('');
                setPage(1);
              }}
            />

            <CustomDropdown 
              label="Quận / Huyện"
              icon={<MapPin size={18} />}
              disabled={!provinceCode}
              value={districtCode || ''}
              options={[{ label: 'Mọi khu vực', value: '' }, ...districts.map(d => ({ label: d.name, value: d.code }))]}
              onChange={(code) => {
                const d = districts.find(x => x.code === code);
                setDistrictCode(code || undefined);
                setDistrict(d?.name || '');
                setPage(1);
              }}
            />

            <CustomDropdown 
              label="Quy mô sân"
              icon={<Users size={18} />}
              value={pitchType}
              options={[
                { label: 'Mọi quy mô', value: '' },
                { label: 'Sân 5 người', value: 'Football5' },
                { label: 'Sân 7 người', value: 'Football7' },
                { label: 'Sân 11 người', value: 'Football11' },
              ]}
              onChange={(val) => { setPitchType(val); setPage(1); }}
            />

            <CustomDropdown 
              label="Mức giá tối đa"
              icon={<DollarSign size={18} />}
              value={maxPrice || ''}
              options={[
                { label: 'Mọi mức giá', value: '' },
                { label: 'Dưới 300k', value: 300000 },
                { label: 'Dưới 500k', value: 500000 },
                { label: 'Dưới 1 triệu', value: 1000000 },
              ]}
              onChange={(val) => { setMaxPrice(val || undefined); setPage(1); }}
            />
          </div>

          <div className="flex items-center gap-8 px-10 lg:border-l-2 lg:border-slate-100 dark:lg:border-white/5">
            <div className="text-right">
              <p className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{totalCount}</p>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">Đang mở cửa</p>
            </div>
            <button 
              onClick={() => { toggleNearMe(); setPage(1); }} 
              className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all duration-500
                ${isNearMe 
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40' 
                  : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-blue-500 hover:shadow-xl'}`}
            >
              <Navigation size={26} fill={isNearMe ? "currentColor" : "none"} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Grid Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-6">
                <div className="aspect-[4/5] bg-slate-100 dark:bg-white/5 rounded-[3rem] animate-pulse" />
                <div className="h-6 bg-slate-100 dark:bg-white/5 rounded-full w-3/4 animate-pulse" />
                <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-full w-1/2 animate-pulse" />
              </div>
            ))
          ) : pitches.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {pitches.map((pitch, index) => (
                <motion.div 
                  key={pitch.id} 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }}
                >
                  <PitchCard 
                    id={pitch.id} 
                    name={pitch.name} 
                    typeDisplay={pitch.typeDisplay} 
                    price={new Intl.NumberFormat('vi-VN').format(pitch.minPrice || 0)} 
                    rating={pitch.averageRating} 
                    reviews={pitch.totalReviews}
                    image={pitch.images?.find(img => img.isPrimary)?.imageUrl || pitch.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800"}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full py-48 text-center bg-white dark:bg-[#11131a] rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-white/5">
              <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
                <Trophy size={48} className="text-slate-200" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Chưa có kết quả trùng khớp</h3>
              <p className="text-slate-400 font-bold mb-12 uppercase tracking-widest text-sm">Hãy thử nới lỏng các điều kiện lọc nhé!</p>
              <button 
                onClick={() => { 
                  setMaxPrice(undefined); setMinRating(undefined); setPitchType(''); 
                  setProvinceCode(undefined); setProvince(''); setDistrictCode(undefined); setDistrict(''); setPage(1);
                }} 
                className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 py-12">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-14 h-14 rounded-2xl border-2 border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 disabled:opacity-20 transition-all"
            >
              <ChevronDown className="rotate-90" size={24} />
            </button>
            <div className="flex gap-3">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-14 h-14 rounded-2xl font-black text-sm transition-all
                    ${page === i + 1 
                      ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' 
                      : 'bg-white dark:bg-[#11131a] text-slate-400 border-2 border-slate-100 dark:border-white/5 hover:border-blue-500/30'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-14 h-14 rounded-2xl border-2 border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 disabled:opacity-20 transition-all"
            >
              <ChevronDown className="-rotate-90" size={24} />
            </button>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ExploreFields;
