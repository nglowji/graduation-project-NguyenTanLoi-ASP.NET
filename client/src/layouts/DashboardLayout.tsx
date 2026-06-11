import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
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
  Moon,
  Search,
  ShieldCheck,
  Star,
  Sun,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import smartSportLogo from '../assets/logo-smartsport.svg';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const ownerNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/owner' },
  { icon: MapPin, label: 'Sân của tôi', path: '/dashboard/owner/pitches' },
  { icon: Calendar, label: 'Lịch đặt sân', path: '/dashboard/owner/bookings' },
  { icon: Briefcase, label: 'Dịch vụ', path: '/dashboard/owner/services' },
  { icon: TrendingUp, label: 'Doanh thu', path: '/dashboard/owner/revenue' },
  { icon: Star, label: 'Đánh giá', path: '/dashboard/owner/reviews' },
  { icon: Users, label: 'Quản lý nhân viên', path: '/dashboard/owner/staff' },
];

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/admin' },
  { icon: Users, label: 'Quản lý người dùng', path: '/dashboard/admin/users' },
  { icon: ShieldCheck, label: 'Quản lý chủ sân', path: '/dashboard/admin/approvals' },
  { icon: Flag, label: 'Kiểm duyệt nội dung', path: '/dashboard/admin/moderation' },
  { icon: DollarSign, label: 'Doanh thu nền tảng', path: '/dashboard/admin/revenue' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: 'admin' | 'owner';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role = 'owner' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
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
  const accentBorder = isAdmin ? 'border-indigo-100' : 'border-blue-100';

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
    const timer = window.setInterval(fetchBookingNotifications, 60000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [isAdmin, location.pathname]);

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
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-900 antialiased transition-colors duration-300 dark:bg-[#0F172A] dark:text-slate-100">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
        />
      )}

      <aside className={`${collapsed ? 'lg:w-22' : 'lg:w-68'} fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-[320px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:relative lg:h-full lg:max-w-none lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 shrink-0 items-center overflow-hidden border-b border-slate-200 px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm"><img src={smartSportLogo} alt="SmartSport" className="h-full w-full object-contain" /></div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col truncate">
                <span className="text-lg font-extrabold leading-tight tracking-tight text-slate-950">SmartSport</span>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                  {isAdmin ? 'System Master' : isStaff ? 'Staff Console' : 'Partner Central'}
                </span>
              </motion.div>
            )}
          </div>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 lg:hidden"
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto overflow-x-hidden px-3 py-5">
          <div className="space-y-1">
            {!collapsed && <p className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vận hành</p>}
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`group relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'border-blue-100 bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  {isActive && <motion.span layoutId="sidebar-active-line" className="absolute -left-3 h-7 w-1 rounded-r-full bg-blue-600" />}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${isActive ? 'bg-white text-blue-700 shadow-sm' : 'bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-blue-700'}`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 truncate">{item.label}</motion.span>}
                  {isActive && !collapsed && <motion.div layoutId="active-indicator" className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            {!collapsed && <p className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hệ thống</p>}
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-950"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              {!collapsed && <span>{theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}</span>}
            </button>
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-950"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Home size={18} />
              </div>
              {!collapsed && <span>Về trang chủ</span>}
            </Link>
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200 p-3">
          {!collapsed && <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-sm font-black text-white">{(auth.user?.fullName?.[0] || (isAdmin ? 'A' : 'O')).toUpperCase()}</span>
            <div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{auth.user?.fullName || (isAdmin ? 'Administrator' : 'Chủ sân')}</p><p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{isAdmin ? 'Quản trị hệ thống' : isStaff ? 'Nhân viên sân' : 'Đối tác SmartSport'}</p></div>
          </div>}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3.5 text-sm font-bold text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <LogOut size={18} />
            </div>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className="relative flex h-full min-w-0 flex-1 flex-col">
        <header className="relative z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800/50 dark:bg-[#1E293B] sm:h-20 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) setMobileMenuOpen(true);
                else setCollapsed(!collapsed);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <span className="lg:hidden"><Menu size={20} /></span>
              <span className="hidden lg:inline-flex">{collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}</span>
            </button>

            <div className="group hidden min-w-60 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 transition-all focus-within:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50 dark:focus-within:border-slate-600 md:flex">
              <Search size={18} className="text-slate-400 transition-colors group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300" />
              <input type="text" placeholder="Tìm kiếm..." className="w-full border-none bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white" />
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <div className="hidden">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((value) => !value)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  title="Thông báo đơn đặt sân"
                >
                  <Bell size={20} />
                  {notificationItems.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-black text-white dark:border-[#1E293B]">
                      {notificationItems.length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.2 }} className="fixed left-3 right-3 top-20 z-50 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-900 sm:absolute sm:left-auto sm:-right-6 sm:top-12 sm:w-144 lg:w-160">
                    <div className="border-b border-blue-100 bg-blue-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-base font-black text-slate-950 dark:text-white">Thông báo vận hành</p>
                          <p className="mt-1 text-xs font-bold text-slate-500">Theo dõi đơn mới và trạng thái cần xử lý.</p>
                        </div>
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                          <Bell size={20} />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[9px] font-black uppercase tracking-wider">
                        <span className="rounded-lg bg-white px-2 py-2 text-amber-700 shadow-sm">Chờ cọc<br/><b className="text-base">{notificationSummary.pending}</b></span>
                        <span className="rounded-lg bg-white px-2 py-2 text-emerald-700 shadow-sm">Xác nhận<br/><b className="text-base">{notificationSummary.confirmed}</b></span>
                        <span className="rounded-lg bg-white px-2 py-2 text-blue-700 shadow-sm">Hoàn thành<br/><b className="text-base">{notificationSummary.completed}</b></span>
                        <span className="rounded-lg bg-white px-2 py-2 text-rose-700 shadow-sm">Đã hủy<br/><b className="text-base">{notificationSummary.cancelled}</b></span>
                      </div>
                    </div>
                    <div className="max-h-128 overflow-y-auto bg-slate-50/70 p-3 dark:bg-slate-950/40">
                      {notificationItems.length === 0 ? (
                        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
                          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <Calendar size={20} />
                          </div>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-200">Chưa có đơn cần chú ý</p>
                          <p className="mt-1 text-xs font-bold text-slate-400">Khi có đơn mới, danh sách sẽ hiện ở đây.</p>
                        </div>
                      ) : notificationItems.map((booking) => {
                        const pitchName = booking.pitchName || booking.timeSlot?.pitch?.name || 'Sân thể thao';
                        const customerName = booking.customerName || booking.user?.fullName || 'Khách hàng';
                        const customerPhone = booking.customerPhone || booking.user?.phoneNumber || 'Chưa có SĐT';
                        const date = formatDateLabel(booking.bookingDate);
                        const startTime = formatTime(booking.startTime || booking.timeSlot?.startTime);
                        const endTime = formatTime(booking.endTime || booking.timeSlot?.endTime);
                        const totalAmount = Number(booking.totalAmount ?? booking.totalPrice ?? 0);
                        const extraServices = Array.isArray(booking.services) ? booking.services : [];
                        const extraTotal = extraServices.reduce(
                          (sum: number, service: any) => sum + Number(service.lineTotal || service.price * service.quantity || 0),
                          0
                        );

                        return (
                          <Link
                            key={booking.id}
                            to="/dashboard/owner/bookings"
                            onClick={() => setShowNotifications(false)}
                            className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex min-w-0 gap-3">
                                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                                  <Calendar size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-slate-900 dark:text-white">{pitchName}</p>
                                  <p className="mt-1 text-xs font-bold text-slate-500">{customerName} · {customerPhone}</p>
                                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {date} · {startTime} - {endTime}
                                  </p>
                                </div>
                              </div>
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ${notificationStatusClass(booking.status)}`}>
                                {notificationStatusLabel(booking.status)}
                              </span>
                            </div>
                            {extraServices.length > 0 && (
                              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                                <p className="truncate text-[10px] font-black uppercase tracking-widest text-amber-700">
                                  Phát sinh dịch vụ: {extraServices.map((service: any) => `${service.serviceName} x${service.quantity}`).join(', ')}
                                </p>
                              </div>
                            )}
                            <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span>{extraServices.length > 0 ? `Tổng tiền, phát sinh ${formatMoney(extraTotal)}đ` : 'Tổng tiền'}</span>
                              <span className="text-slate-900 dark:text-white">{formatMoney(totalAmount)}đ</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mx-1 hidden h-10 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

            <div className="flex min-w-0 items-center gap-3 pl-0 sm:gap-4 sm:pl-2">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-extrabold leading-none text-slate-900 dark:text-white">
                  {auth.user?.fullName || (isAdmin ? 'Administrator' : 'Pitch Owner')}
                </span>
                <span className={`mt-1.5 text-[10px] font-black uppercase tracking-wider ${isAdmin ? 'text-indigo-600' : 'text-blue-600'}`}>
                  {isAdmin ? 'Super Admin' : isStaff ? 'Pitch Staff' : 'Premium Partner'}
                </span>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border ${accentBg} ${accentBorder} shadow-sm`}>
                {auth.user?.avatar ? (
                  <img src={auth.user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className={`text-lg font-black ${accentColor}`}>
                    {(auth.user?.fullName?.[0] || (isAdmin ? 'A' : 'O')).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="custom-scrollbar relative flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#0F172A]">
          <div className="mx-auto min-h-full max-w-400 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {children}
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
