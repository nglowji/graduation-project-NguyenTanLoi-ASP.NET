import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Image, Activity, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBanner from '../../../assets/banner.webp';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[92vh] flex items-center pt-28 pb-16 overflow-hidden bg-surface-light">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-[-120px] w-[420px] h-[420px] rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute bottom-[-160px] right-[-120px] w-[520px] h-[520px] rounded-full bg-secondary/15 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            className="lg:col-span-6"
          >
            <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20 mb-8">
              <Activity size={16} />
              <span>Nền tảng đặt sân thông minh</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 text-xs uppercase tracking-[0.2em] text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">AI gợi ý</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Realtime</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">VNPAY</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black leading-[1.05] mb-6 tracking-tight text-balance">
              Đặt sân thể thao nhanh gọn,
              <span className="text-primary"> quản lý trơn tru</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl text-pretty">
              Tìm sân phù hợp, giữ chỗ an toàn, thanh toán rõ ràng. SmartSport giúp người chơi và chủ sân vận hành tự tin mỗi ngày.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/explore')}
                className="btn-primary flex items-center gap-2 px-8 py-4 text-base md:text-lg font-semibold rounded-2xl"
              >
                Đặt sân ngay <ChevronRight size={20} />
              </button>
              <button onClick={() => navigate('/explore')} className="btn-secondary flex items-center gap-3 px-6 py-4 text-base md:text-lg">
                <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-primary">
                  <Image size={18} />
                </span>
                Xem hình ảnh sân
              </button>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-surface-light px-4 py-3">
                <ShieldCheck size={20} className="text-primary" />
                <div>
                  <p className="text-sm font-semibold">Thanh toán an toàn</p>
                  <p className="text-xs text-slate-500">VNPAY, QR, thẻ nội địa</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-surface-light px-4 py-3">
                <Zap size={20} className="text-secondary" />
                <div>
                  <p className="text-sm font-semibold">Xác nhận trong 60 giây</p>
                  <p className="text-xs text-slate-500">Giữ chỗ tự động, không lo trùng</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
            className="lg:col-span-6"
          >
            <div className="group relative rounded-[28px] border border-slate-200 bg-surface-light shadow-[0_30px_80px_rgba(15,23,42,0.12)] overflow-hidden">
              <div className="aspect-[16/9] bg-slate-100 relative">
                <img
                  src={heroBanner}
                  alt="Vận động viên thi đấu thể thao đầy năng lượng"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="eager"
                  fetchPriority="high"
                />
                <span className="absolute top-4 left-4 rounded-full bg-surface-light px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                  Bóng đá năng động
                </span>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Banner hình ảnh</p>
                    <h3 className="text-2xl font-bold">Bùng năng lượng thể thao</h3>
                    <p className="text-slate-500">Không khí thi đấu rực lửa cho cảm hứng đặt sân.</p>
                  </div>
                  <button onClick={() => navigate('/explore')} className="btn-primary px-5 py-3 text-sm">Xem sân nổi bật</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
