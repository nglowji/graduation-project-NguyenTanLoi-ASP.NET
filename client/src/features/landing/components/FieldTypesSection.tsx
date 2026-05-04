import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const FieldTypesSection: React.FC = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  
  // Create horizontal scroll effect based on vertical scroll
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });
  
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-white">
      <div className="sticky top-0 h-screen flex flex-col items-center overflow-hidden">
        
        {/* Minimalist Header */}
        <div className="w-full container mx-auto px-6 py-12 flex justify-between items-end shrink-0 z-10">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter">
            Địa Điểm <br/> Hàng Đầu
          </h2>
          <p className="text-slate-500 max-w-sm text-right hidden md:block">
            Lướt qua để chiêm ngưỡng những cụm sân thể thao chất lượng nhất nằm trong hệ sinh thái của chúng tôi.
          </p>
        </div>

        {/* Horizontal Scroll Gallery */}
        <motion.div style={{ x }} className="flex gap-8 px-6 mt-10 h-[60vh] md:h-[70vh]">
          
          <VenueCard 
            image="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1600"
            title="Sân Bóng Đá 11 Người"
            subtitle="Cụm Sân Thống Nhất"
          />
          <VenueCard 
            image="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1600"
            title="Sân Cầu Lông Tiêu Chuẩn"
            subtitle="Badminton World"
          />
          <VenueCard 
            image="https://images.unsplash.com/photo-1595435066359-6286386730b9?q=80&w=1600"
            title="Sân Quần Vợt Đất Nện"
            subtitle="Tennis Central"
          />
          <VenueCard 
            image="https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=1600"
            title="Nhà Thi Đấu Bóng Rổ"
            subtitle="SSA Arena"
          />
          
        </motion.div>
      </div>
    </section>
  );
};

const VenueCard: React.FC<{ image: string, title: string, subtitle: string }> = ({ image, title, subtitle }) => (
  <div className="w-[85vw] md:w-[60vw] lg:w-[50vw] h-full shrink-0 relative group overflow-hidden bg-slate-100">
    <img 
      src={image} 
      alt={title} 
      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
    />
    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
    
    <div className="absolute bottom-10 left-10 text-white">
      <p className="text-sm font-bold tracking-widest uppercase mb-2 opacity-80">{subtitle}</p>
      <h3 className="text-3xl md:text-5xl font-black">{title}</h3>
    </div>
  </div>
);

export default FieldTypesSection;
