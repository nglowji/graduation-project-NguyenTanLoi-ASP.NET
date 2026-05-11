import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, BarChart3, PieChart, Download } from 'lucide-react';
import api from '../../../services/api';

const Revenue: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/owner/stats');
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
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Đang tính toán tài chính...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Doanh thu & Tài chính</h1>
          <p className="text-white/40 text-sm mt-1">Theo dõi hiệu quả kinh doanh và dòng tiền từ các sân bóng</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 text-white rounded-2xl text-sm font-black hover:bg-white/10 transition-all">
          <Download size={18} /> Xuất báo cáo (Excel)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Tổng doanh thu', value: formatCurrency(stats?.totalRevenue || 0), change: `+${stats?.revenueChange || 0}%`, up: true, icon: <DollarSign size={24} />, color: 'bg-blue-600' },
          { title: 'Lợi nhuận ước tính', value: formatCurrency((stats?.totalRevenue || 0) * 0.85), change: '+12%', up: true, icon: <TrendingUp size={24} />, color: 'bg-indigo-600' },
          { title: 'Giao dịch thành công', value: (stats?.totalBookings || 0).toString(), change: '+5%', up: true, icon: <Calendar size={24} />, color: 'bg-blue-400' },
        ].map((s, i) => (
          <motion.div 
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#1a1c26] border border-white/5 rounded-3xl p-8 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${s.color} opacity-5 rounded-bl-[5rem] group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-center justify-between mb-8">
              <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center text-white shadow-xl`}>
                {s.icon}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black ${s.up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {s.change} <ArrowUpRight size={12} />
              </div>
            </div>
            <p className="text-white/20 text-xs font-black uppercase tracking-widest mb-2">{s.title}</p>
            <h3 className="text-2xl font-black text-white tracking-tight">{s.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="text-blue-500" size={24} /> Biểu đồ doanh thu
            </h3>
          </div>
          
          <div className="h-64 flex items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
            <div className="text-center">
              <BarChart3 size={40} className="mx-auto mb-3 text-white/5" />
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Đang tổng hợp dữ liệu giao dịch...</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              <PieChart className="text-blue-500" size={24} /> Tỷ lệ loại sân
            </h3>
          </div>
          
          <div className="h-64 flex items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
            <div className="text-center">
              <PieChart size={40} className="mx-auto mb-3 text-white/5" />
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Đang phân tích cơ cấu tài chính...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;
