import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ReceiptText,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { bookingService, type BookingResponse } from '../../../services/bookingService';
import { paymentService } from '../../../services/paymentService';
import { formatCompactAddress } from '../../../utils/address';

const moneyFormatter = new Intl.NumberFormat('vi-VN');

const formatMoney = (value?: number | null) => `${moneyFormatter.format(Number(value || 0))}đ`;

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

const statusLabel = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('pending')) return 'Chờ thanh toán cọc';
  if (normalized.includes('confirm')) return 'Đã xác nhận';
  if (normalized.includes('cancel')) return 'Đã hủy';
  if (normalized.includes('complete')) return 'Hoàn tất';
  return status || 'Đang xử lý';
};

const pageStyle = {
  '--page-bg': 'oklch(98% 0.01 250)',
  '--panel': 'oklch(100% 0 0)',
  '--panel-muted': 'oklch(97% 0.01 250)',
  '--accent': 'oklch(60% 0.25 250)',
  '--accent-soft': 'oklch(92% 0.05 250)',
  '--ink': 'oklch(20% 0.02 250)',
} as React.CSSProperties;

const BookingReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    paymentUrl: string;
    qrCode?: string | null;
    transactionId?: string;
    provider?: 'VNPAY' | 'ZALOPAY';
  }>({
    isOpen: false,
    paymentUrl: '',
  });

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await bookingService.getById(id);
        setBooking(data);
        setCustomerName(data.user?.fullName || (data as any).userName || (data as any).customerName || '');
        setCustomerPhone(data.user?.phoneNumber || (data as any).phoneNumber || (data as any).customerPhone || '');
      } catch (requestError: any) {
        setError(requestError.message || 'Không thể tải thông tin đặt sân.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id]);

  const details = useMemo(() => {
    const pitch = booking?.timeSlot?.pitch;
    const services = booking?.services || [];
    const fieldPrice = Number(booking?.timeSlot?.price ?? booking?.totalPrice ?? 0);
    const serviceTotal = services.reduce((sum, item) => sum + Number(item.lineTotal || item.price * item.quantity || 0), 0);
    const total = Number(booking?.totalPrice || fieldPrice + serviceTotal);
    const deposit = Number(booking?.depositAmount || 0);

    return {
      pitchName: booking?.pitchName || pitch?.name || 'Sân thể thao',
      pitchType: pitch?.type || 'Tiêu chuẩn',
      pitchAddress: formatCompactAddress(pitch?.address || (booking as any)?.pitchAddress),
      startTime: booking?.startTime || booking?.timeSlot?.startTime,
      endTime: booking?.endTime || booking?.timeSlot?.endTime,
      services,
      fieldPrice: Math.max(fieldPrice, total - serviceTotal),
      serviceTotal,
      total,
      deposit,
      remaining: Math.max(total - deposit, 0),
    };
  }, [booking]);

  const handlePayment = async () => {
    if (!booking) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Vui lòng kiểm tra họ tên và số điện thoại trước khi thanh toán.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const paymentResponse = await paymentService.createPayment({
        bookingId: booking.id,
        returnUrl: `${window.location.origin}/payment-result`,
        provider: 'ZALOPAY',
      });
      if (paymentResponse.provider === 'ZALOPAY') {
        setPaymentModal({
          isOpen: true,
          paymentUrl: paymentResponse.paymentUrl,
          qrCode: paymentResponse.qrCode,
          transactionId: paymentResponse.transactionId,
          provider: paymentResponse.provider,
        });
      } else {
        window.location.href = paymentResponse.paymentUrl;
      }
    } catch (paymentError: any) {
      setError(paymentError.message || 'Không thể khởi tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const buildQrSource = (qrCode?: string | null, paymentUrl?: string) => {
    const qrPayload = qrCode?.trim() || paymentUrl?.trim();
    if (!qrPayload) return '';
    if (qrPayload.startsWith('data:image')) return qrPayload;
    if (/^https?:\/\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(qrPayload)) return qrPayload;

    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayload)}`;
  };

  useEffect(() => {
    if (!paymentModal.isOpen || !paymentModal.transactionId) return;

    setPaymentStatus('pending');
    let isActive = true;

    const intervalId = window.setInterval(async () => {
      try {
        const transaction = await paymentService.getTransaction(paymentModal.transactionId!);
        const status = String(transaction.status || '').toLowerCase();

        if (status === 'success') {
          if (!isActive) return;
          setPaymentStatus('success');
          setPaymentModal((prev) => ({ ...prev, isOpen: false }));
          const message = encodeURIComponent('Thanh toán cọc thành công');
          navigate(`/payment-result?success=true&bookingId=${booking?.id}&message=${message}`);
        }

        if (status === 'failed') {
          if (!isActive) return;
          setPaymentStatus('failed');
        }
      } catch (pollError) {
        console.error('Error polling transaction:', pollError);
      }
    }, 3000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [paymentModal.isOpen, paymentModal.transactionId, booking?.id, navigate]);

  if (isLoading) {
    return (
      <main
        className="relative min-h-screen bg-[var(--page-bg)] px-6 pt-28 pb-20 text-[var(--ink)] font-body"
        style={pageStyle}
      >
        <div className="absolute inset-0 -z-10">
        </div>
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="h-[520px] animate-pulse rounded-2xl bg-white/70" />
            <div className="h-[420px] animate-pulse rounded-2xl bg-white/70" />
          </div>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main
        className="relative min-h-screen bg-[var(--page-bg)] px-6 pt-28 pb-20 text-[var(--ink)] font-body"
        style={pageStyle}
      >
        <div className="absolute inset-0 -z-10">
        </div>
        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-red-100 bg-[var(--panel)] p-8 text-center shadow-sm">
          <AlertCircle className="mb-4 text-red-500" size={36} />
          <h1 className="text-2xl font-black font-heading">Không tìm thấy đơn đặt sân</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">{error || 'Đơn đặt sân này không tồn tại hoặc bạn không có quyền xem.'}</p>
          <button onClick={() => navigate('/explore')} className="mt-8 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:opacity-90">
            Tìm sân khác
          </button>
        </div>
      </main>
    );
  }

  return (
    <motion.main
      className="relative min-h-screen bg-[var(--page-bg)] px-4 pt-28 pb-20 text-[var(--ink)] font-body sm:px-6 lg:pt-32"
      style={pageStyle}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 -z-10">
      </div>

      <div className="mx-auto max-w-7xl">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 transition hover:text-[var(--accent)]">
          <ArrowLeft size={16} />
          Quay lại
        </button>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700">
              <BadgeCheck size={14} />
              {statusLabel(booking.status)}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl font-heading">Xác nhận đặt sân</h1>
            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Xem nhanh lịch, cập nhật liên hệ nếu cần, rồi thanh toán cọc để giữ sân.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-[var(--panel)] p-3 shadow-sm sm:grid-cols-3">
          {[
            { icon: <CalendarDays size={18} />, label: 'Ngày chơi', value: formatDate(booking.bookingDate) },
            { icon: <Clock size={18} />, label: 'Khung giờ', value: `${shortTime(details.startTime)} - ${shortTime(details.endTime)}` },
            { icon: <WalletCards size={18} />, label: 'Cọc hôm nay', value: formatMoney(details.deposit) },
          ].map((item) => (
            <div key={item.label} className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[var(--accent)] shadow-sm">
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                <span className="mt-1 block truncate text-sm font-black text-slate-950">{item.value}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200/80 bg-[var(--panel)] p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <UserRound size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black font-heading">Người đặt sân</h2>
                  <p className="text-xs font-semibold text-slate-500">Chủ sân dùng thông tin này để liên hệ khi cần.</p>
                </div>
                </div>
                <ShieldCheck size={20} className="hidden text-emerald-500 sm:block" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Họ và tên</span>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[var(--panel-muted)] px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[var(--accent)] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Nhập họ tên"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Số điện thoại</span>
                  <input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[var(--panel-muted)] px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[var(--accent)] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Nhập số điện thoại"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{booking.user?.email || 'Chưa cập nhật email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-slate-400" />
                  <span>{booking.user?.phoneNumber || customerPhone || 'Chưa cập nhật số điện thoại'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-[var(--panel)] p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">{details.pitchType}</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 font-heading">{details.pitchName}</h2>
                  <div className="mt-3 flex items-start gap-2 text-sm font-semibold text-slate-500">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-red-500" />
                    <span>{details.pitchAddress}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giá sân</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{formatMoney(details.fieldPrice)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-[var(--panel-muted)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <CalendarDays size={15} className="text-[var(--accent)]" />
                    Ngày thi đấu
                  </div>
                  <p className="text-sm font-black text-slate-900">{formatDate(booking.bookingDate)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-[var(--panel-muted)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <Clock size={15} className="text-[var(--accent)]" />
                    Khung giờ
                  </div>
                  <p className="text-sm font-black text-slate-900">{shortTime(details.startTime)} - {shortTime(details.endTime)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-[var(--panel)] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <ReceiptText size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black font-heading">Dịch vụ và chi phí</h2>
                  <p className="text-xs font-semibold text-slate-500">Các khoản đã chọn trong bước đặt sân.</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-[var(--panel)]">
                <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">Tiền thuê sân</p>
                    <p className="text-xs font-semibold text-slate-500">{shortTime(details.startTime)} - {shortTime(details.endTime)}</p>
                  </div>
                  <p className="text-sm font-black text-slate-900">{formatMoney(details.fieldPrice)}</p>
                </div>

                {details.services.length > 0 ? (
                  details.services.map((service) => (
                    <div key={service.id} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{service.serviceName}</p>
                        <p className="text-xs font-semibold text-slate-500">{formatMoney(service.price)} x {service.quantity}</p>
                      </div>
                      <p className="text-sm font-black text-slate-900">{formatMoney(service.lineTotal)}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm font-semibold text-slate-500">Không chọn dịch vụ bổ sung.</div>
                )}
              </div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-[var(--panel)] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Thanh toán</p>
                  <h2 className="mt-1 text-lg font-black font-heading">Tóm tắt đơn</h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <CreditCard size={20} />
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 text-slate-600">
                  <span>Tiền thuê sân</span>
                  <strong className="text-slate-900">{formatMoney(details.fieldPrice)}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 text-slate-600">
                  <span>Dịch vụ bổ sung</span>
                  <strong className="text-slate-900">{formatMoney(details.serviceTotal)}</strong>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-600">Tổng tiền</span>
                    <strong className="text-lg text-slate-900">{formatMoney(details.total)}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-blue-100 bg-[var(--accent-soft)] p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-700">
                  <WalletCards size={15} />
                  Cần thanh toán hôm nay
                </div>
                <p className="mt-2 text-3xl font-black tracking-tight text-[var(--accent)]">{formatMoney(details.deposit)}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                  Số còn lại {formatMoney(details.remaining)} thanh toán trực tiếp tại sân theo chính sách của chủ sân.
                </p>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chọn cổng thanh toán</p>
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                  <WalletCards size={18} />
                  Thanh toán online
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  Quét QR hoặc mở ví ZaloPay để thanh toán.
                </p>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--accent)] px-5 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <>Thanh toán online <ArrowRight size={18} /></>}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <ShieldCheck size={15} />
                Bảo mật bởi cổng thanh toán
              </div>
            </div>
          </aside>
        </div>
      </div>

      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
              className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">Quét mã QR để thanh toán</h3>
                  <p className="text-xs font-semibold text-slate-500">Thanh toán online</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4">
                <img
                  src={buildQrSource(paymentModal.qrCode, paymentModal.paymentUrl)}
                  alt="QR thanh toán"
                  className="h-52 w-52 rounded-xl bg-white p-2"
                />
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-700">Quét mã để thanh toán cọc.</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
                  {paymentStatus === 'pending' && (
                    <>
                      <Loader2 className="animate-spin text-emerald-600" size={16} />
                      <span>Đang chờ xác nhận thanh toán...</span>
                    </>
                  )}
                  {paymentStatus === 'failed' && (
                    <span className="text-red-600">Thanh toán chưa thành công. Vui lòng thử lại.</span>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {paymentModal.paymentUrl && (
                  <a
                    href={paymentModal.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-emerald-700"
                  >
                    Mở trang thanh toán
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
                  className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.main>
  );
};

export default BookingReview;
