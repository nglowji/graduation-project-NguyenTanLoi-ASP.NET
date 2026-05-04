import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const PricingSection: React.FC = () => {
  return (
    <section className="py-28 bg-surface-light relative" id="pricing">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-120px] left-[5%] w-[260px] h-[260px] rounded-full bg-secondary/10 blur-[100px]" />
      </div>
      <div className="container mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Bảng giá & khuyến mãi</p>
            <h2 className="text-4xl md:text-5xl font-black mb-5">Chọn gói phù hợp với quy mô</h2>
            <p className="text-lg text-slate-600">
              Gói linh hoạt cho người chơi và chủ sân, ưu đãi mở tài khoản mới và bảo trì trong 30 ngày đầu.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Ưu đãi đăng ký:</span>
            <span className="rounded-full bg-secondary/15 px-3 py-1 text-secondary font-semibold">Giảm 20% tháng đầu</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-[28px] border border-slate-200 bg-slate-50 p-8">
            <h3 className="text-2xl font-bold mb-4">Người chơi</h3>
            <p className="text-slate-500 mb-6">Miễn phí tìm kiếm và đặt sân, thanh toán theo từng giao dịch.</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-6">
              <span className="rounded-full bg-slate-100 px-3 py-1">Phù hợp nhóm bạn</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Không phí duy trì</span>
            </div>
            <div className="text-4xl font-black mb-6">0đ</div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-primary" />Tìm sân, giữ slot, nhận QR check-in</li>
              <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-primary" />Thanh toán VNPAY minh bạch</li>
              <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-primary" />Hỗ trợ chat & thông báo realtime</li>
            </ul>
            <button className="btn-secondary w-full">Bắt đầu đặt sân</button>
            <p className="text-xs text-slate-500 mt-4">Không thu phí ẩn, chỉ thanh toán khi đặt sân.</p>
          </div>

          <div className="lg:col-span-7 rounded-[28px] border border-primary/30 bg-surface-light p-8 shadow-[0_30px_70px_rgba(13,138,188,0.15)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Chủ sân</h3>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Phổ biến</span>
            </div>
            <p className="text-slate-500 mb-6">Công cụ quản lý lịch sân, doanh thu và CSKH tập trung.</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-6">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Dành cho 1 - 10 sân</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Báo cáo chuyên sâu</span>
            </div>
            <div className="flex items-end gap-2 mb-6">
              <div className="text-4xl font-black">299.000đ</div>
              <div className="text-sm text-slate-500">/tháng/sân</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <FeatureLine text="Dashboard doanh thu và báo cáo" />
              <FeatureLine text="Quản lý khung giờ & giá linh hoạt" />
              <FeatureLine text="Thông báo email, QR check-in" />
              <FeatureLine text="Hỗ trợ kỹ thuật 24/7" />
            </div>
            <button className="btn-primary w-full inline-flex items-center justify-center gap-2">
              Đăng ký chủ sân <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureLine: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-start gap-2 text-sm text-slate-600">
    <CheckCircle2 size={16} className="text-secondary mt-0.5" />
    <span>{text}</span>
  </div>
);

export default PricingSection;
