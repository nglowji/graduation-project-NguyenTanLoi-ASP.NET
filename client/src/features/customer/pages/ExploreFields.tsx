import React, { useState, useEffect } from 'react';
import { Search, Globe, MapPin, Users, DollarSign, Star, Navigation, Trophy, Check, Filter } from 'lucide-react';
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
    <div className="relative flex-1 min-w-[160px]">
      <button 
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-body font-bold text-sm transition-all duration-300 border
          ${disabled 
            ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed' 
            : isOpen 
              ? 'bg-white border-primary text-primary shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.1)]' 
              : 'bg-slate-50/50 border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-primary'
          }`}
      >
        <span className={`${isOpen ? 'text-primary' : 'text-slate-400'}`}>{icon}</span>
        <span className="truncate flex-1 text-left">{selectedLabel}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-[10px] opacity-50">▼</motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
            >
              <div className="max-height-[300px] overflow-y-auto p-2 scrollbar-hide">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-body font-bold text-sm transition-all
                      ${value === opt.value 
                        ? 'bg-primary/5 text-primary' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                      }`}
                  >
                    {opt.label}
                    {value === opt.value && <Check size={14} strokeWidth={3} />}
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
  const [sportType, setSportType] = useState('Football');
  const [pitchType, setPitchType] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [isNearMe, setIsNearMe] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  const { provinces, districts } = useVietnamLocations(provinceCode, districtCode);
  const [pitches, setPitches] = useState<PitchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPitches();
  }, [province, district, sportType, pitchType, maxPrice, minRating, isNearMe, coords]);

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
        pageSize: 12
      });
      setPitches(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch pitches:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 600);
    }
  };

  const toggleNearMe = () => {
    if (!isNearMe) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsNearMe(true);
        }, (error) => {
          console.error("Geolocation error:", error);
        });
      }
    } else {
      setIsNearMe(false);
      setCoords(null);
    }
  };

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Hero Header */}
      <section className="pt-24 pb-16 bg-[radial-gradient(circle_at_top_right,_rgba(var(--primary-rgb),0.08),transparent),_radial-gradient(circle_at_bottom_left,_rgba(var(--secondary-rgb),0.05),transparent)]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading font-black text-5xl md:text-6xl text-slate-900 leading-tight tracking-tight mb-12">
              Khám phá <span className="text-primary block md:inline">Sân bóng chuyên nghiệp</span>
            </h1>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <form 
              onSubmit={(e) => { e.preventDefault(); fetchPitches(); }} 
              className="bg-white p-2 rounded-[2.5rem] flex items-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-50 mb-8"
            >
              <div className="flex-1 flex items-center pl-6">
                <Search size={22} className="text-slate-300" />
                <input 
                  type="text" 
                  placeholder="Tìm tên sân hoặc khu vực của bạn..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-none px-6 py-4 font-body font-bold text-lg text-slate-800 focus:outline-none placeholder:text-slate-300"
                />
              </div>
              <button 
                type="submit" 
                className="bg-primary text-white px-10 py-4 rounded-[2rem] font-heading font-black text-sm uppercase tracking-widest transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_15px_30px_-10px_rgba(var(--primary-rgb),0.4)] active:scale-95"
              >
                Tìm ngay
              </button>
            </form>

            <div className="flex justify-center gap-3 flex-wrap">
              {[
                { id: 'Football', label: 'Bóng đá', icon: '⚽' },
                { id: 'Badminton', label: 'Cầu lông', icon: '🏸' },
                { id: 'Tennis', label: 'Tennis', icon: '🎾' },
                { id: 'Pickleball', label: 'Pickleball', icon: '🥒' },
                { id: 'Basketball', label: 'Bóng rổ', icon: '🏀' },
                { id: 'Volleyball', label: 'Bóng chuyền', icon: '🏐' }
              ].map(sport => (
                <button 
                  key={sport.id} 
                  onClick={() => setSportType(sport.id)} 
                  className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-body font-extrabold text-sm transition-all duration-300 border
                    ${sportType === sport.id 
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-primary/30 hover:text-primary shadow-sm'}`}
                >
                  <span className="text-lg">{sport.icon}</span> {sport.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters Ribbon */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 mb-12">
          <div className="flex-1 flex flex-wrap items-center gap-3 p-1">
            <CustomDropdown 
              label="Toàn quốc"
              icon={<Globe size={18} />}
              value={provinceCode || ''}
              options={[{ label: 'Toàn quốc', value: '' }, ...provinces.map(p => ({ label: p.name, value: p.code }))]}
              onChange={(code) => {
                const p = provinces.find(x => x.code === code);
                setProvinceCode(code || undefined);
                setProvince(p?.name || '');
                setDistrictCode(undefined);
                setDistrict('');
              }}
            />

            <CustomDropdown 
              label="Quận / Huyện"
              icon={<MapPin size={18} />}
              disabled={!provinceCode}
              value={districtCode || ''}
              options={[{ label: 'Mọi Quận / Huyện', value: '' }, ...districts.map(d => ({ label: d.name, value: d.code }))]}
              onChange={(code) => {
                const d = districts.find(x => x.code === code);
                setDistrictCode(code || undefined);
                setDistrict(d?.name || '');
              }}
            />

            <CustomDropdown 
              label="Mọi quy mô"
              icon={<Users size={18} />}
              value={pitchType}
              options={[
                { label: 'Mọi quy mô', value: '' },
                { label: 'Sân 5 người', value: 'Football5' },
                { label: 'Sân 7 người', value: 'Football7' },
                { label: 'Sân 11 người', value: 'Football11' },
              ]}
              onChange={setPitchType}
            />

            <CustomDropdown 
              label="Mọi mức giá"
              icon={<DollarSign size={18} />}
              value={maxPrice || ''}
              options={[
                { label: 'Mọi mức giá', value: '' },
                { label: 'Dưới 100k', value: 100000 },
                { label: 'Dưới 300k', value: 300000 },
                { label: 'Dưới 500k', value: 500000 },
                { label: 'Dưới 1M', value: 1000000 },
              ]}
              onChange={(val) => setMaxPrice(val || undefined)}
            />

            <CustomDropdown 
              label="Mọi đánh giá"
              icon={<Star size={18} />}
              value={minRating || ''}
              options={[
                { label: 'Mọi đánh giá', value: '' },
                { label: 'Từ 4.0 sao', value: 4.0 },
                { label: 'Từ 4.5 sao', value: 4.5 },
              ]}
              onChange={(val) => setMinRating(val || undefined)}
            />
          </div>

          <div className="flex items-center gap-6 px-6 lg:border-l lg:border-slate-100">
            <div className="text-right">
              <div className="text-3xl font-heading font-black text-slate-900 leading-none">{totalCount}</div>
              <div className="text-[10px] font-heading font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Sân bãi</div>
            </div>
            <button 
              onClick={toggleNearMe} 
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                ${isNearMe 
                  ? 'bg-primary text-white shadow-xl shadow-primary/30' 
                  : 'bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 hover:shadow-lg'}`}
            >
              <Navigation size={24} fill={isNearMe ? "currentColor" : "none"} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-slate-100 rounded-[2.5rem] mb-6" />
                <div className="h-8 bg-slate-100 rounded-full w-3/4 mb-4" />
                <div className="h-5 bg-slate-50 rounded-full w-1/2" />
              </div>
            ))
          ) : pitches.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {pitches.map((pitch, index) => (
                <motion.div 
                  key={pitch.id} 
                  layout 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <PitchCard 
                    id={pitch.id} 
                    name={pitch.name} 
                    location={`${pitch.district}, ${pitch.province}`} 
                    price={new Intl.NumberFormat('vi-VN').format(pitch.basePrice)} 
                    rating={pitch.averageRating} 
                    reviews={pitch.totalReviews}
                    image={pitch.images?.[0] || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800"}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full py-40 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Trophy size={48} className="text-slate-200" />
              </div>
              <h3 className="text-3xl font-heading font-black text-slate-900 mb-4">Chưa tìm thấy sân phù hợp</h3>
              <p className="text-slate-400 font-bold text-lg mb-12">Thử nới lỏng các bộ lọc hoặc tìm kiếm khu vực khác nhé!</p>
              <button 
                onClick={() => { 
                  setMaxPrice(undefined); 
                  setMinRating(undefined); 
                  setPitchType(''); 
                  setProvinceCode(undefined); 
                  setProvince(''); 
                  setDistrictCode(undefined); 
                  setDistrict(''); 
                }} 
                className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-heading font-black text-sm uppercase tracking-widest transition-all hover:bg-primary hover:shadow-2xl active:scale-95"
              >
                Đặt lại tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExploreFields;
