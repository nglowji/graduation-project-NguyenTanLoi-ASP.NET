import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellRing,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  User,
  X,
} from 'lucide-react';
import { Link, NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
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
  const { isAuthenticated, logout, isAdmin, isOwner } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const [isPublicMenuOpen, setIsPublicMenuOpen] = React.useState(false);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const dashboardPath = isAdmin ? '/dashboard/admin' : isOwner ? '/dashboard/owner' : '/profile';

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

        const systemItems =
          notificationResult.status === 'fulfilled' && Array.isArray(notificationResult.value)
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

    void fetchUnreadNotifications();

    const timer = window.setInterval(fetchUnreadNotifications, 120000);
    window.addEventListener('focus', fetchUnreadNotifications);
    window.addEventListener(NOTIFICATION_READ_EVENT, fetchUnreadNotifications);
    window.addEventListener('storage', fetchUnreadNotifications);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', fetchUnreadNotifications);
      window.removeEventListener(NOTIFICATION_READ_EVENT, fetchUnreadNotifications);
      window.removeEventListener('storage', fetchUnreadNotifications);
    };
  }, [isAuthenticated]);

  const closeMenus = () => {
    setIsAccountMenuOpen(false);
    setIsPublicMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenus();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" onClick={closeMenus}>
          <img src={logoMark} alt="SmartSport" className="h-8 w-8 shrink-0 object-contain" />
          <span className="text-lg font-bold tracking-tight text-slate-900">SmartSport</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center md:flex">
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-100 bg-slate-50 p-1">
            {publicLinks.map((item) => (
              <PublicNavLink key={item.to} to={item.to}>
                {item.label}
              </PublicNavLink>
            ))}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:flex"
              >
                <LogIn size={15} />
                Đăng nhập
              </Link>

              <Link
                to="/register"
                className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 shadow-sm"
              >
                Bắt đầu
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* Notification Bell */}
              <Link
                to="/profile?tab=notifications"
                className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label={unreadNotifications > 0 ? `${unreadNotifications} thông báo mới` : 'Thông báo'}
              >
                <BellRing size={18} />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>

              {/* User Dropdown Trigger */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((value) => !value)}
                  className={`flex h-9 items-center gap-1 rounded-lg px-2 text-slate-600 transition ${
                    isAccountMenuOpen ? 'bg-slate-50 text-slate-900' : 'hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <User size={18} />
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl"
                    >
                      <div className="mb-1 rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vai trò</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {isAdmin ? 'Quản trị viên' : isOwner ? 'Chủ sân' : 'Thành viên'}
                        </p>
                      </div>

                      {(isAdmin || isOwner) && (
                        <DropdownItem
                          to={dashboardPath}
                          icon={LayoutDashboard}
                          label="Trang quản trị"
                          onClick={() => setIsAccountMenuOpen(false)}
                        />
                      )}

                      <DropdownItem
                        to="/profile"
                        icon={User}
                        label="Hồ sơ cá nhân"
                        onClick={() => setIsAccountMenuOpen(false)}
                      />

                      <DropdownItem
                        to="/profile?tab=notifications"
                        icon={BellRing}
                        label="Thông báo"
                        onClick={() => setIsAccountMenuOpen(false)}
                        badge={unreadNotifications > 0 ? (unreadNotifications > 9 ? '9+' : String(unreadNotifications)) : undefined}
                      />

                      <div className="my-1.5 h-px bg-slate-100" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsPublicMenuOpen((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-50 md:hidden"
          >
            {isPublicMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isPublicMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="border-t border-slate-100 bg-white px-4 py-3 shadow-lg md:hidden"
          >
            <div className="grid gap-1">
              {publicLinks.map((item) => (
                <RouterNavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsPublicMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.label}
                </RouterNavLink>
              ))}

              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsPublicMenuOpen(false)}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Đăng nhập
                    </Link>

                    <Link
                      to="/register"
                      onClick={() => setIsPublicMenuOpen(false)}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white shadow-sm"
                    >
                      Bắt đầu
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/profile?tab=notifications"
                      onClick={() => setIsPublicMenuOpen(false)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600"
                    >
                      <BellRing size={15} />
                      Thông báo
                      {unreadNotifications > 0 && (
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] text-white font-bold">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </Link>

                    <Link
                      to={dashboardPath}
                      onClick={() => setIsPublicMenuOpen(false)}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white"
                    >
                      {isAdmin || isOwner ? 'Dashboard' : 'Hồ sơ'}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

/* Component phụ cho các Link chính trên Desktop - Đã loại bỏ gạch chân rườm rà */
const PublicNavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <RouterNavLink
    to={to}
    className={({ isActive }) =>
      `rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-white text-blue-600 shadow-sm border border-slate-100/50'
          : 'text-slate-600 hover:text-slate-900'
      }`
    }
  >
    {children}
  </RouterNavLink>
);

/* Component phụ cho các item trong Dropdown */
const DropdownItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  onClick?: () => void;
}> = ({ to, icon: Icon, label, badge, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex h-10 items-center justify-between rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
  >
    <span className="flex items-center gap-2.5">
      <Icon size={16} className="text-slate-400" />
      {label}
    </span>

    {badge && (
      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
        {badge}
      </span>
    )}
  </Link>
);

export default Navbar;
