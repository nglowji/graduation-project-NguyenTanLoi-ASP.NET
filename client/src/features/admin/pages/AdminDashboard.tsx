import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarCheck2, CircleDollarSign, Loader2, MapPinned, ShieldCheck, Store, Users, ArrowRight, Flag, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const number = (value?: number) => Number(value || 0).toLocaleString('vi-VN');
const money = (value?: number) => `${number(value)}đ`;

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingServices, setPendingServices] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, serviceRes, reviewRes] = await Promise.all([
          api.get('/dashboard/admin/stats') as Promise<AdminStats>,
          api.get('/admin/service-approvals', { params: { status: 'pending' } }) as Promise<any[]>,
          api.get('/admin/reviews', { params: { pageSize: 1 } }) as Promise<any>,
        ]);
        setStats(statsRes);
        setPendingServices(serviceRes.length || 0);
        setPendingReviews(reviewRes?.totalCount || 0);
      } catch {
        setError('Không thể tải tổng quan admin. Kiểm tra quyền admin và API.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const urgent = useMemo(() => [
    { label: 'Sân và hồ sơ chờ duyệt', value: stats?.pendingApprovals || 0, detail: 'Chủ sân tạo sân phải được admin duyệt trước khi xuất hiện trên web.', icon: ShieldCheck, path: '/dashboard/admin/approvals', tone: 'border-amber-200 bg-amber-50 text-amber-900' },
    { label: 'Dịch vụ chờ duyệt', value: pendingServices, detail: 'Dịch vụ mới chưa bán được cho đến khi admin xác nhận.', icon: PackageCheck, path: '/dashboard/admin/moderation', tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
    { label: 'Đánh giá cần theo dõi', value: pendingReviews, detail: 'Admin có thể rà soát và xóa đánh giá vi phạm.', icon: Flag, path: '/dashboard/admin/moderation', tone: 'border-rose-200 bg-rose-50 text-rose-900' },
  ], [stats?.pendingApprovals, pendingServices, pendingReviews]);

  const metrics = [
    { label: 'Người dùng', value: number(stats?.totalUsers), detail: 'Tất cả tài khoản', icon: Users, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Chủ sân', value: number(stats?.totalOwners), detail: `${number(stats?.activeOwners)} đang hoạt động`, icon: Store, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { label: 'Sân', value: number(stats?.totalPitches), detail: 'Chỉ sân được duyệt mới hiển thị công khai', icon: MapPinned, tone: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
    { label: 'Lượt đặt', value: number(stats?.totalBookings), detail: 'Tổng đơn đặt phát sinh', icon: CalendarCheck2, tone: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { label: 'Doanh thu nền tảng', value: money(stats?.platformCommission), detail: 'Hoa hồng nếu có thu phí', icon: CircleDollarSign, tone: 'bg-slate-100 text-slate-700 border-slate-200' },
  ];

  if (loading) {
    return <div className="flex min-h-[420px] flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-blue-700" size={42} /><p className="text-xs font-black uppercase tracking-widest text-slate-400">Đang tải tổng quan admin</p></div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-2xl border border-blue-200 bg-blue-700 p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-blue-100">System control</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">Tổng quan admin</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-100">Xin chào {user?.fullName || 'Admin'}, đây là màn hình điều phối những việc ảnh hưởng trực tiếp đến dữ liệu công khai của nền tảng.</p>
          </div>
          <button onClick={() => navigate('/dashboard/admin/moderation')} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-blue-700 hover:bg-blue-50">Vào kiểm duyệt <ArrowRight size={17} /></button>
        </div>
      </section>

      {error && <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertCircle size={20} />{error}</div>}

      <section>
        <h2 className="mb-3 text-xl font-black text-slate-950">Nhắc nhở cần xử lý</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {urgent.map((item) => {
            const Icon = item.icon;
            return <button key={item.label} onClick={() => navigate(item.path)} className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${item.tone}`}><div className="flex items-center justify-between"><Icon size={24} /><span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">NEW</span></div><p className="mt-5 text-3xl font-black">{item.value}</p><h3 className="mt-2 font-black">{item.label}</h3><p className="mt-2 text-sm font-semibold leading-6 opacity-80">{item.detail}</p></button>;
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((item) => {
          const Icon = item.icon;
          return <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${item.tone}`}><Icon size={22} /></div><p className="text-xs font-black uppercase tracking-widest text-slate-400">{item.label}</p><p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p><p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.detail}</p></article>;
        })}
      </section>
    </div>
  );
};

export default AdminDashboard;
