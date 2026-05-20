import React, { useState, useEffect } from 'react';
import { 
  MapPin, Star, CheckCircle2, ShieldCheck,
  Loader2, Plus, Minus, Calendar, ArrowRight, ChevronLeft, ChevronRight, User, ArrowLeft, Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { pitchService, type PitchResponse } from '../../../services/pitchService';
import { bookingService } from '../../../services/bookingService';
import { signalRService } from '../../../services/signalRService';
import api from '../../../services/api';

const FieldDetails: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const guidMatch = (slug || '').match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
  const pitchId = id || guidMatch?.[0];
  const [pitch, setPitch] = useState<PitchResponse | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

  const formatMoney = (value?: number | null) =>
    new Intl.NumberFormat('vi-VN').format(Number(value || 0));

  const fullAddress = pitch?.address?.fullAddress
    || [pitch?.address?.street, pitch?.address?.ward, pitch?.address?.district, pitch?.address?.city].filter(Boolean).join(', ');
  const googleMapsEmbedKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const getServiceImageUrl = (service: any) =>
    service?.imageUrl || service?.ImageUrl || service?.image || service?.Image || '';
  const hasPreciseCoordinates = (latitude?: number, longitude?: number) => {
    if (!latitude || !longitude) return false;
    const isOldDefault = Math.abs(latitude - 10) < 0.0001 && Math.abs(longitude - 106) < 0.0001;
    const isHcmFallback = Math.abs(latitude - 10.762622) < 0.0001 && Math.abs(longitude - 106.660172) < 0.0001;
    return !isOldDefault && !isHcmFallback;
  };

  useEffect(() => {
    if (pitchId) {
      fetchPitchDetails(pitchId);
      fetchSlots(pitchId);
      fetchServices(pitchId);
      
      const setupSignalR = async () => {
        try {
          await signalRService.startConnection();
          await signalRService.joinPitchGroup(pitchId);
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
        signalRService.leavePitchGroup(pitchId);
        signalRService.off('TimeSlotStatusChanged');
      };
    }
  }, [pitchId, selectedDate]);

  const fetchPitchDetails = async (currentPitchId: string) => {
    setIsLoading(true);
    try {
      const data = await pitchService.getById(currentPitchId);
      setPitch(data);
    } catch (error) {
      console.error("Error fetching pitch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlots = async (currentPitchId: string) => {
    try {
      const response = await api.get(`/pitches/${currentPitchId}/available-slots`, { params: { date: selectedDate } });
      setAvailableSlots(response.data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  const fetchServices = async (currentPitchId: string) => {
    try {
      const response = await api.get(`/additional-services/pitch/${currentPitchId}`);
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

  const selectedSlot = availableSlots.find((slot) => slot.id === selectedTime);
  const parseSlotMinutes = (value?: string) => {
    const [hour, minute] = String(value || '00:00').split(':').map(Number);
    return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
  };
  const timelineSlots = availableSlots
    .map((slot) => {
      const start = parseSlotMinutes(slot.startTime);
      const end = parseSlotMinutes(slot.endTime);
      return {
        ...slot,
        start,
        end,
        left: `${Math.max(0, Math.min(100, (start / 1440) * 100))}%`,
        width: `${Math.max(4, Math.min(100, ((Math.max(end, start + 30) - start) / 1440) * 100))}%`,
      };
    })
    .sort((a, b) => a.start - b.start);

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

      // Navigate to review page instead of direct payment
      navigate(`/booking-review/${booking.id}`);
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
        <div className="w-8 h-8 border-3 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="min-h-screen bg-white text-slate-900 pb-16 pt-28 font-sans">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-8 text-center">
            <p className="text-sm font-bold text-slate-600">Không tìm thấy sân phù hợp.</p>
            <button
              onClick={() => navigate('/explore')}
              className="mt-4 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
            >
              Quay lại khám phá
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pitchImages = pitch.images && pitch.images.length > 0 
    ? pitch.images 
    : [{ imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1600" }];

  const mapQuery = hasPreciseCoordinates(pitch.address.latitude, pitch.address.longitude)
    ? `${pitch.address.latitude},${pitch.address.longitude}`
    : fullAddress;
  const mapUrl = googleMapsEmbedKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(googleMapsEmbedKey)}&q=${encodeURIComponent(mapQuery)}&zoom=17`
    : `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=17&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16 pt-28 font-sans">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <button 
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors group"
          >
            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <ArrowLeft size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quay lại danh sách</span>
          </button>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">{pitch.typeDisplay}</span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">
                <Star size={10} className="fill-current" /> {Number(pitch.averageRating ?? 0).toFixed(1)}
              </div>
              <div className="px-3 py-1 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100">
                Từ {formatMoney(pitch.minPrice)}đ/giờ
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">{pitch.name}</h1>
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
              <MapPin size={14} className="text-red-500 shrink-0" />
              <span>{fullAddress}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* LEFT COLUMN */}
          <div className="flex-1 space-y-8">
            {/* ULTRA COMPACT GALLERY */}
            <div className="space-y-3 max-w-3xl">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 group">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={pitchImages[activeImageIndex].imageUrl} 
                    className="w-full h-full object-cover" 
                    alt="Pitch" 
                  />
                </AnimatePresence>
                
                {pitchImages.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : pitchImages.length - 1))} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md text-slate-900 hover:bg-blue-600 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                    <button onClick={() => setActiveImageIndex(prev => (prev < pitchImages.length - 1 ? prev + 1 : 0))} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md text-slate-900 hover:bg-blue-600 hover:text-white transition-all"><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>

              {pitchImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {pitchImages.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`relative w-12 h-12 rounded-md overflow-hidden shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-blue-600' : 'border-transparent opacity-50'}`}>
                      <img src={img.imageUrl} className="w-full h-full object-cover" alt={`T${idx}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Overview */}
            <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mô tả</div>
              <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-2xl">
                {pitch.description || 'Nơi những đam mê được đánh thức và những trận cầu rực lửa bắt đầu.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {['Bãi đỗ', 'Wifi', 'Giải khát', 'An ninh'].map((label) => (
                  <span key={label} className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Google Map */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                <MapIcon size={12} className="text-blue-600" />
                <span>Bản đồ</span>
              </div>
              <div className="w-full max-w-xl h-[160px] rounded-2xl overflow-hidden border border-slate-100">
                <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0} src={mapUrl} className="transition-all duration-700" />
              </div>
            </section>

            {/* Services (Corrected Image Display - No Icon) */}
            {availableServices.length > 0 && (
              <section className="space-y-4 pt-6 border-t border-slate-50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ bổ trợ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableServices.map(svc => {
                    const serviceImageUrl = getServiceImageUrl(svc);
                    return (
                    <div key={svc.id} className="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-blue-500/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200/50 bg-slate-50">
                          {serviceImageUrl ? (
                            <img src={serviceImageUrl} alt={svc.name || 'Dịch vụ'} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl">{svc.icon || '📦'}</div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-xs">{svc.name}</p>
                          <p className="text-[10px] font-bold text-blue-500">{formatMoney(svc.price)}đ</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-1.5 py-1 rounded-lg">
                        <button onClick={() => handleUpdateService(svc.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white text-slate-400 hover:text-red-500 rounded-md transition-all"><Minus size={10} /></button>
                        <span className="w-3 text-center font-black text-[10px] text-slate-900">{selectedServices[svc.id] || 0}</span>
                        <button onClick={() => handleUpdateService(svc.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white text-slate-400 hover:text-blue-500 rounded-md transition-all"><Plus size={10} /></button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="space-y-4 pt-6 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Đánh giá</h3>
                <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black border border-amber-100">
                  <Star size={12} className="fill-current" /> {Number(pitch.averageRating ?? 0).toFixed(1)} / 5.0
                </div>
              </div>
              <div className="space-y-3">
                {pitch.reviews && pitch.reviews.length > 0 ? pitch.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-300 border border-slate-100"><User size={16} /></div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{rev.userName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} size={10} className={`${idx < rev.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">{rev.comment || "Khách hàng hài lòng về dịch vụ."}</p>
                  </div>
                )) : (
                  <div className="py-8 text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">
                    <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Chưa có đánh giá</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (Sticky) */}
          <aside className="w-full lg:w-[340px]">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Giá thuê</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{formatMoney(pitch.minPrice)}đ</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ Giờ</span>
                    </div>
                  </div>
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center justify-between">Ngày thi đấu <Calendar size={12} className="text-blue-500" /></label>
                    <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between px-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Khung giờ trống
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">{timelineSlots.filter((slot) => slot.isAvailable).length} khung</span>
                    </label>
                    {timelineSlots.length > 0 ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
                          {timelineSlots.map((slot) => {
                            const isSelected = selectedTime === slot.id;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={!slot.isAvailable}
                                onClick={() => setSelectedTime(slot.id)}
                                className={`rounded-xl border p-3 text-left transition ${
                                  !slot.isAvailable
                                    ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300'
                                    : isSelected
                                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                      : 'border-slate-100 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-sm font-black">{slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}</span>
                                  <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                                    isSelected ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                    {slot.isAvailable ? 'Còn trống' : 'Đã kín'}
                                  </span>
                                </div>
                                <p className={`mt-2 text-xs font-black ${isSelected ? 'text-white' : 'text-blue-600'}`}>
                                  {formatMoney(slot.price)}đ
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 py-5 text-center text-[9px] font-black uppercase text-slate-300">Hết giờ</div>
                    )}
                    {selectedSlot && (
                      <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                        Đã chọn {selectedSlot.startTime.substring(0, 5)} - {selectedSlot.endTime.substring(0, 5)}, {formatMoney(selectedSlot.price)}đ
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tổng tiền</p>
                    <p className="text-2xl font-black text-blue-600 tracking-tight">{formatMoney(calculateTotal())}đ</p>
                  </div>
                  <button onClick={handleBooking} disabled={!selectedTime || isBooking} className="h-12 px-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">{isBooking ? <Loader2 className="animate-spin" size={16} /> : <>Đặt ngay <ArrowRight size={16} /></>}</button>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-blue-50/50 rounded-2xl border border-blue-100/50"><ShieldCheck className="text-blue-500" size={18} /><p className="text-[9px] font-bold text-blue-600/70 uppercase tracking-widest">Bảo mật & Hoàn tiền nhanh</p></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default FieldDetails;
