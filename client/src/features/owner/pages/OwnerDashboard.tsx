import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, CalendarCheck, Users, TrendingUp, TrendingDown, MapPin,
  Star, CheckCircle, XCircle, Eye, Plus, ArrowUpRight, Loader2,
  Clock, Activity, ChevronRight, Filter, Search
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const fadeIn = { 
  hidden: { opacity: 0, y: 20 }, 
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } 
};

const stagger = {
  show: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  newCustomers: number;
  averageRating: number;
  revenueChange: number;
  bookingsChange: number;
}

interface BookingItem {
  id: string;
  customerName: string;
  customerPhone: string;
  pitchName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
}

interface PitchItem {
  id: string;
  name: string;
  pitchType: string;
  status: string;
  todayBookings: number;
  todayRevenue: number;
  averageRating: number;
}

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingTab, setBookingTab] = useState<'upcoming' | 'pending' | 'completed'>('upcoming');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [pitches, setPitches] = useState<PitchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [bookingTab]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, pitchesRes] = await Promise.all([
        api.get('/dashboard/owner/stats'),
        api.get('/pitches/my'),
      ]);
      setStats(statsRes.data);
      setPitches(pitchesRes.data);
    } catch (err) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const statusMap = { upcoming: 'confirmed', pending: 'pending', completed: 'completed' };
      const res = await api.get('/bookings/owner', { params: { status: statusMap[bookingTab] } });
      setBookings(res.data?.items || res.data || []);
    } catch {
      setBookings([]);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'cancel') => {
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      fetchBookings();
    } catch {
      alert('Không thể thực hiện thao tác này.');
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const statusColor = (s: string) => {
    if (s === 'Confirmed') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (s === 'Pending') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (s === 'Completed') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };
  
  const statusLabel = (s: string) => ({ 
    Confirmed: 'Đã xác nhận', 
    Pending: 'Chờ duyệt', 
    Completed: 'Hoàn thành', 
    Cancelled: 'Đã hủy' 
  }[s] || s);

  const pitchTypeLabel = (t: string) => ({
    Football5: 'Sân 5 người', Football7: 'Sân 7 người', Football11: 'Sân 11 người',
    Tennis: 'Tennis', Badminton: 'Cầu lông',
  }[t] || t);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-600/10 border-t-blue-600 animate-spin" />
          <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
        </div>
        <p className="text-white/40 font-bold animate-pulse uppercase tracking-widest text-xs">Đang đồng bộ dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-[0.2em] text-[10px] mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Bảng điều khiển chủ sân
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Chào buổi sáng, {user?.fullName?.split(' ').pop()}!</h1>
          <p className="text-white/40 text-sm mt-2 font-medium">
            Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}. Chúc bạn một ngày kinh doanh thuận lợi.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-sm font-bold transition-all">
            <Filter size={18} /> Lọc dữ liệu
          </button>
          <button 
            onClick={() => navigate('/owner/pitches')}
            className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Thêm sân bãi
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3">
          <XCircle size={18} /> {error}
        </motion.div>
      )}

      {/* Main Statistics Grid */}
      <motion.div 
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { title: 'Doanh thu tháng', value: formatCurrency(stats?.totalRevenue || 0), change: `${stats?.revenueChange || 0}%`, up: (stats?.revenueChange || 0) >= 0, icon: <DollarSign size={24} />, color: 'from-blue-600 to-indigo-700' },
          { title: 'Lượt đặt sân', value: (stats?.totalBookings || 0).toString(), change: `${stats?.bookingsChange || 0}%`, up: (stats?.bookingsChange || 0) >= 0, icon: <CalendarCheck size={24} />, color: 'from-blue-500 to-indigo-600' },
          { title: 'Khách hàng mới', value: (stats?.newCustomers || 0).toString(), change: '+12%', up: true, icon: <Users size={24} />, color: 'from-amber-500 to-orange-600' },
          { title: 'Đánh giá trung bình', value: `${(stats?.averageRating || 0).toFixed(1)} ★`, change: 'Top 5%', up: true, icon: <Star size={24} />, color: 'from-rose-500 to-pink-600' },
        ].map((s, i) => (
          <motion.div 
            key={s.title} 
            variants={fadeIn}
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
            className="relative group bg-[#1a1c26] border border-white/5 rounded-3xl p-6 overflow-hidden transition-all"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.color} opacity-[0.03] rounded-bl-[5rem] group-hover:opacity-[0.08] transition-opacity`} />
            
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg shadow-black/20`}>
                {s.icon}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black ${s.up ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {s.change}
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{s.title}</p>
              <h3 className="text-2xl font-black text-white tracking-tight">{s.value}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Chart & Bookings */}
        <div className="xl:col-span-2 space-y-8">
          
          <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Hiệu suất doanh thu</h3>
                <p className="text-white/40 text-xs mt-1">Dữ liệu doanh thu thời gian thực</p>
              </div>
            </div>
            
            <div className="h-48 w-full flex items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
              <div className="text-center">
                <Activity size={32} className="mx-auto mb-3 text-white/5" />
                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Đang tính toán hiệu suất kinh doanh...</p>
              </div>
            </div>
          </motion.div>

          {/* Bookings Management */}
          <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                  <CalendarCheck size={20} />
                </div>
                <h3 className="font-black text-xl text-white tracking-tight">Lịch đặt sân gần đây</h3>
              </div>
              
              <div className="flex p-1 bg-white/5 rounded-2xl self-start">
                {(['upcoming', 'pending', 'completed'] as const).map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setBookingTab(tab)}
                    className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                      bookingTab === tab 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {tab === 'upcoming' ? 'Sắp tới' : tab === 'pending' ? 'Chờ duyệt' : 'Đã xong'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <AnimatePresence mode="wait">
                {bookings.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-20 bg-white/2 rounded-[2rem] border border-dashed border-white/5"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock size={24} className="text-white/10" />
                    </div>
                    <p className="text-white/20 font-bold text-sm tracking-wide">Hiện chưa có đơn nào trong mục này</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b, index) => (
                      <motion.div 
                        key={b.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#1e202b] rounded-[1.5rem] border border-white/5 hover:border-blue-600/30 transition-all hover:bg-[#232635]"
                      >
                        <div className="flex gap-4 items-center mb-4 sm:mb-0">
                          <div className={`w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center text-sm font-black text-blue-500 shadow-lg`}>
                            {b.customerName?.split(' ').pop()?.[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{b.customerName}</span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black border uppercase tracking-wider ${statusColor(b.status)}`}>
                                {statusLabel(b.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-bold text-white/30 flex items-center gap-1.5 uppercase tracking-widest">
                                <Activity size={10} /> {b.pitchName}
                              </span>
                              <span className="text-[10px] font-bold text-white/30 flex items-center gap-1.5 uppercase tracking-widest">
                                <Clock size={10} /> {b.startTime} - {b.endTime}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-6 pl-12 sm:pl-0">
                          <div className="text-right">
                            <p className="text-xs font-bold text-white/30 uppercase tracking-[0.1em] mb-0.5">Tổng cộng</p>
                            <p className="font-black text-blue-500 text-lg leading-none">{formatCurrency(b.totalAmount)}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {b.status === 'Pending' && (
                              <>
                                <button 
                                  onClick={() => handleBookingAction(b.id, 'confirm')}
                                  className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
                                  title="Xác nhận"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button 
                                  onClick={() => handleBookingAction(b.id, 'cancel')}
                                  className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                                  title="Từ chối"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                            <button className="w-10 h-10 bg-white/5 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center justify-center">
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Pitches & More */}
        <div className="space-y-8">
          <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-xl text-white tracking-tight">Sân của tôi</h3>
              <button 
                onClick={() => navigate('/owner/pitches')}
                className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline flex items-center gap-1.5"
              >
                Xem tất cả <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="space-y-4">
              {pitches.length === 0 ? (
                <div className="text-center py-10 bg-white/2 rounded-3xl border border-dashed border-white/5">
                  <MapPin size={24} className="mx-auto mb-2 text-white/10" />
                  <p className="text-xs text-white/20 font-bold">Chưa có sân bãi</p>
                </div>
              ) : (
                pitches.map((p) => (
                  <div key={p.id} className="p-5 bg-[#1e202b] rounded-[1.5rem] border border-white/5 hover:border-blue-600/20 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-black text-white group-hover:text-blue-500 transition-colors">{p.name}</h4>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">{pitchTypeLabel(p.pitchType)}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${p.status === 'Active' ? 'bg-blue-600 shadow-[0_0_10px_#2563eb]' : 'bg-white/10'}`} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white/3 rounded-2xl">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Hôm nay</p>
                        <p className="text-sm font-black text-white">{p.todayBookings} lượt</p>
                      </div>
                      <div className="p-3 bg-white/3 rounded-2xl">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Xếp hạng</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-black text-amber-400">{p.averageRating.toFixed(1)}</p>
                          <Star size={10} className="text-amber-400 fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-2">Tăng doanh thu?</h3>
              <p className="text-white/60 text-sm font-bold leading-relaxed mb-6 uppercase tracking-widest">Cập nhật bảng giá linh hoạt để thu hút khách hàng mới.</p>
              <button 
                onClick={() => navigate('/owner/pitches')}
                className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all"
              >
                Quản lý sân ngay
              </button>
            </div>
            <Activity className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
