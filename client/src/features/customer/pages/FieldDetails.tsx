import React, { useState } from 'react';
import { MapPin, Star, Share2, Heart, Clock, CheckCircle2, ShieldCheck, Coffee, Car, Wifi, Loader2 } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { pitchService, type PitchResponse } from '../../../services/pitchService';
import { bookingService } from '../../../services/bookingService';
import { paymentService } from '../../../services/paymentService';
import { signalRService } from '../../../services/signalRService';
import api from '../../../services/api';

const FieldDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pitch, setPitch] = useState<PitchResponse | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (id) {
      fetchPitchDetails();
      fetchSlots();
      
      // SignalR setup
      const setupSignalR = async () => {
        await signalRService.startConnection();
        await signalRService.joinPitchGroup(id!);
        
        signalRService.onTimeSlotStatusChanged((timeSlotId, status, date) => {
          if (date === selectedDate) {
            setAvailableSlots(prev => prev.map(slot => 
              slot.id === timeSlotId 
                ? { ...slot, isAvailable: status === 'Available' } 
                : slot
            ));
          }
        });
      };

      setupSignalR();

      return () => {
        signalRService.leavePitchGroup(id!);
        signalRService.off('TimeSlotStatusChanged');
      };
    }
  }, [id, selectedDate]);

  const fetchPitchDetails = async () => {
    setIsLoading(true);
    try {
      const data = await pitchService.getById(id!);
      setPitch(data);
    } catch (error) {
      console.error("Error fetching pitch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await api.get(`/pitches/${id}/available-slots`, {
        params: { date: selectedDate }
      });
      setAvailableSlots(response.data);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  const handleBooking = async () => {
    if (!selectedTime) return;
    
    setIsBooking(true);
    try {
      // 1. Create Booking
      const booking = await bookingService.create({
        timeSlotId: selectedTime,
        bookingDate: selectedDate
      });

      // 2. Create Payment URL
      const paymentResponse = await paymentService.createPayment({
        bookingId: booking.id,
        returnUrl: `${window.location.origin}/payment-result`
      });

      // 3. Redirect to VNPay
      window.location.href = paymentResponse.paymentUrl;
    } catch (error: any) {
      console.error("Booking/Payment failed:", error);
      alert(error.response?.data?.Detail || "Đặt sân thất bại. Vui lòng thử lại.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24">
        <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy sân bóng này.</h2>
        <Link to="/explore" className="mt-4 text-primary font-bold underline">Quay lại tìm kiếm</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 pt-24">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{pitch.name}</h1>
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
              <span className="font-bold">{pitch.averageRating}</span>
              <span className="text-slate-500 underline cursor-pointer hover:text-slate-900">({pitch.totalReviews} đánh giá)</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <MapPin size={16} />
              <span className="underline cursor-pointer hover:text-slate-900">{pitch.address}, {pitch.ward}, {pitch.district}, {pitch.province}</span>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-12">
          <div className="md:col-span-2 h-full">
            <img src={pitch.images?.[0] || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200"} alt={pitch.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-full">
            <img src={pitch.images?.[1] || "https://images.unsplash.com/photo-1518605368461-1ee55e1db87b?q=80&w=600"} alt="Field 2" className="w-full h-1/2 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
            <img src={pitch.images?.[2] || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=600"} alt="Field 3" className="w-full h-1/2 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-full relative">
            <img src={pitch.images?.[3] || "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=600"} alt="Field 4" className="w-full h-1/2 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
            <div className="w-full h-1/2 relative cursor-pointer group">
              <img src={pitch.images?.[4] || "https://images.unsplash.com/photo-1556816214-cb336eb1f37e?q=80&w=600"} alt="Field 5" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <span className="text-white font-bold text-lg">Xem thêm {pitch.images?.length || 0} ảnh</span>
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
                {pitch.description}
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

            <div className="py-8 border-b border-slate-200">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Vị trí trên bản đồ</h2>
              <div className="w-full h-80 bg-slate-200 rounded-2xl overflow-hidden relative border border-slate-300 mb-4">
                {/* Giả lập bản đồ với tọa độ thực */}
                <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${pitch.latitude},${pitch.longitude}&zoom=15&size=800x400&markers=color:red%7C${pitch.latitude},${pitch.longitude}&key=YOUR_API_KEY`} alt="Map" className="w-full h-full object-cover" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-xl">
                  <div className="bg-primary text-white p-2 rounded-full">
                    <MapPin size={24} />
                  </div>
                </div>
              </div>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <MapPin size={18} /> {pitch.address}, {pitch.ward}, {pitch.district}, {pitch.province}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="py-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <Star className="text-yellow-500 fill-current" /> Đánh giá từ khách hàng
                </h2>
                <div className="flex items-center gap-1 font-black text-2xl">
                  4.8 <span className="text-slate-400 text-lg font-bold">/ 5</span>
                </div>
              </div>

              <div className="space-y-8">
                <ReviewItem 
                  name="Nguyễn Minh Triết"
                  rating={5}
                  date="2 ngày trước"
                  comment="Sân cực kỳ đẹp, cỏ mới và êm. Hệ thống đèn chiếu sáng rất tốt, không bị chói mắt khi nhìn bóng bổng. Sẽ quay lại thường xuyên!"
                  avatar="https://i.pravatar.cc/150?u=triet"
                />
                <ReviewItem 
                  name="Trần Hoàng Nam"
                  rating={4}
                  date="1 tuần trước"
                  comment="Chất lượng sân tốt, giá cả hợp lý. Tuy nhiên bãi giữ xe hơi đông vào giờ cao điểm từ 18h-20h. Nhân viên phục vụ nhiệt tình."
                  avatar="https://i.pravatar.cc/150?u=nam"
                />
                <ReviewItem 
                  name="Lê Thị Hồng Thắm"
                  rating={5}
                  date="2 tuần trước"
                  comment="Đặt sân qua app rất nhanh và tiện. Đến nơi chỉ cần đưa mã QR là nhận sân ngay. Tiện ích đầy đủ, căn tin sạch sẽ."
                  avatar="https://i.pravatar.cc/150?u=tham"
                />
              </div>

              <button className="w-full mt-8 py-3 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                Xem thêm 121 đánh giá
              </button>
            </div>
          </div>

          {/* Right Column - Sticky Booking Card */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-28 bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 z-10">
              <div className="mb-6 flex items-end gap-1">
                <span className="text-3xl font-black text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pitch.basePrice)}</span>
                <span className="text-slate-500 font-medium mb-1">/ giờ</span>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
                <div className="flex border-b border-slate-300">
                  <div className="w-full p-3 bg-white">
                    <div className="text-xs font-bold uppercase text-slate-500 mb-1">Ngày chọn</div>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full text-slate-900 font-bold bg-transparent focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock size={18} /> Chọn khung giờ
                </h3>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {availableSlots.map((slot, index) => (
                      <button 
                        key={index}
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedTime(slot.id)}
                        className={`
                          py-3 px-2 rounded-xl text-sm font-bold text-center transition-all border
                          ${!slot.isAvailable ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' : ''}
                          ${slot.isAvailable && selectedTime !== slot.id ? 'bg-white border-slate-300 text-slate-700 hover:border-primary hover:text-primary' : ''}
                          ${selectedTime === slot.id ? 'bg-primary border-primary text-white shadow-md' : ''}
                        `}
                      >
                        {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                        {slot.isAvailable && <div className={`text-xs mt-1 font-medium ${selectedTime === slot.id ? 'text-white/80' : 'text-slate-500'}`}>{new Intl.NumberFormat('vi-VN').format(slot.price)}đ</div>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">Không có khung giờ trống cho ngày này.</p>
                )}
              </div>

              <button 
                onClick={handleBooking}
                disabled={!selectedTime || isBooking}
                className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-lg
                  ${selectedTime && !isBooking ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
                `}
              >
                {isBooking ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  "ĐẶT SÂN NGAY"
                )}
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

const ReviewItem: React.FC<{ name: string, rating: number, date: string, comment: string, avatar: string }> = ({ name, rating, date, comment, avatar }) => (
  <div className="flex gap-4">
    <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover shrink-0" />
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-bold text-slate-900">{name}</h4>
        <span className="text-xs text-slate-400 font-medium">{date}</span>
      </div>
      <div className="flex items-center gap-0.5 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={14} 
            className={i < rating ? "text-yellow-500 fill-current" : "text-slate-200 fill-current"} 
          />
        ))}
      </div>
      <p className="text-slate-600 leading-relaxed">{comment}</p>
    </div>
  </div>
);
