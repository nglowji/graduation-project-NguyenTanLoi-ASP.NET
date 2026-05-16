import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '../../../utils/slug';

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
  const slug = slugify(name || 'san');
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
    <Link to={`/san/${id}${slug ? `-${slug}` : ''}`} className="block h-full group">
      <motion.div 
        whileHover={{ y: -6 }}
        className="bg-white dark:bg-[#11131a] rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col"
      >
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
        </div>

        <div className="p-4 flex flex-col gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
            {name}
          </h3>

          <div className="flex items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
              {getPitchTypeLabel(typeDisplay)}
            </span>
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={14} className="fill-current" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-slate-400">Giá từ</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 dark:text-white">{price}</span>
              <span className="text-xs font-semibold text-slate-400">đ/giờ</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
