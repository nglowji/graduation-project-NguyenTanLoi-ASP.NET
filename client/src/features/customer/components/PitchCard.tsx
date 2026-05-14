import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PitchCardProps {
  id: string;
  name: string;
  typeDisplay: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
}

export const PitchCard: React.FC<PitchCardProps> = ({ id, name, typeDisplay, price, rating, image }) => {
  const getPitchTypeLabel = (type: string) => {
    if (!type || type === "0") return "Sân Đấu";
    const mapping: Record<string, string> = {
      'Football5': 'Bóng đá 5', 'Football7': 'Bóng đá 7', 'Football11': 'Bóng đá 11',
      'Tennis': 'Tennis', 'Badminton': 'Cầu lông', 'Pickleball': 'Pickleball',
      'Basketball': 'Bóng rổ', 'Volleyball': 'Bóng chuyền', 'TableTennis': 'Bóng bàn'
    };
    return mapping[type] || type;
  };

  return (
    <Link to={`/field/${id}`} className="block h-full group">
      <motion.div 
        whileHover={{ y: -12 }}
        className="bg-white dark:bg-[#11131a] rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-500 h-full flex flex-col relative"
      >
        {/* Visual Header */}
        <div className="relative h-64 overflow-hidden shrink-0">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Status Badges */}
          <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {getPitchTypeLabel(typeDisplay)}
            </div>
            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl flex items-center gap-1.5 border border-white shadow-xl">
              <Star size={12} className="text-amber-500 fill-current" />
              <span className="text-slate-900 font-black text-[11px] leading-none">{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-5 left-6 right-6">
            <h3 className="text-xl font-black text-white leading-tight tracking-tight drop-shadow-lg line-clamp-2">{name}</h3>
          </div>
        </div>

        {/* Details Area */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] mb-6 font-black uppercase tracking-[0.2em]">
            <MapPin size={12} className="text-red-500" />
            <span className="truncate">Sân bóng tiêu chuẩn • Hoạt động 24/7</span>
          </div>

          <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5">
            <div className="space-y-0.5">
              <p className="text-[9px] uppercase tracking-widest font-black text-slate-300 dark:text-slate-600">Bắt đầu từ</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-blue-600 drop-shadow-[0_0_20px_rgba(37,99,235,0.2)]">{price}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">đ/h</span>
              </div>
            </div>
            
            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-50 dark:bg-white/5 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-2xl group-hover:shadow-blue-600/30 transition-all duration-500">
              <ArrowRight size={20} strokeWidth={3} className="-rotate-45 group-hover:rotate-0 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
