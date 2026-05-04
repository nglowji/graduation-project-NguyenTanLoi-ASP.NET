import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Filter, Star, Clock, ChevronDown } from 'lucide-react';
import Navbar from '../../../components/Navbar';

const ExploreFields: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-surface-light text-slate-900 pb-24">
      <Navbar />
      
      {/* Search Hero Header */}
      <div className="pt-32 pb-16 bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-black mb-4">Tìm Sân Của Bạn</h1>
            <p className="text-slate-500 text-lg">Khám phá hàng ngàn sân thể thao chất lượng cao trên toàn quốc.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col md:flex-row gap-2"
          >
            <div className="flex-1 flex items-center px-6 py-3">
              <Search className="text-slate-400 mr-4" size={24} />
              <input 
                type="text" 
                placeholder="Tìm sân bóng, cầu lông, tennis..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-lg focus:outline-none placeholder:text-slate-400 bg-transparent font-medium"
              />
            </div>
            <div className="hidden md:flex items-center px-6 py-3 border-l border-slate-200 text-slate-500 cursor-pointer hover:text-slate-800 transition-colors">
              <MapPin className="mr-3" size={20} />
              <span className="font-medium">Hồ Chí Minh</span>
              <ChevronDown className="ml-3" size={16} />
            </div>
            <button className="bg-primary text-white rounded-full px-8 py-4 font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
              Tìm kiếm
            </button>
          </motion.div>
        </div>
      </div>

      <main className="container mx-auto px-6 mt-12">
        {/* Quick Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex gap-3 overflow-x-auto pb-4 md:pb-0 w-full md:w-auto no-scrollbar">
            <FilterPill label="Tất cả" active />
            <FilterPill label="⚽ Bóng đá" />
            <FilterPill label="🏸 Cầu lông" />
            <FilterPill label="🎾 Tennis" />
            <FilterPill label="🏀 Bóng rổ" />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0">
            <Filter size={18} />
            Bộ lọc nâng cao
          </button>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <PitchCard 
            name="Sân Bóng Thống Nhất" 
            location="Quận 10, TP. Hồ Chí Minh" 
            price="250k" 
            rating={4.8} 
            reviews={124}
            image="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800"
          />
          <PitchCard 
            name="Badminton World" 
            location="Quận 7, TP. Hồ Chí Minh" 
            price="150k" 
            rating={4.9} 
            reviews={89}
            image="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800"
          />
          <PitchCard 
            name="Tennis Central" 
            location="Thủ Đức, TP. Hồ Chí Minh" 
            price="400k" 
            rating={4.7} 
            reviews={56}
            image="https://images.unsplash.com/photo-1595435066359-6286386730b9?q=80&w=800"
          />
          <PitchCard 
            name="Sân Cỏ Nhân Tạo K334" 
            location="Tân Bình, TP. Hồ Chí Minh" 
            price="200k" 
            rating={4.6} 
            reviews={230}
            image="https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800"
          />
        </div>
      </main>
    </div>
  );
};

const FilterPill: React.FC<{ label: string, active?: boolean }> = ({ label, active }) => (
  <button className={`
    px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap
    ${active 
      ? 'bg-slate-900 text-white shadow-md' 
      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
  `}>
    {label}
  </button>
);

const PitchCard: React.FC<{ name: string, location: string, price: string, rating: number, reviews: number, image: string }> = ({ name, location, price, rating, reviews, image }) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 group cursor-pointer"
  >
    {/* Image container */}
    <div className="relative h-56 overflow-hidden">
      <img 
        src={image} 
        alt={name} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
      />
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-bold shadow-sm">
        <Star size={16} className="text-yellow-500 fill-current" />
        {rating}
        <span className="text-slate-400 font-normal text-xs ml-1">({reviews})</span>
      </div>
    </div>

    {/* Content */}
    <div className="p-6">
      <h3 className="text-xl font-bold mb-3 truncate">{name}</h3>
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
        <MapPin size={16} className="shrink-0" />
        <span className="truncate">{location}</span>
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Giá thuê từ</p>
          <p className="text-xl font-black text-slate-900">{price}<span className="text-sm text-slate-400 font-medium">/giờ</span></p>
        </div>
        <button className="bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors p-3 rounded-2xl">
          <Clock size={20} />
        </button>
      </div>
    </div>
  </motion.div>
);

export default ExploreFields;
