import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Building, BadgeDollarSign, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OwnerRegistrationSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <h2 className="text-5xl font-black mb-6 uppercase text-slate-900">Trở thành Đối tác</h2>
        <p className="text-xl text-slate-500 mb-20 max-w-2xl mx-auto">
          Tối đa hóa doanh thu sân tập của bạn với hệ thống quản lý thông minh. Tham gia mạng lưới SmartSport chỉ với 3 bước.
        </p>
        
        {/* Creative Timeline Layout */}
        <div className="relative max-w-5xl mx-auto mb-20">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2" />
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            
            <TimelineCard 
              delay={0}
              icon={<UserPlus size={32} />} 
              step="01" 
              title="Tạo Tài Khoản" 
              desc="Đăng ký tài khoản Đối tác miễn phí trong 2 phút."
              color="text-blue-400"
              bgColor="bg-blue-400/10"
              borderColor="border-blue-400/30"
            />

            <TimelineCard 
              delay={0.2}
              icon={<Building size={32} />} 
              step="02" 
              title="Thiết Lập Sân Bãi" 
              desc="Cập nhật hình ảnh, giá thuê và lịch hoạt động thực tế."
              color="text-primary"
              bgColor="bg-primary/10"
              borderColor="border-primary/30"
              className="md:-translate-y-8"
            />

            <TimelineCard 
              delay={0.4}
              icon={<BadgeDollarSign size={32} />} 
              step="03" 
              title="Nhận Doanh Thu" 
              desc="Hệ thống tự động chốt đơn và chuyển tiền nhanh chóng."
              color="text-green-400"
              bgColor="bg-green-400/10"
              borderColor="border-green-400/30"
            />

          </div>
        </div>

        <button 
          onClick={() => navigate('/register')}
          className="btn-primary inline-flex items-center gap-3 px-10 py-5 text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(13,138,188,0.4)]"
        >
          Đăng ký Chủ Sân Ngay <ArrowRight size={24} />
        </button>
      </div>
    </section>
  );
};

const TimelineCard: React.FC<{ icon: React.ReactNode, step: string, title: string, desc: string, color: string, bgColor: string, borderColor: string, delay: number, className?: string }> = ({ icon, step, title, desc, color, bgColor, borderColor, delay, className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, delay }}
    className={`bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:${borderColor} transition-all duration-300 group relative ${className}`}
  >
    <div className={`w-20 h-20 mx-auto rounded-2xl ${bgColor} ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <span className="absolute top-4 right-6 text-5xl font-black text-slate-100 select-none">{step}</span>
    <h3 className="text-2xl font-bold mb-4 text-slate-800">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </motion.div>
);

export default OwnerRegistrationSection;
