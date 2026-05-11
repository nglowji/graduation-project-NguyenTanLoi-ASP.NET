import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Filter, Star, ChevronDown, 
  Loader2, Navigation, DollarSign, Award,
  Check, X, SlidersHorizontal, Map as MapIcon,
  LayoutDashboard, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { pitchService, type PitchResponse } from '../../../services/pitchService';

import { useVietnamLocations } from '../../../hooks/useVietnamLocations';

const ExploreFields: React.FC = () => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [province, setProvince] = useState('');
  const [provinceCode, setProvinceCode] = useState<number | undefined>(undefined);
  const [district, setDistrict] = useState('');
  const [districtCode, setDistrictCode] = useState<number | undefined>(undefined);
  const [ward, setWard] = useState('');
  const [sportType, setSportType] = useState('');
  const [pitchType, setPitchType] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [isNearMe, setIsNearMe] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // Vietnam Locations Hook
  const { provinces, districts, wards } = useVietnamLocations(provinceCode, districtCode);

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
    setProvinceCode(undefined);
    setDistrict('');
    setDistrictCode(undefined);
    setWard('');
    setIsNearMe(false);
    setCoords(null);
    setSearchQuery('');
    setSportType('');
    setPitchType('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinRating(undefined);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 pt-24 font-body">
      {/* Search Header - Premium Glassmorphism */}
      <div className="relative z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-16 py-4 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto flex flex-col gap-4">
            {/* Top Row: Search & Near Me */}
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex bg-slate-100/50 rounded-2xl border border-slate-200/50 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all overflow-hidden group">
                <div className="flex-1 flex items-center px-5 py-3">
                  <Search className="text-slate-400 mr-3 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Tìm tên sân hoặc khu vực..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-base focus:outline-none placeholder:text-slate-400 bg-transparent font-medium"
                  />
                </div>
                <button type="submit" className="bg-slate-900 text-white px-8 py-3 font-bold hover:bg-primary transition-all flex items-center justify-center gap-2">
                  Tìm kiếm
                </button>
              </form>
              
              <button 
                onClick={toggleNearMe}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border ${
                  isNearMe 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-primary/30 hover:bg-slate-50'
                }`}
              >
                <Navigation size={18} className={isNearMe ? 'animate-pulse' : ''} />
                <span className="whitespace-nowrap">Gần tôi</span>
              </button>
            </div>

            {/* Bottom Row: Quick Filters Bar */}
            <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-1">
              <div className="flex items-center gap-3">
                {/* Province Dropdown */}
                <div className="relative">
                  <select 
                    value={provinceCode || ''}
                    onChange={(e) => {
                      const code = Number(e.target.value);
                      const p = provinces.find(x => x.code === code);
                      setProvinceCode(code || undefined);
                      setProvince(p?.name || '');
                      setDistrict('');
                      setDistrictCode(undefined);
                      setWard('');
                    }}
                    className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-slate-700 focus:border-primary transition-all cursor-pointer min-w-[160px] shadow-sm"
                  >
                    <option value="">Toàn quốc</option>
                    {provinces.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>

                {/* District Dropdown (Linked) */}
                <div className="relative">
                  <select 
                    value={districtCode || ''}
                    disabled={!provinceCode}
                    onChange={(e) => {
                      const code = Number(e.target.value);
                      const d = districts.find(x => x.code === code);
                      setDistrictCode(code || undefined);
                      setDistrict(d?.name || '');
                      setWard('');
                    }}
                    className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-slate-700 focus:border-primary transition-all cursor-pointer min-w-[160px] shadow-sm disabled:opacity-50 disabled:bg-slate-50"
                  >
                    <option value="">Tất cả Quận/Huyện</option>
                    {districts.map(d => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>

                {/* Sport Type Pills */}
                <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                <div className="flex items-center gap-2">
                  {['Football', 'Badminton', 'Tennis', 'Basketball'].map(type => (
                    <button
                      key={type}
                      onClick={() => setSportType(sportType === type ? '' : type)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        sportType === type 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-primary/30'
                      }`}
                    >
                      {type === 'Football' ? '⚽ Bóng đá' : 
                       type === 'Badminton' ? '🏸 Cầu lông' : 
                       type === 'Tennis' ? '🎾 Tennis' : '🏀 Bóng rổ'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => setShowFilters(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border font-bold transition-all shadow-sm ${
                    showFilters || minPrice || maxPrice || minRating || ward 
                    ? 'border-primary text-primary bg-primary/5' 
                    : 'border-slate-200 text-slate-600 hover:border-primary/30'
                  }`}
                >
                  <Filter size={16} />
                  <span>Bộ lọc nâng cao</span>
                  {(minPrice || maxPrice || minRating || ward) && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center animate-in zoom-in">
                      !
                    </span>
                  )}
                </button>
                
                {(searchQuery || province || sportType || minPrice || maxPrice || minRating) && (
                  <button 
                    onClick={clearFilters}
                    className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                    title="Xóa tất cả bộ lọc"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 mt-8">
        <div className="max-w-7xl mx-auto">
          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 font-heading">
                Khám phá <span className="text-primary italic">Sân Bãi</span>
              </h2>
              <p className="text-slate-500 font-bold text-sm">Tìm thấy {totalCount} địa điểm phù hợp trong khu vực của bạn</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200/50 shadow-sm">
                 <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg shadow-slate-900/10">
                   <LayoutDashboard size={16} className="inline mr-2" /> Lưới
                 </button>
                 <button className="px-5 py-2.5 text-slate-400 rounded-xl text-sm font-black hover:text-slate-600">
                   <MapIcon size={16} className="inline mr-2" /> Bản đồ
                 </button>
              </div>
            </div>
          </div>

          {/* Active Filter Tags */}
          <AnimatePresence>
            {(province || sportType || minPrice || maxPrice || minRating) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap gap-2 mb-8"
              >
                {province && (
                  <FilterTag label={province} onRemove={() => { setProvince(''); setProvinceCode(undefined); }} />
                )}
                {district && (
                  <FilterTag label={district} onRemove={() => { setDistrict(''); setDistrictCode(undefined); }} />
                )}
                {sportType && (
                  <FilterTag label={sportType} onRemove={() => setSportType('')} />
                )}
                {(minPrice || maxPrice) && (
                  <FilterTag 
                    label={`${minPrice?.toLocaleString() || 0}đ - ${maxPrice?.toLocaleString() || '∞'}đ`} 
                    onRemove={() => { setMinPrice(undefined); setMaxPrice(undefined); }} 
                  />
                )}
                {minRating && (
                  <FilterTag label={`⭐ ${minRating}+`} onRemove={() => setMinRating(undefined)} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
              </div>
              <p className="mt-8 text-slate-400 font-black uppercase tracking-widest text-xs">Đang tìm kiếm dữ liệu...</p>
            </div>
          ) : pitches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              <h3 className="text-2xl font-black text-slate-900 mb-2 font-heading">Không tìm thấy kết quả</h3>
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
      </main>

      {/* Advanced Filter Drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-8 flex items-center justify-between border-b bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <SlidersHorizontal size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 font-heading leading-none">Bộ lọc chi tiết</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tìm kiếm sân chuẩn xác nhất</p>
                  </div>
                </div>
                <button onClick={() => setShowFilters(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                {/* 1. Khu vực chi tiết */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                      <MapPin size={14} className="text-primary" /> Địa điểm cụ thể
                    </label>
                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md">{province || 'Toàn quốc'}</span>
                  </div>
                  <div className="relative group">
                    <select 
                      value={ward}
                      disabled={!districtCode}
                      onChange={(e) => setWard(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-bold appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none disabled:opacity-40"
                    >
                      <option value="">Chọn Phường / Xã</option>
                      {wards.map(w => (
                        <option key={w.code} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" size={16} />
                  </div>
                </section>

                {/* 2. Quy mô & Loại sân (Visual Cards) */}
                <section className="space-y-6">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    <Users size={14} className="text-primary" /> Quy mô & Loại sân
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'Football5', label: 'Sân 5 người', sub: 'Bóng đá mini', icon: '👤×5', sport: 'Football' },
                      { id: 'Football7', label: 'Sân 7 người', sub: 'Bóng đá phổ biến', icon: '👤×7', sport: 'Football' },
                      { id: 'Indoor', label: 'Sân trong nhà', sub: 'Futsal / Cầu lông', icon: '🏟️' },
                      { id: 'Outdoor', label: 'Sân ngoài trời', sub: 'Thoáng đãng', icon: '🌳' },
                    ].filter(item => !item.sport || item.sport === sportType).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setPitchType(pitchType === item.id ? '' : item.id)}
                        className={`flex flex-col items-start p-5 rounded-[1.5rem] border-2 text-left transition-all relative overflow-hidden group ${
                          pitchType === item.id 
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                          : 'border-slate-100 bg-slate-50/50 hover:border-primary/30 hover:bg-white'
                        }`}
                      >
                        <span className="text-2xl mb-3">{item.icon}</span>
                        <span className={`text-sm font-black leading-none mb-1 ${pitchType === item.id ? 'text-primary' : 'text-slate-900'}`}>{item.label}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.sub}</span>
                        {pitchType === item.id && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {/* 3. Khoảng giá (Visual Input) */}
                <section className="space-y-6">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    <DollarSign size={14} className="text-primary" /> Ngân sách (VND / Giờ)
                  </label>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Tối thiểu</span>
                        <div className="relative">
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={minPrice || ''}
                            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-primary transition-all pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">đ</span>
                        </div>
                      </div>
                      <div className="pt-6">
                        <div className="w-4 h-[2px] bg-slate-200" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Tối đa</span>
                        <div className="relative">
                          <input 
                            type="number" 
                            placeholder="∞" 
                            value={maxPrice || ''}
                            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-primary transition-all pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">đ</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[100000, 300000, 500000].map(val => (
                        <button 
                          key={val}
                          onClick={() => setMaxPrice(val)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-black text-slate-500 hover:border-primary hover:text-primary transition-all"
                        >
                          Dưới {val/1000}k
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 4. Tiện ích đi kèm (Visual Grid) */}
                <section className="space-y-6">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    <Navigation size={14} className="text-primary" /> Tiện ích dịch vụ
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'parking', label: 'Bãi đỗ xe', icon: '🚗' },
                      { id: 'water', label: 'Nước uống', icon: '💧' },
                      { id: 'lights', label: 'Đèn đêm', icon: '💡' },
                      { id: 'canteen', label: 'Canteen', icon: '☕' },
                      { id: 'locker', label: 'Tủ đồ', icon: '🔒' },
                      { id: 'shower', label: 'Tắm rửa', icon: '🚿' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/30 hover:bg-white transition-all group"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="text-[10px] font-black text-slate-600 tracking-tighter">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* 5. Đánh giá chất lượng */}
                <section className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    <Award size={14} className="text-primary" /> Xếp hạng tối thiểu
                  </label>
                  <div className="flex gap-2">
                    {[4.5, 4.0, 3.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(minRating === rating ? undefined : rating)}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black border transition-all ${
                          minRating === rating 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-primary/30'
                        }`}
                      >
                        <Star size={14} className={minRating === rating ? 'fill-primary' : ''} />
                        {rating}+
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-8 bg-white border-t sticky bottom-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="flex gap-4">
                  <button 
                    onClick={clearFilters}
                    className="px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all"
                  >
                    Xóa hết
                  </button>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Xem kết quả <ChevronDown className="-rotate-90" size={16} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

const FilterTag: React.FC<{ label: string, onRemove: () => void }> = ({ label, onRemove }) => (
  <button 
    onClick={onRemove}
    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-black hover:bg-primary hover:text-white transition-all group"
  >
    <span>{label}</span>
    <X size={12} className="group-hover:scale-125 transition-transform" />
  </button>
);

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
