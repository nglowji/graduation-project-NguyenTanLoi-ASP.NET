import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, MapPin, ShieldCheck } from 'lucide-react';

const AboutSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden border-t border-b border-slate-200">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Cột Trái: Câu chuyện thương hiệu */}
          <div>
            <span className="text-primary font-bold tracking-widest uppercase mb-4 block">Về Chúng Tôi</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Nền tảng Thể thao số <br /> <span className="text-primary">Tiên phong</span>
            </h2>
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed mb-8">
              SmartSport ra đời với sứ mệnh đơn giản hóa việc kết nối giữa cộng đồng những người đam mê thể thao và các chủ cơ sở kinh doanh sân bãi. Bằng việc ứng dụng công nghệ hiện đại, chúng tôi xóa bỏ mọi rào cản trong việc tìm kiếm, đặt lịch và quản lý.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-slate-700 font-bold bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                <Target className="text-primary" size={20} /> Đặt Sân Nhanh
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-bold bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                <ShieldCheck className="text-primary" size={20} /> Thanh Toán An Toàn
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-bold bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                <MapPin className="text-primary" size={20} /> Phủ Sóng Toàn Quốc
              </div>
            </div>
          </div>

          {/* Cột Phải: Khối Thống kê (Stats Grid) */}
          <div className="grid grid-cols-2 gap-6 relative">
            {/* Lớp nền trang trí */}
            <div className="absolute inset-0 bg-primary/5 rounded-[3rem] -m-6 -z-10" />

            {/* Stat 1 */}
            <motion.div 
              animate={{ y: [24, 0, 24] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center"
            >
              <span className="text-5xl font-black text-primary mb-2">100+</span>
              <span className="text-slate-600 font-bold text-lg">Cơ sở Sân bãi</span>
            </motion.div>

            {/* Stat 2 */}
            <motion.div 
              animate={{ y: [0, 24, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/50 flex flex-col items-center text-center"
            >
              <span className="text-5xl font-black text-white mb-2">5K+</span>
              <span className="text-slate-400 font-bold text-lg">Khách Hàng</span>
            </motion.div>

            {/* Stat 3 */}
            <motion.div 
              animate={{ y: [24, 0, 24] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center"
            >
              <Users className="text-primary mb-4" size={48} strokeWidth={1.5} />
              <span className="text-slate-600 font-bold text-lg">Cộng Đồng Lớn Mạnh</span>
            </motion.div>

            {/* Stat 4 */}
            <motion.div 
              animate={{ y: [0, 24, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="bg-primary p-8 rounded-3xl shadow-xl shadow-primary/30 flex flex-col items-center text-center"
            >
              <span className="text-5xl font-black text-white mb-2">0%</span>
              <span className="text-primary-50 font-bold text-lg">Phí Khởi Tạo</span>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
