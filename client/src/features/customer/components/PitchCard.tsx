import React from 'react';
import { ArrowUpRight, MapPin, Star } from 'lucide-react';
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
  address?: string;
}

const TYPE_STYLE: Record<string, string> = {
  Football5: 'bg-blue-50 text-blue-700',
  Football7: 'bg-blue-50 text-blue-700',
  Football11: 'bg-blue-50 text-blue-700',
  'Football 5': 'bg-blue-50 text-blue-700',
  'Football 7': 'bg-blue-50 text-blue-700',
  'Football 11': 'bg-blue-50 text-blue-700',
  Badminton: 'bg-emerald-50 text-emerald-700',
  Pickleball: 'bg-orange-50 text-orange-700',
  Tennis: 'bg-amber-50 text-amber-700',
  Basketball: 'bg-red-50 text-red-700',
  Volleyball: 'bg-cyan-50 text-cyan-700',
  TableTennis: 'bg-violet-50 text-violet-700',
  'Table tennis': 'bg-violet-50 text-violet-700',
};

const TYPE_LABEL: Record<string, string> = {
  Football5: 'Bóng đá 5 người',
  Football7: 'Bóng đá 7 người',
  Football11: 'Bóng đá 11 người',
  Badminton: 'Cầu lông',
  Tennis: 'Tennis',
  Pickleball: 'Pickleball',
  Basketball: 'Bóng rổ',
  Volleyball: 'Bóng chuyền',
  TableTennis: 'Bóng bàn',
  'Table tennis': 'Bóng bàn',
  'Football 5': 'Bóng đá 5 người',
  'Football 7': 'Bóng đá 7 người',
  'Football 11': 'Bóng đá 11 người',
};

export const PitchCard: React.FC<PitchCardProps> = ({
  id, name, typeDisplay, price, rating, reviews, image, address,
}) => {
  const slug = slugify(name || 'san');
  const label = TYPE_LABEL[typeDisplay] || typeDisplay || 'Sân thể thao';

  return (
    <Link
      to={`/san/${id}${slug ? `-${slug}` : ''}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img src={image} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className={`mb-3 w-fit rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase ${TYPE_STYLE[typeDisplay] || 'bg-slate-50 text-slate-700'}`}>
          {label}
        </span>
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-900">{name}</h3>
          <ArrowUpRight size={17} className="shrink-0 text-slate-300 transition group-hover:text-blue-600" />
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold leading-5 text-slate-500">
          <MapPin size={14} className="mt-0.5 shrink-0 text-red-500" />
          <span className="line-clamp-2">{address || 'Đang cập nhật địa chỉ'}</span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giá từ</p>
            <p className="mt-1 text-lg font-black text-blue-700">{price}<span className="ml-1 text-xs text-slate-400">đ/giờ</span></p>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-100" title={`${reviews || 0} đánh giá`}>
            <Star size={13} className="fill-current" />
            {Number(rating || 0).toFixed(1)}
            <span className="font-bold text-amber-600/70">· {reviews || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
