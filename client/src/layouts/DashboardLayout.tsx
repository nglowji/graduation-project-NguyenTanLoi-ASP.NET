import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Calendar, MapPin, TrendingUp, Settings, LogOut, Bell,
  Users, ShieldCheck, FileText, ChevronLeft, Menu, Star, DollarSign
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
  { icon: <TrendingUp size={20} />, label: 'Doanh thu', path: '/dashboard/owner/revenue' },
  { icon: <Star size={20} />, label: 'Đánh giá', path: '/dashboard/owner/reviews' },
];

const adminNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', path: '/dashboard/admin' },
  { icon: <Users size={20} />, label: 'Người dùng', path: '/dashboard/admin/users' },
  { icon: <ShieldCheck size={20} />, label: 'Duyệt yêu cầu', path: '/dashboard/admin/approvals' },
  { icon: <DollarSign size={20} />, label: 'Hoa hồng nền tảng', path: '/dashboard/admin/revenue' },
  { icon: <FileText size={20} />, label: 'Báo cáo hệ thống', path: '/dashboard/admin/reports' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: 'admin' | 'owner';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role = 'owner' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [notifCount] = useState(0);

  const navItems = role === 'admin' ? adminNavItems : ownerNavItems;
  const isAdmin = role === 'admin';

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#0f1117] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        ${collapsed ? 'w-20' : 'w-64'} 
        transition-all duration-300 ease-in-out
        border-r border-white/5 flex flex-col flex-shrink-0
        bg-gradient-to-b from-[#13151f] to-[#0f1117]
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-white/5 ${collapsed ? 'justify-center px-2' : 'px-5 gap-3'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-[#00C896] to-[#00a07a] rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-[#00C896]/20 flex-shrink-0">
            S
          </div>
          {!collapsed && (
            <div>
              <span className="font-black text-lg tracking-tight text-white">SmartSport</span>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${isAdmin ? 'text-purple-400' : 'text-[#00C896]'}`}>
                {isAdmin ? 'Admin Panel' : 'Owner Panel'}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-3 mb-3">
              {isAdmin ? 'Quản trị' : 'Quản lý sân'}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : ''}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                    ${isActive
                      ? isAdmin 
                        ? 'bg-purple-500/20 text-purple-300 shadow-inner' 
                        : 'bg-[#00C896]/15 text-[#00C896] shadow-inner'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                    }
                  `}
                >
                  {isActive && (
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${isAdmin ? 'bg-purple-400' : 'bg-[#00C896]'}`} />
                  )}
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
        <div className="px-3 pb-4 border-t border-white/5 pt-4 flex flex-col gap-1">
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
          >
            <Settings size={20} />
            {!collapsed && <span>Cài đặt</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut size={20} />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f1117]/80 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2 rounded-lg hover:bg-white/5 relative text-white/40 hover:text-white transition-colors">
              <Bell size={20} />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                  {notifCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {auth.user?.fullName || (isAdmin ? 'System Admin' : 'Chủ Sân')}
                </p>
                <p className={`text-xs font-medium ${isAdmin ? 'text-purple-400' : 'text-[#00C896]'}`}>
                  {isAdmin ? 'Quản trị viên' : 'Đối tác'}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-[#00C896]/20 text-[#00C896] border border-[#00C896]/30'}`}>
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
