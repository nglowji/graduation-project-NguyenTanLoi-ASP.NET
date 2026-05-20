import React from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Search, ShieldCheck, Sparkles, TimerReset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bannerImg from '../../../assets/banner.webp';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const trustItems = [
    { value: '1K+', title: 'Sân bãi đăng ký', detail: 'Dữ liệu cập nhật liên tục', tone: 'bg-primary' },
    { value: 'AI', title: 'Gợi ý thông minh', detail: 'Theo khu vực và giờ chơi', tone: 'bg-emerald-500' },
    { value: '10%', title: 'Cọc giữ lịch', detail: 'Thanh toán rõ ràng', tone: 'bg-blue-500' },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[oklch(98%_0.01_250)] pt-20">
      <div className="absolute inset-x-0 top-20 h-px bg-slate-200" />
      <div className="container mx-auto grid min-h-[calc(100vh-80px)] items-stretch px-5 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:py-12">
        <div className="relative z-10 flex items-center pb-8 pt-4 lg:min-h-[640px] lg:pb-16 lg:pr-12 lg:pt-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles size={14} />
              Nền tảng thể thao số
            </span>

            <h1 className="mb-5 max-w-2xl text-4xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
              Đặt sân nhanh, rõ giá, giữ lịch chắc.
            </h1>

            <p className="mb-8 max-w-xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              Tìm sân gần bạn, xem khung giờ trống, đặt cọc qua VNPAY và nhận mã check-in trong một luồng liền mạch.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="inline-flex h-13 items-center justify-center gap-3 rounded-xl bg-primary px-7 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark active:scale-[0.98]"
              >
                <Search size={20} />
                Tìm sân ngay
              </button>
              <button
                type="button"
                onClick={() => navigate('/partner')}
                className="inline-flex h-13 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-sm font-black uppercase tracking-widest text-slate-700 transition hover:border-primary/30 hover:bg-slate-50 active:scale-[0.98]"
              >
                Đăng ký chủ sân
              </button>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: <TimerReset size={18} />, label: 'Giữ lịch tức thì' },
                { icon: <ShieldCheck size={18} />, label: 'Cọc an toàn' },
                { icon: <CalendarCheck size={18} />, label: 'Giá hiển thị rõ' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 shadow-sm">
                  <span className="text-primary">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden bg-slate-950 shadow-2xl shadow-slate-900/20 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] lg:-ml-10 lg:min-h-[600px] lg:-mr-[max(1.25rem,calc((100vw-1200px)/2))] lg:[clip-path:polygon(8%_0,100%_0,100%_100%,0_100%)]">
          <div className="pointer-events-none absolute inset-y-0 left-[10%] z-30 hidden w-px rotate-[-7deg] bg-white/80 shadow-[0_0_0_1px_rgba(15,23,42,0.08)] lg:block" />
          <div className="absolute inset-0">
            <img
              src={bannerImg}
              alt="Sân thể thao SmartSport"
              className="h-full w-full scale-95 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/55 via-slate-950/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
          </div>

          <div className="absolute inset-x-4 bottom-4 z-40 grid gap-3 sm:grid-cols-3 lg:left-[18%] lg:right-10">
            {trustItems.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/15 bg-slate-950/75 p-3 shadow-xl backdrop-blur-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${item.tone}`}>
                    {item.value}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{item.title}</p>
                    <p className="truncate text-[10px] font-semibold text-slate-300">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
