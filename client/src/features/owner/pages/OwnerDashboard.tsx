import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, CalendarCheck, Users, TrendingUp, TrendingDown, MapPin,
  Star, CheckCircle, XCircle, Eye, Plus, ArrowUpRight, Loader2
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const fadeIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

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
    if (s === 'Confirmed') return 'bg-[#00C896]/10 text-[#00C896]';
    if (s === 'Pending') return 'bg-amber-500/10 text-amber-400';
    if (s === 'Completed') return 'bg-blue-500/10 text-blue-400';
    return 'bg-red-500/10 text-red-400';
  };
  const statusLabel = (s: string) => ({ Confirmed: 'Xác nhận', Pending: 'Chờ duyệt', Completed: 'Hoàn thành', Cancelled: 'Huỷ' }[s] || s);

  const pitchTypeLabel = (t: string) => ({
    Football5: 'Sân 5 người', Football7: 'Sân 7 người', Football11: 'Sân 11 người',
    Tennis: 'Tennis', Badminton: 'Cầu lông',
  }[t] || t);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#00C896]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Tổng quan sân bóng</h1>
          <p className="text-white/40 text-sm mt-1">
            Chào mừng, <span className="text-[#00C896] font-semibold">{user?.fullName}</span> • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#00C896] text-black rounded-xl text-sm font-bold hover:bg-[#00a07a] transition-colors self-start">
          <Plus size={16} /> Thêm sân mới
        </button>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Doanh thu tháng', value: formatCurrency(stats.totalRevenue), change: `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%`, up: stats.revenueChange >= 0, icon: <DollarSign size={20} />, color: 'from-[#00C896]/20 to-[#00C896]/5', iconColor: 'text-[#00C896]', border: 'border-[#00C896]/20' },
            { title: 'Lượt đặt sân', value: stats.totalBookings.toString(), change: `${stats.bookingsChange > 0 ? '+' : ''}${stats.bookingsChange}%`, up: stats.bookingsChange >= 0, icon: <CalendarCheck size={20} />, color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400', border: 'border-blue-500/20' },
            { title: 'Khách hàng mới', value: stats.newCustomers.toString(), change: '', up: true, icon: <Users size={20} />, color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400', border: 'border-amber-500/20' },
            { title: 'Đánh giá trung bình', value: `${stats.averageRating.toFixed(1)}★`, change: '', up: true, icon: <Star size={20} />, color: 'from-pink-500/20 to-pink-500/5', iconColor: 'text-pink-400', border: 'border-pink-500/20' },
          ].map((s, i) => (
            <motion.div key={s.title} variants={fadeIn} initial="hidden" animate="show" transition={{ delay: i * 0.08 }}
              className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 bg-white/5 rounded-xl ${s.iconColor}`}>{s.icon}</div>
                {s.change && (
                  <span className={`flex items-center gap-1 text-xs font-bold ${s.up ? 'text-[#00C896]' : 'text-red-400'}`}>
                    {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {s.change}
                  </span>
                )}
              </div>
              <p className="text-white/40 text-xs mb-1">{s.title}</p>
              <h3 className="text-2xl font-black text-white">{s.value}</h3>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-5 animate-pulse h-28" />
          ))}
        </div>
      )}

      {/* Bookings Management */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <CalendarCheck size={18} className="text-[#00C896]" /> Quản lý đơn đặt sân
          </h3>
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
            {(['upcoming', 'pending', 'completed'] as const).map(tab => (
              <button key={tab} onClick={() => setBookingTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${bookingTab === tab ? 'bg-[#00C896]/20 text-[#00C896]' : 'text-white/40 hover:text-white'}`}>
                {tab === 'upcoming' ? 'Sắp tới' : tab === 'pending' ? 'Chờ duyệt' : 'Hoàn thành'}
              </button>
            ))}
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <CalendarCheck size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Không có đơn nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5 hover:border-[#00C896]/20 transition-colors">
                <div className="flex gap-4 items-center min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/60 flex-shrink-0">
                    {b.customerName?.split(' ').pop()?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{b.customerName}</p>
                    <p className="text-xs text-white/40">{b.pitchName} • {b.bookingDate} • {b.startTime}–{b.endTime}</p>
                    <p className="text-xs text-white/25">{b.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-white">{formatCurrency(b.totalAmount)}</p>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${statusColor(b.status)}`}>{statusLabel(b.status)}</span>
                  </div>
                  {b.status === 'Pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => handleBookingAction(b.id, 'confirm')}
                        className="p-2 bg-[#00C896]/10 text-[#00C896] rounded-lg hover:bg-[#00C896]/20 border border-[#00C896]/20">
                        <CheckCircle size={15} />
                      </button>
                      <button onClick={() => handleBookingAction(b.id, 'cancel')}
                        className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-red-500/20">
                        <XCircle size={15} />
                      </button>
                    </div>
                  )}
                  <button className="p-2 hover:bg-white/5 text-white/30 hover:text-white rounded-lg">
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Pitches */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <MapPin size={18} className="text-blue-400" /> Sân của tôi
          </h3>
          <button className="flex items-center gap-1 text-xs text-[#00C896] font-semibold hover:underline">
            Quản lý <ArrowUpRight size={13} />
          </button>
        </div>

        {pitches.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <MapPin size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Chưa có sân nào. Hãy thêm sân đầu tiên!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pitches.map((p) => (
              <div key={p.id} className="p-4 bg-white/3 rounded-xl border border-white/5 hover:border-blue-500/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-white/40">{pitchTypeLabel(p.pitchType)}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${p.status === 'Active' ? 'bg-[#00C896]/10 text-[#00C896] border-[#00C896]/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
                    {p.status === 'Active' ? '● Hoạt động' : '○ Tạm dừng'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-white/3 rounded-lg">
                    <p className="text-sm font-bold text-white">{p.todayBookings}</p>
                    <p className="text-[10px] text-white/30">Đặt hôm nay</p>
                  </div>
                  <div className="text-center p-2 bg-white/3 rounded-lg">
                    <p className="text-sm font-bold text-[#00C896]">{formatCurrency(p.todayRevenue)}</p>
                    <p className="text-[10px] text-white/30">Doanh thu</p>
                  </div>
                  <div className="text-center p-2 bg-white/3 rounded-lg">
                    <p className="text-sm font-bold text-amber-400">{p.averageRating.toFixed(1)}★</p>
                    <p className="text-[10px] text-white/30">Đánh giá</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
