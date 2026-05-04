import React from 'react';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Testimonial</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Người dùng tin tưởng và giới thiệu</h2>
            <p className="text-slate-500">Người chơi và chủ sân đánh giá cao tính minh bạch và tốc độ xử lý.</p>
          </div>
          <div className="text-sm text-slate-500">4.9/5 từ 2.000+ giao dịch</div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <FeaturedReviewCard
            name="Trần Thị Lan"
            role="Quản lý Sân Cầu Lông 88"
            content="Từ khi đưa sân lên SmartSport, tỷ lệ lấp đầy lịch trống của tôi tăng vọt. Hệ thống quản lý thông minh giúp tiết kiệm thời gian, doanh thu ổn định hơn rõ rệt."
            avatar="L"
          />
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
            <ReviewCard
              name="Nguyễn Văn An"
              role="Người chơi phong trào"
              content="Giao diện rất trực quan. Tôi có thể tìm và đặt sân gần nhà chỉ trong vòng 2 phút. Thanh toán VNPAY cực kỳ tiện lợi."
              avatar="A"
            />
            <ReviewCard
              name="Lê Minh Hùng"
              role="Tổ chức giải đấu"
              content="Ấn tượng với lịch trống realtime. Không còn cảnh gọi điện hỏi từng sân nữa. Mọi thứ minh bạch và chuyên nghiệp."
              avatar="H"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeaturedReviewCard: React.FC<{ name: string; role: string; content: string; avatar: string }> = ({ name, role, content, avatar }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="lg:col-span-5 rounded-[28px] border border-primary/20 bg-surface-light p-8 shadow-[0_20px_60px_rgba(13,138,188,0.12)]"
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex gap-1 text-secondary">
        <Star fill="currentColor" size={16} />
        <Star fill="currentColor" size={16} />
        <Star fill="currentColor" size={16} />
        <Star fill="currentColor" size={16} />
        <Star fill="currentColor" size={16} />
      </div>
      <Quote size={18} className="text-primary" />
    </div>
    <p className="text-slate-700 text-lg leading-relaxed mb-10">"{content}"</p>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
        {avatar}
      </div>
      <div>
        <h4 className="font-bold">{name}</h4>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
  </motion.div>
);

const ReviewCard: React.FC<{ name: string, role: string, content: string, avatar: string }> = ({ name, role, content, avatar }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="rounded-[24px] border border-slate-200 bg-surface-light p-6 flex flex-col h-full"
  >
    <div className="flex gap-1 text-secondary mb-5">
      <Star fill="currentColor" size={16} />
      <Star fill="currentColor" size={16} />
      <Star fill="currentColor" size={16} />
      <Star fill="currentColor" size={16} />
      <Star fill="currentColor" size={16} />
    </div>
    <p className="text-slate-600 mb-8 flex-1">"{content}"</p>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
        {avatar}
      </div>
      <div>
        <h4 className="font-bold">{name}</h4>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
  </motion.div>
);

export default TestimonialsSection;
