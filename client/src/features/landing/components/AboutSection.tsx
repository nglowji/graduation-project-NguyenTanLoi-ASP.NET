import React from 'react';
import { MapPin, ShieldCheck, Target, Users } from 'lucide-react';

const statCards = [
  { value: '3 bước', label: 'Tìm sân, giữ lịch, thanh toán cọc' },
  { value: 'QR', label: 'Check-in nhanh tại sân' },
  { value: 'AI', label: 'Gợi ý sân theo vị trí và nhu cầu' },
  { value: '0đ', label: 'Phí khởi tạo cho chủ sân' },
];

const AboutSection: React.FC = () => {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-18 sm:py-24">
      <div className="container mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
          <div>
            <span className="mb-4 block text-xs font-black uppercase tracking-[0.28em] text-primary">Về SmartSport</span>
            <h2 className="mb-6 max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Một nơi để người chơi đặt sân và chủ sân vận hành gọn hơn.
            </h2>
            <p className="mb-8 max-w-2xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              SmartSport gom tìm kiếm sân, lịch trống, thanh toán cọc, mã check-in và dashboard vận hành vào cùng một hệ thống. Người chơi giảm thời gian hỏi sân; chủ sân giảm thao tác thủ công.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: <Target size={20} />, label: 'Đặt sân nhanh' },
                { icon: <ShieldCheck size={20} />, label: 'Thanh toán an toàn' },
                { icon: <MapPin size={20} />, label: 'Lọc theo khu vực' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">
                  <span className="text-primary">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {statCards.map((item, index) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-5 shadow-sm ${
                  index === 1
                    ? 'border-slate-800 bg-slate-950 text-white'
                    : index === 3
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-950'
                }`}
              >
                {index === 2 && <Users className="mb-5 text-primary" size={34} strokeWidth={1.7} />}
                <p className="text-2xl font-black sm:text-3xl">{item.value}</p>
                <p className={`mt-3 text-xs font-black uppercase leading-5 tracking-widest ${index === 0 || index === 2 ? 'text-slate-500' : 'text-white/75'}`}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
