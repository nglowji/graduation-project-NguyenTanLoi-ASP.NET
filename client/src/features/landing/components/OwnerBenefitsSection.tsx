import React from 'react';
import { motion } from 'framer-motion';

const OwnerBenefitsSection: React.FC = () => {
  return (
    <section className="py-32 bg-white relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase">
            Tại sao nên hợp tác <br/> cùng SmartSport?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Benefit 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 bg-slate-50 rounded-[2rem] p-10 flex flex-col justify-between overflow-hidden relative group"
          >
            <div className="relative z-10 w-2/3">
              <h3 className="text-3xl font-black mb-4">Lấp đầy <br/> Công suất sân</h3>
              <p className="text-slate-500 text-lg">Tiếp cận hàng ngàn người chơi đang có nhu cầu đặt sân mỗi ngày ngay trên nền tảng. Tối đa hóa doanh thu của bạn.</p>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800" 
              alt="Stadium" 
              className="absolute right-0 bottom-0 w-1/2 h-[120%] object-cover object-left opacity-30 group-hover:opacity-60 transition-opacity duration-500"
            />
          </motion.div>

          {/* Benefit 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1 bg-slate-900 text-white rounded-[2rem] p-10 flex flex-col justify-end overflow-hidden relative group"
          >
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-4 text-primary">Tự động hóa 100%</h3>
              <p className="text-slate-400">Không còn phải gọi điện kiểm tra, xếp lịch thủ công hay lo sợ trùng giờ.</p>
            </div>
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>

          {/* Benefit 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3 bg-slate-100 rounded-[2rem] p-12 flex flex-col md:flex-row items-center gap-12 overflow-hidden"
          >
            <div className="md:w-1/2">
              <h3 className="text-4xl font-black mb-6">Chống rủi ro <br/> "Bùng lịch"</h3>
              <p className="text-slate-600 text-xl leading-relaxed">
                Hệ thống đặt cọc và thanh toán trước được tích hợp sẵn. Khách hàng phải thanh toán qua VNPAY hoặc ví điện tử để giữ chỗ, đảm bảo doanh thu an toàn tuyệt đối cho bạn.
              </p>
            </div>
            <div className="md:w-1/2 w-full h-64 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800" 
                alt="Payment Security" 
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default OwnerBenefitsSection;
