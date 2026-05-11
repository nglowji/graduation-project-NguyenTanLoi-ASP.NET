import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, Clock, User, CheckCircle, XCircle, ChevronRight, Activity } from 'lucide-react';
import api from '../../../services/api';

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [tab, setTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [tab]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = tab === 'all' ? {} : { status: tab };
      const res = await api.get('/bookings/owner', { params });
      setBookings(res.data?.items || res.data || []);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'confirm' | 'cancel') => {
    try {
      await api.patch(`/bookings/${id}/${action}`);
      fetchBookings();
    } catch {
      alert('Thao tác thất bại');
    }
  };

  const statusStyles: any = {
    Pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Lịch đặt sân</h1>
        <p className="text-white/40 text-sm mt-1">Quản lý các yêu cầu đặt sân và lịch thi đấu từ khách hàng</p>
      </div>

      <div className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex p-1 bg-white/5 rounded-2xl self-start">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'pending', label: 'Chờ duyệt' },
              { id: 'confirmed', label: 'Đã xác nhận' },
              { id: 'completed', label: 'Hoàn thành' },
            ].map((t) => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  tab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input 
                type="text" 
                placeholder="Tìm khách hàng, số điện thoại..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <button className="px-5 py-3 bg-white/5 text-white/60 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 border border-white/5">
              <Filter size={16} /> Lọc ngày
            </button>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Đang truy xuất dữ liệu...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-32 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
              <Calendar size={48} className="mx-auto mb-4 text-white/5" />
              <p className="text-white/20 font-black uppercase tracking-widest text-sm">Không có đơn đặt sân nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b, index) => (
                <motion.div 
                  key={b.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-[#1e202b] rounded-[1.5rem] border border-white/5 hover:border-blue-500/20 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-5 mb-6 lg:mb-0">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center text-blue-500 shadow-xl flex-shrink-0">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-black text-white">{b.customerName}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${statusStyles[b.status] || 'bg-white/5 text-white/40 border-white/10'}`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <p className="text-xs font-bold text-white/30 flex items-center gap-2 uppercase tracking-wide">
                          <Activity size={12} className="text-blue-500" /> {b.pitchName}
                        </p>
                        <p className="text-xs font-bold text-white/30 flex items-center gap-2 uppercase tracking-wide">
                          <Clock size={12} className="text-blue-500" /> {b.startTime} - {b.endTime} ({b.bookingDate})
                        </p>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-wide">
                          SĐT: <span className="text-white/60">{b.customerPhone}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-8 pt-6 lg:pt-0 border-t lg:border-none border-white/5">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Tổng cộng</p>
                      <p className="text-xl font-black text-blue-500">{formatCurrency(b.totalAmount)}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {b.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleAction(b.id, 'confirm')}
                            className="w-11 h-11 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center"
                            title="Xác nhận"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button 
                            onClick={() => handleAction(b.id, 'cancel')}
                            className="w-11 h-11 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                            title="Từ chối"
                          >
                            <XCircle size={20} />
                          </button>
                        </>
                      )}
                      <button className="w-11 h-11 bg-white/5 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center justify-center">
                        <ChevronRight size={20} />
                      </button>
                    </div>
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

export default Bookings;
