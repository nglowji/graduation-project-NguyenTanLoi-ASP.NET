import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellRing,
  UserRound,
  Briefcase,
  Calendar,
  ChevronLeft,
  DollarSign,
  Flag,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  Settings,
  Star,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import smartSportLogo from '../assets/logo-smartsport.svg';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}
const ownerNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/owner' },
  { icon: MapPin, label: 'Quản lý sân', path: '/dashboard/owner/pitches' },
  { icon: Calendar, label: 'Đơn đặt sân', path: '/dashboard/owner/bookings' },
  { icon: Briefcase, label: 'Dịch vụ bổ sung', path: '/dashboard/owner/services' },
  { icon: TrendingUp, label: 'Báo cáo doanh thu', path: '/dashboard/owner/revenue' },
  { icon: Star, label: 'Phản hồi khách hàng', path: '/dashboard/owner/reviews' },
  { icon: Users, label: 'Nhân sự', path: '/dashboard/owner/staff' },
];

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/admin' },
  { icon: Users, label: 'Quản lý người dùng', path: '/dashboard/admin/users' },
  { icon: ShieldCheck, label: 'Quản lý chủ sân', path: '/dashboard/admin/approvals' },
  { icon: Flag, label: 'Kiểm duyệt nội dung', path: '/dashboard/admin/moderation' },
  { icon: DollarSign, label: 'Doanh thu nền tảng', path: '/dashboard/admin/revenue' },
  { icon: Settings, label: 'Cấu hình hệ thống', path: '/dashboard/admin/system' },
];
interface DashboardLayoutProps {
  children?: React.ReactNode;
  role?: 'admin' | 'owner';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role = 'owner' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const contentRef = useRef<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bookingNotifications, setBookingNotifications] = useState<any[]>([]);

  const isStaff = auth.user?.role === 4;
  const isAdmin = role === 'admin';
  const staffNavItems = ownerNavItems.filter((item) =>
    ['/dashboard/owner', '/dashboard/owner/bookings', '/dashboard/owner/reviews'].includes(item.path)
  );
  const navItems = isAdmin ? adminNavItems : isStaff ? staffNavItems : ownerNavItems;
  const currentPage = navItems.find((item) => item.path === location.pathname) || navItems[0];
  const mobileQuickItems = useMemo(() => {
    const activeItem = navItems.find((item) => item.path === location.pathname);
    const baseItems = navItems.slice(0, 4);

    if (activeItem && !baseItems.some((item) => item.path === activeItem.path)) {
      return [...baseItems.slice(0, 3), activeItem];
    }

    return baseItems;
  }, [navItems, location.pathname]);
  const accentColor = isAdmin ? 'text-indigo-600' : 'text-blue-600';
  const accentBg = isAdmin ? 'bg-indigo-50' : 'bg-blue-50';

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isAdmin) return;

    let mounted = true;
    const fetchBookingNotifications = async () => {
      try {
        const res = await api.get('/bookings/owner', { params: { pageSize: 8 } }) as any;
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        if (mounted) setBookingNotifications(items);
      } catch {
        if (mounted) setBookingNotifications([]);
      }
    };

    fetchBookingNotifications();
    const timer = window.setInterval(fetchBookingNotifications, 180000);
    window.addEventListener('focus', fetchBookingNotifications);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', fetchBookingNotifications);
    };
  }, [isAdmin]);

  const notificationItems = useMemo(() => {
    return bookingNotifications.slice(0, 8);
  }, [bookingNotifications]);

  const notificationSummary = useMemo(() => {
    const pending = notificationItems.filter((item) => String(item.status || '').toLowerCase().includes('pending')).length;
    const confirmed = notificationItems.filter((item) => String(item.status || '').toLowerCase().includes('confirm')).length;
    const completed = notificationItems.filter((item) => String(item.status || '').toLowerCase().includes('complete')).length;
    const cancelled = notificationItems.filter((item) => String(item.status || '').toLowerCase().includes('cancel')).length;
    return { pending, confirmed, completed, cancelled, total: notificationItems.length };
  }, [notificationItems]);

  const notificationStatusLabel = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('pending')) return 'Chờ cọc';
    if (normalized.includes('confirm')) return 'Đã xác nhận';
    if (normalized.includes('complete')) return 'Hoàn thành';
    if (normalized.includes('cancel')) return 'Đã hủy';
    return 'Đơn đặt sân';
  };

  const notificationStatusClass = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('pending')) return 'bg-amber-50 text-amber-700 ring-amber-100';
    if (normalized.includes('confirm')) return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    return 'bg-blue-50 text-blue-700 ring-blue-100';
  };

  const formatTime = (value?: string) => String(value || '--:--').substring(0, 5);
  const formatMoney = (value?: number) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
  const formatDateLabel = (value?: string) => {
    if (!value) return '--/--/----';
    if (value.toLowerCase().includes('invalid')) return '--/--/----';
    if (value.includes('/')) return value;
    const normalized = value.includes('T') ? value : `${value}T00:00:00`;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('vi-VN');
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
        />
      )}

      <aside
        className={`${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-[292px] flex-col border-r border-slate-800 bg-slate-900 text-white transition-all duration-300 lg:relative lg:h-full lg:max-w-none lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center overflow-hidden border-b border-slate-800 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 p-2 shadow-lg shadow-blue-950/20 ring-1 ring-white/10">
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-white">
                <img src={smartSportLogo} alt="SmartSport" className="h-6 w-6 object-contain" />
              </div>
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-lg font-black tracking-tight text-white">SmartSport</p>
                <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300/80">
                  {isAdmin ? 'Admin' : isStaff ? 'Staff' : 'Owner'}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <div className="space-y-1">
            {!collapsed && <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Vận hành</p>}

            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`group relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-blue-500" />}

                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.6 : 2.1}
                    className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}
                  />

                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 space-y-1">
            {!collapsed && <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Điều hướng</p>}

            <Link
              to="/"
              onClick={closeMobileMenu}
              className="group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold text-slate-400 transition hover:bg-slate-800/70 hover:text-white"
            >
              <Home size={18} className="text-slate-500 group-hover:text-slate-300" />
              {!collapsed && <span>Về trang chủ</span>}
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-bold text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} className="text-slate-500 group-hover:text-red-300" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className="relative flex h-full min-w-0 flex-1 flex-col">
        <header className="relative z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) setMobileMenuOpen(true);
                else setCollapsed(!collapsed);
              }}
              className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              aria-label="Mở hoặc thu gọn menu"
            >
              <span className="lg:hidden"><Menu size={21} /></span>
              <span className="hidden lg:inline-flex">{collapsed ? <Menu size={21} /> : <ChevronLeft size={21} />}</span>
            </button>

            <div className="hidden min-w-0 md:block">
              <h2 className="truncate text-lg font-black tracking-tight text-slate-950">{currentPage.label}</h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {isAdmin ? 'Quản trị hệ thống' : isStaff ? 'Theo dõi công việc được phân quyền' : 'Theo dõi vận hành trung tâm'}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowNotifications((value) => !value)}
              className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              title="Thông báo đơn đặt sân"
              aria-label="Thông báo đơn đặt sân"
            >
              <BellRing size={20} />
              {notificationItems.length > 0 && (
                <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white">
                  {notificationItems.length > 9 ? '9+' : notificationItems.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="fixed left-3 right-3 top-18 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 sm:absolute sm:left-auto sm:right-24 sm:top-14 sm:w-120"
                >
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-black text-slate-950">Thông báo vận hành</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      {notificationSummary.total} thông báo gần đây
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto p-2">
                    {notificationItems.length === 0 ? (
                      <div className="rounded-lg bg-slate-50 px-4 py-8 text-center">
                        <Calendar className="mx-auto text-slate-300" size={34} />
                        <p className="mt-3 text-sm font-bold text-slate-700">Chưa có đơn cần xử lý</p>
                      </div>
                    ) : (
                      notificationItems.map((booking) => {
                        const pitchName = booking.pitchName || booking.timeSlot?.pitch?.name || 'Sân thể thao';
                        const customerName = booking.customerName || booking.user?.fullName || 'Khách hàng';
                        const customerPhone = booking.customerPhone || booking.user?.phoneNumber || 'Chưa có SĐT';
                        const date = formatDateLabel(booking.bookingDate);
                        const startTime = formatTime(booking.startTime || booking.timeSlot?.startTime);
                        const endTime = formatTime(booking.endTime || booking.timeSlot?.endTime);
                        const totalAmount = Number(booking.totalAmount ?? booking.totalPrice ?? 0);

                        return (
                          <Link
                            key={booking.id}
                            to="/dashboard/owner/bookings"
                            onClick={() => setShowNotifications(false)}
                            className="mb-2 block rounded-lg border border-slate-100 bg-white p-3 transition hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{pitchName}</p>
                                <p className="mt-1 truncate text-xs font-semibold text-slate-500">{customerName} · {customerPhone}</p>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  {date} · {startTime} - {endTime}
                                </p>
                              </div>

                              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${notificationStatusClass(booking.status)}`}>
                                {notificationStatusLabel(booking.status)}
                              </span>
                            </div>

                            <div className="mt-2 text-right text-xs font-bold text-slate-900">{formatMoney(totalAmount)}đ</div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              aria-label="Tài khoản"
              title={auth.user?.fullName || auth.user?.email || 'Tài khoản'}
            >
              <UserRound size={20} />
            </button>
          </div>
        </header>

        <main ref={contentRef} className="custom-scrollbar relative flex-1 overflow-y-auto bg-slate-100 px-3 pb-3 pt-5 sm:px-5 lg:px-6">
          <div className="mx-auto min-h-full max-w-400 py-2 pb-24 sm:pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {children ?? <Outlet />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          {mobileQuickItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-black transition ${
                  isActive
                    ? `${accentBg} ${accentColor}`
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.7 : 2.2} />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
