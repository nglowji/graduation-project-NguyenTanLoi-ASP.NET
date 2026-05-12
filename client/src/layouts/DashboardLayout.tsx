import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LayoutDashboard, Calendar, MapPin, TrendingUp, LogOut, Bell,
  Users, ShieldCheck, FileText, ChevronLeft, Menu, Star, DollarSign, Home,
  Sun, Moon, Briefcase
} from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const ownerNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', path: '/dashboard/owner' },
  { icon: <MapPin size={20} />, label: 'Sân của tôi', path: '/dashboard/owner/pitches' },
  { icon: <Calendar size={20} />, label: 'Lịch đặt sân', path: '/dashboard/owner/bookings' },
  { icon: <Briefcase size={20} />, label: 'Dịch vụ', path: '/dashboard/owner/services' },
  { icon: <TrendingUp size={20} />, label: 'Doanh thu', path: '/dashboard/owner/revenue' },
  { icon: <Star size={20} />, label: 'Đánh giá', path: '/dashboard/owner/reviews' },
  { icon: <Users size={20} />, label: 'Quản lý nhân viên', path: '/dashboard/owner/staff' },
];

const adminNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', path: '/dashboard/admin' },
  { icon: <ShieldCheck size={20} />, label: 'Duyệt yêu cầu', path: '/dashboard/admin/approvals' },
  { icon: <Users size={20} />, label: 'Quản lý người dùng', path: '/dashboard/admin/users' },
  { icon: <DollarSign size={20} />, label: 'Quản lý doanh thu', path: '/dashboard/admin/revenue' },
  { icon: <FileText size={20} />, label: 'Báo cáo thống kê', path: '/dashboard/admin/reports' },
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
  const [notifCount] = useState(0);

  const navItems = role === 'admin' ? adminNavItems : ownerNavItems;
  const isAdmin = role === 'admin';

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        ${collapsed ? 'w-20' : 'w-64'} 
        transition-all duration-300 ease-in-out
        border-r border-slate-200 dark:border-white/5 flex flex-col flex-shrink-0
        bg-white dark:bg-[#13151f]
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-slate-200 dark:border-white/5 ${collapsed ? 'justify-center px-2' : 'px-5 gap-3'}`}>
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg flex-shrink-0">
            S
          </div>
          {!collapsed && (
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">SmartSport</span>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${isAdmin ? 'text-primary' : 'text-blue-500'}`}>
                {isAdmin ? 'Quản trị hệ thống' : 'Đối tác chủ sân'}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 px-3 mb-4">
              {isAdmin ? 'Menu Quản Trị' : 'Quản Lý Sân Bãi'}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : ''}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-slate-500 dark:text-white/40 hover:text-primary dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                    }
                  `}
                >
                  <span className={`flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-6 border-t border-slate-200 dark:border-white/5 pt-6 flex flex-col gap-1.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-slate-500 dark:text-white/40 hover:text-primary dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all w-full"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {!collapsed && <span>{theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}</span>}
          </button>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-slate-500 dark:text-white/40 hover:text-primary dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <Home size={20} />
            {!collapsed && <span>Trang chủ</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-slate-500 dark:text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut size={20} />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 relative text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Bell size={20} />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                  {notifCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {auth.user?.fullName || (isAdmin ? 'System Admin' : 'Chủ Sân')}
                </p>
                <p className={`text-xs font-medium ${isAdmin ? 'text-primary' : 'text-blue-500'}`}>
                  {isAdmin ? 'Quản trị viên' : 'Đối tác'}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isAdmin ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-blue-600/10 text-blue-500 border border-blue-500/20'}`}>
                {auth.user?.fullName?.[0] || (isAdmin ? 'A' : 'O')}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
