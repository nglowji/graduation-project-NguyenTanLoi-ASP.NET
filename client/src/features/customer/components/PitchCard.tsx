import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Search, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PitchCardProps {
  id: string;
  name: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
}

export const PitchCard: React.FC<PitchCardProps> = ({ id, name, location, price, rating, reviews, image }) => (
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
