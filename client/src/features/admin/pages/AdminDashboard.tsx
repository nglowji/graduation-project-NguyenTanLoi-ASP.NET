import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck2,
  CircleDollarSign,
  Loader2,
  MapPinned,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

type AdminStats = {
  totalUsers: number;
  totalOwners: number;
  totalPitches: number;
  totalBookings: number;
  activeOwners: number;
  platformCommission: number;
  pendingApprovals: number;
};

const formatNumber = (value?: number) => Number(value || 0).toLocaleString('vi-VN');
const formatMoney = (value?: number) => `${formatNumber(value)}d`;

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await api.get('/dashboard/admin/stats') as AdminStats;
        setStats(res);
      } catch {
        setError('Không thể tải thống kê tổng quan admin.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={42} />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải tổng quan hệ thống</p>
      </div>
    );
  }

  const cards = [
    { label: 'Tổng số người dùng', value: formatNumber(stats?.totalUsers), detail: 'Tất cả tài khoản trên hệ thống', icon: Users, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Tổng số chủ sân', value: formatNumber(stats?.totalOwners ?? stats?.activeOwners), detail: `${formatNumber(stats?.activeOwners)} chủ sân đang hoạt động`, icon: Store, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { label: 'Tổng số sân', value: formatNumber(stats?.totalPitches), detail: `${formatNumber(stats?.pendingApprovals)} hồ sơ/sân chờ duyệt`, icon: MapPinned, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
    { label: 'Tổng số lượt đặt', value: formatNumber(stats?.totalBookings), detail: 'Tất cả đơn đặt đã phát sinh', icon: CalendarCheck2, tone: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
    { label: 'Doanh thu nền tảng', value: formatMoney(stats?.platformCommission), detail: 'Hoa hồng tháng hiện tại nếu có thu phí', icon: CircleDollarSign, tone: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { label: 'Cần admin xử lý', value: formatNumber(stats?.pendingApprovals), detail: 'Hồ sơ chủ sân hoặc sân mới chờ xác minh', icon: ShieldCheck, tone: 'bg-rose-50 text-rose-700 border-rose-100' },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">System admin</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Tổng quan hệ thống</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Xin chào {user?.fullName || 'Admin'}, trang này chỉ hiển thị số liệu tổng quan nền tảng. Các thao tác kiểm duyệt, phân quyền và hỗ trợ nằm ở menu riêng.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Việc cấp thiết</p>
            <p className="mt-3 text-4xl font-black text-indigo-950">{formatNumber(stats?.pendingApprovals)}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-indigo-700">
              Hồ sơ cần duyệt hoặc xác minh. Ưu tiên xử lý để chủ sân có thể vận hành đúng hạn.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${item.tone}`}>
                <Icon size={23} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{item.value}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.detail}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default AdminDashboard;
