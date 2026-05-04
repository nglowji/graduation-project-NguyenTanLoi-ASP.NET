import React from 'react';
import { BarChart3, CalendarClock, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OwnerBenefitsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-28 bg-slate-50 relative" id="owner">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-120px] right-[15%] w-[260px] h-[260px] rounded-full bg-primary/10 blur-[90px]" />
      </div>
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Lợi ích chủ sân</p>
            <h2 className="text-4xl md:text-5xl font-black mb-6">Quản lý sân và doanh thu tập trung</h2>
            <p className="text-lg text-slate-600 mb-8">
              Dashboard thống kê, lịch sân rõ ràng và tự động nhắc khách. Tăng tỷ lệ lấp đầy với waitlist và giá linh hoạt.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary inline-flex items-center gap-2 px-7 py-4 text-base"
            >
              Đăng ký làm chủ sân <ArrowRight size={18} />
            </button>
          </div>
          <div className="lg:col-span-7">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <BenefitRow
                  icon={<BarChart3 size={22} />}
                  title="Báo cáo doanh thu"
                  desc="Theo dõi tỷ lệ lấp đầy, doanh thu theo ngày, tuần, tháng."
                />
                <BenefitRow
                  icon={<CalendarClock size={22} />}
                  title="Lịch sân đồng bộ"
                  desc="Cập nhật tình trạng đặt sân theo thời gian thực."
                />
                <BenefitRow
                  icon={<Users size={22} />}
                  title="Giảm tỉ lệ bỏ hẹn"
                  desc="Đặt cọc và thông báo giúp giảm tình trạng boom sân."
                />
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-surface-light p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Dashboard mẫu</p>
                <h3 className="text-xl font-semibold mb-4">Tối ưu doanh thu theo khung giờ</h3>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-2">Tỷ lệ lấp đầy hôm nay</p>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full w-[68%] bg-primary/60" />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-2">Giờ cao điểm</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">17:00 - 21:00</span>
                      <span className="font-semibold text-secondary">+30%</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-2">Waitlist</p>
                    <p className="text-sm font-semibold">Tự động lấp đầy khi có huỷ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const BenefitRow: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-surface-light p-5">
    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-slate-500 text-sm">{desc}</p>
    </div>
  </div>
);

export default OwnerBenefitsSection;
