import React, { useState, useEffect } from 'react';
import { 
  MapPin, Star, CheckCircle2, ShieldCheck, 
  Coffee, Car, Wifi, Loader2, Plus, Minus, Zap, Calendar, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
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
  
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

  const formatMoney = (value?: number | null) =>
    new Intl.NumberFormat('vi-VN').format(Number(value || 0));

  const fullAddress = pitch?.address?.fullAddress
    || [pitch?.address?.street, pitch?.address?.ward, pitch?.address?.district, pitch?.address?.city].filter(Boolean).join(', ');

  useEffect(() => {
    if (id) {
      fetchPitchDetails();
      fetchSlots();
      fetchServices();
      
      const setupSignalR = async () => {
        try {
          await signalRService.startConnection();
          await signalRService.joinPitchGroup(id!);
          signalRService.onTimeSlotStatusChanged((timeSlotId, status, date) => {
            if (date === selectedDate) {
              setAvailableSlots(prev => prev.map(slot => 
                slot.id === timeSlotId ? { ...slot, isAvailable: status === 'Available' } : slot
              ));
            }
          });
        } catch (err) {
          console.error("SignalR connection error:", err);
        }
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
      setAvailableSlots(response.data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get(`/additional-services/pitch/${id}`);
      setAvailableServices(response.data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleUpdateService = (serviceId: string, delta: number) => {
    setSelectedServices(prev => {
      const current = prev[serviceId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const rest = { ...prev };
        delete rest[serviceId];
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
    let lockId: string | undefined;
    try {
      const servicesPayload = Object.entries(selectedServices).map(([id, qty]) => ({
        serviceId: id,
        quantity: qty
      }));

      const lock = await bookingService.lock(selectedTime, selectedDate);
      lockId = (lock as any).lockId || (lock as any).LockId;

      const booking = await bookingService.create({
        timeSlotId: selectedTime,
        bookingDate: selectedDate,
        selectedServices: servicesPayload.length > 0 ? servicesPayload : undefined
      });

      const paymentResponse = await paymentService.createPayment({
        bookingId: booking.id,
        returnUrl: `${window.location.origin}/payment-result`
      });

      window.location.href = paymentResponse.paymentUrl;
    } catch (error: any) {
      console.error("Booking failed:", error);
      if (lockId) await bookingService.releaseLock(lockId).catch(() => undefined);
      alert(error.message || "Đặt sân thất bại. Vui lòng thử lại.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!pitch) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 pt-20 font-sans">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                {pitch.typeDisplay || 'Standard'}
              </span>
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                <Star size={10} className="fill-current" />
                {pitch.averageRating}
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-none">{pitch.name}</h1>
            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-sm">
              <MapPin size={14} className="text-red-500" />
              <span>{fullAddress}</span>
            </div>
          </div>
        </div>

        {/* Streamlined Gallery */}
        <div className="mb-12">
          {pitch.images && pitch.images.length > 0 ? (
            <div className={`grid gap-3 ${pitch.images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'} h-[300px] md:h-[450px]`}>
              <div className={`${pitch.images.length === 1 ? 'col-span-1' : 'md:col-span-9'} rounded-3xl overflow-hidden shadow-sm group`}>
                <img 
                  src={pitch.images.find(img => img.isPrimary)?.imageUrl || pitch.images[0].imageUrl} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  alt="Main View" 
                />
              </div>
              {pitch.images.length > 1 && (
                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-1 gap-3 h-full">
                  {pitch.images.filter(img => !img.isPrimary).slice(0, 2).map((img, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden shadow-sm group relative h-full">
                      <img 
                        src={img.imageUrl} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={`Thumb ${i}`} 
                      />
                      {i === 1 && pitch.images.length > 3 && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center cursor-pointer">
                          <span className="text-white font-black text-xl">+{pitch.images.length - 3}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[300px] bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
              <Zap size={40} />
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Information Area */}
          <div className="flex-1 space-y-12">
            <section className="max-w-2xl">
              <p className="text-xl font-medium text-slate-500 leading-relaxed">
                {pitch.description || "Hệ thống sân bãi hiện đại, chuyên nghiệp, điểm đến lý tưởng cho mọi đam mê thể thao."}
              </p>
            </section>

            {/* Compact Amenities */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <Car />, label: 'Bãi đỗ' },
                { icon: <Wifi />, label: 'Wifi' },
                { icon: <Coffee />, label: 'Giải khát' },
                { icon: <ShieldCheck />, label: 'An ninh' }
              ].map((item, i) => (
                <div key={i} className="px-5 py-3 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100 hover:border-blue-200 transition-all">
                  <div className="text-slate-900">
                    {React.cloneElement(item.icon as React.ReactElement<any>, { size: 16 })}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Compact Services */}
            {availableServices.length > 0 && (
              <section className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Dịch vụ bổ trợ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableServices.map(svc => (
                    <div key={svc.id} className="p-5 bg-white rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-2xl filter grayscale group-hover:grayscale-0 transition-all">{svc.icon || '📦'}</div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{svc.name}</p>
                          <p className="text-[11px] font-bold text-blue-500">{formatMoney(svc.price)}đ</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-100">
                        <button onClick={() => handleUpdateService(svc.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white text-slate-400 hover:text-red-500 rounded-lg transition-all"><Minus size={12} /></button>
                        <span className="w-4 text-center font-black text-xs text-slate-900">{selectedServices[svc.id] || 0}</span>
                        <button onClick={() => handleUpdateService(svc.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white text-slate-400 hover:text-blue-500 rounded-lg transition-all"><Plus size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Compact Booking Sidebar */}
          <aside className="w-full lg:w-[380px]">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] space-y-8">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-300">Giá đặt sân</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">{formatMoney(pitch.minPrice)}đ</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ Giờ</span>
                    </div>
                  </div>
                  <CheckCircle2 size={24} className="text-emerald-500 mb-1" />
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center justify-between">
                      Ngày thi đấu <Calendar size={12} className="text-blue-500" />
                    </label>
                    <input 
                      type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-800 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Giờ trống</label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.length > 0 ? availableSlots.map((slot, idx) => (
                        <button 
                          key={idx} disabled={!slot.isAvailable} onClick={() => setSelectedTime(slot.id)}
                          className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                            ${!slot.isAvailable 
                              ? 'bg-slate-50 text-slate-200 border-transparent cursor-not-allowed' 
                              : selectedTime === slot.id 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20' 
                                : 'bg-white border-slate-100 text-slate-600 hover:border-blue-500/30'}`}
                        >
                          {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                        </button>
                      )) : (
                        <div className="col-span-2 py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-300 font-black text-[9px] uppercase">Hết giờ trống</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tổng tiền</p>
                    <p className="text-3xl font-black text-blue-600 tracking-tighter">{formatMoney(calculateTotal())}đ</p>
                  </div>
                  <button 
                    onClick={handleBooking} disabled={!selectedTime || isBooking}
                    className="h-14 px-8 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isBooking ? <Loader2 className="animate-spin" size={18} /> : <>Đặt ngay <ArrowRight size={16} /></>}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                <ShieldCheck className="text-blue-500" size={20} />
                <p className="text-[9px] font-bold text-blue-600/70 uppercase tracking-widest leading-relaxed">
                  Bảo mật • An toàn • Nhanh chóng
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default FieldDetails;
