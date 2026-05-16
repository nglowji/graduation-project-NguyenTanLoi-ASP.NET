import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Briefcase,
  Calendar,
  ChevronLeft,
  DollarSign,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

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
  { icon: ShieldCheck, label: 'Duyệt yêu cầu', path: '/dashboard/admin/approvals' },
  { icon: Users, label: 'Quản lý người dùng', path: '/dashboard/admin/users' },
  { icon: DollarSign, label: 'Quản lý doanh thu', path: '/dashboard/admin/revenue' },
  { icon: FileText, label: 'Báo cáo hoa hồng', path: '/dashboard/admin/reports' },
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [bookingNotifications, setBookingNotifications] = useState<any[]>([]);

  const isStaff = auth.user?.role === 4;
  const isAdmin = role === 'admin';
  const staffNavItems = ownerNavItems.filter((item) =>
    ['/dashboard/owner', '/dashboard/owner/bookings', '/dashboard/owner/reviews'].includes(item.path)
  );
  const navItems = isAdmin ? adminNavItems : isStaff ? staffNavItems : ownerNavItems;
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
    return bookingNotifications
      .filter((booking) => {
        const status = String(booking.status || '').toLowerCase();
        return status.includes('pending') || status.includes('confirm');
      })
      .slice(0, 5);
  }, [bookingNotifications]);

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

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-900 antialiased transition-colors duration-300 dark:bg-[#0F172A] dark:text-slate-100">
      <aside className={`${collapsed ? 'w-[88px]' : 'w-[280px]'} relative z-50 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-500 dark:border-slate-800 dark:bg-[#1E293B]`}>
        <div className="flex h-20 shrink-0 items-center overflow-hidden border-b border-slate-50 px-6 dark:border-slate-800/50">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 shadow-sm dark:bg-white">
              <span className="text-xl font-black tracking-tighter text-white dark:text-slate-900">S</span>
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col truncate">
                <span className="text-lg font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">SmartSport</span>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                  {isAdmin ? 'System Master' : isStaff ? 'Staff Console' : 'Partner Central'}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto overflow-x-hidden px-4 py-6">
          <div className="space-y-1">
            {!collapsed && <p className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Main Menu</p>}
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center gap-3 rounded-xl border border-transparent px-4 py-3.5 text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? `${accentBg} ${accentColor} shadow-sm`
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${isActive ? 'bg-white shadow-sm dark:bg-slate-900' : 'bg-transparent group-hover:bg-white group-hover:shadow-sm dark:group-hover:bg-slate-900'}`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 truncate">{item.label}</motion.span>}
                  {isActive && !collapsed && <motion.div layoutId="active-indicator" className="h-1.5 w-1.5 rounded-full bg-current" />}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            {!collapsed && <p className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Tùy chọn</p>}
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              {!collapsed && <span>{theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}</span>}
            </button>
            <Link
              to="/"
              className="flex items-center gap-3 rounded-xl border border-transparent px-4 py-3.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Home size={18} />
              </div>
              {!collapsed && <span>Về trang chủ</span>}
            </Link>
          </div>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4 dark:border-slate-800/50">
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
        <header className="relative z-40 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 dark:border-slate-800/50 dark:bg-[#1E293B]">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>

            <div className="group hidden min-w-[240px] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 transition-all focus-within:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50 dark:focus-within:border-slate-600 md:flex">
              <Search size={18} className="text-slate-400 transition-colors group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300" />
              <input type="text" placeholder="Tìm kiếm..." className="w-full border-none bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
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

                {showNotifications && (
                  <div className="absolute right-0 top-12 z-50 w-[390px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
                    <div className="bg-slate-950 p-4 text-white dark:bg-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black">Thông báo đơn đặt sân</p>
                          <p className="mt-1 text-xs font-bold text-slate-300">Các đơn mới hoặc đang cần xử lý.</p>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                          <Bell size={18} />
                        </div>
                      </div>
                    </div>
                    <div className="max-h-[340px] overflow-y-auto">
                      {notificationItems.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <Calendar size={20} />
                          </div>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-200">Chưa có đơn cần chú ý</p>
                          <p className="mt-1 text-xs font-bold text-slate-400">Khi có đơn mới, danh sách sẽ hiện ở đây.</p>
                        </div>
                      ) : notificationItems.map((booking) => {
                        const pitchName = booking.pitchName || booking.timeSlot?.pitch?.name || 'Sân thể thao';
                        const customerName = booking.customerName || booking.user?.fullName || 'Khách hàng';
                        const date = booking.bookingDate ? new Date(`${booking.bookingDate}T00:00:00`).toLocaleDateString('vi-VN') : '--/--/----';

                        return (
                          <Link
                            key={booking.id}
                            to="/dashboard/owner/bookings"
                            onClick={() => setShowNotifications(false)}
                            className="block border-b border-slate-100 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                  <Calendar size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-slate-900 dark:text-white">{pitchName}</p>
                                  <p className="mt-1 truncate text-xs font-bold text-slate-500">{customerName} · {date}</p>
                                </div>
                              </div>
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ${notificationStatusClass(booking.status)}`}>
                                {notificationStatusLabel(booking.status)}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                <Settings size={20} />
              </button>
            </div>

            <div className="mx-1 h-10 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-4 pl-2">
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
          <div className="mx-auto min-h-full max-w-[1600px] p-8">
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
      </div>
    </div>
  );
};

export default DashboardLayout;
