import React, { useState, useEffect } from 'react';
import { 
  MapPin, Star, Share2, Heart, CheckCircle2, ShieldCheck, 
  Coffee, Car, Wifi, Loader2, Plus, Minus, ShoppingBag, Zap
} from 'lucide-react';
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
  
  // Services
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (id) {
      fetchPitchDetails();
      fetchSlots();
      fetchServices();
      
      const setupSignalR = async () => {
        await signalRService.startConnection();
        await signalRService.joinPitchGroup(id!);
        signalRService.onTimeSlotStatusChanged((timeSlotId, status, date) => {
          if (date === selectedDate) {
            setAvailableSlots(prev => prev.map(slot => 
              slot.id === timeSlotId ? { ...slot, isAvailable: status === 'Available' } : slot
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
      const response = await api.get(`/pitches/${id}/available-slots`, { params: { date: selectedDate } });
      setAvailableSlots(response.data);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get(`/additional-services/pitch/${id}`);
      setAvailableServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleUpdateService = (serviceId: string, delta: number) => {
    setSelectedServices(prev => {
      const current = prev[serviceId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  const calculateTotal = () => {
    const slot = availableSlots.find(s => s.id === selectedTime);
    const slotPrice = slot?.price || 0;
    const servicesPrice = availableServices.reduce((acc, svc) => {
      return acc + (svc.price * (selectedServices[svc.id] || 0));
    }, 0);
    return slotPrice + servicesPrice;
  };

  const handleBooking = async () => {
    if (!selectedTime) return;
    setIsBooking(true);
    try {
      const servicesPayload = Object.entries(selectedServices).map(([id, qty]) => ({
        serviceId: id,
        quantity: qty
      }));

      const booking = await bookingService.create({
        timeSlotId: selectedTime,
        bookingDate: selectedDate,
        selectedServices: servicesPayload.length > 0 ? servicesPayload : undefined
      } as any);

      const paymentResponse = await paymentService.createPayment({
        bookingId: booking.id,
        returnUrl: `${window.location.origin}/payment-result`
      });

      window.location.href = paymentResponse.paymentUrl;
    } catch (error: any) {
      console.error("Booking/Payment failed:", error);
      alert(error.response?.data?.Detail || "Đặt sân thất bại. Vui lòng thử lại.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center pt-24"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!pitch) return <div className="min-h-screen flex flex-col items-center justify-center pt-24"><h2 className="text-2xl font-bold">Không tìm thấy SVD này.</h2><Link to="/explore" className="mt-4 text-primary font-bold underline">Quay lại</Link></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b10] text-slate-900 dark:text-white pb-24 pt-24 transition-colors">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
            <h1 className="text-4xl font-black tracking-tight">{pitch.name}</h1>
            <div className="flex items-center gap-3">
              <button className="p-3 bg-white dark:bg-white/5 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 dark:border-white/5"><Share2 size={20} /></button>
              <button className="p-3 bg-white dark:bg-white/5 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 dark:border-white/5"><Heart size={20} /></button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-500">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-lg">
              <Star size={16} className="fill-current" /> {pitch.averageRating} <span className="opacity-50">({pitch.totalReviews})</span>
            </div>
            <div className="flex items-center gap-2 underline"><MapPin size={16} /> {pitch.address}, {pitch.province}</div>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl">
          <div className="md:col-span-2"><img src={pitch.images?.[0] || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200"} className="w-full h-full object-cover" alt="Main" /></div>
          <div className="hidden md:grid grid-rows-2 gap-4">
            <img src={pitch.images?.[1] || "https://images.unsplash.com/photo-1518605368461-1ee55e1db87b?q=80&w=600"} className="w-full h-full object-cover" alt="SVD 2" />
            <div className="relative group cursor-pointer">
              <img src={pitch.images?.[2] || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=600"} className="w-full h-full object-cover" alt="SVD 3" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-all">
                <span className="text-white font-black text-lg">+ {pitch.images?.length || 0} Ảnh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column */}
          <div className="flex-1 space-y-12">
            <section className="p-8 bg-white dark:bg-[#1a1c26] rounded-[2.5rem] border border-slate-200 dark:border-white/5">
              <h2 className="text-2xl font-black mb-6">Thông tin Sân vận động</h2>
              <p className="text-slate-600 dark:text-white/40 leading-relaxed text-lg mb-8">{pitch.description}</p>
              <div className="flex items-center gap-4 p-5 bg-primary/5 rounded-3xl border border-primary/10">
                <ShieldCheck className="text-primary shrink-0" size={32} />
                <div className="text-sm">
                  <p className="font-black text-slate-900 dark:text-white">Smart Booking System</p>
                  <p className="text-slate-500 font-medium">Nhận sân ngay qua QR Code, không cần thủ tục rườm rà.</p>
                </div>
              </div>
            </section>

            {/* Amenities */}
            <section className="p-8 bg-white dark:bg-[#1a1c26] rounded-[2.5rem] border border-slate-200 dark:border-white/5">
              <h2 className="text-2xl font-black mb-8">Tiện ích hạ tầng</h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="flex items-center gap-4 text-slate-700 dark:text-white/60"><Car size={24} className="text-primary" /><span className="font-bold">Bãi đỗ xe an ninh</span></div>
                <div className="flex items-center gap-4 text-slate-700 dark:text-white/60"><Wifi size={24} className="text-primary" /><span className="font-bold">High-speed Wifi</span></div>
                <div className="flex items-center gap-4 text-slate-700 dark:text-white/60"><Coffee size={24} className="text-primary" /><span className="font-bold">Căn tin giải khát</span></div>
                <div className="flex items-center gap-4 text-slate-700 dark:text-white/60"><CheckCircle2 size={24} className="text-primary" /><span className="font-bold">Cho thuê đồ tập</span></div>
              </div>
            </section>

            {/* Optional Services - NEW */}
            {availableServices.length > 0 && (
              <section className="p-8 bg-white dark:bg-[#1a1c26] rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-3 mb-8">
                  <ShoppingBag className="text-primary" size={24} />
                  <h2 className="text-2xl font-black">Dịch vụ đính kèm (Tùy chọn)</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableServices.map(svc => (
                    <div key={svc.id} className="p-5 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{svc.icon}</span>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">{svc.name}</p>
                          <p className="text-xs font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(svc.price)}đ</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                        <button onClick={() => handleUpdateService(svc.id, -1)} className="w-8 h-8 flex items-center justify-center hover:text-red-500 transition-colors"><Minus size={14} /></button>
                        <span className="w-6 text-center font-black text-sm">{selectedServices[svc.id] || 0}</span>
                        <button onClick={() => handleUpdateService(svc.id, 1)} className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors"><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Booking Card */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-28 bg-white dark:bg-[#1a1c26] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl p-8 space-y-8">
              <div>
                <span className="text-4xl font-black text-primary">{new Intl.NumberFormat('vi-VN').format(pitch.basePrice)}đ</span>
                <span className="text-slate-400 font-bold ml-2">/ Giờ</span>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lịch thi đấu</label>
                <input 
                  type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-slate-900 dark:text-white font-black focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chọn khung giờ</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableSlots.map((slot, idx) => (
                    <button 
                      key={idx} disabled={!slot.isAvailable} onClick={() => setSelectedTime(slot.id)}
                      className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all border ${!slot.isAvailable ? 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent' : selectedTime === slot.id ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-primary text-slate-600 dark:text-white/60'}`}
                    >
                      {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-100 dark:border-white/5">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                  <span>Tiền sân</span>
                  <span>{new Intl.NumberFormat('vi-VN').format(availableSlots.find(s => s.id === selectedTime)?.price || 0)}đ</span>
                </div>
                {Object.entries(selectedServices).map(([id, qty]) => {
                  const svc = availableServices.find(s => s.id === id);
                  return (
                    <div key={id} className="flex justify-between text-sm font-bold text-slate-500">
                      <span>{svc?.name} (x{qty})</span>
                      <span>{new Intl.NumberFormat('vi-VN').format((svc?.price || 0) * qty)}đ</span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-end pt-4">
                  <span className="text-lg font-black uppercase tracking-widest">Tổng cộng</span>
                  <span className="text-2xl font-black text-primary">{new Intl.NumberFormat('vi-VN').format(calculateTotal()) }đ</span>
                </div>
              </div>

              <button 
                onClick={handleBooking} disabled={!selectedTime || isBooking}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isBooking ? <Loader2 className="animate-spin" size={24} /> : <Zap size={20} fill="currentColor" />}
                Xác nhận & Thanh toán
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldDetails;
