import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Calendar, Clock, MapPin } from 'lucide-react';
import { bookingService, type BookingResponse } from '../../../services/bookingService';

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const message = searchParams.get('message');
  const isSuccess = !searchParams.has('message'); // Simple logic for demo

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setIsLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const data = await bookingService.getById(bookingId!);
      setBooking(data);
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-bold">Đang xác nhận kết quả thanh toán...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          {/* Header Status */}
          <div className={`py-12 flex flex-col items-center justify-center ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {isSuccess ? (
              <CheckCircle2 className="text-emerald-500 mb-4" size={80} />
            ) : (
              <XCircle className="text-red-500 mb-4" size={80} />
            )}
            <h1 className={`text-3xl font-black ${isSuccess ? 'text-emerald-900' : 'text-red-900'}`}>
              {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </h1>
            <p className={`mt-2 font-medium ${isSuccess ? 'text-emerald-700' : 'text-red-700'}`}>
              {isSuccess ? 'Yêu cầu đặt sân của bạn đã được xác nhận.' : message || 'Có lỗi xảy ra trong quá trình xử lý.'}
            </p>
          </div>

          {/* Details */}
          <div className="p-10">
            {booking && (
              <div className="mb-10">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Chi tiết đơn hàng</h2>
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl text-primary shadow-sm">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Sân bóng</p>
                      <p className="text-lg font-black text-slate-900">{booking.pitchName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white rounded-2xl text-primary shadow-sm">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Ngày</p>
                        <p className="font-black text-slate-900">{booking.bookingDate}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white rounded-2xl text-primary shadow-sm">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Giờ</p>
                        <p className="font-black text-slate-900">{booking.startTime} - {booking.endTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <Link 
                to="/my-bookings" 
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30"
              >
                Xem lịch sử đặt sân <ArrowRight size={20} />
              </Link>
              <Link 
                to="/" 
                className="w-full py-4 bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-600 font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                Quay lại trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
