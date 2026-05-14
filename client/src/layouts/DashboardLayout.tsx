import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, MapPin, TrendingUp, LogOut, Bell,
  Users, ShieldCheck, FileText, ChevronLeft, Menu, Star, DollarSign, Home,
  Sun, Moon, Briefcase, Search, Settings, ChevronRight
} from 'lucide-react';

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
  { icon: FileText, label: 'Báo cáo thống kê', path: '/dashboard/admin/reports' },
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
  const [notifCount] = useState(3);

  const navItems = role === 'admin' ? adminNavItems : ownerNavItems;
  const isAdmin = role === 'admin';
  const accentColor = isAdmin ? 'text-indigo-600' : 'text-blue-600';
  const accentBg = isAdmin ? 'bg-indigo-50' : 'bg-blue-50';
  const accentBorder = isAdmin ? 'border-indigo-100' : 'border-blue-100';

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`
          ${collapsed ? 'w-[88px]' : 'w-[280px]'} 
          relative z-50 flex flex-col h-full border-r border-slate-200 dark:border-slate-800
          bg-white dark:bg-[#1E293B] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        `}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 shrink-0 overflow-hidden border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 shrink-0 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-sm`}>
              <span className="font-black text-white dark:text-slate-900 text-xl tracking-tighter">S</span>
            </div>
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col truncate"
              >
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">SmartSport</span>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                  {isAdmin ? 'System Master' : 'Partner Central'}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-4 space-y-8 custom-scrollbar">
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-3">
                Main Menu
              </p>
            )}
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    group flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 relative
                    ${isActive 
                      ? `${accentBg} ${accentColor} shadow-sm border border-transparent` 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border border-transparent'
                    }
                  `}
                >
                  <div className={`
                    shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                    ${isActive ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-transparent group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:shadow-sm'}
                  `}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 truncate">
                      {item.label}
                    </motion.span>
                  )}
                  {isActive && !collapsed && (
                    <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            {!collapsed && (
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-3">
                Preferences
              </p>
            )}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all border border-transparent"
            >
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-transparent group-hover:bg-white dark:group-hover:bg-slate-900">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              {!collapsed && <span>{theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}</span>}
            </button>
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all border border-transparent"
            >
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-transparent group-hover:bg-white dark:group-hover:bg-slate-900">
                <Home size={18} />
              </div>
              {!collapsed && <span>Về trang chủ</span>}
            </Link>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent"
          >
            <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center">
              <LogOut size={18} />
            </div>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800/50 relative z-40 shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all"
            >
              {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>

            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 min-w-[240px] group focus-within:border-slate-300 dark:focus-within:border-slate-600 transition-all">
              <Search size={18} className="text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-slate-400 text-slate-900 dark:text-white w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 relative transition-all">
                <Bell size={20} />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black flex items-center justify-center text-white border-2 border-white dark:border-[#1E293B]">
                    {notifCount}
                  </span>
                )}
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all">
                <Settings size={20} />
              </button>
            </div>

            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

            <div className="flex items-center gap-4 pl-2">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">
                  {auth.user?.fullName || (isAdmin ? 'Administrator' : 'Pitch Owner')}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 ${isAdmin ? 'text-indigo-600' : 'text-blue-600'}`}>
                  {isAdmin ? 'Super Admin' : 'Premium Partner'}
                </span>
              </div>
              <div className={`w-11 h-11 rounded-2xl ${accentBg} border ${accentBorder} flex items-center justify-center shadow-sm overflow-hidden`}>
                {auth.user?.avatar ? (
                  <img src={auth.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className={`font-black text-lg ${accentColor}`}>
                    {(auth.user?.fullName?.[0] || (isAdmin ? 'A' : 'O')).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#0F172A] relative custom-scrollbar">
          <div className="p-8 max-w-[1600px] mx-auto min-h-full">
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
