import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, ShoppingBag, Bell, Lock, LogOut, 
  Camera, MapPin, Phone, Mail, ChevronRight,
  ShieldCheck, Clock, CalendarDays, CreditCard, Banknote, ReceiptText, Eye,
  AlertCircle, Save, Loader2, Edit3, X,
  ExternalLink, MailCheck, CheckCircle2, Star
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

const Profile: React.FC = () => {
  const { user, logout, login, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  // Booking history is the primary workspace in the customer profile.
  const [activeTab, setActiveTab] = useState<TabType>(isProfileTab(initialTab) ? initialTab : 'bookings');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotificationItem[]>([]);
  const [paymentHistoryByBooking, setPaymentHistoryByBooking] = useState<Record<string, PaymentHistoryItem>>({});
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [reviewingBookingId, setReviewingBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmittingId, setReviewSubmittingId] = useState<string | null>(null);
  const [reviewsByBooking, setReviewsByBooking] = useState<Record<string, UserReviewItem>>({});
  const [bookingFilter, setBookingFilter] = useState('all');
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [bookingPage, setBookingPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);
  const profilePageSize = 6;
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => getReadNotificationIds());
  const previousBookingStatusRef = useRef<Record<string, string>>({});

  // Location selection states
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // Vietnam Locations Hook integration
  const { 
    provinces, districts, wards
  } = useVietnamLocations(selectedProvince?.code, selectedDistrict?.code);

  // Form states
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    mapLink: user?.mapLink || ''
  });

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

    const timer = window.setInterval(() => {
      fetchBookings(true);
    }, 20000);

    return () => window.clearInterval(timer);
  }, [activeTab]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isProfileTab(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsEditing(false);
    setSearchParams(tab === 'profile' ? {} : { tab });
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile') as any;
      if (res) {
        setFormData({
          fullName: res.fullName || '',
          email: res.email || '',
          phoneNumber: res.phoneNumber || '',
          address: res.address || '',
          mapLink: res.mapLink || ''
        });
        updateUser(res);
      }
    } catch (err: any) {
      if (err.status === 404 && err.message?.includes('not found')) {
         setNotification({ type: 'error', message: 'Dữ liệu người dùng đã thay đổi. Vui lòng đăng xuất và đăng nhập lại để tiếp tục.' });
      }
    }
  };

  // Auto-clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchBookings = async (silent = false) => {
    if (!silent) setIsLoadingBookings(true);
    try {
      const [bookingResult, paymentResult] = await Promise.allSettled([
        bookingService.getMyBookings({ pageNumber: 1, pageSize: 500 }),
        paymentService.getMyHistory(1, 500),
      ]);

      if (bookingResult.status === 'rejected') {
        throw bookingResult.reason;
      }

      const res = bookingResult.value;
      const paymentRes = paymentResult.status === 'fulfilled' ? paymentResult.value : null;
      const paymentItems = Array.isArray(paymentRes?.items) ? paymentRes.items as PaymentHistoryItem[] : [];
      const latestPaymentByBooking = paymentItems.reduce<Record<string, PaymentHistoryItem>>((acc, payment) => {
        const current = acc[payment.bookingId];
        const currentTime = current ? new Date(current.transactionDate || 0).getTime() : 0;
        const nextTime = new Date(payment.transactionDate || 0).getTime();
        if (!current || nextTime >= currentTime) {
          acc[payment.bookingId] = payment;
        }
        return acc;
      }, {});
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];

      const previousStatuses = previousBookingStatusRef.current;
      const nextStatuses: Record<string, string> = {};

      items.forEach((booking: BookingResponse) => {
        const nextStatus = String(booking.status || '').toLowerCase();
        nextStatuses[booking.id] = nextStatus;

        const prevStatus = previousStatuses[booking.id];
        const isCompletedNow = nextStatus.includes('complete') || nextStatus === '4';
        const wasCompleted = prevStatus ? (prevStatus.includes('complete') || prevStatus === '4') : false;
        const becameCompleted = isCompletedNow && prevStatus && !wasCompleted;

        if (becameCompleted) {
          setNotification({
            type: 'success',
            message: `Đơn ${getBookingPitchName(booking)} đã hoàn thành. Hãy để lại đánh giá trải nghiệm nhé!`,
          });
        }
      });

      previousBookingStatusRef.current = nextStatuses;
      setBookings(items);
      setPaymentHistoryByBooking(latestPaymentByBooking);
      fetchBookingReviews(items);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setNotification({ type: 'error', message: 'Không thể tải lịch sử đặt sân.' });
    } finally {
      if (!silent) setIsLoadingBookings(false);
    }
  };

  const fetchSystemNotifications = async () => {
    try {
      const res = await api.get('/notifications', { params: { pageNumber: 1, pageSize: 500 } }) as any;
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setSystemNotifications(items);

      if (items.some((item: SystemNotificationItem) => String(item.type).toLowerCase().includes('approved'))) {
        const refreshed = await api.post('/auth/refresh-token', {}) as any;
        login(refreshed);
      }
    } catch {
      setSystemNotifications([]);
    }
  };

  const getBookingPitchName = (booking: BookingResponse) =>
    booking.pitchName || booking.timeSlot?.pitch?.name || 'Sân thể thao';

  const getBookingAddress = (booking: BookingResponse) =>
    formatCompactAddress(booking.timeSlot?.pitch?.address);

  const getBookingStartTime = (booking: BookingResponse) =>
    booking.startTime || booking.timeSlot?.startTime || '--:--';

  const getBookingEndTime = (booking: BookingResponse) =>
    booking.endTime || booking.timeSlot?.endTime || '--:--';

  const getBookingPitchType = (booking: BookingResponse) =>
    booking.timeSlot?.pitch?.type || 'Tiêu chuẩn';

  const getBookingAmount = (booking: BookingResponse) =>
    Number(booking.totalPrice || 0);

  const getBookingDepositAmount = (booking: BookingResponse) =>
    Number(booking.depositAmount || paymentHistoryByBooking[booking.id]?.amount || 0);

  const isBookingDepositPaid = (booking: BookingResponse) => {
    const payment = paymentHistoryByBooking[booking.id];
    const bookingStatus = String(booking.status || '').toLowerCase();
    const paymentStatus = String(payment?.status || '').toLowerCase();

    return paymentStatus === 'success'
      || bookingStatus.includes('confirm')
      || bookingStatus.includes('complete')
      || bookingStatus === '2'
      || bookingStatus === '4';
  };

  const getPaidDepositAmount = (booking: BookingResponse) =>
    isBookingDepositPaid(booking) ? Number(paymentHistoryByBooking[booking.id]?.amount || booking.depositAmount || 0) : 0;

  const getRemainingAmount = (booking: BookingResponse) =>
    isCompletedBooking(booking) ? 0 : Math.max(getBookingAmount(booking) - getPaidDepositAmount(booking), 0);
  const getExtraServices = (booking: BookingResponse) => Array.isArray(booking.services) ? booking.services : [];
  const getExtraTotal = (booking: BookingResponse) => getExtraServices(booking).reduce((sum, item) => sum + Number(item.lineTotal || item.price * item.quantity || 0), 0);

  const formatMoney = (value?: number) =>
    `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const formatBookingDate = (value?: string) => {
    if (!value) return '--/--/----';
    const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
  };

  const getPaymentStatusMeta = (booking: BookingResponse) => {
    const payment = paymentHistoryByBooking[booking.id];
    const paymentStatus = String(payment?.status || '').toLowerCase();

    if (isCompletedBooking(booking)) {
      return {
        label: 'Đã thanh toán đủ',
        className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
        dotClassName: 'bg-emerald-500',
      };
    }

    if (isBookingDepositPaid(booking)) {
      return {
        label: 'Đã thanh toán cọc',
        className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
        dotClassName: 'bg-emerald-500',
      };
    }

    if (paymentStatus === 'failed') {
      return {
        label: 'Thanh toán thất bại',
        className: 'bg-red-50 text-red-700 ring-1 ring-red-100',
        dotClassName: 'bg-red-500',
      };
    }

    if (paymentStatus === 'processing') {
      return {
        label: 'Đang xác nhận',
        className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
        dotClassName: 'bg-blue-500',
      };
    }

    return {
      label: 'Chưa thanh toán cọc',
      className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
      dotClassName: 'bg-amber-500',
    };
  };

  const getBookingStatusLabel = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === '1' || normalized.includes('pending')) return 'Chờ thanh toán';
    if (normalized === '2' || normalized.includes('confirm')) return 'Đã xác nhận';
    if (normalized === '3' || normalized.includes('cancel')) return 'Đã hủy';
    if (normalized === '4' || normalized.includes('complete')) return 'Hoàn tất';
    if (normalized === '5' || normalized.includes('noshow')) return 'Không đến';
    return 'Đang xử lý';
  };

  const getBookingStatusClass = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === '2' || normalized === '4' || normalized.includes('confirm') || normalized.includes('complete')) {
      return 'bg-emerald-500/10 text-emerald-500';
    }
    if (normalized === '1' || normalized.includes('pending')) return 'bg-amber-500/10 text-amber-500';
    if (normalized === '3' || normalized === '5' || normalized.includes('cancel') || normalized.includes('noshow')) return 'bg-red-500/10 text-red-500';
    return 'bg-slate-100 text-slate-400';
  };

  const getBookingNotifications = () =>
    bookings.slice(0, 10).map((booking) => {
      const payment = paymentHistoryByBooking[booking.id];
      const paymentStatus = String(payment?.status || '').toLowerCase();
      const bookingStatus = String(booking.status || '').toLowerCase();
      const isPaid = isBookingDepositPaid(booking);
      const isFailed = paymentStatus === 'failed';
      const isCancelled = bookingStatus.includes('cancel') || bookingStatus === '3';

      if (bookingStatus.includes('complete') || bookingStatus === '4') {
        return {
          booking,
          title: 'Đơn đặt sân đã hoàn thành',
          message: `${getBookingPitchName(booking)} đã hoàn thành. Hãy đánh giá trải nghiệm của bạn nhé!`,
          meta: getBookingStatusLabel(booking.status),
          icon: <Star size={18} />,
          className: 'bg-amber-50 text-amber-600',
        };
      }

      if (isCancelled) {
        return {
          booking,
          title: 'Đơn đặt sân đã hủy',
          message: `${getBookingPitchName(booking)} ngày ${formatBookingDate(booking.bookingDate)} đã được hủy.`,
          meta: getBookingStatusLabel(booking.status),
          icon: <X size={18} />,
          className: 'bg-red-50 text-red-600',
        };
      }

      if (isFailed) {
        return {
          booking,
          title: 'Thanh toán cọc thất bại',
          message: `${getBookingPitchName(booking)} chưa ghi nhận cọc ${formatMoney(getBookingDepositAmount(booking))}.`,
          meta: payment?.gateway || 'Cổng thanh toán',
          icon: <AlertCircle size={18} />,
          className: 'bg-red-50 text-red-600',
        };
      }

      if (isPaid) {
        return {
          booking,
          title: 'Đơn đặt sân đã xác nhận',
          message: `Đã thanh toán cọc ${formatMoney(getPaidDepositAmount(booking))} cho ${getBookingPitchName(booking)}.`,
          meta: payment?.gateway || getBookingStatusLabel(booking.status),
          icon: <CheckCircle2 size={18} />,
          className: 'bg-emerald-50 text-emerald-600',
        };
      }

      return {
        booking,
        title: 'Đơn đặt sân đang chờ cọc',
        message: `${getBookingPitchName(booking)} giữ lịch ${getBookingStartTime(booking).substring(0, 5)} - ${getBookingEndTime(booking).substring(0, 5)}, cần thanh toán cọc ${formatMoney(getBookingDepositAmount(booking))}.`,
        meta: getBookingStatusLabel(booking.status),
        icon: <CreditCard size={18} />,
        className: 'bg-amber-50 text-amber-600',
      };
    });

  const getSystemNotificationClass = (type?: string) => {
    const normalized = String(type || '').toLowerCase();
    if (normalized.includes('approved')) return 'bg-emerald-50 text-emerald-600';
    if (normalized.includes('rejected')) return 'bg-red-50 text-red-600';
    return 'bg-blue-50 text-blue-600';
  };

  const getSystemNotificationIcon = (type?: string) => {
    const normalized = String(type || '').toLowerCase();
    if (normalized.includes('approved')) return <CheckCircle2 size={18} />;
    if (normalized.includes('rejected')) return <X size={18} />;
    return <Bell size={18} />;
  };

  const persistReadNotification = (id: string) => {
    setReadNotificationIds((current) => {
      if (current.includes(id)) return current;
      return saveReadNotificationIds([...current, id]);
    });
  };

  const fetchBookingReviews = async (items: BookingResponse[]) => {
    const completedBookings = items.filter(isCompletedBooking);
    if (completedBookings.length === 0) {
      setReviewsByBooking({});
      return;
    }

    const reviewResults = await Promise.allSettled(
      completedBookings.map((booking) => api.get(`/bookings/${booking.id}/reviews`) as Promise<UserReviewItem>)
    );

    const nextReviews = reviewResults.reduce<Record<string, UserReviewItem>>((acc, result) => {
      if (result.status === 'fulfilled' && result.value?.bookingId) {
        acc[result.value.bookingId] = result.value;
      }
      return acc;
    }, {});

    setReviewsByBooking(nextReviews);
  };

  const persistReadNotifications = (ids: string[]) => {
    if (ids.length === 0) return;
    setReadNotificationIds((current) => saveReadNotificationIds([...current, ...ids]));
  };

  const markSystemNotificationAsRead = async (id: string) => {
    setSystemNotifications((current) =>
      current.map((item) => item.id === id ? { ...item, isRead: true } : item)
    );
    persistReadNotification(id);
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // Local read state keeps the UI calm even if the server has already marked it read.
    }
  };

  const bookingFilterOptions = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ thanh toán' },
    { id: 'confirmed', label: 'Đã xác nhận' },
    { id: 'completed', label: 'Hoàn tất' },
    { id: 'cancelled', label: 'Đã hủy' },
  ];

  const notificationFilterOptions = [
    { id: 'all', label: 'Tất cả' },
    { id: 'new', label: 'Mới' },
    { id: 'booking', label: 'Đơn đặt sân' },
    { id: 'system', label: 'Hệ thống' },
  ];

  const sortedBookings = [...bookings].sort((a, b) =>
    new Date(b.createdAt || b.bookingDate || 0).getTime() - new Date(a.createdAt || a.bookingDate || 0).getTime()
  );

  const filteredBookings = sortedBookings.filter((booking) => {
    const normalized = String(booking.status || '').toLowerCase();
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'pending') return normalized.includes('pending') || normalized === '1';
    if (bookingFilter === 'confirmed') return normalized.includes('confirm') || normalized === '2';
    if (bookingFilter === 'completed') return normalized.includes('complete') || normalized === '4';
    if (bookingFilter === 'cancelled') return normalized.includes('cancel') || normalized === '3';
    return true;
  });
  const pagedBookings = filteredBookings.slice((bookingPage - 1) * profilePageSize, bookingPage * profilePageSize);
  const selectedBooking = pagedBookings.find((booking) => booking.id === expandedBookingId) || pagedBookings[0] || null;

  const notificationItems = [
    ...systemNotifications.map((item) => ({
      id: item.id,
      source: 'system',
      title: item.title,
      message: item.message,
      meta: item.type,
      date: item.createdAt,
      isRead: item.isRead || readNotificationIds.includes(item.id),
      icon: getSystemNotificationIcon(item.type),
      className: getSystemNotificationClass(item.type),
      onClick: () => markSystemNotificationAsRead(item.id),
    })),
    ...getBookingNotifications().map((item) => ({
      id: item.booking.id,
      source: 'booking',
      title: item.title,
      message: item.message,
      meta: item.meta,
      date: item.booking.createdAt || item.booking.bookingDate,
      isRead: readNotificationIds.includes(item.booking.id),
      icon: item.icon,
      className: item.className,
      onClick: () => openBookingFromNotification(item.booking.id),
    })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const filteredNotificationItems = notificationItems.filter((item) => {
    if (notificationFilter === 'all') return true;
    if (notificationFilter === 'new') return !item.isRead;
    return item.source === notificationFilter;
  });
  const pagedNotificationItems = filteredNotificationItems.slice((notificationPage - 1) * profilePageSize, notificationPage * profilePageSize);

  useEffect(() => { setBookingPage(1); }, [bookingFilter]);
  useEffect(() => { setNotificationPage(1); }, [notificationFilter]);
  useEffect(() => {
    const maxPage = Math.max(Math.ceil(filteredBookings.length / profilePageSize), 1);
    if (bookingPage > maxPage) setBookingPage(maxPage);
  }, [filteredBookings.length, bookingPage]);
  useEffect(() => {
    const maxPage = Math.max(Math.ceil(filteredNotificationItems.length / profilePageSize), 1);
    if (notificationPage > maxPage) setNotificationPage(maxPage);
  }, [filteredNotificationItems.length, notificationPage]);

  useEffect(() => {
    if (String(activeTab) === 'notifications') return;
    if (activeTab !== 'notifications' || notificationItems.length === 0) return;

    const unreadIds = notificationItems
      .filter((item) => !item.isRead)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;
    persistReadNotifications(unreadIds);

    systemNotifications
      .filter((item) => unreadIds.includes(item.id) && !item.isRead)
      .forEach((item) => {
        api.patch(`/notifications/${item.id}/read`).catch(() => undefined);
      });
  }, [activeTab, notificationItems.length, systemNotifications.length]);

  const openBookingFromNotification = (bookingId: string) => {
    persistReadNotification(bookingId);
    setExpandedBookingId(bookingId);
    handleTabChange('bookings');
  };

  const isCompletedBooking = (booking: BookingResponse) => {
    const normalized = String(booking.status || '').toLowerCase();
    return normalized.includes('complete') || normalized === '4';
  };

  const isCancelledBooking = (booking: BookingResponse) => {
    const normalized = String(booking.status || '').toLowerCase();
    return normalized.includes('cancel') || normalized === '3';
  };

  const isPendingDepositBooking = (booking: BookingResponse) => {
    const normalized = String(booking.status || '').toLowerCase();
    return normalized === '1'
      || normalized.includes('pending')
      || normalized.includes('deposit')
      || normalized.includes('chờ');
  };

  const canCancelBooking = (booking: BookingResponse) => {
    const normalized = String(booking.status || '').toLowerCase();
    if (isCompletedBooking(booking) || isCancelledBooking(booking)) return false;
    return normalized.includes('pending') || normalized.includes('confirm') || normalized === '1' || normalized === '2';
  };

  const canOpenPaymentPage = (booking: BookingResponse) =>
    isPendingDepositBooking(booking) && !isCompletedBooking(booking) && !isCancelledBooking(booking);

  const handleCancelBooking = async (booking: BookingResponse) => {
    const defaultReason = 'Khách hàng thay đổi kế hoạch';
    const reason = window.prompt('Nhập lý do hủy đặt sân', defaultReason);
    if (reason === null) return;

    try {
      await bookingService.cancel(booking.id, reason.trim() || defaultReason);
      setNotification({ type: 'success', message: 'Đã gửi yêu cầu hủy đặt sân.' });
      fetchBookings(true);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể hủy đơn đặt sân.' });
    }
  };

  const openReviewForm = (bookingId: string) => {
    if (reviewsByBooking[bookingId]) {
      return;
    }

    setReviewingBookingId((current) => {
      const next = current === bookingId ? null : bookingId;
      const existingReview = reviewsByBooking[bookingId];
      setReviewRating(existingReview?.rating || 5);
      setReviewComment(existingReview?.comment || '');
      return next;
    });
  };

  const getPitchDetailUrl = (booking: BookingResponse) => {
    const pitchId = booking.timeSlot?.pitch?.id;
    const pitchName = getBookingPitchName(booking);
    return pitchId ? `/san/${pitchId}-${slugify(pitchName)}` : '/explore';
  };

  const submitReview = async (bookingId: string) => {
    setReviewSubmittingId(bookingId);
    try {
      const payload = {
        rating: reviewRating,
        comment: reviewComment.trim(),
      };

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
      setNotification({ type: 'success', message: reviewsByBooking[bookingId] ? 'Đánh giá đã được cập nhật.' : 'Cảm ơn bạn, đánh giá đã được ghi nhận.' });
      fetchBookings(true);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể gửi đánh giá cho đơn này.' });
    } finally {
      setReviewSubmittingId(null);
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: <User size={20} />, color: 'text-blue-500' },
    { id: 'bookings', label: 'Lịch sử đặt sân', icon: <ShoppingBag size={20} />, color: 'text-emerald-500' },
    { id: 'notifications', label: 'Thông báo', icon: <Bell size={20} />, color: 'text-rose-500' },
    { id: 'security', label: 'Xác thực Email', icon: <Lock size={20} />, color: 'text-indigo-500' },
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const locationString = `${selectedWard?.name || ''}, ${selectedDistrict?.name || ''}, ${selectedProvince?.name || ''}`;
      const finalAddress = locationString.trim() === ', ,' ? formData.address : locationString;

      await api.patch('/users/profile', {
        ...formData,
        address: finalAddress
      });
      
      // Update global context immediately
      updateUser({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        address: finalAddress,
        mapLink: formData.mapLink
      });

      setIsEditing(false);
      setNotification({ type: 'success', message: 'Cập nhật thành công!' });
    } catch (err: any) {
      let msg = err.message || 'Không thể cập nhật thông tin.';
      
      if (msg === 'User not found') {
        msg = 'Phiên đăng nhập đã hết hạn hoặc dữ liệu không khớp. Vui lòng ĐĂNG XUẤT và ĐĂNG NHẬP lại.';
      }

      if (err?.errors) {
        const validationErrors = Object.values(err.errors).flat().join(', ');
        setNotification({ type: 'error', message: `Lỗi: ${validationErrors}` });
      } else {
        setNotification({ type: 'error', message: msg });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16 pt-24 font-body">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-700 text-xl font-black text-white shadow-lg shadow-blue-700/20">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-700">Tài khoản SmartSport</p>
                  <h1 className="mt-1 truncate text-2xl font-black text-slate-950 sm:text-3xl">{user?.fullName || 'Người dùng'}</h1>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-500">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-xl font-black text-blue-700">{bookings.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn sân</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <p className="text-xl font-black text-rose-600">{notificationItems.filter((item) => !item.isRead).length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thông báo</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-xl font-black text-emerald-600">{user?.emailConfirmed ? 'OK' : '!'}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:flex-row">
            {/* Left Sidebar */}
            <aside className="w-full shrink-0 lg:w-64">
              <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* User Brief */}
                <div className="border-b border-slate-100 bg-slate-50 p-5 text-center">
                  <div className="relative inline-block mb-4 group">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-2xl font-black text-white shadow-xl shadow-blue-500/20">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <button type="button" aria-label="Cập nhật ảnh đại diện" className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-white text-slate-400 shadow-lg transition-all hover:text-blue-600 group-hover:scale-110 active:scale-90">
                      <Camera size={18} />
                    </button>
                  </div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">{user?.fullName}</h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {user?.role === 3 ? 'Quản trị viên' : user?.role === 2 ? 'Chủ sân' : 'Thành viên'}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Đang hoạt động</span>
                  </div>
                </div>

                {/* Nav Menu */}
                <nav className="p-2.5">
                  <div className="space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id as TabType)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${
                          activeTab === item.id 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2 transition-colors ${activeTab === item.id ? 'bg-white/15 text-white' : item.color + ' bg-slate-50 group-hover:bg-white'}`}>
                            {item.icon}
                          </div>
                          <span className="text-sm font-black tracking-tight">{item.label}</span>
                        </div>
                        <ChevronRight size={16} className={`transition-transform ${activeTab === item.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                      </button>
                    ))}
                  </div>

                  <div className="hidden">
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-sm"
                    >
                      <div className="p-2 rounded-xl bg-red-100">
                        <LogOut size={20} />
                      </div>
                      Đăng xuất
                    </button>
                  </div>
                </nav>
              </div>
            </aside>

            {/* Right Content */}
            <main className="flex-1">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                            <User size={24} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight font-heading">Thông tin cá nhân</h3>
                            <p className="text-sm font-bold text-slate-400">Quản lý các thông tin định danh của bạn</p>
                          </div>
                        </div>
                        
                        {!isEditing ? (
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                          >
                            <Edit3 size={16} /> Chỉnh sửa
                          </button>
                        ) : (
                          <button 
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                          >
                            <X size={16} /> Hủy bỏ
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleUpdateProfile} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Họ tên */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên</label>
                            <div className="relative group">
                              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                              <input 
                                type="text" 
                                value={formData.fullName}
                                readOnly={!isEditing}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                className={`w-full border rounded-xl py-3.5 pl-12 pr-5 font-bold text-sm outline-none transition-all ${
                                  isEditing 
                                  ? 'bg-white border-primary ring-4 ring-primary/5' 
                                  : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}
                                placeholder="Nhập họ tên đầy đủ"
                              />
                            </div>
                          </div>
                          
                          {/* Email (Readonly) */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email liên hệ</label>
                            <div className="relative group opacity-60">
                              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input 
                                type="email" 
                                value={formData.email}
                                disabled
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-5 font-bold text-sm cursor-not-allowed"
                              />
                            </div>
                          </div>

                          {/* Số điện thoại */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Số điện thoại</label>
                            <div className="relative group">
                              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                              <input 
                                type="tel" 
                                value={formData.phoneNumber}
                                readOnly={!isEditing}
                                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                className={`w-full border rounded-xl py-3.5 pl-12 pr-5 font-bold text-sm outline-none transition-all ${
                                  isEditing 
                                  ? 'bg-white border-primary ring-4 ring-primary/5' 
                                  : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}
                                placeholder="09xx xxx xxx"
                              />
                            </div>
                          </div>

                          {/* Tỉnh thành (Dùng Hook thực tế khi Editing) */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tỉnh / Thành phố</label>
                            <select 
                              disabled={!isEditing}
                              value={selectedProvince?.code || ''}
                              onChange={(e) => {
                                const code = Number(e.target.value);
                                const p = provinces.find(x => x.code === code);
                                if (p) setSelectedProvince(p);
                                setSelectedDistrict(null);
                                setSelectedWard(null);
                              }}
                              className={`w-full border rounded-xl py-3.5 px-5 font-bold text-sm outline-none transition-all appearance-none cursor-pointer ${
                                isEditing ? 'bg-white border-primary ring-4 ring-primary/5' : 'bg-slate-50 border-slate-100 text-slate-500'
                              }`}
                            >
                              <option value="">{user?.address || 'Chọn Tỉnh / Thành'}</option>
                              {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                            </select>
                          </div>

                          {isEditing && (
                            <>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quận / Huyện</label>
                                <select 
                                  value={selectedDistrict?.code || ''}
                                  onChange={(e) => {
                                    const code = Number(e.target.value);
                                    const d = districts.find(x => x.code === code);
                                    if (d) setSelectedDistrict(d);
                                    setSelectedWard(null);
                                  }}
                                  className="w-full bg-white border-primary border rounded-xl py-3.5 px-5 font-bold text-sm outline-none ring-4 ring-primary/5 appearance-none cursor-pointer"
                                >
                                  <option value="">Chọn Quận / Huyện</option>
                                  {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phường / Xã</label>
                                <select 
                                  value={selectedWard?.code || ''}
                                  onChange={(e) => {
                                    const code = Number(e.target.value);
                                    const w = wards.find(x => x.code === code);
                                    if (w) setSelectedWard(w);
                                  }}
                                  className="w-full bg-white border-primary border rounded-xl py-3.5 px-5 font-bold text-sm outline-none ring-4 ring-primary/5 appearance-none cursor-pointer"
                                >
                                  <option value="">Chọn Phường / Xã</option>
                                  {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                </select>
                              </div>
                            </>
                          )}

                          {/* Địa chỉ chi tiết */}
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Địa chỉ chi tiết (hoặc địa chỉ hiện tại)</label>
                            <div className="relative group">
                              <MapPin className="absolute left-5 top-5 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                              <textarea 
                                value={formData.address}
                                readOnly={!isEditing}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                rows={2}
                                className={`w-full border rounded-xl py-3.5 pl-12 pr-5 font-bold text-sm outline-none transition-all resize-none ${
                                  isEditing ? 'bg-white border-primary ring-4 ring-primary/5' : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}
                                placeholder="Số nhà, tên đường..."
                              />
                            </div>
                          </div>

                          {/* Link Google Map */}
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link Google Map (Tọa độ cụ thể)</label>
                            <div className="relative group">
                              <ExternalLink className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                              <input 
                                type="url" 
                                value={formData.mapLink}
                                readOnly={!isEditing}
                                onChange={(e) => setFormData({...formData, mapLink: e.target.value})}
                                className={`w-full border rounded-xl py-3.5 pl-12 pr-5 font-bold text-sm outline-none transition-all ${
                                  isEditing ? 'bg-white border-primary ring-4 ring-primary/5' : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}
                                placeholder="https://www.google.com/maps/place/..."
                              />
                            </div>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="pt-8 flex justify-end border-t border-slate-50">
                            <button 
                              type="submit"
                              disabled={isSaving}
                              className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
                            >
                              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                              Lưu thay đổi
                            </button>
                          </div>
                        )}
                      </form>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-700 p-6 text-white shadow-lg shadow-blue-600/15">
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <ShieldCheck size={20} />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Hệ sinh thái thông minh</span>
                        </div>
                        <h4 className="text-2xl font-black mb-4">Kết nối đam mê thể thao!</h4>
                        <p className="text-sm font-bold text-white/60 max-w-lg mb-8">Trải nghiệm đặt sân nhanh nhất Việt Nam với hệ thống SmartSport.</p>
                        <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-blue-600 transition-all"> Khám phá ngay </button>
                      </div>
                      <ShieldCheck size={200} className="absolute -bottom-10 -right-10 text-white/5" />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'bookings' && (
                  <motion.div
                    key="bookings-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Lịch đặt sân</p>
                        <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950 font-heading">Lịch sử đặt sân</h3>
                        <p className="mt-2 text-sm font-bold text-slate-500">Theo dõi đơn sân, thanh toán cọc, đánh giá và trạng thái xử lý.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                      {bookingFilterOptions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBookingFilter(item.id)}
                          className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition ${
                            bookingFilter === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {isLoadingBookings ? (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
                        <Loader2 className="animate-spin text-primary mb-4" size={40} />
                        <p className="text-slate-400 font-bold">Đang tải lịch sử đặt sân...</p>
                      </div>
                    ) : filteredBookings.length > 0 ? (
                      <div className="grid gap-5 xl:grid-cols-[minmax(310px,.78fr)_minmax(0,1.22fr)]">
                        <div className="space-y-3">
                      {pagedBookings.map((item) => {
                        const payment = paymentHistoryByBooking[item.id];
                        const paymentMeta = getPaymentStatusMeta(item);
                        const isExpanded = expandedBookingId === item.id;
                        const isReviewing = reviewingBookingId === item.id;
                        const existingReview = reviewsByBooking[item.id];

                        return (
                          <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
                            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_180px_180px_120px] lg:items-center">
                              <div className="min-w-0">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getBookingStatusClass(item.status)}`}>
                                    {getBookingStatusLabel(item.status)}
                                  </span>
                                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${paymentMeta.className}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${paymentMeta.dotClassName}`} />
                                    {paymentMeta.label}
                                  </span>
                                  {getExtraServices(item).length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 ring-1 ring-amber-100">
                                      <ShoppingBag size={12} />
                                      Có hóa đơn phát sinh
                                    </span>
                                  )}
                                </div>
                                <h4 className="truncate text-base font-black text-slate-950">{getBookingPitchName(item)}</h4>
                                <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-bold text-slate-500">
                                  <MapPin size={13} className="shrink-0 text-slate-400" />
                                  {getBookingAddress(item)}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm lg:block lg:space-y-1">
                                <p className="flex items-center gap-2 text-xs font-black text-slate-500">
                                  <CalendarDays size={14} className="text-blue-600" />
                                  {formatBookingDate(item.bookingDate)}
                                </p>
                                <p className="flex items-center gap-2 text-xs font-black text-slate-700">
                                  <Clock size={14} className="text-blue-600" />
                                  {getBookingStartTime(item).substring(0, 5)} - {getBookingEndTime(item).substring(0, 5)}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-3 lg:block lg:space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tiền cọc</p>
                                <p className="text-sm font-black text-slate-950">{formatMoney(getBookingDepositAmount(item))}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:ml-auto lg:w-32 lg:grid-cols-1">
                                <button
                                  type="button"
                                  onClick={() => setExpandedBookingId(isExpanded ? null : item.id)}
                                  className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                                >
                                  <Eye size={16} />
                                  {isExpanded ? 'Ẩn bớt' : 'Chi tiết'}
                                </button>
                                {canOpenPaymentPage(item) && (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/booking-review/${item.id}?pay=1`)}
                                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-center text-xs font-bold leading-tight text-emerald-700 transition hover:bg-emerald-100"
                                  >
                                    <CreditCard size={16} />
                                    Thanh toán cọc
                                  </button>
                                )}
                                {canCancelBooking(item) && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelBooking(item)}
                                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-red-50 px-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                                  >
                                    <X size={16} />
                                    Hủy đơn
                                  </button>
                                )}
                                {isCompletedBooking(item) && !existingReview && (
                                  <button
                                    type="button"
                                    onClick={() => openReviewForm(item.id)}
                                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-2.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                                  >
                                    <Star size={16} />
                                    Đánh giá
                                  </button>
                                )}
                              </div>
                            </div>

                            {existingReview && !isReviewing && (
                              <div className="border-t border-amber-100 bg-amber-50/40 px-5 py-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div className="min-w-0">
                                    <div className="mb-2 flex items-center gap-2">
                                      {Array.from({ length: 5 }).map((_, index) => (
                                        <Star key={index} size={14} className={index < existingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                                      ))}
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Đã đánh giá ngày {formatBookingDate(existingReview.createdAt)}
                                      </span>
                                    </div>
                                    <p className="truncate text-sm font-bold text-slate-700">{existingReview.comment || 'Không có nhận xét kèm theo.'}</p>
                                  </div>
                                  <a
                                    href={getPitchDetailUrl(item)}
                                    className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-600 hover:text-white"
                                  >
                                    Xem trên chi tiết sân
                                  </a>
                                </div>
                              </div>
                            )}

                            <AnimatePresence initial={false}>
                              {isReviewing && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18, ease: 'easeOut' }}
                                  className="overflow-hidden border-t border-amber-100 bg-amber-50/50"
                                >
                                  <div className="grid gap-4 p-5 lg:grid-cols-[220px_minmax(0,1fr)_120px] lg:items-end">
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Đánh giá sân</p>
                                      <div className="mt-3 flex gap-1">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                          <button
                                            key={rating}
                                            type="button"
                                            onClick={() => setReviewRating(rating)}
                                            className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                                              rating <= reviewRating ? 'bg-amber-400 text-white' : 'bg-white text-slate-300 ring-1 ring-slate-200'
                                            }`}
                                          >
                                            <Star size={18} className={rating <= reviewRating ? 'fill-current' : ''} />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <label>
                                      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Nhận xét ngắn</span>
                                      <input
                                        value={reviewComment}
                                        onChange={(event) => setReviewComment(event.target.value)}
                                        placeholder="Sân sạch, đúng giờ, phục vụ tốt..."
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => submitReview(item.id)}
                                      disabled={reviewSubmittingId === item.id}
                                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {reviewSubmittingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                                      Gửi
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18, ease: 'easeOut' }}
                                  className="overflow-hidden border-t border-slate-100 bg-slate-50/70"
                                >
                                  <div className="grid gap-4 p-5 md:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <ReceiptText size={14} className="text-blue-600" />
                                        Đơn đặt
                                      </div>
                                      <dl className="space-y-2 text-xs font-bold">
                                        <div className="flex justify-between gap-4">
                                          <dt className="text-slate-400">Loại sân</dt>
                                          <dd className="text-right text-slate-800">{getBookingPitchType(item)}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <dt className="text-slate-400">Trạng thái</dt>
                                          <dd className="text-right text-slate-800">{getBookingStatusLabel(item.status)}</dd>
                                        </div>
                                      </dl>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <Banknote size={14} className="text-emerald-600" />
                                        Thanh toán
                                      </div>
                                      <dl className="space-y-2 text-xs font-bold">
                                        <div className="flex justify-between gap-4">
                                          <dt className="text-slate-400">Tổng tiền</dt>
                                          <dd className="text-right text-slate-800">{formatMoney(getBookingAmount(item))}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <dt className="text-slate-400">Hóa đơn phát sinh</dt>
                                          <dd className="text-right text-amber-700">{getExtraServices(item).length ? formatMoney(getExtraTotal(item)) : 'Chưa có'}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <dt className="text-slate-400">Cọc cần thanh toán</dt>
                                          <dd className="text-right text-emerald-700">{formatMoney(getBookingDepositAmount(item))}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <dt className="text-slate-400">Đã thanh toán</dt>
                                          <dd className="text-right text-slate-800">{formatMoney(getPaidDepositAmount(item))}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <dt className="text-slate-400">Còn lại</dt>
                                          <dd className="text-right text-slate-800">{formatMoney(getRemainingAmount(item))}</dd>
                                        </div>
                                      </dl>
                                      {getExtraServices(item).length > 0 && (
                                        <div className="mt-4 rounded-xl bg-amber-50 p-3">
                                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-700">Dịch vụ mua thêm tại sân</p>
                                          <div className="space-y-2">
                                            {getExtraServices(item).map((service) => (
                                              <div key={service.id} className="flex justify-between gap-3 text-xs font-bold text-slate-700">
                                                <span className="truncate">{service.serviceName} x{service.quantity}</span>
                                                <span className="shrink-0 font-black">{formatMoney(service.lineTotal)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <CreditCard size={14} className="text-blue-600" />
                                        Giao dịch
                                      </div>
                                      <dl className="space-y-2 text-xs font-bold">
                                        <div className="flex justify-between gap-4">
                                          <dt className="text-slate-400">Cổng</dt>
                                          <dd className="text-right text-slate-800">{payment?.gateway || 'Chưa có'}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <dt className="text-slate-400">Trạng thái</dt>
                                          <dd className="text-right text-slate-800">{payment?.status || paymentMeta.label}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <dt className="text-slate-400">Mã GD</dt>
                                          <dd className="max-w-37.5 truncate text-right text-slate-800">{payment?.providerTxnId || payment?.transactionId || 'Chưa có'}</dd>
                                        </div>
                                      </dl>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                        </div>
                        {selectedBooking && (
                          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Chi tiết đơn đặt sân</p>
                                <h4 className="mt-2 text-xl font-black text-slate-950">{getBookingPitchName(selectedBooking)}</h4>
                                <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500"><MapPin size={14} className="text-blue-600" />{getBookingAddress(selectedBooking)}</p>
                              </div>
                              <span className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${getBookingStatusClass(selectedBooking.status)}`}>{getBookingStatusLabel(selectedBooking.status)}</span>
                            </div>
                            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                              <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày đặt</dt><dd className="mt-1 font-black text-slate-800">{formatBookingDate(selectedBooking.bookingDate)}</dd></div>
                              <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khung giờ</dt><dd className="mt-1 font-black text-slate-800">{getBookingStartTime(selectedBooking).substring(0, 5)} - {getBookingEndTime(selectedBooking).substring(0, 5)}</dd></div>
                              <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loại sân</dt><dd className="mt-1 font-black text-slate-800">{getBookingPitchType(selectedBooking)}</dd></div>
                              <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mã đơn</dt><dd className="mt-1 font-black text-slate-800">{selectedBooking.checkInCode || selectedBooking.id.substring(0, 8).toUpperCase()}</dd></div>
                            </dl>
                            <div className="mt-5 rounded-xl bg-blue-50 p-4">
                              <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-600">Tổng tiền</span><strong className="text-lg font-black text-blue-700">{formatMoney(getBookingAmount(selectedBooking))}</strong></div>
                              <div className="mt-3 flex items-center justify-between border-t border-blue-100 pt-3"><span className="text-xs font-bold text-slate-600">Tiền cọc</span><strong className="text-sm font-black text-slate-900">{formatMoney(getBookingDepositAmount(selectedBooking))}</strong></div>
                            </div>
                            <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setExpandedBookingId(selectedBooking.id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white text-xs font-black text-blue-700 transition hover:bg-blue-50"><Eye size={15} />Xem chi tiết</button>{canOpenPaymentPage(selectedBooking) && <button type="button" onClick={() => navigate(`/booking-review/${selectedBooking.id}?pay=1`)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 text-xs font-black text-white transition hover:bg-blue-800"><CreditCard size={15} />Thanh toán cọc</button>}</div>
                          </aside>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 shadow-sm">
                        <ShoppingBag size={64} className="text-slate-200 mb-6" />
                        <h4 className="text-xl font-black text-slate-900 mb-2">Chưa có đơn đặt sân nào</h4>
                        <p className="text-slate-400 font-bold mb-8 text-center max-w-xs">Bắt đầu khám phá và đặt sân bóng yêu thích của bạn ngay hôm nay!</p>
                        <button className="rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white transition-all hover:bg-blue-700">Khám phá sân ngay</button>
                      </div>
                    )}
                    {filteredBookings.length > 0 && (
                      <Pagination
                        page={bookingPage}
                        totalItems={filteredBookings.length}
                        pageSize={profilePageSize}
                        onPageChange={setBookingPage}
                        label="đơn đặt sân"
                      />
                    )}
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-blue-700">Trung tâm thông báo</p>
                        <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950 font-heading">Thông báo</h3>
                        <p className="mt-2 text-sm font-bold text-slate-500">Cập nhật trạng thái đặt sân, thanh toán cọc và các thay đổi quan trọng.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                      {notificationFilterOptions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setNotificationFilter(item.id)}
                          className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition ${
                            notificationFilter === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {isLoadingBookings ? (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
                        <Loader2 className="animate-spin text-primary mb-4" size={40} />
                        <p className="text-slate-400 font-bold">Đang tải thông báo...</p>
                      </div>
                    ) : filteredNotificationItems.length > 0 ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="divide-y divide-slate-100">
                          {pagedNotificationItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={item.onClick}
                              className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-blue-50/50"
                            >
                              <div className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.className}`}>
                                {item.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-black text-slate-950">{item.title}</h4>
                                    {!item.isRead && (
                                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                                        New
                                      </span>
                                    )}
                                  </div>
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{formatBookingDate(item.date)}</span>
                                </div>
                                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{item.message}</p>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {item.meta}
                                  </span>
                                </div>
                              </div>
                              {item.source === 'booking' && <ChevronRight size={16} className="mt-3 shrink-0 text-slate-300" />}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 p-4">
                          <Pagination
                            page={notificationPage}
                            totalItems={filteredNotificationItems.length}
                            pageSize={profilePageSize}
                            onPageChange={setNotificationPage}
                            label="thông báo"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-24 shadow-sm">
                        <div className="relative mb-8">
                          <div className="w-24 h-24 rounded-4xl bg-slate-50 flex items-center justify-center text-slate-200">
                            <Bell size={48} />
                          </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-2">Chưa có thông báo nào</h4>
                        <p className="text-slate-400 font-bold mb-8 text-center max-w-xs">Các cập nhật về đơn đặt sân sẽ xuất hiện tại đây.</p>
                        <button
                          onClick={() => handleTabChange('bookings')}
                          className="bg-slate-50 text-slate-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all"
                        >
                          Kiểm tra đặt sân
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    key="security-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                      <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight font-heading">Xác thực tài khoản</h3>
                          <p className="text-sm font-bold text-slate-400">Đảm bảo an toàn tuyệt đối cho tài khoản của bạn</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-5 rounded-2xl border border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${user?.emailConfirmed ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>
                            {user?.emailConfirmed ? <MailCheck size={32} /> : <AlertCircle size={32} />}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 mb-1">Xác thực địa chỉ Email</h4>
                            <p className="text-xs font-bold text-slate-400">Trạng thái: <span className={user?.emailConfirmed ? 'text-emerald-500' : 'text-amber-500'}>{user?.emailConfirmed ? 'Đã xác minh' : 'Chưa xác minh'}</span></p>
                          </div>
                        </div>
                        {!user?.emailConfirmed && (
                          <button className="rounded-xl bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700">Gửi mã xác thực</button>
                        )}
                      </div>

                      <div className="mt-8 space-y-4">
                         <div className="flex items-start gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                            <ShieldCheck className="text-blue-500 shrink-0" size={20} />
                            <div>
                               <p className="text-sm font-black text-slate-900 mb-1">Tại sao cần xác thực email?</p>
                               <p className="text-xs font-bold text-slate-500 leading-relaxed">Xác thực email giúp bạn bảo mật tài khoản, nhận thông báo đặt sân nhanh nhất và khôi phục mật khẩu khi cần thiết.</p>
                            </div>
                         </div>
                      </div>
                    </div>

                    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-blue-100 bg-blue-700 p-6 text-white shadow-lg shadow-blue-600/15">
                       <div className="relative z-10">
                          <h4 className="text-xl font-black mb-2">Đổi mật khẩu</h4>
                          <p className="text-sm font-bold text-white/40 mb-6">Bạn nên thay đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
                          <button className="flex items-center gap-2 text-sm font-black text-white transition-colors hover:text-cyan-200">
                             Thiết lập ngay <ExternalLink size={16} />
                          </button>
                       </div>
                       <Lock size={150} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>

        </div>
      </div>

      {/* Premium Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-200 min-w-[320px]"
          >
            <div className={`p-1 rounded-4xl shadow-2xl backdrop-blur-xl ${
              notification.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-emerald-500/10' 
                : 'bg-red-500/10 border border-red-500/20 shadow-red-500/10'
            }`}>
              <div className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-[#1a1c26] rounded-[1.8rem]">
                {notification.type === 'success' ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                    <AlertCircle size={20} />
                  </div>
                )}
                <div className="flex-1 pr-4">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${
                    notification.type === 'success' ? 'text-emerald-500' : 'text-red-400'
                  }`}>
                    {notification.type === 'success' ? 'Thành công' : 'Thất bại'}
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-white/80 mt-0.5 leading-tight">
                    {notification.message}
                  </p>
                </div>
                <button 
                  onClick={() => setNotification(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-all flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;

