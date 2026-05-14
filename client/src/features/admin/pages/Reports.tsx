import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Download, Filter, Search, Calendar, ChevronRight, 
  Activity, TrendingUp, AlertCircle, FileSpreadsheet, 
  Database, ShieldCheck, Zap
} from 'lucide-react';

const Reports: React.FC = () => {
  const [reports] = useState<any[]>([]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Analytics Engine</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Báo cáo thống kê</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Dữ liệu phân tích và báo cáo chi tiết về tình hình hoạt động của nền tảng.</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 group">
          <Zap size={18} className="animate-pulse" /> 
          Chạy phân tích AI
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'Báo cáo đã xuất', value: '128', icon: <FileSpreadsheet size={24} />, color: 'blue-600', trend: '+12%' },
          { title: 'Dữ liệu phân tích', value: '2.4k', icon: <Database size={24} />, color: 'indigo-600', trend: 'Stable' },
          { title: 'Cần xử lý', value: '15', icon: <AlertCircle size={24} />, color: 'rose-500', trend: 'Critical' },
        ].map((s, i) => (
          <motion.div 
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className={`w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center text-${s.color} border border-slate-100 dark:border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
              {s.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{s.value}</span>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-400`}>{s.trend}</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <FileText size={24} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Thư viện báo cáo</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group flex-1 md:w-80">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Tìm tên báo cáo..." 
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-600 transition-all shadow-inner"
              />
            </div>
            <button className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 rounded-2xl transition-all active:scale-95">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-32 bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-sm">
                <FileText size={40} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No reports generated</p>
                <p className="text-slate-300 dark:text-slate-600 text-[10px] font-bold">Start an AI analysis to populate your library</p>
              </div>
            </div>
          ) : (
            reports.map((report, i) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-600/30 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm group-hover:scale-110 duration-500">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors mb-1.5">{report.name}</h4>
                    <div className="flex items-center gap-5">
                      <span className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">{report.type}</span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                        <Calendar size={12} /> {report.date}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{report.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${report.status === 'Sẵn sàng' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    {report.status}
                  </span>
                  <button className="w-12 h-12 bg-white dark:bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm active:scale-90">
                    <Download size={20} />
                  </button>
                  <button className="w-12 h-12 bg-white dark:bg-slate-800 text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm active:scale-90 lg:hidden xl:flex">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck size={24} />
              </div>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Advanced Cryptography</span>
            </div>
            <h4 className="text-3xl font-black text-white leading-tight max-w-xl">Dữ liệu của bạn được bảo vệ bởi AI tiêu chuẩn doanh nghiệp</h4>
            <p className="text-slate-400 text-sm font-medium">Chúng tôi sử dụng các mô hình học máy tiên tiến nhất để phân tích và bảo mật dữ liệu vận hành của bạn 24/7.</p>
          </div>
          <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-3 group/btn shadow-xl shadow-blue-600/20 active:scale-95">
            Xem hạ tầng bảo mật <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
        <Activity className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
      </div>
    </div>
  );
};

export default Reports;
