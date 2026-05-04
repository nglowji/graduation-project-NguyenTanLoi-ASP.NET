import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, QrCode, Clock, Radar, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FieldTypesSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-28 bg-surface-light relative" id="features">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-[-120px] w-[320px] h-[320px] rounded-full bg-secondary/15 blur-[80px]" />
      </div>
      <div className="container mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-14 gap-8">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-4">Tính năng nổi bật</p>
            <h2 className="text-4xl md:text-5xl font-black mb-5 tracking-tight text-slate-900">
              Đặt sân nhanh, quản lý thông minh,
              <span className="text-primary"> trải nghiệm liền mạch</span>
            </h2>
            <p className="text-slate-600 text-lg">
              Từ gợi ý sân phù hợp đến trạng thái thời gian thực, SmartSport giúp bạn đặt sân chuẩn xác và chủ sân vận hành hiệu quả.
            </p>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="group inline-flex items-center gap-2 font-semibold text-primary hover:text-slate-900 transition-colors"
          >
            Khám phá ngay <ArrowUpRight className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div
            whileHover={{ y: -4 }}
            className="lg:col-span-7 rounded-[28px] border border-slate-200 bg-surface-light p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">AI gợi ý sân hợp gu</h3>
                <p className="text-slate-500">Phân tích lịch sử chơi và vị trí để đề xuất khung giờ phù hợp.</p>
              </div>
            </div>
            <div className="space-y-4">
              <FeatureRow
                icon={<Radar size={18} />}
                title="Lọc đa tiêu chí"
                desc="Giá, loại sân, tiện ích, đánh giá đều có sẵn trong 1 lần tìm."
              />
              <FeatureRow
                icon={<Clock size={18} />}
                title="Trạng thái realtime"
                desc="Slot trống, đang giữ, đã đặt cập nhật tức thì qua SignalR."
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">Waitlist tự động</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Giữ chỗ 10 phút</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Thông báo tức thì</span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="lg:col-span-5 rounded-[28px] border border-slate-200 bg-gradient-to-br from-surface-light via-surface-light to-secondary/10 p-10"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center mb-6">
              <QrCode size={22} />
            </div>
            <h3 className="text-2xl font-bold mb-4">QR Check-in & thông báo tự động</h3>
            <p className="text-slate-600 mb-8">
              Sau khi đặt sân, mã QR và email xác nhận được gửi ngay. Chủ sân dễ dàng kiểm soát lưu lượng.
            </p>
            <div className="flex items-center justify-between rounded-2xl bg-surface-light border border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Thời gian đặt trung bình</p>
                <p className="text-lg font-semibold">Dưới 60 giây</p>
              </div>
              <button className="btn-secondary px-4 py-2 text-sm">Xem demo</button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const FeatureRow: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-surface-light px-5 py-4">
    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default FieldTypesSection;
