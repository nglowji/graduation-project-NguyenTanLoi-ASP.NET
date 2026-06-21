import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowRight, CalendarCheck2, CheckCircle2, CircleDollarSign,
  Clock3, Loader2, MapPinned, PackageCheck, RefreshCw, ShieldCheck, Store,
  TrendingDown, TrendingUp, Users,
} from 'lucide-react';
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
  userGrowth: number;
  commissionGrowth: number;
};

const number = (value?: number) => Number(value || 0).toLocaleString('vi-VN');
const money = (value?: number) => `${number(value)}đ`;

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingServices, setPendingServices] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, serviceRes] = await Promise.all([
        api.get('/dashboard/admin/stats') as Promise<AdminStats>,
        api.get('/admin/service-approvals', { params: { status: 'pending' } }) as Promise<any[]>,
      ]);
      setStats(statsRes);
      setPendingServices(Array.isArray(serviceRes) ? serviceRes.length : 0);
    } catch {
      setError('Không thể tải tổng quan quản trị. Vui lòng kiểm tra kết nối API và quyền admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const urgent = useMemo(() => [
    {
      label: 'Hồ sơ và sân chờ duyệt',
      value: stats?.pendingApprovals || 0,
      detail: 'Kiểm tra trước khi nội dung được công khai.',
      icon: ShieldCheck,
      path: '/dashboard/admin/approvals',
      tone: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Dịch vụ chờ duyệt',
      value: pendingServices,
      detail: 'Xác minh dịch vụ trước khi chủ sân bán.',
      icon: PackageCheck,
      path: '/dashboard/admin/moderation',
      tone: 'text-blue-700 bg-blue-50',
    },
  ], [stats?.pendingApprovals, pendingServices]);

  const metrics = [
    { label: 'Người dùng', value: number(stats?.totalUsers), detail: 'Tài khoản trên hệ thống', growth: stats?.userGrowth, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Chủ sân', value: number(stats?.totalOwners), detail: `${number(stats?.activeOwners)} đang hoạt động`, icon: Store, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Sân thể thao', value: number(stats?.totalPitches), detail: 'Bao gồm mọi trạng thái', icon: MapPinned, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Lượt đặt sân', value: number(stats?.totalBookings), detail: 'Tổng đơn trên nền tảng', icon: CalendarCheck2, color: 'text-violet-600 bg-violet-50' },
    { label: 'Hoa hồng tháng', value: money(stats?.platformCommission), detail: 'Doanh thu nền tảng', growth: stats?.commissionGrowth, icon: CircleDollarSign, color: 'text-orange-600 bg-orange-50' },
  ];

  if (loading) {
    return <div className="flex min-h-[420px] flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-blue-600" size={40} /><p className="text-xs font-black uppercase tracking-widest text-slate-400">Đang tổng hợp dữ liệu hệ thống</p></div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-16">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            <ShieldCheck size={17} /> Trung tâm điều hành
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Chào {user?.fullName || 'Admin'}, hệ thống hôm nay thế nào?</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Theo dõi quy mô nền tảng và ưu tiên những nội dung đang chờ xử lý.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:border-blue-200 hover:text-blue-700">
          <RefreshCw size={16} /> Làm mới dữ liệu
        </button>
      </header>

      {error && <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertCircle size={20} />{error}</div>}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-widest text-amber-600">Ưu tiên hôm nay</p><h2 className="mt-1 text-xl font-black text-slate-950">Việc cần xử lý</h2></div>
          <span className="text-xs font-bold text-slate-400">{urgent.reduce((sum, item) => sum + item.value, 0)} mục đang chờ</span>
        </div>
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
          {urgent.map((item, index) => {
            const Icon = item.icon;
            return <button key={item.label} onClick={() => navigate(item.path)} className={`group flex items-center gap-4 p-5 text-left transition hover:bg-slate-50 ${index ? 'border-t border-slate-200 lg:border-l lg:border-t-0' : ''}`}>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${item.tone}`}><Icon size={22} /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><b className="text-2xl text-slate-950">{item.value}</b>{item.value > 0 && <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-red-600">Cần xử lý</span>}</span><span className="mt-1 block text-sm font-black text-slate-800">{item.label}</span><span className="mt-1 block truncate text-xs font-semibold text-slate-400">{item.detail}</span></span>
              <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
            </button>;
          })}
        </div>
      </section>

      <section>
        <div className="mb-4"><p className="text-xs font-black uppercase tracking-widest text-blue-600">Toàn cảnh nền tảng</p><h2 className="mt-1 text-xl font-black text-slate-950">Chỉ số hệ thống</h2></div>
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((item, index) => {
            const Icon = item.icon;
            const growth = Number(item.growth || 0);
            return <article key={item.label} className={`p-5 ${index ? 'border-t border-slate-200 sm:border-l xl:border-t-0' : ''}`}>
              <div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${item.color}`}><Icon size={19} /></span>{item.growth !== undefined && <span className={`flex items-center gap-1 text-[10px] font-black ${growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{growth >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(growth)}%</span>}</div>
              <p className="mt-5 text-2xl font-black text-slate-950">{item.value}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-500">{item.label}</p>
              <p className="mt-2 text-xs font-semibold text-slate-400">{item.detail}</p>
            </article>;
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Kiểm soát nội dung</p><h2 className="mt-1 text-lg font-black text-slate-950">Quy trình xuất bản</h2></div><Clock3 className="text-blue-600" size={22} /></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[['1', 'Chủ sân gửi nội dung'], ['2', 'Admin kiểm tra'], ['3', 'Xuất hiện công khai']].map(([step, label]) => <div key={step} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-blue-700 shadow-sm">{step}</span><span className="text-xs font-bold text-slate-600">{label}</span></div>)}
          </div>
        </div>
        <button type="button" onClick={() => navigate('/dashboard/admin/moderation')} className="group flex items-center gap-4 rounded-2xl bg-blue-600 p-5 text-left text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/15"><CheckCircle2 size={23} /></span>
          <span className="flex-1"><span className="block text-xs font-black uppercase tracking-widest text-blue-100">Truy cập nhanh</span><span className="mt-1 block text-lg font-black">Mở trung tâm kiểm duyệt</span></span>
          <ArrowRight size={20} className="transition group-hover:translate-x-1" />
        </button>
      </section>
    </div>
  );
};

export default AdminDashboard;
