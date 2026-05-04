import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ListChecks, CreditCard, Map, UserPlus, Settings, TrendingUp, CheckCircle2, Star } from 'lucide-react';

const WorkflowSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'player' | 'owner'>('player');

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Cách thức hoạt động
          </h2>
          <p className="text-slate-600 text-xl">Đơn giản, nhanh chóng và minh bạch cho tất cả mọi người.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-16">
          <div className="bg-slate-100 p-2 rounded-full flex gap-2 relative shadow-inner">
            <motion.div 
              className="absolute inset-y-2 w-[calc(50%-0.5rem)] bg-primary rounded-full shadow-md"
              initial={false}
              animate={{
                left: activeTab === 'player' ? '0.5rem' : '50%'
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            
            <button 
              onClick={() => setActiveTab('player')}
              className={`relative z-10 px-10 py-4 rounded-full font-bold text-lg transition-colors w-48 ${activeTab === 'player' ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Người chơi
            </button>
            <button 
              onClick={() => setActiveTab('owner')}
              className={`relative z-10 px-10 py-4 rounded-full font-bold text-lg transition-colors w-48 ${activeTab === 'owner' ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Chủ sân
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {activeTab === 'player' && (
              <motion.div
                key="player-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pb-12 md:pb-16"
              >
                {/* Bước 1 (Cột Trái - Bình thường) */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3"><span className="text-primary mr-2">01.</span>Gợi Ý Thông Minh</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">Hệ thống AI phân tích thói quen và vị trí để đề xuất sân bóng, sân tennis phù hợp nhất kèm bộ lọc nâng cao.</p>
                </div>

                {/* Bước 2 (Cột Phải - Kéo xuống tạo So-le) */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-primary/50 hover:shadow-xl transition-all duration-300 md:translate-y-12">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <ListChecks size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3"><span className="text-primary mr-2">02.</span>Đặt Sân & Dịch Vụ</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">Xem chi tiết tình trạng sân, lịch trống và thêm trực tiếp các dịch vụ đi kèm như nước uống, áo bib, thuê bóng.</p>
                </div>

                {/* Bước 3 (Cột Trái - Bình thường) */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <CreditCard size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3"><span className="text-primary mr-2">03.</span>Thanh Toán An Toàn</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">Thanh toán đặt cọc nhanh chóng qua VNPAY, MoMo, thẻ tín dụng với hệ thống bảo mật tuyệt đối.</p>
                </div>

                {/* Bước 4 (Cột Phải - Kéo xuống tạo So-le) */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-primary/50 hover:shadow-xl transition-all duration-300 md:translate-y-12">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <Map size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3"><span className="text-primary mr-2">04.</span>Bản Đồ Chỉ Đường</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">Tích hợp bản đồ thông minh hướng dẫn lộ trình ngắn nhất đến sân, sẵn sàng cho trận đấu thăng hoa.</p>
                </div>

                {/* Phần gợi ý sân nổi bật (Mới thêm) */}
                <div className="md:col-span-2 mt-20 md:mt-32">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                      <Sparkles className="text-primary" /> Sân bãi gợi ý cho bạn
                    </h3>
                    <button className="text-primary font-bold hover:underline">Xem tất cả</button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <FeaturedPitchCard 
                      name="Sân Thống Nhất"
                      price="250k"
                      rating={4.8}
                      image="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800"
                    />
                    <FeaturedPitchCard 
                      name="Badminton Center"
                      price="180k"
                      rating={4.9}
                      image="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800"
                    />
                    <FeaturedPitchCard 
                      name="Tennis Central"
                      price="400k"
                      rating={4.7}
                      image="https://images.unsplash.com/photo-1595435066359-6286386730b9?q=80&w=800"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'owner' && (
              <motion.div
                key="owner-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-12"
              >
                {/* 3 Bước cho Chủ sân */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-emerald-50 rounded-[2rem] p-8 border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-600/30">
                      <UserPlus size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">01. Mở Tài Khoản</h3>
                    <p className="text-slate-600 font-medium text-lg leading-relaxed">Đăng ký tài khoản Đối tác hoàn toàn miễn phí chỉ trong vòng 3 phút.</p>
                  </div>
                  <div className="bg-teal-50 rounded-[2rem] p-8 border-2 border-teal-100 hover:border-teal-300 transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-teal-600/30">
                      <Settings size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">02. Thiết Lập Sân</h3>
                    <p className="text-slate-600 font-medium text-lg leading-relaxed">Đăng tải hình ảnh sân bãi và thiết lập giá tiền theo từng khung giờ linh hoạt.</p>
                  </div>
                  <div className="bg-cyan-50 rounded-[2rem] p-8 border-2 border-cyan-100 hover:border-cyan-300 transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-cyan-600/30">
                      <TrendingUp size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">03. Tăng Doanh Thu</h3>
                    <p className="text-slate-600 font-medium text-lg leading-relaxed">Nhận thông báo đặt lịch tự động, quản lý dòng tiền an toàn không lo bị bùng lịch.</p>
                  </div>
                </div>

                {/* Khối Giải thích Mô hình 10% (Solid Colors, No Blur) */}
                <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
                  <div className="flex-1">
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-8 uppercase tracking-wide leading-tight">
                      Mô hình kinh doanh<br/><span className="text-green-400">Siêu Lợi Nhuận</span>
                    </h3>
                    <ul className="space-y-6">
                      <li className="flex items-start gap-4">
                        <CheckCircle2 className="text-green-400 shrink-0 mt-1" size={28} strokeWidth={3} />
                        <div>
                          <p className="text-white text-xl font-bold mb-1">Miễn phí 100% Khởi tạo</p>
                          <p className="text-slate-400 font-medium">Không thu phí đăng ký tài khoản và đăng tải sân bãi.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-4">
                        <CheckCircle2 className="text-green-400 shrink-0 mt-1" size={28} strokeWidth={3} />
                        <div>
                          <p className="text-white text-xl font-bold mb-1">Win - Win</p>
                          <p className="text-slate-400 font-medium">Chỉ thu chiết khấu khi có khách hàng đặt sân thành công.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-4">
                        <CheckCircle2 className="text-green-400 shrink-0 mt-1" size={28} strokeWidth={3} />
                        <div>
                          <p className="text-white text-xl font-bold mb-1 text-yellow-400">Không thu phí Dịch vụ đi kèm</p>
                          <p className="text-slate-400 font-medium">Bạn giữ 100% doanh thu từ việc bán nước, thuê áo bib, thuê bóng.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Cục 10% Siêu nét */}
                  <div className="w-full md:w-auto bg-green-500 rounded-[2rem] p-10 flex flex-col items-center justify-center shrink-0 shadow-2xl shadow-green-500/20 transform md:rotate-3 hover:rotate-0 transition-transform duration-300">
                    <span className="text-green-950 text-xl font-black uppercase tracking-widest mb-2">Phí nền tảng</span>
                    <span className="text-white text-8xl md:text-9xl font-black leading-none drop-shadow-sm">
                      10%
                    </span>
                    <span className="text-green-900 font-bold text-lg mt-4 px-6 py-2 bg-white/20 rounded-full">Trên mỗi đơn đặt sân</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default WorkflowSection;
