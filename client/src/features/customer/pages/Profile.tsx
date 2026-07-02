import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Edit3,
  Eye,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MailCheck,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  ShoppingBag,
  Star,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { bookingService, type BookingResponse } from '../../../services/bookingService';
import { paymentService } from '../../../services/paymentService';
import { formatCompactAddress } from '../../../utils/address';
import { getReadNotificationIds, saveReadNotificationIds } from '../../../utils/notifications';
import { slugify } from '../../../utils/slug';
import { useVietnamLocations, type Province, type District, type Ward } from '../../../hooks/useVietnamLocations';
import Pagination from '../../../components/Pagination';

type TabType = 'profile' | 'bookings' | 'notifications' | 'security';

type PaymentHistoryItem = {
  transactionId: string;
  bookingId: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  providerTxnId?: string | null;
  transactionDate: string;
};

type SystemNotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type UserReviewItem = {
  id: string;
  bookingId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

const isProfileTab = (value: string | null): value is TabType =>
  value === 'profile' || value === 'bookings' || value === 'notifications' || value === 'security';

const fmtMoney = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const fmtDate = (value?: string) => {
  if (!value) return '--/--/----';

  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
};

const fmtTime = (value?: string) => String(value || '--:--').slice(0, 5);

const statusLabel = (status?: string) => {
  const value = String(status || '').toLowerCase();

  if (value === '1' || value.includes('pending')) return 'Chờ thanh toán';
  if (value === '2' || value.includes('confirm')) return 'Đã xác nhận';
  if (value === '3' || value.includes('cancel')) return 'Đã hủy';
  if (value === '4' || value.includes('complete')) return 'Hoàn tất';
  if (value === '5' || value.includes('noshow')) return 'Không đến';

  return 'Đang xử lý';
};

const statusClass = (status?: string) => {
  const value = String(status || '').toLowerCase();

  if (value === '2' || value === '4' || value.includes('confirm') || value.includes('complete')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }

  if (value === '1' || value.includes('pending')) {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }

  if (value === '3' || value === '5' || value.includes('cancel') || value.includes('noshow')) {
    return 'bg-red-50 text-red-600 border-red-100';
  }

  return 'bg-slate-100 text-slate-500 border-slate-200';
};

const initials = (name?: string) =>
  String(name || 'U')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

const normalizeAddressPart = (value?: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(tinh|thanh pho|quan|huyen|thi xa|phuong|xa|thi tran)\s+/i, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const compactAddress = (...parts: Array<string | undefined | null>) => {
  const result: string[] = [];
  const seen = new Set<string>();

  parts
    .flatMap((part) => String(part || '').split(','))
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^(việt nam|vietnam)$/i.test(part))
    .forEach((part) => {
      const key = normalizeAddressPart(part);
      if (!key || seen.has(key)) return;

      seen.add(key);
      result.push(part);
    });

  return result.join(', ');
};

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <span className="inline-flex gap-0.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={size}
        className={index < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
      />
    ))}
  </span>
);

const Profile: React.FC = () => {
  const { user, logout, login, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>(isProfileTab(initialTab) ? initialTab : 'profile');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotificationItem[]>([]);
  const [paymentHistoryByBooking, setPaymentHistoryByBooking] = useState<Record<string, PaymentHistoryItem>>({});
  const [reviewsByBooking, setReviewsByBooking] = useState<Record<string, UserReviewItem>>({});

  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [bookingPage, setBookingPage] = useState(1);

  const [notificationFilter, setNotificationFilter] = useState('all');
  const [notificationPage, setNotificationPage] = useState(1);
  const [readIds, setReadIds] = useState<string[]>(() => getReadNotificationIds());

  const [reviewingBookingId, setReviewingBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmittingId, setReviewSubmittingId] = useState<string | null>(null);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const { provinces, districts, wards } = useVietnamLocations(selectedProvince?.code, selectedDistrict?.code);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    mapLink: user?.mapLink || '',
  });

  const pageSize = 6;

  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsEditing(false);
    setSearchParams(tab === 'profile' ? {} : { tab });
  };

  const fetchProfile = async () => {
    try {
      const result = await api.get('/users/profile') as any;

      if (!result) return;

      setFormData({
        fullName: result.fullName || '',
        email: result.email || '',
        phoneNumber: result.phoneNumber || '',
        address: result.address || '',
        mapLink: result.mapLink || '',
      });

      updateUser(result);
    } catch (error: any) {
      if (error.status === 404) {
        setToast({ type: 'error', message: 'Vui lòng đăng xuất và đăng nhập lại.' });
      }
    }
  };

  const isCompleted = (booking: BookingResponse) => {
    const value = String(booking.status || '').toLowerCase();
    return value.includes('complete') || value === '4';
  };

  const isCancelled = (booking: BookingResponse) => {
    const value = String(booking.status || '').toLowerCase();
    return value.includes('cancel') || value === '3';
  };

  const isPending = (booking: BookingResponse) => {
    const value = String(booking.status || '').toLowerCase();
    return value === '1' || value.includes('pending') || value.includes('deposit');
  };

  const pitchName = (booking: BookingResponse) => booking.pitchName || booking.timeSlot?.pitch?.name || 'Sân thể thao';
  const pitchAddress = (booking: BookingResponse) => formatCompactAddress(booking.timeSlot?.pitch?.address);
  const startTime = (booking: BookingResponse) => booking.startTime || booking.timeSlot?.startTime || '--:--';
  const endTime = (booking: BookingResponse) => booking.endTime || booking.timeSlot?.endTime || '--:--';
  const totalAmount = (booking: BookingResponse) => Number(booking.totalPrice || 0);
  const depositAmount = (booking: BookingResponse) => Number(booking.depositAmount || paymentHistoryByBooking[booking.id]?.amount || 0);
  const extraServices = (booking: BookingResponse) => Array.isArray(booking.services) ? booking.services : [];
  const extraTotal = (booking: BookingResponse) =>
    extraServices(booking).reduce((sum, item) => sum + Number(item.lineTotal || item.price * item.quantity || 0), 0);

  const isDepositPaid = (booking: BookingResponse) => {
    const payment = paymentHistoryByBooking[booking.id];
    const paymentStatus = String(payment?.status || '').toLowerCase();
    const bookingStatus = String(booking.status || '').toLowerCase();

    return paymentStatus === 'success' || bookingStatus.includes('confirm') || bookingStatus.includes('complete') || bookingStatus === '2' || bookingStatus === '4';
  };

  const paidDeposit = (booking: BookingResponse) =>
    isDepositPaid(booking) ? Number(paymentHistoryByBooking[booking.id]?.amount || booking.depositAmount || 0) : 0;

  const remaining = (booking: BookingResponse) =>
    isCompleted(booking) ? 0 : Math.max(totalAmount(booking) - paidDeposit(booking), 0);

  const canPay = (booking: BookingResponse) => isPending(booking) && !isCompleted(booking) && !isCancelled(booking);

  const canCancel = (booking: BookingResponse) => {
    const status = String(booking.status || '').toLowerCase();
    if (isCompleted(booking) || isCancelled(booking)) return false;
    return status.includes('pending') || status.includes('confirm') || status === '1' || status === '2';
  };

  const detailUrl = (booking: BookingResponse) => {
    const pitchId = booking.timeSlot?.pitch?.id;
    return pitchId ? `/san/${pitchId}-${slugify(pitchName(booking))}` : '/explore';
  };

  const fetchBookingReviews = async (items: BookingResponse[]) => {
    const completed = items.filter(isCompleted);

    if (completed.length === 0) {
      setReviewsByBooking({});
      return;
    }

    const results = await Promise.allSettled(
      completed.map((booking) => api.get(`/bookings/${booking.id}/reviews`) as Promise<UserReviewItem>),
    );

    const next = results.reduce<Record<string, UserReviewItem>>((acc, result) => {
      if (result.status === 'fulfilled' && result.value?.bookingId) {
        acc[result.value.bookingId] = result.value;
      }

      return acc;
    }, {});

    setReviewsByBooking(next);
  };

  const fetchBookings = async (silent = false) => {
    if (!silent) setIsLoadingBookings(true);

    try {
      const [bookingResult, paymentResult] = await Promise.allSettled([
        bookingService.getMyBookings({ pageNumber: 1, pageSize: 500 }),
        paymentService.getMyHistory(1, 500),
      ]);

      if (bookingResult.status === 'rejected') throw bookingResult.reason;

      const bookingItems: BookingResponse[] = Array.isArray(bookingResult.value?.items)
        ? bookingResult.value.items
        : Array.isArray(bookingResult.value)
          ? bookingResult.value
          : [];

      const paymentItems: PaymentHistoryItem[] =
        paymentResult.status === 'fulfilled' && Array.isArray(paymentResult.value?.items)
          ? paymentResult.value.items
          : [];

      const latestPayment = paymentItems.reduce<Record<string, PaymentHistoryItem>>((acc, payment) => {
        const current = acc[payment.bookingId];

        if (!current || new Date(payment.transactionDate).getTime() >= new Date(current.transactionDate).getTime()) {
          acc[payment.bookingId] = payment;
        }

        return acc;
      }, {});

      setBookings(bookingItems);
      setPaymentHistoryByBooking(latestPayment);
      await fetchBookingReviews(bookingItems);
    } catch {
      setToast({ type: 'error', message: 'Không thể tải lịch sử đặt sân.' });
    } finally {
      if (!silent) setIsLoadingBookings(false);
    }
  };

  const fetchSystemNotifications = async () => {
    try {
      const result = await api.get('/notifications', { params: { pageNumber: 1, pageSize: 500 } }) as any;
      const items = Array.isArray(result?.items) ? result.items : [];
      setSystemNotifications(items);

      if (items.some((item: SystemNotificationItem) => String(item.type).toLowerCase().includes('approved'))) {
        const refreshResult = await api.post('/auth/refresh-token', {}) as any;
        login(refreshResult);
      }
    } catch {
      setSystemNotifications([]);
    }
  };

  useEffect(() => {
    fetchProfile();

    if (activeTab === 'bookings' || activeTab === 'notifications') {
      fetchBookings();
    }

    if (activeTab === 'notifications') {
      fetchSystemNotifications();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'bookings' && activeTab !== 'notifications') return;

    const timer = window.setInterval(() => fetchBookings(true), 20000);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isProfileTab(tab) && tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setBookingPage(1);
  }, [bookingFilter]);

  useEffect(() => {
    setNotificationPage(1);
  }, [notificationFilter]);

  const persistRead = (id: string) => {
    setReadIds((current) => current.includes(id) ? current : saveReadNotificationIds([...current, id]));
  };

  const markSystemRead = async (id: string) => {
    setSystemNotifications((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
    persistRead(id);
    await api.patch(`/notifications/${id}/read`).catch(() => {});
  };

  const bookingNotifications = bookings.slice(0, 12).map((booking) => {
    const payment = paymentHistoryByBooking[booking.id];
    const paymentStatus = String(payment?.status || '').toLowerCase();
    const paid = isDepositPaid(booking);
    const failed = paymentStatus === 'failed';

    if (isCompleted(booking)) {
      return {
        booking,
        title: 'Đơn đặt sân hoàn thành',
        message: `${pitchName(booking)} đã hoàn thành. Bạn có thể đánh giá trải nghiệm.`,
        icon: <Star size={18} />,
        className: 'bg-amber-50 text-amber-600',
      };
    }

    if (isCancelled(booking)) {
      return {
        booking,
        title: 'Đơn đặt sân đã hủy',
        message: `${pitchName(booking)} ngày ${fmtDate(booking.bookingDate)} đã hủy.`,
        icon: <X size={18} />,
        className: 'bg-red-50 text-red-600',
      };
    }

    if (failed) {
      return {
        booking,
        title: 'Thanh toán cọc thất bại',
        message: `${pitchName(booking)} chưa ghi nhận cọc ${fmtMoney(depositAmount(booking))}.`,
        icon: <AlertCircle size={18} />,
        className: 'bg-red-50 text-red-600',
      };
    }

    if (paid) {
      return {
        booking,
        title: 'Đơn đặt sân đã xác nhận',
        message: `Đã cọc ${fmtMoney(paidDeposit(booking))} cho ${pitchName(booking)}.`,
        icon: <CheckCircle2 size={18} />,
        className: 'bg-emerald-50 text-emerald-600',
      };
    }

    return {
      booking,
      title: 'Đơn đặt sân chờ cọc',
      message: `${pitchName(booking)} ${fmtTime(startTime(booking))}-${fmtTime(endTime(booking))}, cần cọc ${fmtMoney(depositAmount(booking))}.`,
      icon: <CreditCard size={18} />,
      className: 'bg-amber-50 text-amber-600',
    };
  });

  const allNotifications = [
    ...systemNotifications.map((item) => ({
      id: item.id,
      source: 'system',
      title: item.title,
      message: item.message,
      meta: item.type,
      date: item.createdAt,
      isRead: item.isRead || readIds.includes(item.id),
      icon: String(item.type).toLowerCase().includes('approved') ? <CheckCircle2 size={18} /> : <Bell size={18} />,
      className: String(item.type).toLowerCase().includes('approved') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600',
      onClick: () => markSystemRead(item.id),
    })),
    ...bookingNotifications.map((item) => ({
      id: item.booking.id,
      source: 'booking',
      title: item.title,
      message: item.message,
      meta: statusLabel(item.booking.status),
      date: item.booking.createdAt || item.booking.bookingDate,
      isRead: readIds.includes(item.booking.id),
      icon: item.icon,
      className: item.className,
      onClick: () => {
        persistRead(item.booking.id);
        setExpandedBookingId(item.booking.id);
        changeTab('bookings');
      },
    })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  useEffect(() => {
    if (activeTab !== 'notifications') return;

    const unreadItems = allNotifications.filter((item) => !item.isRead);
    if (unreadItems.length === 0) return;

    const unreadIds = unreadItems.map((item) => item.id);
    setReadIds(saveReadNotificationIds(Array.from(new Set([...readIds, ...unreadIds]))));
    setSystemNotifications((current) => current.map((item) => ({ ...item, isRead: true })));

    unreadItems
      .filter((item) => item.source === 'system')
      .forEach((item) => {
        api.patch(`/notifications/${item.id}/read`).catch(() => {});
      });
  }, [activeTab, allNotifications.length]);

  const filteredNotifications = allNotifications.filter((item) => {
    if (notificationFilter === 'all') return true;
    return item.source === notificationFilter;
  });

  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(b.createdAt || b.bookingDate || 0).getTime() - new Date(a.createdAt || a.bookingDate || 0).getTime(),
  );

  const filteredBookings = sortedBookings.filter((booking) => {
    const status = String(booking.status || '').toLowerCase();

    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'pending') return status.includes('pending') || status === '1';
    if (bookingFilter === 'confirmed') return status.includes('confirm') || status === '2';
    if (bookingFilter === 'completed') return status.includes('complete') || status === '4';
    if (bookingFilter === 'cancelled') return status.includes('cancel') || status === '3';

    return true;
  });

  const pagedBookings = filteredBookings.slice((bookingPage - 1) * pageSize, bookingPage * pageSize);
  const pagedNotifications = filteredNotifications.slice((notificationPage - 1) * pageSize, notificationPage * pageSize);

  const unreadCount = allNotifications.filter((item) => !item.isRead).length;
  const completedBookingCount = bookings.filter(isCompleted).length;
  const pendingBookingCount = bookings.filter(isPending).length;
  const cancelledBookingCount = bookings.filter(isCancelled).length;
  const totalSpent = bookings
    .filter((booking) => !isCancelled(booking))
    .reduce((sum, booking) => sum + totalAmount(booking), 0);
  const reviewedCount = Object.keys(reviewsByBooking).length;

  const joinedAddress = compactAddress(formData.address, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name) || formData.address;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const finalAddress = compactAddress(formData.address, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name) || formData.address;

      await api.patch('/users/profile', { ...formData, address: finalAddress });
      updateUser({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        address: finalAddress,
        mapLink: formData.mapLink,
      });
      setIsEditing(false);
      setToast({ type: 'success', message: 'Cập nhật thành công!' });
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Không thể cập nhật.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (booking: BookingResponse) => {
    const reason = window.prompt('Nhập lý do hủy đặt sân', 'Khách hàng thay đổi kế hoạch');
    if (reason === null) return;

    try {
      await bookingService.cancel(booking.id, reason.trim() || 'Khách hàng thay đổi kế hoạch');
      setToast({ type: 'success', message: 'Đã gửi yêu cầu hủy đặt sân.' });
      fetchBookings(true);
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'Không thể hủy đơn.' });
    }
  };

  const submitReview = async (bookingId: string) => {
    setReviewSubmittingId(bookingId);

    try {
      const payload = { rating: reviewRating, comment: reviewComment.trim() };

      if (reviewsByBooking[bookingId]) {
        await api.put(`/bookings/${bookingId}/reviews`, payload);
      } else {
        await api.post(`/bookings/${bookingId}/reviews`, payload);
      }

      const savedReview = await api.get(`/bookings/${bookingId}/reviews`) as UserReviewItem;
      setReviewsByBooking((current) => ({ ...current, [bookingId]: savedReview }));
      setReviewingBookingId(null);
      setReviewComment('');
      setReviewRating(5);
      setToast({ type: 'success', message: 'Cảm ơn bạn, đánh giá đã được ghi nhận.' });
      fetchBookings(true);
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'Không thể gửi đánh giá.' });
    } finally {
      setReviewSubmittingId(null);
    }
  };

  const menuItems = [
    { id: 'profile' as const, label: 'Thông tin cá nhân', icon: User },
    { id: 'bookings' as const, label: 'Lịch đặt sân', icon: ShoppingBag },
    { id: 'notifications' as const, label: 'Thông báo', icon: Bell },
    { id: 'security' as const, label: 'Bảo mật', icon: Lock },
  ];

  const StatCard: React.FC<{ label: string; value: React.ReactNode; tone: string }> = ({ label, value, tone }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className={`w-fit rounded-lg px-2.5 py-1 text-lg font-black ${tone}`}>{value}</p>
      <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-16 pt-24 font-sans text-slate-900">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        {toast && (
          <div
            className={`fixed right-5 top-24 z-50 rounded-lg border px-4 py-3 text-sm font-bold shadow-lg ${
              toast.type === 'success'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-red-100 bg-red-50 text-red-600'
            }`}
          >
            {toast.message}
          </div>
        )}

        <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="p-6 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="grid h-18 w-18 shrink-0 place-items-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-sm">
                  {initials(user?.fullName)}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Hồ sơ cá nhân</p>
                  <h1 className="mt-1 truncate text-3xl font-black tracking-tight text-slate-950">
                    {user?.fullName || 'Người dùng'}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      <Mail size={13} />
                      {user?.email}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      user?.emailConfirmed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <ShieldCheck size={13} />
                      {user?.emailConfirmed ? 'Email đã xác thực' : 'Chưa xác thực email'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  const badge = item.id === 'notifications' && unreadCount > 0 ? unreadCount : null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => changeTab(item.id)}
                      className={`relative inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
                        active
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                      {badge && (
                        <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-5 lg:border-l lg:border-t-0">
              <div className="grid h-full grid-cols-2 gap-3">
                <StatCard label="Tổng đơn" value={bookings.length} tone="bg-blue-50 text-blue-700" />
                <StatCard label="Hoàn tất" value={completedBookingCount} tone="bg-emerald-50 text-emerald-700" />
                <StatCard label="Chờ cọc" value={pendingBookingCount} tone="bg-amber-50 text-amber-700" />
                <StatCard label="Đã chi" value={fmtMoney(totalSpent)} tone="bg-slate-100 text-slate-800" />
              </div>
            </div>
          </div>
        </section>

        <main className="min-w-0">
          {activeTab === 'profile' && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Thông tin cá nhân</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">Thông tin liên hệ</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Cập nhật thông tin để đặt sân, nhận thông báo và thanh toán thuận tiện hơn.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditing((current) => !current)}
                    className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
                      isEditing
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isEditing ? <X size={15} /> : <Edit3 size={15} />}
                    {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Họ và tên" icon={<User size={16} />}>
                      <input
                        type="text"
                        value={formData.fullName}
                        readOnly={!isEditing}
                        onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                        className={inputClass(isEditing)}
                        placeholder="Nhập họ tên đầy đủ"
                      />
                    </Field>

                    <Field label="Email" icon={<Mail size={16} />}>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className={inputClass(false) + ' cursor-not-allowed'}
                      />
                    </Field>

                    <Field label="Số điện thoại" icon={<Phone size={16} />}>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        readOnly={!isEditing}
                        onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })}
                        className={inputClass(isEditing)}
                        placeholder="09xx xxx xxx"
                      />
                    </Field>

                    <label>
                      <span className="mb-1.5 block text-xs font-bold text-slate-500">Tỉnh / Thành phố</span>
                      <select
                        disabled={!isEditing}
                        value={selectedProvince?.code || ''}
                        onChange={(event) => {
                          const province = provinces.find((item) => item.code === Number(event.target.value));
                          setSelectedProvince(province || null);
                          setSelectedDistrict(null);
                          setSelectedWard(null);
                        }}
                        className={selectClass(isEditing)}
                      >
                        <option value="">Chọn tỉnh / thành</option>
                        {provinces.map((province) => (
                          <option key={province.code} value={province.code}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    {isEditing && (
                      <>
                        <label>
                          <span className="mb-1.5 block text-xs font-bold text-slate-500">Quận / Huyện</span>
                          <select
                            value={selectedDistrict?.code || ''}
                            disabled={!selectedProvince}
                            onChange={(event) => {
                              const district = districts.find((item) => item.code === Number(event.target.value));
                              setSelectedDistrict(district || null);
                              setSelectedWard(null);
                            }}
                            className={selectClass(true)}
                          >
                            <option value="">Chọn quận / huyện</option>
                            {districts.map((district) => (
                              <option key={district.code} value={district.code}>
                                {district.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          <span className="mb-1.5 block text-xs font-bold text-slate-500">Phường / Xã</span>
                          <select
                            value={selectedWard?.code || ''}
                            disabled={!selectedDistrict}
                            onChange={(event) => {
                              const ward = wards.find((item) => item.code === Number(event.target.value));
                              setSelectedWard(ward || null);
                            }}
                            className={selectClass(true)}
                          >
                            <option value="">Chọn phường / xã</option>
                            {wards.map((ward) => (
                              <option key={ward.code} value={ward.code}>
                                {ward.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}

                    <label className="md:col-span-2">
                      <span className="mb-1.5 block text-xs font-bold text-slate-500">Địa chỉ chi tiết</span>
                      <textarea
                        value={formData.address}
                        readOnly={!isEditing}
                        onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                        rows={3}
                        className={`${isEditing ? 'border-blue-300 bg-white ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50 text-slate-500'} w-full resize-none rounded-lg border px-4 py-3 text-sm font-semibold outline-none transition`}
                        placeholder="Số nhà, tên đường..."
                      />
                    </label>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end border-t border-slate-100 pt-5">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Lưu thay đổi
                      </button>
                    </div>
                  )}
                </form>
              </section>

              <aside className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <MapPin size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-black text-slate-900">Địa chỉ hiển thị</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        {joinedAddress || 'Chưa cập nhật địa chỉ'}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                      user?.emailConfirmed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <MailCheck size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-black text-slate-900">Xác thực email</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                        {user?.emailConfirmed
                          ? 'Tài khoản đã xác thực email.'
                          : 'Bạn nên xác thực email để tăng độ an toàn.'}
                      </p>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-5">
              <PageHeader
                tone="text-emerald-600"
                label="Lịch đặt sân"
                title="Đơn đặt của bạn"
                description="Theo dõi trạng thái, thanh toán cọc và đánh giá sau khi hoàn tất."
              />

              <FilterBar
                options={[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'pending', label: 'Chờ thanh toán' },
                  { id: 'confirmed', label: 'Đã xác nhận' },
                  { id: 'completed', label: 'Hoàn tất' },
                  { id: 'cancelled', label: 'Đã hủy' },
                ]}
                value={bookingFilter}
                onChange={setBookingFilter}
                activeClass="bg-emerald-600 text-white"
              />

              {isLoadingBookings ? (
                <LoadingCard text="Đang tải lịch sử đặt sân..." />
              ) : filteredBookings.length > 0 ? (
                <section className="grid gap-3">
                  {pagedBookings.map((booking) => {
                    const expanded = expandedBookingId === booking.id;
                    const review = reviewsByBooking[booking.id];
                    const reviewing = reviewingBookingId === booking.id;

                    return (
                      <article key={booking.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-wrap gap-2">
                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass(booking.status)}`}>
                                  {statusLabel(booking.status)}
                                </span>
                                {extraServices(booking).length > 0 && (
                                  <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
                                    Có dịch vụ thêm
                                  </span>
                                )}
                              </div>

                              <h3 className="truncate text-base font-black text-slate-950">{pitchName(booking)}</h3>
                              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                <MapPin size={12} className="shrink-0" />
                                {pitchAddress(booking)}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                                <span className="flex items-center gap-1">
                                  <CalendarDays size={12} className="text-blue-500" />
                                  {fmtDate(booking.bookingDate)}
                                </span>
                                <span>{fmtTime(startTime(booking))} - {fmtTime(endTime(booking))}</span>
                                <span className="font-black text-slate-900">{fmtMoney(totalAmount(booking))}</span>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                              <ActionButton onClick={() => setExpandedBookingId(expanded ? null : booking.id)} icon={<Eye size={14} />}>
                                {expanded ? 'Ẩn' : 'Chi tiết'}
                              </ActionButton>

                              {canPay(booking) && (
                                <ActionButton
                                  onClick={() => navigate(`/booking-review/${booking.id}?pay=1`)}
                                  icon={<CreditCard size={14} />}
                                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                >
                                  Thanh toán cọc
                                </ActionButton>
                              )}

                              {canCancel(booking) && (
                                <ActionButton
                                  onClick={() => handleCancel(booking)}
                                  icon={<X size={14} />}
                                  className="bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                  Hủy đơn
                                </ActionButton>
                              )}

                              {isCompleted(booking) && !review && (
                                <ActionButton
                                  onClick={() => {
                                    setReviewingBookingId(reviewing ? null : booking.id);
                                    setReviewRating(5);
                                    setReviewComment('');
                                  }}
                                  icon={<Star size={14} />}
                                  className="bg-amber-50 text-amber-700 hover:bg-amber-100"
                                >
                                  Đánh giá
                                </ActionButton>
                              )}
                            </div>
                          </div>
                        </div>

                        {review && !reviewing && (
                          <div className="border-t border-amber-100 bg-amber-50/50 px-5 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <StarRow rating={review.rating} />
                                <p className="mt-1 text-sm font-semibold text-slate-600">{review.comment || 'Không có nhận xét.'}</p>
                              </div>

                              <a href={detailUrl(booking)} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-600 ring-1 ring-blue-100 hover:bg-blue-600 hover:text-white">
                                Xem sân
                              </a>
                            </div>
                          </div>
                        )}

                        {reviewing && (
                          <div className="border-t border-amber-100 bg-amber-50/50 p-5">
                            <div className="flex flex-wrap items-end gap-4">
                              <div>
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-600">Đánh giá sân</p>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={rating}
                                      type="button"
                                      onClick={() => setReviewRating(rating)}
                                      className={`grid h-9 w-9 place-items-center rounded-lg ${
                                        rating <= reviewRating ? 'bg-amber-400 text-white' : 'bg-white text-slate-300 ring-1 ring-slate-200'
                                      }`}
                                    >
                                      <Star size={17} className={rating <= reviewRating ? 'fill-current' : ''} />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <input
                                value={reviewComment}
                                onChange={(event) => setReviewComment(event.target.value)}
                                placeholder="Sân sạch, đúng giờ..."
                                className="h-10 min-w-[240px] flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                              />

                              <button
                                type="button"
                                onClick={() => submitReview(booking.id)}
                                disabled={reviewSubmittingId === booking.id}
                                className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-60"
                              >
                                {reviewSubmittingId === booking.id ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                                Gửi
                              </button>
                            </div>
                          </div>
                        )}

                        {expanded && (
                          <div className="grid gap-3 border-t border-slate-100 bg-slate-50 p-5 md:grid-cols-3">
                            <InfoBox title="Thanh toán">
                              <Row label="Tổng tiền" value={fmtMoney(totalAmount(booking))} />
                              <Row label="Dịch vụ thêm" value={extraServices(booking).length ? fmtMoney(extraTotal(booking)) : '—'} />
                              <Row label="Đã cọc" value={fmtMoney(paidDeposit(booking))} />
                              <Row label="Còn lại" value={fmtMoney(remaining(booking))} />
                            </InfoBox>

                            <InfoBox title="Thông tin đơn">
                              <Row label="Trạng thái" value={statusLabel(booking.status)} />
                              <Row label="Mã đơn" value={(booking as any).checkInCode || booking.id.slice(0, 8).toUpperCase()} />
                              <Row label="Ngày đặt" value={fmtDate(booking.bookingDate)} />
                            </InfoBox>

                            <InfoBox title="Giao dịch">
                              <Row label="Cổng TT" value={paymentHistoryByBooking[booking.id]?.gateway || '—'} />
                              <Row label="Trạng thái" value={paymentHistoryByBooking[booking.id]?.status || '—'} />
                              <Row label="Mã GD" value={paymentHistoryByBooking[booking.id]?.providerTxnId || '—'} />
                            </InfoBox>
                          </div>
                        )}
                      </article>
                    );
                  })}

                  {filteredBookings.length > pageSize && (
                    <Pagination
                      page={bookingPage}
                      totalItems={filteredBookings.length}
                      pageSize={pageSize}
                      onPageChange={setBookingPage}
                      label="đơn đặt sân"
                    />
                  )}
                </section>
              ) : (
                <EmptyCard
                  icon={<ShoppingBag size={52} />}
                  title="Chưa có đơn đặt sân"
                  description="Khám phá và đặt sân yêu thích của bạn ngay hôm nay."
                  action="Khám phá sân"
                  onAction={() => navigate('/explore')}
                />
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <PageHeader
                tone="text-blue-600"
                label="Thông báo"
                title="Trung tâm thông báo"
                description="Khi mở trang này, thông báo mới sẽ tự động được đánh dấu là đã xem."
              />

              <FilterBar
                options={[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'booking', label: 'Đặt sân' },
                  { id: 'system', label: 'Hệ thống' },
                ]}
                value={notificationFilter}
                onChange={setNotificationFilter}
                activeClass="bg-blue-600 text-white"
              />

              {isLoadingBookings ? (
                <LoadingCard text="Đang tải thông báo..." />
              ) : filteredNotifications.length > 0 ? (
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="divide-y divide-slate-100">
                    {pagedNotifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-slate-50"
                      >
                        <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg ${item.className}`}>
                          {item.icon}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-950">{item.title}</p>
                              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{item.message}</p>
                            </div>
                            <span className="shrink-0 text-[11px] font-bold text-slate-400">{fmtDate(item.date)}</span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                              {item.source === 'booking' ? 'Đặt sân' : 'Hệ thống'}
                            </span>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-600">
                              Đã xem
                            </span>
                          </div>
                        </div>

                        {item.source === 'booking' && <ChevronRight size={16} className="mt-3 shrink-0 text-slate-300" />}
                      </button>
                    ))}
                  </div>

                  {filteredNotifications.length > pageSize && (
                    <div className="border-t border-slate-100 p-4">
                      <Pagination
                        page={notificationPage}
                        totalItems={filteredNotifications.length}
                        pageSize={pageSize}
                        onPageChange={setNotificationPage}
                        label="thông báo"
                      />
                    </div>
                  )}
                </section>
              ) : (
                <EmptyCard
                  icon={<Bell size={52} />}
                  title="Chưa có thông báo"
                  description="Các cập nhật đặt sân và hệ thống sẽ xuất hiện tại đây."
                />
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <PageHeader
                tone="text-indigo-600"
                label="Bảo mật"
                title="Bảo mật tài khoản"
                description="Theo dõi trạng thái xác thực và bảo vệ tài khoản của bạn."
              />

              <section className="grid gap-4 md:grid-cols-2">
                <SecurityCard
                  icon={<MailCheck size={20} />}
                  title="Xác thực email"
                  description={user?.emailConfirmed ? 'Email của bạn đã được xác thực.' : 'Bạn nên xác thực email để bảo vệ tài khoản.'}
                  status={user?.emailConfirmed ? 'Đã xác thực' : 'Chưa xác thực'}
                  success={Boolean(user?.emailConfirmed)}
                />

                <SecurityCard
                  icon={<ShieldCheck size={20} />}
                  title="Bảo vệ phiên đăng nhập"
                  description="Không chia sẻ tài khoản và đăng xuất khi sử dụng máy lạ."
                  status="Đang hoạt động"
                  success
                />
              </section>
            </div>
          )}
        </main>
      </div>
    </div>

  );
};

const inputClass = (editable: boolean) =>
  `h-11 w-full rounded-lg border px-4 text-sm font-semibold outline-none transition ${
    editable ? 'border-blue-300 bg-white ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50 text-slate-500'
  }`;

const selectClass = (editable: boolean) =>
  `h-11 w-full rounded-lg border px-4 text-sm font-semibold outline-none transition ${
    editable ? 'border-blue-300 bg-white ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50 text-slate-500'
  }`;

const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <label>
    <span className="mb-1.5 block text-xs font-bold text-slate-500">{label}</span>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{icon}</span>
      <div className="[&_input]:pl-11">{children}</div>
    </div>
  </label>
);

const PageHeader: React.FC<{ tone: string; label: string; title: string; description: string }> = ({ tone, label, title, description }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <p className={`text-[10px] font-black uppercase tracking-widest ${tone}`}>{label}</p>
    <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
    <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>
  </section>
);

const FilterBar: React.FC<{
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  activeClass: string;
}> = ({ options, value, onChange, activeClass }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
            value === option.id ? activeClass : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </section>
);

const LoadingCard: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-20 shadow-sm">
    <Loader2 className="animate-spin text-blue-600" size={32} />
    <p className="mt-3 text-sm font-semibold text-slate-400">{text}</p>
  </div>
);

const EmptyCard: React.FC<{ icon: React.ReactNode; title: string; description: string; action?: string; onAction?: () => void }> = ({
  icon,
  title,
  description,
  action,
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
    <span className="mb-4 text-slate-200">{icon}</span>
    <h4 className="text-lg font-black text-slate-800">{title}</h4>
    <p className="mt-1 max-w-xs text-sm text-slate-400">{description}</p>
    {action && (
      <button
        type="button"
        onClick={onAction}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-black text-white transition hover:bg-blue-700"
      >
        {action}
      </button>
    )}
  </div>
);

const ActionButton: React.FC<{ children: React.ReactNode; icon: React.ReactNode; onClick: () => void; className?: string }> = ({
  children,
  icon,
  onClick,
  className = 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600',
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${className}`}
  >
    {icon}
    {children}
  </button>
);

const InfoBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
    <dl className="space-y-2 text-xs font-semibold">{children}</dl>
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between gap-3">
    <dt className="text-slate-400">{label}</dt>
    <dd className="max-w-[160px] truncate text-right font-black text-slate-800">{value}</dd>
  </div>
);

const SecurityCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
  success: boolean;
}> = ({ icon, title, description, status, success }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${success ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{description}</p>
        <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
          success ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {status}
        </span>
      </div>
    </div>
  </section>
);

export default Profile;
