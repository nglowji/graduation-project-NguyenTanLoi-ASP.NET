import React from 'react';
import { motion } from 'framer-motion';
import { Bell, ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, User, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import logoMark from '../assets/logo-smartsport.svg';
import { getReadNotificationIds, NOTIFICATION_READ_EVENT } from '../utils/notifications';

type SystemNotificationItem = {
  id: string;
  isRead: boolean;
};

type BookingNotificationItem = {
  id: string;
  status?: string;
};

const publicLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/explore', label: 'Khám phá sân' },
  { to: '/partner', label: 'Dành cho chủ sân' },
  { to: '/contact', label: 'Liên hệ' },
];

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin, isOwner } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const [isPublicMenuOpen, setIsPublicMenuOpen] = React.useState(false);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const accountRoleLabel = isAdmin ? 'Quản trị' : isOwner ? 'Chủ sân' : 'Thành viên';

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      return;
    }

    let isMounted = true;
    const fetchUnreadNotifications = async () => {
      try {
        const [notificationResult, bookingResult] = await Promise.allSettled([
          api.get('/notifications') as Promise<SystemNotificationItem[]>,
          api.get('/bookings/my-bookings') as Promise<{ items?: BookingNotificationItem[] } | BookingNotificationItem[]>,
        ]);

        const readIds = getReadNotificationIds();
        const systemItems = notificationResult.status === 'fulfilled' && Array.isArray(notificationResult.value)
          ? notificationResult.value
          : [];
        const bookingPayload = bookingResult.status === 'fulfilled' ? bookingResult.value : [];
        const bookingItems = Array.isArray(bookingPayload)
          ? bookingPayload
          : Array.isArray(bookingPayload?.items)
            ? bookingPayload.items
            : [];

        const unreadSystem = systemItems.filter((item) => !item.isRead && !readIds.includes(item.id)).length;
        const unreadBookings = bookingItems.filter((booking) => {
          const status = String(booking.status || '').toLowerCase();
          const isRelevant = status.includes('pending') || status.includes('complete') || status === '1' || status === '4';
          return isRelevant && !readIds.includes(booking.id);
        }).length;

        if (isMounted) setUnreadNotifications(unreadSystem + unreadBookings);
      } catch {
        if (isMounted) setUnreadNotifications(0);
      }
    };

    fetchUnreadNotifications();
    const timer = window.setInterval(fetchUnreadNotifications, 30000);
    window.addEventListener(NOTIFICATION_READ_EVENT, fetchUnreadNotifications);
    window.addEventListener('storage', fetchUnreadNotifications);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATION_READ_EVENT, fetchUnreadNotifications);
      window.removeEventListener('storage', fetchUnreadNotifications);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setIsAccountMenuOpen(false);
    setIsPublicMenuOpen(false);
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed left-0 right-0 top-0 z-100 border-b border-slate-200 bg-white/95 backdrop-blur-lg"
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex min-w-0 items-center gap-2">
          <img src={logoMark} alt="SmartSport" className="h-11 w-11 shrink-0 object-contain transition-transform group-hover:scale-105" />
          <span className="truncate text-xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-primary">SmartSport</span>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 md:flex">
          {publicLinks.map((item) => (
            <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hidden items-center gap-2 rounded-lg px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:flex">
                <LogIn size={18} />
                Đăng nhập
              </Link>
              <Link to="/register" className="btn-primary inline-flex h-10 items-center px-4 text-sm sm:px-5">
                Bắt đầu
              </Link>
            </>
          ) : (
            <>
            <Link
              to="/profile?tab=notifications"
              className="relative grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-white"
              aria-label={unreadNotifications > 0 ? `${unreadNotifications} thông báo mới` : 'Thông báo'}
            >
              <Bell size={18} />
              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black leading-none text-white ring-2 ring-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                aria-label={`Mở menu ${accountRoleLabel}`}
                className={`flex items-center gap-2 rounded-xl border bg-white px-2 py-1.5 shadow-sm transition-all ${isAccountMenuOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-100 hover:border-blue-200 hover:bg-blue-50'}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-black text-blue-700">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-[10px] font-bold leading-none text-slate-400">Xin chào</p>
                  <p className="mt-1 max-w-30 truncate text-sm font-black leading-none text-slate-900">{user?.fullName}</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAccountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-62 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10"
                >
                  <div className="border-b border-slate-100 bg-white p-3 text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
                        {user?.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{user?.fullName || 'Tài khoản'}</p>
                        <p className="truncate text-xs font-semibold text-slate-500">{user?.email || 'Chưa cập nhật email'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 p-2">
                    {(isAdmin || isOwner) && (
                      <Link
                        to={isAdmin ? '/dashboard/admin' : '/dashboard/owner'}
                        className="flex items-center gap-2.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-black text-blue-800 transition hover:bg-blue-600 hover:text-white"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        <LayoutDashboard size={18} />
                        Trang quản trị
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      <User size={18} />
                      Hồ sơ cá nhân
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-black text-red-600 transition hover:bg-red-600 hover:text-white"
                    >
                      <LogOut size={18} />
                      Đăng xuất
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsPublicMenuOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-label="Mở menu"
          >
            {isPublicMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isPublicMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-slate-200 bg-white px-4 py-4 shadow-xl md:hidden"
        >
          <div className="grid gap-2">
            {publicLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsPublicMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsPublicMenuOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-black text-slate-700"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsPublicMenuOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-black text-white"
                  >
                    Bắt đầu
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/profile?tab=notifications"
                    onClick={() => setIsPublicMenuOpen(false)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-black text-slate-700"
                  >
                    <Bell size={16} />
                    Thông báo
                    {unreadNotifications > 0 && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <Link
                    to={isAdmin ? '/dashboard/admin' : isOwner ? '/dashboard/owner' : '/profile'}
                    onClick={() => setIsPublicMenuOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-black text-white"
                  >
                    {isAdmin || isOwner ? 'Vào dashboard' : 'Hồ sơ cá nhân'}
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to} className="rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-white hover:text-primary">
    {children}
    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
  </Link>
);

export default Navbar;
