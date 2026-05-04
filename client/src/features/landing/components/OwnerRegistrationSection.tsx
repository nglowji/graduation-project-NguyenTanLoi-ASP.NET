import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OwnerRegistrationSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
      {/* Immersive Dark Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1519315901367-f34f9274ceb5?q=80&w=2500" 
          alt="Sports Venue Management"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-slate-900/60" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight uppercase">
            Sân Bãi Của Bạn <br/> 
            <span className="text-primary">Doanh Thu Tối Đa</span>
          </h2>
          
          <p className="text-2xl text-slate-300 font-light mb-12">
            Hệ thống quản lý thông minh giúp đối tác tối ưu hóa 100% công suất sân.
          </p>

          <button 
            onClick={() => navigate('/register')}
            className="group relative inline-flex items-center justify-center gap-4 px-10 py-6 text-xl font-bold text-white transition-all duration-300 bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-black overflow-hidden"
          >
            Trở thành Đối Tác Ngay
            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default OwnerRegistrationSection;
