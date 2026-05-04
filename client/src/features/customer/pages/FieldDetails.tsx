import React, { useState } from 'react';
import { MapPin, Star, Share2, Heart, Clock, CheckCircle2, ShieldCheck, Coffee, Car, Wifi } from 'lucide-react';

const FieldDetails: React.FC = () => {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const timeSlots = [
    { time: '16:00 - 17:30', price: '250.000đ', available: false },
    { time: '17:30 - 19:00', price: '300.000đ', available: true },
    { time: '19:00 - 20:30', price: '300.000đ', available: true },
    { time: '20:30 - 22:00', price: '250.000đ', available: true },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 pt-24">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Sân Bóng Thống Nhất</h1>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700">
                <Share2 size={18} /> Chia sẻ
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700">
                <Heart size={18} /> Lưu lại
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-1 text-slate-900">
              <Star size={16} className="text-yellow-500 fill-current" />
              <span className="font-bold">4.8</span>
              <span className="text-slate-500 underline cursor-pointer hover:text-slate-900">(124 đánh giá)</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <MapPin size={16} />
              <span className="underline cursor-pointer hover:text-slate-900">138 Đào Duy Từ, Phường 6, Quận 10, TP. Hồ Chí Minh</span>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-12">
          <div className="md:col-span-2 h-full">
            <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200" alt="Main Field" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-full">
            <img src="https://images.unsplash.com/photo-1518605368461-1ee55e1db87b?q=80&w=600" alt="Field 2" className="w-full h-1/2 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
            <img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=600" alt="Field 3" className="w-full h-1/2 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-full relative">
            <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=600" alt="Field 4" className="w-full h-1/2 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
            <div className="w-full h-1/2 relative cursor-pointer group">
              <img src="https://images.unsplash.com/photo-1556816214-cb336eb1f37e?q=80&w=600" alt="Field 5" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <span className="text-white font-bold text-lg">Xem thêm 12 ảnh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column - Details */}
          <div className="flex-1 lg:w-2/3">
            <div className="pb-8 border-b border-slate-200">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">Về sân bóng này</h2>
              <p className="text-slate-600 leading-relaxed text-lg mb-6">
                Sân bóng Thống Nhất là một trong những cụm sân cỏ nhân tạo đạt chuẩn FIFA lớn nhất tại khu vực Quận 10. Với hệ thống chiếu sáng LED chống lóa, mặt cỏ được bảo trì thường xuyên, đây là địa điểm lý tưởng cho các giải đấu phong trào và những trận giao hữu nảy lửa.
              </p>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <ShieldCheck className="text-primary" size={32} />
                <div>
                  <p className="font-bold text-slate-900">Sân vận hành tự động</p>
                  <p className="text-sm text-slate-500">Hỗ trợ nhận sân nhanh chóng qua mã QR, không cần chờ đợi.</p>
                </div>
              </div>
            </div>

            <div className="py-8 border-b border-slate-200">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Tiện ích đi kèm</h2>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="flex items-center gap-3 text-slate-700">
                  <Car size={24} className="text-slate-400" />
                  <span className="text-lg">Bãi đỗ xe miễn phí (Có mái che)</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Wifi size={24} className="text-slate-400" />
                  <span className="text-lg">Wifi tốc độ cao</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Coffee size={24} className="text-slate-400" />
                  <span className="text-lg">Căn tin giải khát & Đồ ăn nhẹ</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 size={24} className="text-slate-400" />
                  <span className="text-lg">Cho thuê bóng, áo Bib miễn phí</span>
                </div>
              </div>
            </div>

            <div className="py-8">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Vị trí trên bản đồ</h2>
              <div className="w-full h-80 bg-slate-200 rounded-2xl overflow-hidden relative border border-slate-300">
                {/* Giả lập bản đồ */}
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200" alt="Map" className="w-full h-full object-cover opacity-80" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-xl">
                  <div className="bg-primary text-white p-2 rounded-full">
                    <MapPin size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Booking Card */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-28 bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 z-10">
              <div className="mb-6 flex items-end gap-1">
                <span className="text-3xl font-black text-slate-900">250.000đ</span>
                <span className="text-slate-500 font-medium mb-1">/ 1.5 giờ</span>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
                <div className="flex border-b border-slate-300">
                  <div className="w-full p-3 bg-white">
                    <div className="text-xs font-bold uppercase text-slate-500 mb-1">Ngày chọn</div>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full text-slate-900 font-bold bg-transparent focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock size={18} /> Chọn khung giờ
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((slot, index) => (
                    <button 
                      key={index}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`
                        py-3 px-2 rounded-xl text-sm font-bold text-center transition-all border
                        ${!slot.available ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' : ''}
                        ${slot.available && selectedTime !== slot.time ? 'bg-white border-slate-300 text-slate-700 hover:border-primary hover:text-primary' : ''}
                        ${selectedTime === slot.time ? 'bg-primary border-primary text-white shadow-md' : ''}
                      `}
                    >
                      {slot.time}
                      {slot.available && <div className={`text-xs mt-1 font-medium ${selectedTime === slot.time ? 'text-white/80' : 'text-slate-500'}`}>{slot.price}</div>}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-lg
                  ${selectedTime ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
                `}
              >
                ĐẶT SÂN NGAY
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-slate-500">Bạn sẽ không bị trừ tiền cho đến khi xác nhận ở bước tiếp theo.</p>
              </div>

              {selectedTime && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex justify-between text-slate-600 mb-3 font-medium">
                    <span>Giá thuê sân (1.5h)</span>
                    <span>300.000đ</span>
                  </div>
                  <div className="flex justify-between text-slate-600 mb-3 font-medium">
                    <span>Nước suối (Tùy chọn)</span>
                    <span>0đ</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-lg pt-3 border-t border-slate-200">
                    <span>Tổng tiền</span>
                    <span>300.000đ</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FieldDetails;
