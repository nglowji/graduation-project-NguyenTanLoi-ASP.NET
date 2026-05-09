import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, BarChart3, PieChart, Download, CreditCard, Wallet, ArrowUpRight } from 'lucide-react';
import api from '../../../services/api';

const PlatformRevenue: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/admin/stats');
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Đang kết xuất báo cáo tài chính...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Quản lý doanh thu</h1>
          <p className="text-white/40 text-sm mt-1">Quản lý dòng tiền, hoa hồng và thanh toán toàn hệ thống</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
          <Download size={18} /> Tải báo cáo tổng kết
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Hoa hồng tháng', value: formatCurrency(stats?.platformCommission || 0), change: `+${stats?.commissionGrowth || 0}%`, icon: <DollarSign size={22} />, color: 'bg-blue-600' },
          { title: 'Tổng doanh thu hệ thống', value: formatCurrency((stats?.platformCommission || 0) * 10), change: '+15%', icon: <CreditCard size={22} />, color: 'bg-indigo-600' },
          { title: 'Giao dịch chờ xử lý', value: formatCurrency(0), change: '0 đơn', icon: <Wallet size={22} />, color: 'bg-amber-600' },
          { title: 'Tăng trưởng', value: '0%', change: 'Năm nay', icon: <TrendingUp size={22} />, color: 'bg-emerald-600' },
        ].map((s, i) => (
          <motion.div 
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#1a1c26] border border-white/5 rounded-3xl p-6 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${s.color} opacity-5 rounded-bl-[4rem]`} />
            <div className="flex items-center justify-between mb-6">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white shadow-xl`}>
                {s.icon}
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{s.change}</span>
            </div>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mb-1">{s.title}</p>
            <h3 className="text-xl font-black text-white tracking-tight">{s.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-[#1a1c26] border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="text-blue-500" size={24} /> Phân tích dòng tiền toàn quốc
            </h3>
          </div>
          
          <div className="h-72 flex items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
            <div className="text-center">
              <BarChart3 size={40} className="mx-auto mb-3 text-white/5" />
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Đang khởi tạo biểu đồ dòng tiền...</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3 mb-8">
            <PieChart className="text-blue-500" size={24} /> Cơ cấu doanh thu
          </h3>
          <div className="h-[280px] flex items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
            <div className="text-center">
              <PieChart size={40} className="mx-auto mb-3 text-white/5" />
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest px-8">Đang phân tích cơ cấu doanh thu hệ thống...</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-8 bg-blue-600 rounded-[2.5rem] relative overflow-hidden group cursor-pointer shadow-xl shadow-blue-600/20">
        <div className="relative z-10">
          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Hệ thống đối soát</p>
          <h4 className="text-2xl font-black text-white mb-4">Mọi giao dịch đều được bảo mật & minh bạch</h4>
          <button className="flex items-center gap-2 text-sm font-black text-white group-hover:gap-4 transition-all">
            Xem quy trình thanh toán <ArrowUpRight size={18} />
          </button>
        </div>
        <DollarSign className="absolute -bottom-6 -right-6 w-48 h-48 text-white/10" />
      </div>
    </div>
  );
};

export default PlatformRevenue;
