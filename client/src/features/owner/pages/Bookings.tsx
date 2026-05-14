import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Clock, Phone, Activity, Trash2, Loader2
} from 'lucide-react';
import api from '../../../services/api';

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [tab, setTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [tab]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = tab === 'all' ? {} : { status: tab };
      const res = await api.get('/bookings/owner', { params }) as any;
      setBookings(res?.items || res || []);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn đặt sân này?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchBookings();
    } catch {
      alert('Không thể xóa đơn đặt sân này');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const action = newStatus === 'Confirmed' ? 'confirm' : newStatus === 'Cancelled' ? 'cancel' : null;
      if (action) {
        await api.patch(`/bookings/${id}/${action}`);
      } else {
        await api.patch(`/bookings/${id}`, { status: newStatus });
      }
      fetchBookings();
    } catch {
      alert('Không thể cập nhật trạng thái');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Confirmed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Completed': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Cancelled': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const filteredBookings = bookings.filter(b => 
    b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customerPhone?.includes(searchTerm)
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Lịch đặt sân</h1>
        <p className="text-slate-500 font-medium mt-2">Quản lý và cập nhật trạng thái các yêu cầu đặt sân từ khách hàng.</p>
      </div>

      {/* DISTINCT FILTER BAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-3xl w-fit border border-slate-200 dark:border-slate-700 shadow-sm">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ duyệt' },
            { id: 'confirmed', label: 'Đã xác nhận' },
            { id: 'completed', label: 'Hoàn thành' },
          ].map((t) => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)}
              className={`px-8 py-3 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                tab === t.id 
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xl shadow-blue-500/10' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative group w-full xl:w-[400px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc số điện thoại..." 
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl py-4 pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Khách hàng</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thông tin đặt sân</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Tổng tiền</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Trạng thái xử lý</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-32 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Đang đồng bộ dữ liệu</p>
                  </div>
                </td>
              </tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-40 text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Calendar size={32} className="text-slate-200" />
                  </div>
                  <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Không có dữ liệu hiển thị</p>
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all duration-300">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-[1.25rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-500 shadow-sm">
                        {b.customerName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-white leading-tight">{b.customerName}</p>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1.5">
                          <Phone size={12} className="text-blue-500/50" /> {b.customerPhone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
                        <Activity size={16} className="text-blue-500" /> {b.pitchName}
                      </p>
                      <p className="text-xs font-medium text-slate-400 flex items-center gap-2.5">
                        <Clock size={16} className="text-slate-300" /> {b.startTime} - {b.endTime} | {b.bookingDate}
                      </p>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right font-black text-slate-900 dark:text-white text-lg">
                    {formatCurrency(b.totalAmount)}
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex justify-center">
                      <select 
                        value={b.status}
                        onChange={(e) => handleStatusUpdate(b.id, e.target.value)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border-2 outline-none cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm ${getStatusColor(b.status)}`}
                      >
                        <option value="Pending">Chờ duyệt</option>
                        <option value="Confirmed">Đã xác nhận</option>
                        <option value="Completed">Hoàn thành</option>
                        <option value="Cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button 
                      onClick={() => handleDelete(b.id)}
                      className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-red-500/10"
                      title="Xóa đơn"
                    >
                      <Trash2 size={22} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;
