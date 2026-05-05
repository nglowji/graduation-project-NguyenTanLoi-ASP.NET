import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Filter, Star, ChevronDown, CheckSquare, Square, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pitchService, type PitchResponse } from '../../../services/pitchService';

const ExploreFields: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pitches, setPitches] = useState<PitchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  React.useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const result = await pitchService.search({
        searchTerm: searchQuery || undefined,
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 pt-24">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 py-8 shadow-sm">
        <div className="container mx-auto px-6">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row max-w-4xl mx-auto overflow-hidden">
            <div className="flex-1 flex items-center px-6 py-4">
              <Search className="text-slate-400 mr-4" size={22} />
              <input 
                type="text" 
                placeholder="Tìm sân bóng, cầu lông, tennis..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-lg focus:outline-none placeholder:text-slate-400 bg-transparent font-medium"
              />
            </div>
            <div className="hidden md:flex items-center px-6 py-4 border-l border-slate-200 text-slate-600 hover:text-primary transition-colors cursor-pointer bg-slate-50">
              <MapPin className="mr-2" size={20} />
              <span className="font-bold">Hồ Chí Minh</span>
              <ChevronDown className="ml-2" size={18} />
            </div>
            <button type="submit" className="bg-primary text-white px-8 py-4 font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
              Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      <main className="container mx-auto px-6 mt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-28">
              <div className="flex items-center gap-2 mb-6 text-slate-800">
                <Filter size={20} />
                <h2 className="text-xl font-bold">Bộ lọc</h2>
              </div>

              {/* Loại sân */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-900 mb-4">Môn thể thao</h3>
                <div className="space-y-3">
                  <Checkbox label="⚽ Bóng đá" checked />
                  <Checkbox label="🏸 Cầu lông" />
                  <Checkbox label="🎾 Tennis" />
                  <Checkbox label="🏀 Bóng rổ" />
                </div>
              </div>

              {/* Khoảng giá */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-900 mb-4">Khoảng giá (giờ)</h3>
                <div className="space-y-3">
                  <Checkbox label="Dưới 150.000đ" />
                  <Checkbox label="150.000đ - 300.000đ" checked />
                  <Checkbox label="300.000đ - 500.000đ" />
                  <Checkbox label="Trên 500.000đ" />
                </div>
              </div>

              {/* Tiện ích */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-900 mb-4">Tiện ích</h3>
                <div className="space-y-3">
                  <Checkbox label="Miễn phí đỗ xe" checked />
                  <Checkbox label="Căn tin / Giải khát" checked />
                  <Checkbox label="Wifi miễn phí" />
                  <Checkbox label="Cho thuê dụng cụ" />
                  <Checkbox label="Trọng tài" />
                </div>
              </div>
              
              <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                Xóa bộ lọc
              </button>
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Tìm thấy <span className="text-primary">{totalCount}</span> sân bãi</h2>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                Sắp xếp: Phù hợp nhất <ChevronDown size={16} />
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <Loader2 className="text-primary animate-spin mb-4" size={48} />
                <p className="text-slate-500 font-bold">Đang tải danh sách sân bóng...</p>
              </div>
            ) : pitches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pitches.map(pitch => (
                  <PitchCard 
                    key={pitch.id}
                    id={pitch.id}
                    name={pitch.name} 
                    location={`${pitch.district}, ${pitch.province}`} 
                    price={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pitch.basePrice)} 
                    rating={pitch.averageRating} 
                    reviews={pitch.totalReviews}
                    image={pitch.images?.[0] || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800"}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-500 text-xl font-bold">Không tìm thấy sân bóng nào phù hợp.</p>
              </div>
            )}
            
            <div className="mt-12 flex justify-center">
              <button className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                Tải thêm kết quả
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Checkbox: React.FC<{ label: string, checked?: boolean }> = ({ label, checked }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    {checked ? (
      <CheckSquare size={20} className="text-primary" />
    ) : (
      <Square size={20} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
    )}
    <span className={`text-sm font-medium transition-colors ${checked ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
      {label}
    </span>
  </label>
);

const PitchCard: React.FC<{ id: string, name: string, location: string, price: string, rating: number, reviews: number, image: string }> = ({ id, name, location, price, rating, reviews, image }) => (
  <Link to={`/field/${id}`} className="block h-full">
    <motion.div 
      whileHover={{ y: -12, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
      className="bg-white rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100 group cursor-pointer transition-all h-full flex flex-col relative"
    >
      {/* Sport Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-primary/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Sân Bóng Đá
        </div>
      </div>

      {/* Image container */}
      <div className="relative h-56 overflow-hidden shrink-0">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-sm font-black shadow-xl">
          <Star size={16} className="text-yellow-500 fill-current" />
          {rating}
          <span className="text-slate-400 font-bold text-xs">({reviews})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-black mb-2 text-slate-900 line-clamp-1 group-hover:text-primary transition-colors leading-tight">{name}</h3>
        
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-6 font-medium">
          <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <MapPin size={14} className="shrink-0" />
          </div>
          <span className="truncate">{location}</span>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Giá chỉ từ</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-primary">{price}</span>
              <span className="text-xs font-bold text-slate-400">/h</span>
            </div>
          </div>
          
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/20 group-hover:bg-primary group-hover:shadow-primary/30 transition-all duration-300 transform group-hover:rotate-12">
            <ChevronDown className="-rotate-90" size={24} />
          </div>
        </div>
      </div>
    </motion.div>
  </Link>
);

export default ExploreFields;
