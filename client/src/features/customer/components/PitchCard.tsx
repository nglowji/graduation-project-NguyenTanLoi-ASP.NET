import React from 'react';
import { ArrowUpRight, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '../../../utils/slug';

interface PitchCardProps { id: string; name: string; typeDisplay: string; price: string; rating: number; reviews: number; image: string; address?: string; }

const typeLabel = (value?: string) => {
  const normalized = String(value || '').replace(/[\s_-]/g, '').toLowerCase();
  const labels: Record<string, string> = {
    football5: 'Bóng đá 5 người', football7: 'Bóng đá 7 người', football11: 'Bóng đá 11 người',
    badminton: 'Cầu lông', pickleball: 'Pickleball', tennis: 'Quần vợt',
    basketball: 'Bóng rổ', volleyball: 'Bóng chuyền', tabletennis: 'Bóng bàn',
    bongda5: 'Bóng đá 5 người', bongda7: 'Bóng đá 7 người', bongda11: 'Bóng đá 11 người',
    caulong: 'Cầu lông', quanvot: 'Quần vợt', bongro: 'Bóng rổ',
    bongchuyen: 'Bóng chuyền', bongban: 'Bóng bàn',
  };

  return labels[normalized] || 'Sân thể thao';
};

export const PitchCard: React.FC<PitchCardProps> = ({ id, name, typeDisplay, price, rating, reviews, image, address }) => {
  const slug = slugify(name || 'san');
  const ratingNum = Number(rating || 0);
  return <Link to={`/san/${id}${slug ? `-${slug}` : ''}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-4 focus:ring-blue-500/20">
    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100"><img src={image} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /><span className="absolute left-3 top-3 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700 shadow-sm">{typeLabel(typeDisplay)}</span>{ratingNum > 0 && <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-black text-white"><Star size={12} className="fill-amber-400 text-amber-400" />{ratingNum.toFixed(1)}<span className="text-white/60">({reviews || 0})</span></span>}</div>
    <div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="line-clamp-1 text-base font-black text-slate-950 transition group-hover:text-blue-700">{name}</h3><ArrowUpRight size={17} className="shrink-0 text-slate-300 group-hover:text-blue-600" /></div>{address && <p className="mt-2 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500"><MapPin size={14} className="shrink-0 text-blue-600" />{address}</p>}<div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giá từ</p><p className="mt-1 text-lg font-black text-blue-700">{price}<span className="ml-1 text-xs text-slate-400">đ/giờ</span></p></div><span className="text-xs font-black text-slate-500 group-hover:text-blue-700">Xem chi tiết</span></div></div>
  </Link>;
};
