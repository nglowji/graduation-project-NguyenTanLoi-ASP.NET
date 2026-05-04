import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Bell,
  Search
} from 'lucide-react';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-surface-dark text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col bg-black/20">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold">
            S
          </div>
          <span className="font-bold text-xl tracking-tight">SmartSport</span>
        </div>

        <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
          <SidebarLink icon={<LayoutDashboard size={20} />} label="Tổng quan" active />
          <SidebarLink icon={<MapPin size={20} />} label="Sân của tôi" />
          <SidebarLink icon={<Calendar size={20} />} label="Lịch trình" />
          <SidebarLink icon={<TrendingUp size={20} />} label="Doanh thu" />
          <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-2">
            <SidebarLink icon={<Settings size={20} />} label="Cài đặt" />
            <SidebarLink icon={<LogOut size={20} />} label="Đăng xuất" />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm lịch đặt, sân..." 
              className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-white/5 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">Lợi Nguyễn</p>
                <p className="text-xs text-text/50">Chủ sân</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ icon: React.ReactNode, label: string, active?: boolean }> = ({ icon, label, active }) => (
  <button className={`
    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
    ${active 
      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
      : 'text-text/50 hover:text-text hover:bg-white/5'}
  `}>
    {icon}
    {label}
  </button>
);

export default DashboardLayout;
