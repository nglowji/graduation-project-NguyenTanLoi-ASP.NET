import React from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Search, ShieldCheck, Sparkles, TimerReset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bannerImg from '../../../assets/home.png';

const benefits = [
  { icon: CalendarCheck, label: 'Lịch sân rõ ràng' },
  { icon: TimerReset, label: 'Đặt lịch nhanh' },
  { icon: ShieldCheck, label: 'Thanh toán an tâm' },
];

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="border-b border-cyan-100 bg-cyan-50 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto grid max-w-[1680px] gap-8 px-6 py-12 xl:grid-cols-[0.66fr_1.34fr] xl:items-center xl:py-16"
      >
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
            <Sparkles size={16} />
            SmartSport
          </div>
          <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
            Tìm đúng sân.<br /><span className="text-blue-700">Chơi đúng chất.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600 sm:text-lg">
            Khám phá sân thể thao theo khu vực, bộ môn và ngân sách. Chọn khung giờ trống rồi đặt sân trong vài bước.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/fields')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
            >
              <Search size={18} />
              Khám phá sân
            </button>
            <button
              type="button"
              onClick={() => navigate('/owner')}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
            >
              Dành cho chủ sân
            </button>
          </div>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2 text-xs font-black text-slate-700">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-700 text-cyan-100"><Icon size={16} /></span>
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/10">
          <img src={bannerImg} alt="SmartSport kết nối cộng đồng thể thao" className="block h-auto w-full object-contain" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
