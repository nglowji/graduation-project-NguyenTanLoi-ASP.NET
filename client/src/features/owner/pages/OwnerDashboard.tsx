import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, CalendarCheck, Percent } from 'lucide-react';

const OwnerDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tổng quan</h1>
          <p className="text-text/50">Chào mừng trở lại, đây là thống kê hôm nay.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors">
            7 Ngày qua
          </button>
          <button className="btn-primary py-2 px-4 text-sm">
            Thêm sân mới
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tổng doanh thu" value="$12,450" change="+12.5%" icon={<DollarSign className="text-green-500" />} />
        <StatCard title="Lượt đặt sân" value="156" change="+8.2%" icon={<CalendarCheck className="text-primary" />} />
        <StatCard title="Khách hàng mới" value="89" change="+5.4%" icon={<Users className="text-blue-400" />} />
        <StatCard title="Tỷ lệ lấp đầy" value="78%" change="+2.1%" icon={<Percent className="text-secondary" />} />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart Placeholder */}
        <div className="lg:col-span-2 glass-card h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg">Phân tích doanh thu</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 text-xs text-text/50">
                <span className="w-3 h-3 rounded-full bg-primary" /> Doanh thu
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white/5 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-text/30">
            [Biểu đồ doanh thu trực quan]
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="glass-card flex flex-col">
          <h3 className="font-bold text-lg mb-6">Đơn đặt gần đây</h3>
          <div className="flex flex-col gap-4">
            <BookingItem name="Hữu Phước" pitch="San A1" time="17:00 - 18:30" amount="$25" status="Đã xác nhận" />
            <BookingItem name="Minh Trí" pitch="San B2" time="19:00 - 20:30" amount="$30" status="Đang chờ" />
            <BookingItem name="Thành Đạt" pitch="San A1" time="20:30 - 22:00" amount="$25" status="Hoàn thành" />
            <BookingItem name="Quốc Anh" pitch="San C1" time="18:00 - 19:30" amount="$20" status="Đã xác nhận" />
          </div>
          <button className="mt-8 text-sm text-primary font-semibold hover:underline w-full text-center">
            Xem tất cả
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, change: string, icon: React.ReactNode }> = ({ title, value, change, icon }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="glass-card flex flex-col gap-4"
  >
    <div className="flex items-center justify-between">
      <div className="p-2 bg-white/5 rounded-lg">
        {icon}
      </div>
      <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
        {change}
      </span>
    </div>
    <div>
      <p className="text-sm text-text/50 mb-1">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </motion.div>
);

const BookingItem: React.FC<{ name: string, pitch: string, time: string, amount: string, status: string }> = ({ name, pitch, time, amount, status }) => (
  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs">
        {name.split(' ').map(n => n[0]).join('')}
      </div>
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-text/50">{pitch} • {time}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold">{amount}</p>
      <p className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${
        status === 'Đã xác nhận' ? 'bg-green-500/10 text-green-500' : 
        status === 'Đang chờ' ? 'bg-secondary/10 text-secondary' : 
        'bg-blue-500/10 text-blue-500'
      }`}>
        {status}
      </p>
    </div>
  </div>
);

export default OwnerDashboard;
