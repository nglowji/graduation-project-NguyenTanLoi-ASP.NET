import React from 'react';
import { MapPin, CalendarDays, Wallet, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    title: 'Chọn sân phù hợp',
    desc: 'Lọc theo khu vực, môn thể thao, giá tiền và tiện ích mong muốn.',
    icon: <MapPin size={22} />,
    tag: 'Lọc 20+ tiêu chí'
  },
  {
    title: 'Giữ khung giờ nhanh',
    desc: 'Kiểm tra slot trong thời gian thực, hệ thống giữ chỗ an toàn.',
    icon: <CalendarDays size={22} />,
    tag: 'Giữ slot 10 phút'
  },
  {
    title: 'Thanh toán rõ ràng',
    desc: 'Đặt cọc qua VNPAY hoặc thẻ, thông tin giao dịch minh bạch.',
    icon: <Wallet size={22} />,
    tag: 'Đặt cọc 30%'
  },
  {
    title: 'Xác nhận & check-in',
    desc: 'Nhận email và mã QR, đến sân check-in trong vài giây.',
    icon: <CheckCircle2 size={22} />,
    tag: 'QR xác nhận'
  }
];

const ProcessSection: React.FC = () => {
  return (
    <section className="py-28 bg-slate-50 relative" id="process">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-[15%] w-[240px] h-[240px] rounded-full bg-primary/10 blur-[90px]" />
      </div>
      <div className="container mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-14">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Quy trình đặt sân</p>
            <h2 className="text-4xl md:text-5xl font-black mb-5">4 bước đơn giản để có sân tốt</h2>
            <p className="text-slate-600 text-lg">
              Mọi thao tác được thiết kế gọn gàng để người chơi hoàn tất đặt sân trong vài phút.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-surface-light px-5 py-3 text-sm text-slate-500">
            Trung bình 60 giây là hoàn tất đặt sân
          </div>
        </div>
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div className="rounded-[28px] border border-slate-200 bg-surface-light p-8">
              <div className="relative space-y-6">
                <div className="absolute left-5 top-5 bottom-5 w-px bg-slate-200" />
                {steps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="relative pl-16"
                  >
                    <div className="absolute left-0 top-0 w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      0{index + 1}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 w-fit">
                        {step.tag}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Gợi ý tối ưu</p>
              <h3 className="text-2xl font-bold mb-4">Giữ slot trước, đến sân đúng giờ</h3>
              <p className="text-slate-600 mb-6">
                Hệ thống nhắc lịch tự động và gửi QR check-in. Chủ sân nhận thông báo khi khách đến.
              </p>
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-surface-light px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nhắc lịch</p>
                  <p className="text-sm font-semibold">Tự động trước 2 giờ</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-surface-light px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Đối soát</p>
                  <p className="text-sm font-semibold">Xác nhận bằng QR trong 5 giây</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
