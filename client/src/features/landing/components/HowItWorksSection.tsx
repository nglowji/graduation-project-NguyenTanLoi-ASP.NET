import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const HowItWorksSection: React.FC = () => {
  return (
    <section className="bg-slate-50 relative py-32">
      <div className="container mx-auto px-6">
        
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase">Trải nghiệm <br/> Liền Mạch</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-20 items-start">
          
          {/* Left: Sticky Image */}
          <div className="lg:w-1/2 sticky top-32 h-[70vh] rounded-[3rem] overflow-hidden hidden lg:block">
            <img 
              src="https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1200" 
              alt="Player Action" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right: Scrolling Content */}
          <div className="lg:w-1/2 flex flex-col gap-32 py-20">
            
            <StepBlock 
              number="01"
              title="Tìm Kiếm Nhanh Chóng"
              desc="Sử dụng bộ lọc thông minh để tìm thấy sân bóng, sân tennis hay cầu lông gần bạn nhất chỉ trong vài giây."
            />
            
            <StepBlock 
              number="02"
              title="Đặt Lịch Tức Thì"
              desc="Không cần gọi điện xác nhận. Chọn giờ trống, thanh toán an toàn và nhận ngay mã xác nhận đặt sân."
            />
            
            <StepBlock 
              number="03"
              title="Ra Sân Tận Hưởng"
              desc="Đến sân đúng giờ, quét mã QR và bắt đầu trận đấu đỉnh cao của bạn với bạn bè và đồng đội."
            />

          </div>
        </div>
      </div>
    </section>
  );
};

const StepBlock: React.FC<{ number: string, title: string, desc: string }> = ({ number, title, desc }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 50%"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 1], [0.2, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [50, 0]);

  return (
    <motion.div ref={ref} style={{ opacity, y }} className="flex flex-col">
      <span className="text-8xl font-black text-slate-200 mb-6">{number}</span>
      <h3 className="text-4xl font-bold text-slate-900 mb-6">{title}</h3>
      <p className="text-2xl text-slate-500 leading-relaxed font-light">{desc}</p>
    </motion.div>
  );
};

export default HowItWorksSection;
