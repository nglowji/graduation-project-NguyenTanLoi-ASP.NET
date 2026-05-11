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
      const res = await api.get('/admin/pitch-approvals', { params: { status: tab } });
      setApprovals(res.data?.items || res.data || []);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Duyệt yêu cầu</h1>
        <p className="text-white/40 text-sm mt-1">Xét duyệt hồ sơ và năng lực của các chủ sân đăng ký mới</p>
      </div>

      <div className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex p-1 bg-white/5 rounded-2xl self-start">
            {[
              { id: 'pending', label: 'Đang chờ' },
              { id: 'approved', label: 'Đã duyệt' },
              { id: 'rejected', label: 'Từ chối' },
            ].map((t) => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Tìm tên sân, tên chủ..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-5 text-sm text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Đang xác minh hồ sơ...</p>
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-32 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
              <ShieldCheck size={48} className="mx-auto mb-4 text-white/5" />
              <p className="text-white/20 font-black uppercase tracking-widest text-sm">Không có yêu cầu nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {approvals.map((a, i) => (
                <motion.div 
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 bg-[#1e202b] rounded-[1.5rem] border border-white/5 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center text-blue-500 shadow-xl">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white group-hover:text-blue-400 transition-colors">{a.pitchName}</h4>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2 mt-1">
                          <Calendar size={12} /> Gửi: {new Date(a.submittedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest">
                      {pitchTypeLabel(a.pitchType)}
                    </div>
                  </div>

                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-black">
                        {a.ownerName[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{a.ownerName}</p>
                        <p className="text-[10px] font-bold text-white/20">{a.ownerEmail}</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 flex items-center gap-2 italic">
                      <MapPin size={12} /> {a.address}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                    <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                      <Eye size={14} /> Xem hồ sơ
                    </button>
                    {a.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApproval(a.id, 'approve')}
                          className="w-12 h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center"
                          title="Duyệt"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button 
                          onClick={() => handleApproval(a.id, 'reject')}
                          className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                          title="Từ chối"
                        >
                          <XCircle size={20} />
                        </button>
                      </>
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
