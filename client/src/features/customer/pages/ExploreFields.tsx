import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Filter, Star, ChevronDown, 
  Loader2, Navigation, DollarSign, Award,
  Check, X, SlidersHorizontal, Map as MapIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { pitchService, type PitchResponse } from '../../../services/pitchService';

import { VIETNAM_PROVINCES } from '../../../constants/locations';

const ExploreFields: React.FC = () => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [sportType, setSportType] = useState('');
  const [pitchType, setPitchType] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [isNearMe, setIsNearMe] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // Data States
  const [pitches, setPitches] = useState<PitchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPitches();
  }, [province, district, ward, sportType, pitchType, minPrice, maxPrice, minRating, isNearMe, coords]);

  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const result = await pitchService.search({
        searchTerm: searchQuery || undefined,
        province: province || undefined,
        district: district || undefined,
        ward: ward || undefined,
        type: pitchType || undefined,
        sportType: sportType || undefined,
        minPrice,
        maxPrice,
        minRating,
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
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPitches();
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
          alert("Không thể lấy vị trí của bạn. Vui lòng bật định vị.");
        });
      }
    } else {
      setIsNearMe(false);
      setCoords(null);
    }
  };

  const clearFilters = () => {
    setProvince('');
    setDistrict('');
    setWard('');
    setSportType('');
    setPitchType('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinRating(undefined);
    setIsNearMe(false);
    setCoords(null);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 pt-24">
      {/* Search Header - Premium Glassmorphism */}
      <div className="relative z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-16 py-6 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex bg-slate-100/50 rounded-2xl border border-slate-200/50 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all overflow-hidden group">
              <div className="flex-1 flex items-center px-5 py-3.5">
                <Search className="text-slate-400 mr-3 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Tìm tên sân hoặc khu vực..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-base focus:outline-none placeholder:text-slate-400 bg-transparent font-medium"
                />
              </div>
              <button type="submit" className="bg-slate-900 text-white px-8 py-3.5 font-bold hover:bg-primary transition-all flex items-center justify-center gap-2">
                Tìm kiếm
              </button>
            </form>
            
            <div className="flex gap-3">
              <button 
                onClick={toggleNearMe}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold transition-all border ${
                  isNearMe 
                  ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-primary/30 hover:bg-slate-50'
                }`}
              >
                <Navigation size={18} className={isNearMe ? 'animate-pulse' : ''} />
                <span className="whitespace-nowrap">Gần tôi</span>
              </button>
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`lg:hidden flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold transition-all ${showFilters ? 'border-primary text-primary' : ''}`}
              >
                <SlidersHorizontal size={18} />
                <span>Bộ lọc</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 mt-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Advanced Sidebar Filters */}
          <aside className={`
            fixed inset-0 z-[100] lg:relative lg:inset-auto lg:z-0 lg:block lg:w-80 shrink-0
            ${showFilters ? 'block' : 'hidden'}
          `}>
            {/* Mobile Overlay */}
            <div className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
            
            <div className="relative bg-white p-8 rounded-[2.5rem] border border-slate-200/50 shadow-xl lg:shadow-sm lg:sticky lg:top-40 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Filter size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Bộ lọc nâng cao</h2>
                </div>
                <button 
                  onClick={clearFilters}
                  className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <X size={14} /> Xóa hết
                </button>
              </div>

              {/* Location Group */}
              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                  <MapPin size={12} /> Vị trí khu vực
                </div>
                
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Tỉnh / Thành phố</label>
                    <div className="relative">
                      <select 
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                      >
                        <option value="">Tất cả tỉnh thành</option>
                        {VIETNAM_PROVINCES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Quận / Huyện</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Nhập quận/huyện..."
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                  <MapIcon size={12} /> Phân loại sân
                </div>

                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Môn thể thao</label>
                    <div className="relative">
                      <select 
                        value={sportType}
                        onChange={(e) => setSportType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                      >
                        <option value="">Tất cả môn</option>
                        <option value="Football">Bóng đá</option>
                        <option value="Badminton">Cầu lông</option>
                        <option value="Tennis">Tennis</option>
                        <option value="Basketball">Bóng rổ</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Loại sân</label>
                    <div className="relative">
                      <select 
                        value={pitchType}
                        onChange={(e) => setPitchType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                      >
                        <option value="">Tất cả loại</option>
                        {sportType === 'Football' && (
                          <>
                            <option value="Football5">Sân 5 người</option>
                            <option value="Football7">Sân 7 người</option>
                            <option value="Football11">Sân 11 người</option>
                          </>
                        )}
                        <option value="Indoor">Trong nhà</option>
                        <option value="Outdoor">Ngoài trời</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-10">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                  <DollarSign size={12} /> Khoảng giá (giờ)
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={minPrice || ''}
                      onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="w-4 h-[2px] bg-slate-200" />
                  <div className="flex-1">
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={maxPrice || ''}
                      onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                  <Award size={12} /> Đánh giá tối thiểu
                </div>
                <div className="flex flex-wrap gap-2">
                  {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(minRating === rating ? undefined : rating)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${
                        minRating === rating 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-primary/30'
                      }`}
                    >
                      <Star size={14} className={minRating === rating ? 'fill-current' : ''} />
                      {rating}+
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                  Khám phá <span className="text-primary italic">Sân Bãi</span>
                </h2>
                <p className="text-slate-500 font-bold text-sm">Tìm thấy {totalCount} địa điểm phù hợp trong khu vực của bạn</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200/50 shadow-sm">
                   <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg shadow-slate-900/10">Lưới</button>
                   <button className="px-5 py-2.5 text-slate-400 rounded-xl text-sm font-black hover:text-slate-600">Bản đồ</button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                  <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
                </div>
                <p className="mt-8 text-slate-400 font-black uppercase tracking-widest text-xs">Đang tìm kiếm dữ liệu...</p>
              </div>
            ) : pitches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {pitches.map((pitch, index) => (
                    <motion.div
                      key={pitch.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PitchCard 
                        id={pitch.id}
                        name={pitch.name} 
                        location={`${pitch.district}, ${pitch.province}`} 
                        price={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pitch.basePrice)} 
                        rating={pitch.averageRating} 
                        reviews={pitch.totalReviews}
                        image={pitch.images?.[0] || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800"}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="text-slate-300" size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Không tìm thấy kết quả</h3>
                <p className="text-slate-500 font-bold mb-8">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn</p>
                <button 
                  onClick={clearFilters}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:bg-primary transition-all active:scale-95"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
            
            {totalCount > pitches.length && (
              <div className="mt-20 flex justify-center">
                <button className="group relative px-10 py-5 bg-white border border-slate-200 rounded-[2rem] font-black text-slate-700 hover:bg-slate-50 transition-all shadow-xl shadow-slate-200/50 flex items-center gap-3 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span>Tải thêm kết quả</span>
                  <ChevronDown className="group-hover:translate-y-1 transition-transform" size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

const PitchCard: React.FC<{ id: string, name: string, location: string, price: string, rating: number, reviews: number, image: string }> = ({ id, name, location, price, rating, reviews, image }) => (
  <Link to={`/field/${id}`} className="block h-full">
    <motion.div 
      whileHover={{ y: -12, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.15)" }}
      className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 group cursor-pointer transition-all h-full flex flex-col relative"
    >
      {/* Sport Badge */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] shadow-xl flex items-center gap-2 border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          Sân Bóng Đá
        </div>
      </div>

      {/* Image container */}
      <div className="relative h-64 overflow-hidden shrink-0">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
        
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-white/20">
            <Star size={16} className="text-yellow-400 fill-current" />
            <span className="text-white font-black text-sm">{rating.toFixed(1)}</span>
            <span className="text-white/60 font-bold text-xs">({reviews})</span>
          </div>
          
          <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-slate-900/20 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 flex flex-col flex-1">
        <h3 className="text-2xl font-black mb-3 text-slate-900 line-clamp-1 group-hover:text-primary transition-colors leading-tight tracking-tight">{name}</h3>
        
        <div className="flex items-center gap-3 text-slate-500 text-sm mb-8 font-bold">
          <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <MapPin size={16} className="shrink-0" />
          </div>
          <span className="truncate">{location}</span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-6 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.25em] font-black text-slate-400 mb-1">Giá trải nghiệm</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-primary">{price}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/h</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-primary font-black text-xs uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
            Đặt sân <ChevronDown className="-rotate-90" size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  </Link>
);

export default ExploreFields;
