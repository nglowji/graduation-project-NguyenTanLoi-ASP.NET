import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Filter, Search, Calendar, ChevronRight, Activity, TrendingUp, AlertCircle } from 'lucide-react';

const Reports: React.FC = () => {
  const [reports] = useState<any[]>([]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Báo cáo thống kê</h1>
          <p className="text-white/40 text-sm mt-1">Dữ liệu phân tích và báo cáo chi tiết về tình hình hoạt động của nền tảng</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
            <Activity size={18} /> Chạy báo cáo AI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1a1c26] border border-white/5 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xl font-black text-white">128</p>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Báo cáo đã xuất</p>
          </div>
        </div>
        <div className="bg-[#1a1c26] border border-white/5 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xl font-black text-white">2.4k</p>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Dữ liệu phân tích</p>
          </div>
        </div>
        <div className="bg-[#1a1c26] border border-white/5 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xl font-black text-white">15</p>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Cần xử lý</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <h3 className="text-xl font-black text-white tracking-tight">Thư viện báo cáo</h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input type="text" placeholder="Tìm tên báo cáo..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-5 text-sm text-white focus:outline-none" />
            </div>
            <button className="p-3 bg-white/5 border border-white/10 text-white/60 rounded-xl hover:text-white transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-32 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
              <FileText size={48} className="mx-auto mb-4 text-white/5" />
              <p className="text-white/20 font-black uppercase tracking-widest text-sm">Chưa có báo cáo nào khả dụng</p>
            </div>
          ) : (
            reports.map((report, i) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-5 bg-[#1e202b] rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{report.name}</h4>
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">{report.type}</span>
                      <span className="text-[9px] font-bold text-white/20 flex items-center gap-1 uppercase tracking-widest">
                        <Calendar size={10} /> {report.date}
                      </span>
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{report.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${report.status === 'Sẵn sàng' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/20'}`}>
                    {report.status}
                  </span>
                  <button className="w-10 h-10 bg-white/5 hover:bg-blue-600 text-white/30 hover:text-white rounded-xl transition-all flex items-center justify-center">
                    <Download size={18} />
                  </button>
                  <button className="w-10 h-10 bg-white/5 text-white/30 hover:text-white rounded-xl transition-all flex items-center justify-center lg:hidden xl:flex">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
