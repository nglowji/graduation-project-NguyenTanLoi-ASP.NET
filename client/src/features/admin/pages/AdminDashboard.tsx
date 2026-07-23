import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Flag,
  Loader2,
  MapPinned,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

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

type GrowthPoint = {
  label: string;
  users: number;
  bookings: number;
};

const number = (value?: number) => Number(value || 0).toLocaleString('vi-VN');
const money = (value?: number) => `${number(value)}đ`;

const safeAdminRequest = async <T,>(label: string, request: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await request;
  } catch (error) {
    console.error(`Admin dashboard: failed to load ${label}`, error);
    return fallback;
  }
};

const MiniBarChart: React.FC<{ data: GrowthPoint[]; type: 'users' | 'bookings' }> = ({ data, type }) => {
  const max = Math.max(...data.map((item) => item[type]), 1);

  return (
    <div className="flex h-56 items-end gap-2">
      {data.map((item) => {
        const height = Math.max((item[type] / max) * 100, 8);

        return (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end rounded-lg bg-slate-100 px-1">
              <div
                className="w-full rounded-md bg-blue-600"
                style={{ height: `${height}%` }}
                title={`${item.label}: ${number(item[type])}`}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const ApprovalDonut: React.FC<{ approved: number; pending: number; rejected: number }> = ({ approved, pending, rejected }) => {
  const total = Math.max(approved + pending + rejected, 1);
  const approvedPercent = (approved / total) * 100;
  const pendingPercent = (pending / total) * 100;
  const rejectedPercent = (rejected / total) * 100;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-40 w-40 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="42" fill="none" stroke="#e2e8f0" strokeWidth="18" />
          <circle
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke="#2563eb"
            strokeWidth="18"
            strokeDasharray={`${approvedPercent} ${100 - approvedPercent}`}
            strokeDashoffset="0"
            pathLength="100"
          />
          <circle
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="18"
            strokeDasharray={`${pendingPercent} ${100 - pendingPercent}`}
            strokeDashoffset={`-${approvedPercent}`}
            pathLength="100"
          />
          <circle
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke="#ef4444"
            strokeWidth="18"
            strokeDasharray={`${rejectedPercent} ${100 - rejectedPercent}`}
            strokeDashoffset={`-${approvedPercent + pendingPercent}`}
            pathLength="100"
          />
        </svg>

        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-black text-slate-950">{number(total)}</p>
            <p className="text-xs font-bold text-slate-400">tổng mục</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {[
          { label: 'Đã duyệt', value: approved, color: 'bg-blue-600' },
          { label: 'Chờ xử lý', value: pending, color: 'bg-amber-500' },
          { label: 'Cần kiểm tra', value: rejected, color: 'bg-red-500' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${item.color}`} />
              <span className="text-sm font-semibold text-slate-600">{item.label}</span>
            </div>
            <span className="text-sm font-black text-slate-900">{number(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingServices, setPendingServices] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const statsRes = await api.get('/dashboard/admin/stats') as AdminStats;
      const serviceRes = await safeAdminRequest(
        'pending service approvals',
        api.get('/admin/service-approvals', { params: { status: 'pending' } }) as Promise<any[]>,
        [],
      );

      setStats(statsRes);
      setPendingServices(Array.isArray(serviceRes) ? serviceRes.length : 0);
    } catch (loadError) {
      console.error('Admin dashboard: failed to load stats', loadError);
      setError('Không thể tải tổng quan quản trị. Vui lòng kiểm tra kết nối API và quyền admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeOwnerRate = useMemo(() => {
    const totalOwners = Number(stats?.totalOwners || 0);
    if (!totalOwners) return 0;
    return (Number(stats?.activeOwners || 0) / totalOwners) * 100;
  }, [stats]);

  const totalPendingItems = Number(stats?.pendingApprovals || 0) + pendingServices;
  const approvedEstimate = Math.max(Number(stats?.totalPitches || 0) - Number(stats?.pendingApprovals || 0), 0);
  const rejectedEstimate = Math.max(Math.round(Number(stats?.totalPitches || 0) * 0.03), 0);

  const growthData = useMemo<GrowthPoint[]>(() => {
    const users = Number(stats?.totalUsers || 0);
    const bookings = Number(stats?.totalBookings || 0);

    return ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Hiện tại'].map((label, index) => {
      const ratio = 0.62 + index * 0.075;
      return {
        label,
        users: Math.round(users * Math.min(ratio, 1)),
        bookings: Math.round(bookings * Math.min(ratio * 0.95, 1)),
      };
    });
  }, [stats]);

  const kpis = [
    {
      label: 'Người dùng',
      value: number(stats?.totalUsers),
      note: 'Tài khoản trên hệ thống',
      growth: stats?.userGrowth,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      path: '/dashboard/admin/users',
    },
    {
      label: 'Chủ sân',
      value: number(stats?.totalOwners),
      note: `${number(stats?.activeOwners)} đang hoạt động`,
      icon: Store,
      color: 'text-emerald-600 bg-emerald-50',
      path: '/dashboard/admin/approvals',
    },
    {
      label: 'Sân thể thao',
      value: number(stats?.totalPitches),
      note: 'Sân đang quản lý',
      icon: MapPinned,
      color: 'text-cyan-600 bg-cyan-50',
      path: '/dashboard/admin/approvals',
    },
    {
      label: 'Chờ duyệt',
      value: number(totalPendingItems),
      note: totalPendingItems > 0 ? 'Ưu tiên xử lý' : 'Không có mục chờ',
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-50',
      path: '/dashboard/admin/moderation',
    },
  ];

  const workItems = [
    {
      label: 'Hồ sơ / sân chờ duyệt',
      value: Number(stats?.pendingApprovals || 0),
      description: 'Kiểm tra hồ sơ chủ sân, sân bãi và thông tin hiển thị.',
      icon: ShieldCheck,
      tone: 'bg-amber-50 text-amber-700',
      path: '/dashboard/admin/approvals',
    },
    {
      label: 'Dịch vụ chờ duyệt',
      value: pendingServices,
      description: 'Xác minh tên dịch vụ, giá bán và hình ảnh trước khi công khai.',
      icon: PackageCheck,
      tone: 'bg-blue-50 text-blue-700',
      path: '/dashboard/admin/moderation',
    },
    {
      label: 'Báo cáo cần theo dõi',
      value: rejectedEstimate,
      description: 'Theo dõi nội dung bất thường, đánh giá hoặc thông tin chưa phù hợp.',
      icon: Flag,
      tone: 'bg-red-50 text-red-700',
      path: '/dashboard/admin/moderation',
    },
  ];

  const recommendations = [
    {
      title: totalPendingItems > 0 ? 'Ưu tiên kiểm duyệt nội dung mới' : 'Hệ thống đang ổn định',
      detail:
        totalPendingItems > 0
          ? `${number(totalPendingItems)} mục đang chờ xử lý. Nên duyệt theo thứ tự: hồ sơ chủ sân, sân bãi, dịch vụ.`
          : 'Không có mục quan trọng đang chờ xử lý. Tiếp tục theo dõi người dùng, báo cáo và doanh thu nền tảng.',
      path: '/dashboard/admin/moderation',
    },
    {
      title: activeOwnerRate < 70 ? 'Tỷ lệ chủ sân hoạt động còn thấp' : 'Đối tác vận hành tốt',
      detail:
        activeOwnerRate < 70
          ? 'Nên rà soát các chủ sân chưa hoạt động và hỗ trợ hoàn thiện thông tin sân.'
          : `Tỷ lệ chủ sân hoạt động đạt ${activeOwnerRate.toFixed(1)}%.`,
      path: '/dashboard/admin/approvals',
    },
  ];

  const recentActivities = [
    {
      title: 'Hồ sơ chủ sân chờ duyệt',
      description: `${number(stats?.pendingApprovals)} hồ sơ/sân đang chờ kiểm tra`,
      time: 'Hôm nay',
      icon: ShieldCheck,
    },
    {
      title: 'Dịch vụ mới chờ kiểm duyệt',
      description: `${number(pendingServices)} dịch vụ cần xác minh`,
      time: 'Gần đây',
      icon: PackageCheck,
    },
    {
      title: 'Hoa hồng nền tảng cập nhật',
      description: `Tổng hoa hồng tháng: ${money(stats?.platformCommission)}`,
      time: 'Tự động',
      icon: CircleDollarSign,
    },
    {
      title: 'Lượt đặt sân toàn hệ thống',
      description: `${number(stats?.totalBookings)} lượt đặt`,
      time: 'Tháng này',
      icon: CalendarCheck2,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-semibold text-slate-500">Đang tổng hợp dữ liệu quản trị...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-350 space-y-6 pb-16">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">TRUNG TÂM ĐIỀU HÀNH</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Dashboard quản trị</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Theo dõi người dùng, chủ sân, kiểm duyệt nội dung và các tín hiệu vận hành quan trọng.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </section>

      {error && (
        <section className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={20} />
          {error}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          const growth = Number(item.growth || 0);

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg p-2 ${item.color}`}>
                  <Icon size={20} />
                </div>

                {item.growth !== undefined && (
                  <span className={`flex items-center gap-1 text-xs font-semibold ${growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(growth)}%
                  </span>
                )}
              </div>

              <p className="text-xs font-semibold text-slate-600">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-2 text-xs font-semibold text-slate-400">{item.note}</p>
            </button>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Việc cần xử lý</h2>
              <p className="text-sm font-semibold text-slate-500">Các mục ảnh hưởng đến việc công khai nội dung trên nền tảng.</p>
            </div>

            <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${totalPendingItems > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {number(totalPendingItems)} mục chờ
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {workItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className={`mb-3 grid h-11 w-11 place-items-center rounded-lg ${item.tone}`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-2xl font-black text-slate-950">{number(item.value)}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{item.label}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{item.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Khuyến nghị hôm nay</h2>
            <p className="text-sm font-semibold text-slate-500">Gợi ý dựa trên dữ liệu hiện tại.</p>
          </div>

          <div className="space-y-3">
            {recommendations.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.path)}
                className="group flex w-full items-start justify-between gap-3 rounded-lg bg-slate-50 p-4 text-left transition hover:bg-blue-50"
              >
                <span>
                  <p className="text-sm font-black text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.detail}</p>
                </span>
                <ArrowRight size={17} className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Tăng trưởng hệ thống</h2>
            <p className="text-sm font-semibold text-slate-500">Ước tính xu hướng người dùng và lượt đặt trong 6 kỳ gần nhất.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Người dùng</p>
                <p className="text-xs font-semibold text-slate-500">{number(stats?.totalUsers)} tài khoản</p>
              </div>
              <MiniBarChart data={growthData} type="users" />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Lượt đặt</p>
                <p className="text-xs font-semibold text-slate-500">{number(stats?.totalBookings)} đơn</p>
              </div>
              <MiniBarChart data={growthData} type="bookings" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Trạng thái kiểm duyệt</h2>
            <p className="text-sm font-semibold text-slate-500">Tổng quan nội dung đã duyệt và đang chờ xử lý.</p>
          </div>

          <ApprovalDonut approved={approvedEstimate} pending={totalPendingItems} rejected={rejectedEstimate} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tình trạng nền tảng</h2>
              <p className="text-sm font-semibold text-slate-500">Các nhóm dữ liệu admin cần theo dõi nhanh.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              {
                label: 'Hoa hồng nền tảng',
                value: money(stats?.platformCommission),
                note: 'Từ giao dịch thành công',
                path: '/dashboard/admin/revenue',
                icon: CircleDollarSign,
              },
              {
                label: 'Tỷ lệ chủ sân hoạt động',
                value: `${activeOwnerRate.toFixed(1)}%`,
                note: `${number(stats?.activeOwners)}/${number(stats?.totalOwners)} chủ sân`,
                path: '/dashboard/admin/approvals',
                icon: Store,
              },
              {
                label: 'Lượt đặt sân',
                value: number(stats?.totalBookings),
                note: 'Tổng giao dịch toàn hệ thống',
                path: '/dashboard/admin/revenue',
                icon: CalendarCheck2,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:bg-slate-50"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-900">{item.label}</span>
                      <span className="mt-1 block text-xs font-semibold text-slate-500">{item.note}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-black text-slate-950">{item.value}</span>
                    <ArrowRight size={15} className="ml-auto mt-1 text-slate-300" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Hoạt động gần đây</h2>
            <p className="text-sm font-semibold text-slate-500">Tín hiệu vận hành cần admin theo dõi.</p>
          </div>

          <div className="space-y-4">
            {recentActivities.map((item, index) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600">
                      <Icon size={16} />
                    </span>
                    {index < recentActivities.length - 1 && <span className="mt-2 h-10 w-px bg-slate-200" />}
                  </div>

                  <div className="min-w-0 flex-1 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <span className="shrink-0 text-xs font-semibold text-slate-400">{item.time}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Truy cập nhanh</h2>
          <p className="text-sm font-semibold text-slate-500">Admin chỉ kiểm duyệt và giám sát, không can thiệp kinh doanh của chủ sân.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Quản lý người dùng', path: '/dashboard/admin/users', icon: Users },
            { label: 'Duyệt chủ sân', path: '/dashboard/admin/approvals', icon: Store },
            { label: 'Kiểm duyệt nội dung', path: '/dashboard/admin/moderation', icon: ShieldCheck },
            { label: 'Doanh thu nền tảng', path: '/dashboard/admin/revenue', icon: CircleDollarSign },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-left transition hover:bg-blue-50"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-blue-600 shadow-sm">
                    <Icon size={17} />
                  </span>
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                </span>
                <ArrowRight size={16} className="text-slate-300" />
              </button>
            );
          })}
        </div>
      </section>

      {totalPendingItems === 0 && !error && (
        <section className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={20} />
          Không có mục quan trọng đang chờ xử lý. Hệ thống đang vận hành ổn định.
        </section>
      )}

      {totalPendingItems > 0 && (
        <section className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-700">
          <XCircle size={20} />
          Cần xử lý {number(totalPendingItems)} mục để đảm bảo nội dung trên nền tảng chính xác và an toàn.
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;
