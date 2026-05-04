import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bannerImg from '../../../assets/banner.webp';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] w-full flex items-center overflow-hidden bg-surface-light pt-20">
      
      {/* Nửa bên Phải: Hình ảnh bị vát chéo (Diagonal Split) */}
      <div 
        className="hidden lg:block absolute top-0 right-0 w-[55%] h-full z-0 bg-slate-900"
        style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
        <img 
          src={bannerImg} 
          alt="Stadium Banner"
          className="w-full h-full object-contain object-right opacity-90"
        />
        
        {/* Nội dung chuyển động ở khu vực đen (phía dưới ảnh) */}
        <div className="absolute bottom-10 left-[15%] right-0 z-20 flex gap-6 px-10">
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">1K+</div>
              <div>
                <p className="text-white text-xs font-bold">Sân bãi đăng ký</p>
                <p className="text-slate-400 text-[10px]">Cập nhật 5 phút trước</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">AI</div>
              <div>
                <p className="text-white text-xs font-bold">Gợi ý thông minh</p>
                <p className="text-slate-400 text-[10px]">Đang hoạt động</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">24/7</div>
              <div>
                <p className="text-white text-xs font-bold">Hỗ trợ trực tuyến</p>
                <p className="text-slate-400 text-[10px]">Luôn sẵn sàng</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Lớp phủ mờ nhẹ */}
        <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
      </div>

      {/* Nửa bên Trái: Nội dung (Slogan & CTA) */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="w-full lg:w-[50%]">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Tiêu đề phụ (Badge) */}
            <span className="inline-block py-1 px-4 rounded-full bg-primary/10 text-primary font-bold tracking-widest uppercase mb-4 text-xs border border-primary/20">
              Nền tảng Thể thao Số 1 Việt Nam
            </span>
            
            {/* Tiêu đề chính */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.15] mb-5 tracking-tight max-w-[90%]">
              Thỏa mãn đam mê, <br />
              <span className="text-primary">Không lo tìm sân.</span>
            </h1>
            
            {/* Mô tả */}
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed font-medium max-w-md">
              Khám phá và đặt lịch tại hàng trăm cơ sở thể thao chất lượng cao trên toàn quốc chỉ với vài thao tác đơn giản.
            </p>

            {/* Nút hành động (CTA) */}
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/explore')} 
                className="bg-primary hover:bg-primary-dark text-white text-base font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-primary/30 group"
              >
                <Search size={22} className="group-hover:scale-110 transition-transform" />
                Tìm sân ngay
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      
    </section>
  );
};

export default HeroSection;
