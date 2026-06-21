import React from 'react';
import { ArrowRight, CalendarDays, MapPin, Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bannerImg from '../../../assets/banner.png';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  return <section className="relative isolate min-h-130 overflow-hidden pt-20 text-blue-950 sm:min-h-142.5">
    <img src={bannerImg} alt="Các bộ môn thể thao tại SmartSport" className="absolute inset-0 -z-20 h-full w-full object-cover" />
    <div className="mx-auto flex min-h-110 max-w-7xl flex-col justify-end px-5 pb-10 sm:min-h-122.5 sm:px-6 sm:pb-12">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">SmartSport · Đặt sân thể thao</p>
      <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight text-blue-950 sm:text-6xl">Chọn sân, chốt giờ, ra sân đúng hẹn.</h1>
      <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">Tìm sân theo môn và khu vực, xem khung giờ trống, thanh toán cọc rồi theo dõi toàn bộ đơn đặt tại một nơi.</p>
      <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => navigate('/explore')} className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white transition hover:bg-blue-800"><Search size={18} />Khám phá sân</button><button type="button" onClick={() => navigate('/partner')} className="inline-flex h-12 items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-5 text-sm font-black text-blue-800 transition hover:bg-blue-50">Dành cho chủ sân <ArrowRight size={17} /></button></div>
      <div className="mt-9 grid max-w-xl gap-3 border-t border-blue-200 pt-5 sm:grid-cols-3"><span className="flex items-center gap-2 text-sm font-bold text-blue-950"><MapPin size={17} className="text-blue-600" />Lọc theo khu vực</span><span className="flex items-center gap-2 text-sm font-bold text-blue-950"><CalendarDays size={17} className="text-blue-600" />Lịch trống thực tế</span><span className="flex items-center gap-2 text-sm font-bold text-blue-950"><Star size={17} className="text-amber-500" />Đánh giá từ người chơi</span></div>
    </div>
  </section>;
};

export default HeroSection;
