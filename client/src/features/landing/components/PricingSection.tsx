import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const PricingSection: React.FC = () => {
  return (
    <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between max-w-6xl">
        
        {/* Left: Info */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="md:w-1/2 mb-16 md:mb-0"
        >
          <span className="text-primary font-bold tracking-widest uppercase mb-4 block">Đầu tư 0 Đồng</span>
          <h2 className="text-5xl md:text-6xl font-black uppercase mb-6 leading-tight">
            Chỉ trả phí <br/> khi có khách
          </h2>
          <p className="text-xl text-slate-400 mb-8 font-light">
            Đăng ký và đưa sân của bạn lên nền tảng hoàn toàn miễn phí. Chúng tôi đồng hành cùng sự phát triển của bạn.
          </p>
          
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-lg text-slate-300">
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
              Bảo vệ rủi ro trống sân
            </li>
            <li className="flex items-center gap-3 text-lg text-slate-300">
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
              Hỗ trợ kỹ thuật 24/7
            </li>
          </ul>
        </motion.div>

        {/* Right: The 10% Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="md:w-5/12 w-full"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[3rem] text-center shadow-2xl relative">
            <h3 className="text-2xl text-slate-300 mb-2 font-medium">Chiết khấu hệ thống</h3>
            <div className="text-[8rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 leading-none mb-6">
              10<span className="text-[4rem] text-primary">%</span>
            </div>
            <p className="text-lg text-slate-400">Trên mỗi lượt đặt sân thành công</p>
            
            <div className="mt-8 pt-8 border-t border-white/10 text-left">
              <p className="text-sm text-slate-500 italic">
                * Chỉ tính trên tiền thuê sân. <br/>
                * KHÔNG thu phí đối với các dịch vụ đi kèm (nước uống, thuê bóng, giày...).
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default PricingSection;
