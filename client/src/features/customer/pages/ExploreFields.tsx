import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Filter, Star, Clock, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { Link } from 'react-router-dom';

const ExploreFields: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 pt-24">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 py-8 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row max-w-4xl mx-auto overflow-hidden">
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
            <button className="bg-primary text-white px-8 py-4 font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
              Tìm kiếm
            </button>
          </div>
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
              <h2 className="text-2xl font-bold text-slate-800">Tìm thấy <span className="text-primary">124</span> sân bãi</h2>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                Sắp xếp: Phù hợp nhất <ChevronDown size={16} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <PitchCard 
                id="1"
                name="Sân Bóng Thống Nhất" 
                location="Quận 10, TP. Hồ Chí Minh" 
                price="250.000đ" 
                rating={4.8} 
                reviews={124}
                image="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800"
              />
              <PitchCard 
                id="2"
                name="Badminton World" 
                location="Quận 7, TP. Hồ Chí Minh" 
                price="150.000đ" 
                rating={4.9} 
                reviews={89}
                image="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800"
              />
              <PitchCard 
                id="3"
                name="Tennis Central" 
                location="Thủ Đức, TP. Hồ Chí Minh" 
                price="400.000đ" 
                rating={4.7} 
                reviews={56}
                image="https://images.unsplash.com/photo-1595435066359-6286386730b9?q=80&w=800"
              />
              <PitchCard 
                id="4"
                name="Sân Cỏ Nhân Tạo K334" 
                location="Tân Bình, TP. Hồ Chí Minh" 
                price="200.000đ" 
                rating={4.6} 
                reviews={230}
                image="https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800"
              />
              <PitchCard 
                id="5"
                name="Sân Bóng Chảo Lửa" 
                location="Tân Bình, TP. Hồ Chí Minh" 
                price="280.000đ" 
                rating={4.5} 
                reviews={412}
                image="https://images.unsplash.com/photo-1518605368461-1ee55e1db87b?q=80&w=800"
              />
              <PitchCard 
                id="6"
                name="Sân Cầu Lông VNA" 
                location="Quận 3, TP. Hồ Chí Minh" 
                price="180.000đ" 
                rating={4.9} 
                reviews={156}
                image="https://images.unsplash.com/photo-1611345115162-811c750ecdf8?q=80&w=800"
              />
            </div>
            
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
  <Link to={`/field/${id}`}>
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 group cursor-pointer transition-all h-full flex flex-col"
    >
      {/* Image container */}
      <div className="relative h-52 overflow-hidden shrink-0">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-bold shadow-sm">
          <Star size={16} className="text-yellow-500 fill-current" />
          {rating}
          <span className="text-slate-500 font-medium text-xs ml-0.5">({reviews})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold mb-2 text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{name}</h3>
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
          <MapPin size={16} className="shrink-0" />
          <span className="truncate">{location}</span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-semibold mb-0.5">Giá thuê từ</p>
            <p className="text-lg font-black text-slate-900">{price}<span className="text-xs text-slate-400 font-medium ml-1">/giờ</span></p>
          </div>
          <div className="bg-slate-50 text-slate-700 group-hover:bg-primary group-hover:text-white transition-colors p-2.5 rounded-xl border border-slate-100 group-hover:border-primary">
            <Clock size={20} />
          </div>
        </div>
      </div>
    </motion.div>
  </Link>
);

export default ExploreFields;
