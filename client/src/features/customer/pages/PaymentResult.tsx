import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  ReceiptText,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { bookingService, type BookingResponse } from '../../../services/bookingService';
import { paymentService, type PaymentTransactionDto } from '../../../services/paymentService';

const formatDate = (value?: string) => {
  if (!value) return 'Chưa có ngày';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const shortTime = (value?: string) => (value ? value.substring(0, 5) : '--:--');
const isConfirmedBooking = (status?: string) => String(status || '').toLowerCase().includes('confirm');
const isSuccessfulTransaction = (status?: string) => String(status || '').toLowerCase() === 'success';
const isFailedTransaction = (status?: string) => String(status || '').toLowerCase() === 'failed';
const MAX_CONFIRMATION_ATTEMPTS = 10;

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const transactionId = searchParams.get('transactionId');
  const message = searchParams.get('message');
  const successParam = searchParams.get('success');
  const pendingParam = searchParams.get('pending') === 'true';

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [transaction, setTransaction] = useState<PaymentTransactionDto | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(bookingId || transactionId));
  const [isPendingConfirmation, setIsPendingConfirmation] = useState(Boolean(pendingParam || transactionId));
  const [confirmationTimedOut, setConfirmationTimedOut] = useState(false);

  const isSuccess =
    successParam === 'true' ||
    isConfirmedBooking(booking?.status) ||
    isSuccessfulTransaction(transaction?.status);
  const isFailed = successParam === 'false' || isFailedTransaction(transaction?.status);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId && !transactionId) return;

      try {
        const [bookingData, transactionData] = await Promise.all([
          bookingId ? bookingService.getById(bookingId) : Promise.resolve(null),
          transactionId ? paymentService.getTransaction(transactionId) : Promise.resolve(null),
        ]);

        setBooking(bookingData);
        setTransaction(transactionData);
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, transactionId]);

  useEffect(() => {
    if (!transactionId || isSuccess || isFailed) {
      setIsPendingConfirmation(false);
      return;
    }

    let isActive = true;
    let attempts = 0;
    setIsPendingConfirmation(true);

    const intervalId = window.setInterval(async () => {
      try {
        attempts += 1;

        const [latestTransaction, latestBooking] = await Promise.all([
          paymentService.getTransaction(transactionId),
          bookingId ? bookingService.getById(bookingId) : Promise.resolve(null),
        ]);

        if (!isActive) return;

        setTransaction(latestTransaction);
        if (latestBooking) {
          setBooking(latestBooking);
        }

        if (
          isSuccessfulTransaction(latestTransaction.status) ||
          isFailedTransaction(latestTransaction.status) ||
          isConfirmedBooking(latestBooking?.status)
        ) {
          window.clearInterval(intervalId);
          setIsPendingConfirmation(false);
          return;
        }

        if (attempts >= MAX_CONFIRMATION_ATTEMPTS) {
          window.clearInterval(intervalId);
          setConfirmationTimedOut(true);
          setIsPendingConfirmation(false);
        }
      } catch (error) {
        console.error('Error polling payment transaction:', error);
        if (attempts >= MAX_CONFIRMATION_ATTEMPTS) {
          window.clearInterval(intervalId);
          setConfirmationTimedOut(true);
          setIsPendingConfirmation(false);
        }
      }
    }, 3000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [bookingId, transactionId, isSuccess, isFailed]);

  if (isLoading || isPendingConfirmation) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 pt-32 pb-20 text-slate-900">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mb-4 animate-spin text-blue-600" size={42} />
          <p className="text-sm font-bold text-slate-500">Đang xác nhận kết quả thanh toán...</p>
        </div>
      </main>
    );
  }

  if (confirmationTimedOut && !isSuccess) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pt-28 pb-20 text-slate-900 sm:px-6 lg:pt-32">
        <div className="mx-auto max-w-2xl">
          <section className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="bg-amber-50 px-6 py-10 text-center">
              <Clock className="mx-auto mb-4 text-amber-500" size={72} />
              <h1 className="text-3xl font-black tracking-tight text-amber-950">Đang chờ xác nhận thanh toán</h1>
              <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-amber-700">
                Giao dịch có thể đã thành công nhưng cổng thanh toán chưa gửi xác nhận về hệ thống. Bạn có thể kiểm tra lại lịch sử đặt sân sau ít phút.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <ShieldCheck size={15} />
                Thanh toán bảo mật qua cổng thanh toán
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to="/profile?tab=bookings"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Xem lịch sử đặt sân <ArrowRight size={18} />
                </Link>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50"
                >
                  Kiểm tra lại
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-28 pb-20 text-slate-900 sm:px-6 lg:pt-32">
      <div className="mx-auto max-w-2xl">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className={`px-6 py-10 text-center ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {isSuccess ? (
              <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={72} />
            ) : (
              <XCircle className="mx-auto mb-4 text-red-500" size={72} />
            )}
            <h1 className={`text-3xl font-black tracking-tight ${isSuccess ? 'text-emerald-950' : 'text-red-950'}`}>
              {isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất'}
            </h1>
            <p className={`mx-auto mt-3 max-w-md text-sm font-semibold leading-6 ${isSuccess ? 'text-emerald-700' : 'text-red-700'}`}>
              {isSuccess
                ? 'Tiền cọc 10% đã được ghi nhận. Đơn đặt sân của bạn đã được xác nhận.'
                : message || 'Giao dịch bị hủy hoặc không thể xác nhận. Bạn có thể quay lại đơn đặt sân để thử thanh toán lại.'}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {booking && (
              <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="mb-5 flex items-center gap-3">
                  <ReceiptText className="text-blue-600" size={22} />
                  <div>
                    <h2 className="text-base font-black text-slate-950">Chi tiết đơn đặt sân</h2>
                    <p className="text-xs font-semibold text-slate-500">Mã đơn: {booking.checkInCode || booking.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 shrink-0 text-red-500" size={18} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sân</p>
                      <p className="mt-1 text-sm font-black text-slate-900">{booking.pitchName || booking.timeSlot?.pitch?.name || 'Sân thể thao'}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                        <Calendar size={14} className="text-blue-600" />
                        Ngày
                      </div>
                      <p className="text-sm font-black">{formatDate(booking.bookingDate)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                        <Clock size={14} className="text-blue-600" />
                        Giờ
                      </div>
                      <p className="text-sm font-black">
                        {shortTime(booking.startTime || booking.timeSlot?.startTime)} - {shortTime(booking.endTime || booking.timeSlot?.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <ShieldCheck size={15} />
              Thanh toán bảo mật qua cổng thanh toán
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/profile?tab=bookings"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Xem lịch sử đặt sân <ArrowRight size={18} />
              </Link>
              <Link
                to="/explore"
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50"
              >
                Tìm sân khác
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PaymentResult;
