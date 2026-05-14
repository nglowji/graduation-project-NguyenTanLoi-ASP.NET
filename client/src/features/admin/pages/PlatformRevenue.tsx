import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, BarChart3, PieChart, Download, 
  CreditCard, Wallet, ArrowUpRight, ArrowDownRight, Activity,
  ShieldCheck, ChevronRight
} from 'lucide-react';
import api from '../../../services/api';

const PlatformRevenue: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/admin/stats') as any;
      setStats(res);
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
      <div className="flex flex-col items-center justify-center py-40 gap-8 animate-in fade-in duration-700">
        <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Processing financial reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Treasury Overview</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Quản lý doanh thu</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Quản lý dòng tiền, hoa hồng và thanh toán toàn hệ thống.</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 group">
          <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" /> 
          Tải báo cáo tổng kết
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: 'Hoa hồng tháng', value: formatCurrency(stats?.platformCommission || 0), change: `+${stats?.commissionGrowth || 0}%`, up: true, icon: <Wallet size={24} />, color: 'blue-600' },
          { title: 'Tổng GD hệ thống', value: formatCurrency((stats?.platformCommission || 0) * 10), change: '+15.2%', up: true, icon: <CreditCard size={24} />, color: 'indigo-600' },
          { title: 'Giao dịch chờ', value: formatCurrency(0), change: '0 đơn', up: true, icon: <Activity size={24} />, color: 'sky-500' },
          { title: 'Tỷ lệ tăng trưởng', value: '12.4%', change: 'FY2024', up: true, icon: <TrendingUp size={24} />, color: 'emerald-600' },
        ].map((s, i) => (
          <motion.div 
            key={s.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-xl hover:border-blue-600/20 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-${s.color} border border-slate-100 dark:border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                {s.icon}
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black ${s.up ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {s.change}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{s.title}</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{s.value}</h3>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-50 dark:bg-slate-900/50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-10 shadow-sm group hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-500/20">
                  <BarChart3 size={20} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Dòng tiền hệ thống</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-13">Phân tích biến động hoa hồng theo tháng</p>
            </div>
          </div>
          
          <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-700/50 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/30 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
            <Activity size={48} className="text-slate-200 dark:text-slate-800 mb-6 animate-pulse" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Aggregating nationwide data...</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-10 shadow-sm group hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-500/20">
                  <PieChart size={20} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cơ cấu nguồn thu</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-13">Tỷ trọng theo loại sân & khu vực</p>
            </div>
            <button className="p-3 text-slate-400 hover:text-blue-600 transition-colors"><ChevronRight size={20} /></button>
          </div>
          <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-700/50 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/30 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
            <div className="relative w-40 h-40 mb-6">
              <div className="absolute inset-0 border-8 border-slate-100 dark:border-slate-800 rounded-full" />
              <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent border-l-transparent rotate-45" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Analyzing category weights...</p>
          </div>
        </div>
      </div>
      
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="p-10 bg-slate-900 dark:bg-blue-600/10 border border-slate-800 dark:border-blue-500/20 rounded-[3rem] relative overflow-hidden group cursor-pointer shadow-2xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck size={24} />
              </div>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Compliance & Transparency</span>
            </div>
            <h4 className="text-3xl font-black text-white leading-tight">Hệ thống đối soát & thanh toán an toàn</h4>
            <p className="text-slate-400 text-sm font-medium max-w-xl">Mọi giao dịch trên nền tảng SmartSport đều được mã hóa và đối soát tự động, đảm bảo tính minh bạch tuyệt đối cho chủ sân và người chơi.</p>
          </div>
          <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-3 group/btn shadow-xl active:scale-95">
            Xem quy trình thanh toán <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
          </button>
        </div>
        <DollarSign className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
      </motion.div>
    </div>
  );
};

export default PlatformRevenue;
