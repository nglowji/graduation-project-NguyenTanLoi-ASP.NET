import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, CheckCircle, XCircle, Eye, MapPin, Calendar } from 'lucide-react';
import api from '../../../services/api';

const Approvals: React.FC = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [tab, setTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, [tab]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/pitch-approvals', { params: { status: tab } }) as any;
      setApprovals(res?.items || res || []);
    } catch {
      setApprovals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/admin/pitch-approvals/${id}/${action}`);
      fetchApprovals();
    } catch {
      alert('Thao tác thất bại');
    }
  };

  const pitchTypeLabel = (t: string) => ({ 
    Football5: 'Sân 5', Football7: 'Sân 7', Football11: 'Sân 11',
    Tennis: 'Tennis', Badminton: 'Cầu lông' 
  }[t] || t);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Verification Center</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Duyệt yêu cầu</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Xét duyệt hồ sơ và năng lực của các chủ sân đăng ký mới.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/50 dark:bg-transparent">
          <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800 rounded-xl self-start">
            {[
              { id: 'pending', label: 'Đang chờ' },
              { id: 'approved', label: 'Đã duyệt' },
              { id: 'rejected', label: 'Từ chối' },
            ].map((t) => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)}
                className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  tab === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Tìm tên sân, tên chủ..." 
              className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Đang xác minh hồ sơ...</p>
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-24 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
              <ShieldCheck size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Không có yêu cầu nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {approvals.map((a, i) => (
                <motion.div 
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.02] rounded-bl-[3rem]" />
                  
                  <div className="flex items-start justify-between mb-6 relative">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 shadow-sm">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors text-lg leading-tight">{a.pitchName}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-2">
                          <Calendar size={12} className="text-blue-500" /> {new Date(a.submittedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                      {pitchTypeLabel(a.pitchType)}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 mb-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 text-sm font-black shadow-sm border border-slate-100 dark:border-slate-700">
                        {a.ownerName[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{a.ownerName}</p>
                        <p className="text-[10px] font-bold text-slate-400">{a.ownerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-800 py-2 px-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <MapPin size={12} className="text-red-500 shrink-0" /> 
                      <span className="truncate">{a.address}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <button className="flex-1 py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 group/btn">
                      <Eye size={14} className="group-hover/btn:scale-110 transition-transform" /> Xem hồ sơ
                    </button>
                    {a.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApproval(a.id, 'approve')}
                          className="w-12 h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center active:scale-95"
                          title="Duyệt"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button 
                          onClick={() => handleApproval(a.id, 'reject')}
                          className="w-12 h-12 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center active:scale-95"
                          title="Từ chối"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Approvals;
