import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  CreditCard,
  ExternalLink,
  Hourglass,
  Loader2,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Star,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { bookingService, type BookingResponse } from '../../../services/bookingService';
import { paymentService, type PaymentProvider } from '../../../services/paymentService';
import { formatCompactAddress } from '../../../utils/address';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const moneyFormatter = new Intl.NumberFormat('vi-VN');
const PAYMENT_STATUS_POLL_INTERVAL_MS = 8_000;
type PaymentUiStatus = 'idle' | 'pending' | 'success' | 'failed';

const formatMoney = (value?: number | null) => `${moneyFormatter.format(Number(value || 0))}đ`;

const getServiceCategory = (name?: string) => {
  const text = String(name || '').toLowerCase();
  if (/(nước|redbull|sting|revive|cà phê|trà|đồ uống)/.test(text)) return 'Đồ uống';
  if (/(vợt|bóng|dụng cụ|cầu|thuê)/.test(text)) return 'Dụng cụ';
  if (/(áo|quần|giày|trang phục)/.test(text)) return 'Quần áo';
  if (/(khăn|tủ|locker|tiện ích)/.test(text)) return 'Tiện ích khác';
  return 'Khác';
};

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
const normalizeStatus = (status?: string) => String(status || '').toLowerCase();

const statusLabel = (status?: string) => {
  const normalized = normalizeStatus(status);
  if (normalized.includes('pending')) return 'Chờ thanh toán cọc';
  if (normalized.includes('confirm')) return 'Đã xác nhận';
  if (normalized.includes('cancel')) return 'Đã hủy';
  if (normalized.includes('complete')) return 'Hoàn tất';
  return status || 'Đang xử lý';
};

const pitchTypeLabel = (type?: string) => {
  const normalized = String(type || '').trim();
  const labels: Record<string, string> = {
    Football5: 'Sân bóng đá 5 người',
    Football7: 'Sân bóng đá 7 người',
    Football11: 'Sân bóng đá 11 người',
    Tennis: 'Sân tennis',
    Badminton: 'Sân cầu lông',
    Pickleball: 'Sân pickleball',
    Basketball: 'Sân bóng rổ',
    Volleyball: 'Sân bóng chuyền',
    TableTennis: 'Sân bóng bàn',
    '1': 'Sân bóng đá 5 người',
    '2': 'Sân bóng đá 7 người',
    '3': 'Sân bóng đá 11 người',
    '4': 'Sân tennis',
    '5': 'Sân cầu lông',
    '6': 'Sân pickleball',
    '7': 'Sân bóng rổ',
    '8': 'Sân bóng chuyền',
    '9': 'Sân bóng bàn',
  };

  return labels[normalized] || normalized || 'Sân thể thao';
};

const pageStyle = {
  '--page-bg': '#f1f5f9',
  '--panel': 'oklch(100% 0 0)',
  '--panel-muted': '#f8fafc',
  '--accent': '#2563eb',
  '--accent-soft': '#eff6ff',
  '--ink': '#0f172a',
} as React.CSSProperties;

const BookingReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const autoPayStarted = useRef(false);
  const isDraft = id === 'new';
  const draft = useMemo(() => {
    if (!isDraft) return null;
    try { return JSON.parse(sessionStorage.getItem('bookingDraft') || 'null'); } catch { return null; }
  }, [isDraft]);

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentUiStatus>('idle');
  const [paymentFailureReason, setPaymentFailureReason] = useState<string | null>(null);
  const [suggestedServices, setSuggestedServices] = useState<any[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [serviceCategory, setServiceCategory] = useState('Tất cả');
  const [now, setNow] = useState(() => Date.now());
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    paymentUrl: string;
    qrCode?: string | null;
    transactionId?: string;
    provider?: PaymentProvider;
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
        if (isDraft) {
          if (!draft?.timeSlotId) throw new Error('Thông tin xác nhận đã hết hạn. Vui lòng chọn lại sân.');
          const preview = draft.preview || {};
          setBooking({
            id: '',
            timeSlotId: draft.timeSlotId,
            pitchName: preview.pitchName || 'Sân thể thao',
            bookingDate: draft.bookingDate,
            startTime: preview.startTime || '',
            endTime: preview.endTime || '',
            totalPrice: Number(preview.totalPrice || 0),
            depositAmount: Number(preview.totalPrice || 0) * 0.1,
            status: 'Draft',
            services: (preview.services || []).map((service: any) => ({
              id: service.id,
              serviceId: service.id,
              serviceName: service.name,
              price: Number(service.price || 0),
              currency: 'VND',
              quantity: Number(service.quantity || 0),
              lineTotal: Number(service.lineTotal || 0),
            })),
            timeSlot: {
              id: draft.timeSlotId,
              startTime: preview.startTime || '',
              endTime: preview.endTime || '',
              price: Number(preview.fieldPrice || 0),
              pitch: {
                id: '',
                name: preview.pitchName || 'Sân thể thao',
                type: preview.pitchType || 'Tiêu chuẩn',
                address: preview.pitchAddress || '',
              },
            },
          });
          setIsLoading(false);
          return;
        }
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
  }, [id, isDraft, draft]);

  useEffect(() => {
    if (user) {
      setCustomerName((current) => current || user.fullName || '');
      setCustomerPhone((current) => current || user.phoneNumber || '');
    }
  }, [user]);

  useEffect(() => {
    const pitchId = draft?.pitchId || booking?.timeSlot?.pitch?.id;
    if (!pitchId) return;
    api.get(`/additional-services/pitch/${pitchId}`).then((response) => {
      const data = Array.isArray(response) ? response : response.data;
      setSuggestedServices(Array.isArray(data) ? data.map((item: any) => ({
        id: item.id || item.Id,
        name: item.name || item.Name,
        price: Number(item.price ?? item.Price ?? 0),
        imageUrl: item.imageUrl || item.ImageUrl || '',
        stockQuantity: Number(item.stockQuantity ?? item.StockQuantity ?? 0),
      })) : []);
    }).catch(() => setSuggestedServices([]));
  }, [booking?.timeSlot?.pitch?.id, draft?.pitchId]);

  const selectedSuggestedServices = useMemo(() => suggestedServices.filter((service) => selectedExtras[service.id]).map((service) => ({
    id: service.id,
    serviceId: service.id,
    serviceName: service.name,
    price: service.price,
    quantity: selectedExtras[service.id],
    lineTotal: service.price * selectedExtras[service.id],
  })), [selectedExtras, suggestedServices]);

  const details = useMemo(() => {
    const pitch = booking?.timeSlot?.pitch;
    const preview = draft?.preview;
    const services: NonNullable<BookingResponse['services']> = isDraft ? selectedSuggestedServices : (booking?.services || preview?.services || []);
    const fieldPrice = Number(booking?.timeSlot?.price ?? preview?.fieldPrice ?? booking?.totalPrice ?? 0);
    const serviceTotal = services.reduce((sum, item) => sum + Number(item.lineTotal || item.price * item.quantity || 0), 0);
    const total = fieldPrice + serviceTotal;
    const deposit = Number(booking?.depositAmount || 0);

    return {
      bookingCode: booking?.checkInCode || booking?.id?.slice(0, 8).toUpperCase() || 'TẠM TÍNH',
      pitchName: booking?.pitchName || pitch?.name || preview?.pitchName || 'Sân thể thao',
      pitchType: pitch?.type || preview?.pitchType || 'Tiêu chuẩn',
      pitchAddress: formatCompactAddress(pitch?.address || (booking as any)?.pitchAddress || preview?.pitchAddress),
      pitchImage: preview?.pitchImage || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
      startTime: booking?.startTime || booking?.timeSlot?.startTime || preview?.startTime,
      endTime: booking?.endTime || booking?.timeSlot?.endTime || preview?.endTime,
      services,
      fieldPrice: Math.max(fieldPrice, total - serviceTotal),
      serviceTotal,
      total,
      deposit,
      remaining: Math.max(total - deposit, 0),
      expiresAt: booking?.createdAt ? new Date(booking.createdAt).getTime() + 15 * 60 * 1000 : null,
    };
  }, [booking, draft, isDraft, selectedSuggestedServices]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const holdRemainingMs = details.expiresAt ? Math.max(details.expiresAt - now, 0) : null;
  const holdExpired = holdRemainingMs !== null && holdRemainingMs <= 0;
  const formatCountdown = (value: number | null) => {
    if (value === null) return '15:00';
    const totalSeconds = Math.max(Math.ceil(value / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handlePayment = async () => {
    if (!booking && !draft) return;

    if (holdExpired) {
      setError('Đơn giữ chỗ đã quá 15 phút. Vui lòng tải lại trang hoặc chọn lại khung giờ.');
      return;
    }

    if (!isDraft && (!customerName.trim() || !customerPhone.trim())) {
      setError('Vui lòng kiểm tra họ tên và số điện thoại trước khi thanh toán.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPaymentStatus('idle');
    setPaymentFailureReason(null);
    let lockId: string | undefined;
    try {
      let confirmedBooking = booking;
      if (isDraft) {
        const lock = await bookingService.lock(draft.timeSlotId, draft.bookingDate);
        lockId = (lock as any).lockId || (lock as any).LockId;
        confirmedBooking = await bookingService.create({
          timeSlotId: draft.timeSlotId,
          bookingDate: draft.bookingDate,
          selectedServices: selectedSuggestedServices.map((service) => ({ serviceId: service.serviceId, quantity: service.quantity })),
        });
        setBooking(confirmedBooking);
        sessionStorage.removeItem('bookingDraft');
      }
      const paymentResponse = await paymentService.createPayment({
        bookingId: confirmedBooking!.id,
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
      if (lockId) await bookingService.releaseLock(lockId).catch(() => undefined);
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
    if (autoPayStarted.current || isLoading || !booking || searchParams.get('pay') !== '1') return;

    autoPayStarted.current = true;
    handlePayment();
  }, [booking, isLoading, searchParams]);

  useEffect(() => {
    if (!paymentModal.isOpen || !paymentModal.transactionId) return;

    setPaymentStatus('pending');
    let isActive = true;

    const synchronizePayment = async () => {
      try {
        const transaction = await paymentService.getTransaction(paymentModal.transactionId!);
        const status = normalizeStatus(transaction.status);

        if (status === 'success') {
          if (!isActive) return;
          setPaymentStatus('success');
          setPaymentModal((prev) => ({ ...prev, isOpen: false }));
          const message = encodeURIComponent('Thanh toán cọc thành công');
          navigate(`/payment-result?success=true&bookingId=${booking?.id}&message=${message}`);
        }

        if (status === 'failed') {
          if (!isActive) return;
          setPaymentFailureReason(transaction.failureReason || 'ZaloPay chưa xác nhận giao dịch này. Vui lòng kiểm tra lại trên ứng dụng ZaloPay.');
          setPaymentStatus('failed');
        }
      } catch (pollError) {
        console.error('Error polling transaction:', pollError);
      }
    };

    void synchronizePayment();
    const intervalId = window.setInterval(synchronizePayment, PAYMENT_STATUS_POLL_INTERVAL_MS);

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
      className="relative min-h-screen bg-[var(--page-bg)] px-4 pt-24 pb-14 text-[var(--ink)] font-body sm:px-6 lg:pt-26"
      style={pageStyle}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 -z-10">
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 font-heading">Xác nhận đặt sân</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                <BadgeCheck size={13} />
                {statusLabel(booking.status)}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Kiểm tra thông tin đặt sân, chọn thêm dịch vụ cần thiết và thanh toán cọc để giữ lịch.
            </p>
          </div>

          <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-3 lg:min-w-[620px]">
            {[
              { icon: <CalendarDays size={17} />, label: 'Ngày chơi', value: formatDate(booking.bookingDate) },
              { icon: <Clock size={17} />, label: 'Khung giờ', value: `${shortTime(details.startTime)} - ${shortTime(details.endTime)}` },
              { icon: <WalletCards size={17} />, label: 'Cọc hôm nay', value: formatMoney(details.deposit) },
            ].map((item) => (
              <div key={item.label} className="flex min-w-0 items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm">
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                  <span className="mt-0.5 block truncate text-sm font-black text-slate-950">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200/80 bg-[var(--panel)] p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
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

            <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-[var(--panel)] p-4 shadow-sm sm:grid-cols-[220px_minmax(0,1fr)]">
              <img src={details.pitchImage} alt={details.pitchName} className="h-52 w-full rounded-xl object-cover" />
              <div className="min-w-0 py-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">{pitchTypeLabel(details.pitchType)}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 font-heading">{details.pitchName}</h2>
                <p className="mt-3 flex items-center gap-2 text-sm font-bold text-amber-600"><Star size={16} className="fill-current" />Sân đã chọn theo khung giờ của bạn</p>
                <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600"><span className="flex items-center gap-2"><CalendarDays size={16} className="text-[var(--accent)]" />{formatDate(booking.bookingDate)}</span><span className="flex items-center gap-2"><Clock size={16} className="text-[var(--accent)]" />{shortTime(details.startTime)} - {shortTime(details.endTime)} (1 giờ)</span><span className="flex items-center gap-2"><MapPin size={16} className="text-[var(--accent)]" />{details.pitchAddress}</span></div>
                <button type="button" onClick={() => navigate(-1)} className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:bg-blue-100">Xem chi tiết sân <ArrowRight size={14} /></button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-[var(--panel)] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <ReceiptText size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black font-heading">Gợi ý dịch vụ đi kèm</h2>
                  <p className="text-xs font-semibold text-slate-500">Bạn có thể bổ sung dịch vụ phù hợp trước khi thanh toán.</p>
                </div>
              </div>

              {suggestedServices.length > 0 ? (
                <>
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                    {['Tất cả', 'Đồ uống', 'Dụng cụ', 'Quần áo', 'Tiện ích khác', 'Khác'].map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setServiceCategory(category)}
                        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${
                          serviceCategory === category
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {suggestedServices
                      .filter((service) => serviceCategory === 'Tất cả' || getServiceCategory(service.name) === serviceCategory)
                      .map((service) => {
                        const quantity = selectedExtras[service.id] || 0;
                        const stock = Number(service.stockQuantity || 0);
                        const unavailable = stock <= 0;

                        return (
                          <article
                            key={service.id}
                            className={`rounded-lg border bg-white p-3 transition ${
                              quantity > 0 ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200 hover:border-blue-200'
                            } ${unavailable ? 'bg-slate-50 opacity-75' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                {service.imageUrl ? (
                                  <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
                                ) : (
                                  <ReceiptText className="m-4 text-slate-400" size={22} />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-slate-900">{service.name}</p>
                                <p className="mt-1 text-sm font-black text-blue-700">{formatMoney(service.price)}</p>

                                {unavailable ? (
                                  <span className="mt-2 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                                    Tạm thời hết hàng
                                  </span>
                                ) : (
                                  <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                    Tồn kho: {stock}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                              <button
                                type="button"
                                disabled={quantity <= 0}
                                onClick={() =>
                                  setSelectedExtras((current) => ({
                                    ...current,
                                    [service.id]: Math.max(0, (current[service.id] || 0) - 1),
                                  }))
                                }
                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                -
                              </button>

                              <span className="text-sm font-black text-slate-900">{quantity}</span>

                              <button
                                type="button"
                                disabled={unavailable || quantity >= stock}
                                onClick={() =>
                                  setSelectedExtras((current) => ({
                                    ...current,
                                    [service.id]: (current[service.id] || 0) + 1,
                                  }))
                                }
                                className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          </article>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  Sân này chưa có dịch vụ bổ sung đang bán.
                </div>
              )}
            </div>
          </section>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-slate-200 bg-[var(--panel)] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tóm tắt đơn</p>
                  <h2 className="mt-1 text-lg font-black font-heading">Chi tiết thanh toán</h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <CreditCard size={20} />
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="truncate text-sm font-black text-slate-950">{details.pitchName}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {shortTime(details.startTime)} - {shortTime(details.endTime)} · {formatDate(booking.bookingDate)}
                </p>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 text-slate-600">
                  <span>Tiền thuê sân</span>
                  <strong className="text-slate-900">{formatMoney(details.fieldPrice)}</strong>
                </div>

                {details.serviceTotal > 0 && (
                  <div>
                    <div className="flex items-center justify-between gap-4 text-slate-600">
                      <span>Dịch vụ đi kèm</span>
                      <strong className="text-slate-900">{formatMoney(details.serviceTotal)}</strong>
                    </div>
                    <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-2">
                      {details.services.map((service) => (
                        <div key={service.id || service.serviceId} className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                          <span className="truncate">{service.serviceName} x{service.quantity}</span>
                          <span className="shrink-0">{formatMoney(service.lineTotal || service.price * service.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-slate-700">Tổng tiền</span>
                    <strong className="text-lg text-slate-950">{formatMoney(details.total)}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-700">
                  <WalletCards size={15} />
                  Thanh toán cọc hôm nay
                </div>
                <p className="mt-2 text-3xl font-black tracking-tight text-blue-700">{formatMoney(details.deposit)}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                  Còn lại {formatMoney(details.remaining)} thanh toán tại sân.
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700">
                    <Hourglass size={15} />
                    Giữ chỗ
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${holdExpired ? 'bg-red-100 text-red-700' : 'bg-white text-amber-700'}`}>
                    {holdExpired ? 'Hết hạn' : formatCountdown(holdRemainingMs)}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                  Quá 15 phút chưa thanh toán, khung giờ sẽ được mở lại.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                <WalletCards size={18} />
                Thanh toán online
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing || holdExpired}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--accent)] px-5 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <>{isDraft ? 'Đặt sân và thanh toán' : 'Thanh toán online'} <ArrowRight size={18} /></>}
              </button>

              {!paymentModal.isOpen && paymentModal.paymentUrl && paymentStatus !== 'success' && (
                <button
                  type="button"
                  onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: true }))}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-blue-700 transition hover:bg-blue-100"
                >
                  Xem lại mã QR
                  <QrCode size={16} />
                </button>
              )}
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <ShieldCheck size={15} />
                Bảo mật bởi cổng thanh toán
              </div>
            </div>
          </aside>
        </div>
      </div>

      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4">
          <div className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
            <button
              type="button"
              onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
              className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            <div className="shrink-0 border-b border-slate-200 px-4 py-3 pr-14 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">Thanh toán cọc bằng mã QR</h3>
                  <p className="text-xs font-semibold text-slate-500">Quét mã bằng ZaloPay hoặc mở trang thanh toán.</p>
                </div>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="bg-slate-50 px-4 py-4 sm:px-5">
                <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center justify-center rounded-xl bg-white p-3 shadow-sm">
                    <img
                      src={buildQrSource(paymentModal.qrCode, paymentModal.paymentUrl)}
                      alt="Mã QR thanh toán cọc"
                      className="h-48 w-48 rounded-lg object-contain sm:h-52 sm:w-52"
                    />
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700">
                      <Hourglass size={15} />
                      Thời gian giữ chỗ
                    </span>
                    <strong className={`rounded-full px-3 py-1 text-sm ${holdExpired ? 'bg-red-100 text-red-700' : 'bg-white text-amber-700'}`}>
                      {holdExpired ? 'Hết hạn' : formatCountdown(holdRemainingMs)}
                    </strong>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    Quá 15 phút chưa thanh toán cọc, đơn sẽ tự hủy và khung giờ được mở lại.
                  </p>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-700">Quét mã hoặc mở trang thanh toán để trả tiền cọc.</p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
                    {paymentStatus === 'pending' && (
                      <>
                        <Loader2 className="animate-spin text-emerald-600" size={16} />
                        <span>Đang chờ xác nhận thanh toán...</span>
                      </>
                    )}
                    {paymentStatus === 'failed' && (
                      <span className="text-red-600">{paymentFailureReason || 'Giao dịch chưa thành công. Bạn có thể tạo mã thanh toán mới.'}</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  {paymentModal.paymentUrl && (
                    <a
                      href={paymentModal.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-emerald-700"
                    >
                      Mở trang thanh toán
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {paymentStatus === 'failed' && (
                    <button
                      type="button"
                      onClick={handlePayment}
                      disabled={isProcessing || holdExpired}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <><QrCode size={16} /> Tạo mã thanh toán mới</>}
                    </button>
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

              <div className="px-4 py-4 sm:px-5">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Chi tiết đơn đặt sân</p>
                  <h4 className="mt-2 text-xl font-black text-slate-950">{details.pitchName}</h4>
                  <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-5 text-slate-600">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-red-500" />
                    {details.pitchAddress}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mã đơn</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{details.bookingCode}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loại sân</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{pitchTypeLabel(details.pitchType)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày chơi</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{formatDate(booking.bookingDate)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khung giờ</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{shortTime(details.startTime)} - {shortTime(details.endTime)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Người đặt</p>
                    <p className="mt-1 truncate text-sm font-black text-slate-900">{customerName || booking.user?.fullName || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Số điện thoại</p>
                    <p className="mt-1 truncate text-sm font-black text-slate-900">{customerPhone || booking.user?.phoneNumber || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cổng thanh toán</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{paymentModal.provider || 'ZALOPAY'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mã giao dịch</p>
                    <p className="mt-1 truncate text-sm font-black text-slate-900">{paymentModal.transactionId || 'Đang tạo'}</p>
                  </div>
                </div>

                <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-600">Tiền thuê sân</span>
                    <strong>{formatMoney(details.fieldPrice)}</strong>
                  </div>
                  {details.serviceTotal > 0 && (
                    <div className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-semibold text-slate-600">Dịch vụ phát sinh</span>
                        <strong>{formatMoney(details.serviceTotal)}</strong>
                      </div>
                      <div className="mt-2 space-y-1 text-xs font-semibold text-slate-500">
                        {details.services.map((service) => (
                          <div key={service.id || service.serviceId} className="flex items-center justify-between gap-3">
                            <span className="truncate">{service.serviceName} x {service.quantity}</span>
                            <span className="shrink-0">{formatMoney(service.lineTotal || service.price * service.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-600">Tổng tiền</span>
                    <strong>{formatMoney(details.total)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 bg-emerald-50 px-4 py-4 text-sm">
                    <span className="font-black text-emerald-700">Cọc cần thanh toán</span>
                    <strong className="text-xl text-emerald-700">{formatMoney(details.deposit)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-600">Còn lại tại sân</span>
                    <strong>{formatMoney(details.remaining)}</strong>
                  </div>
                </div>

                <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
                  Sau khi cổng thanh toán xác nhận thành công, hệ thống sẽ tự chuyển đơn sang trạng thái đã xác nhận và khóa slot này cho bạn.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.main>
  );
};

export default BookingReview;
