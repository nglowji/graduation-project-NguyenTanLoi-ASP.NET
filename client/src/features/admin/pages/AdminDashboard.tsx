import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Eye,
  Loader2,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

type AdminStats = {
  totalUsers: number;
  activeOwners: number;
  platformCommission: number;
  pendingApprovals: number;
  userGrowth: number;
  commissionGrowth: number;
};

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: number;
  createdAt: string;
  isActive: boolean;
};

type PitchApproval = {
  id: string;
  pitchName: string;
  ownerName: string;
  ownerEmail: string;
  submittedAt: string;
  pitchType: string;
  address: string;
  status: string;
};

type UserTab = 'all' | 'owners' | 'customers';
type ApprovalTab = 'PendingApproval' | 'Active' | 'Inactive';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userTab, setUserTab] = useState<UserTab>('all');
  const [approvalTab, setApprovalTab] = useState<ApprovalTab>('PendingApproval');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [approvals, setApprovals] = useState<PitchApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [userTab, search]);

  useEffect(() => {
    fetchApprovals();
  }, [approvalTab]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const statsRes = await api.get('/dashboard/admin/stats') as AdminStats;
      setStats(statsRes);
    } catch {
      setError('Không thể tải dữ liệu thống kê admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const role = userTab === 'owners' ? 2 : userTab === 'customers' ? 1 : undefined;
      const res = await api.get('/admin/users', { params: { search: search || undefined, role, pageSize: 50 } }) as any;
      setUsers(Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []);
    } catch {
      setUsers([]);
    }
  };

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/admin/pitch-approvals', { params: { status: approvalTab } }) as any;
      setApprovals(Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []);
    } catch {
      setApprovals([]);
    }
  };

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/admin/pitch-approvals/${id}/${action}`);
      fetchApprovals();
      fetchDashboard();
    } catch {
      alert('Không thể thực hiện thao tác này.');
    }
  };

  const handleToggleUser = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      fetchUsers();
      fetchDashboard();
    } catch {
      alert('Không thể cập nhật trạng thái tài khoản.');
    }
  };

  const formatMoney = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const formatDate = (value?: string) => {
    if (!value) return '--/--/----';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
  };

  const roleLabel = (role: number) => {
    if (role === 3) return 'Admin';
    if (role === 2) return 'Chủ sân';
    if (role === 4) return 'Nhân viên';
    return 'Khách hàng';
  };

  const roleClass = (role: number) => {
    if (role === 3) return 'bg-indigo-50 text-indigo-700 ring-indigo-100';
    if (role === 2) return 'bg-blue-50 text-blue-700 ring-blue-100';
    if (role === 4) return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    return 'bg-slate-100 text-slate-600 ring-slate-200';
  };

  const approvalLabel = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('pending')) return 'Chờ duyệt';
    if (normalized.includes('active')) return 'Đã duyệt';
    if (normalized.includes('inactive')) return 'Đã từ chối';
    return status || 'Khác';
  };

  const roleStats = useMemo(() => {
    const customer = users.filter((item) => item.role === 1).length;
    const owner = users.filter((item) => item.role === 2).length;
    const admin = users.filter((item) => item.role === 3).length;
    const staff = users.filter((item) => item.role === 4).length;
    return [
      { label: 'Khách', value: customer, color: 'bg-slate-500' },
      { label: 'Chủ sân', value: owner, color: 'bg-blue-600' },
      { label: 'Nhân viên', value: staff, color: 'bg-emerald-600' },
      { label: 'Admin', value: admin, color: 'bg-indigo-600' },
    ];
  }, [users]);

  const totalLoadedUsers = Math.max(users.length, 1);
  const inactiveUsers = users.filter((item) => !item.isActive).length;
  const recentUsers = users.slice(0, 5);
  const pendingApprovals = approvals.filter((item) => String(item.status || '').toLowerCase().includes('pending'));

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={42} />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải tổng quan admin</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Admin control center</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Tổng quan hệ thống</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
              Xin chào {user?.fullName || 'Admin'}, đây là các số liệu thật từ hệ thống: người dùng, chủ sân, hoa hồng và hàng chờ duyệt.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Hàng chờ duyệt</p>
            <p className="mt-3 text-4xl font-black">{stats?.pendingApprovals || 0}</p>
            <p className="mt-2 text-sm font-semibold text-slate-300">Sân đang chờ admin kiểm tra và phê duyệt.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tải về</p>
                <p className="mt-1 text-xl font-black">{approvals.length}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Cần xử lý</p>
                <p className="mt-1 text-xl font-black">{pendingApprovals.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tổng người dùng', value: Number(stats?.totalUsers || 0).toLocaleString('vi-VN'), detail: `${stats?.userGrowth || 0}% so với tháng trước`, icon: <Users size={22} />, color: 'text-blue-600' },
          { label: 'Chủ sân hoạt động', value: Number(stats?.activeOwners || 0).toLocaleString('vi-VN'), detail: 'Tài khoản chủ sân đang hoạt động', icon: <UserCheck size={22} />, color: 'text-emerald-600' },
          { label: 'Hoa hồng tháng', value: formatMoney(stats?.platformCommission), detail: `${stats?.commissionGrowth || 0}% so với tháng trước`, icon: <DollarSign size={22} />, color: 'text-indigo-600' },
          { label: 'Chờ phê duyệt', value: Number(stats?.pendingApprovals || 0).toLocaleString('vi-VN'), detail: 'Sân đang ở trạng thái chờ', icon: <ShieldCheck size={22} />, color: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 ${item.color} dark:bg-slate-800`}>
              {item.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{item.value}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Quản lý người dùng</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Dữ liệu từ API `/admin/users`.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên hoặc email..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white md:w-[280px]"
                />
              </div>
              <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {([
                  ['all', 'Tất cả'],
                  ['owners', 'Chủ sân'],
                  ['customers', 'Khách'],
                ] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setUserTab(tab)}
                    className={`h-9 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest transition ${
                      userTab === tab ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.length === 0 ? (
              <div className="p-10 text-center text-sm font-bold text-slate-400">Không có người dùng phù hợp.</div>
            ) : users.map((item) => (
              <div key={item.id} className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_130px_120px_100px] md:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-600">
                    {(item.fullName?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">{item.fullName}</p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-400">{item.email}</p>
                  </div>
                </div>

                <span className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-[10px] font-black uppercase tracking-widest ring-1 ${roleClass(item.role)}`}>
                  {roleLabel(item.role)}
                </span>

                <span className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-[10px] font-black uppercase tracking-widest ring-1 ${
                  item.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-red-50 text-red-700 ring-red-100'
                }`}>
                  {item.isActive ? 'Hoạt động' : 'Tạm khóa'}
                </span>

                <div className="flex justify-end gap-2">
                  <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800" title="Xem chi tiết">
                    <Eye size={17} />
                  </button>
                  {item.role !== 3 && (
                    <button type="button" onClick={() => handleToggleUser(item.id)} className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-600 hover:text-white" title={item.isActive ? 'Tạm khóa' : 'Mở khóa'}>
                      <Ban size={17} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Phân bổ vai trò</h2>
                <p className="mt-1 text-xs font-bold text-slate-400">Tính từ danh sách đang tải.</p>
              </div>
              <BarChart3 className="text-blue-600" size={22} />
            </div>
            <div className="space-y-4">
              {roleStats.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-xs font-black">
                    <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                    <span className="text-slate-400">{item.value}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / totalLoadedUsers) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Tài khoản cần chú ý</h2>
                <p className="mt-1 text-xs font-bold text-slate-400">{inactiveUsers} tài khoản đang tạm khóa.</p>
              </div>
              <TrendingUp className="text-emerald-600" size={22} />
            </div>
            <div className="space-y-3">
              {recentUsers.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">{item.fullName}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{roleLabel(item.role)} · {formatDate(item.createdAt)}</p>
                  </div>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Phê duyệt sân</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">Dữ liệu từ API `/admin/pitch-approvals`.</p>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {([
              ['PendingApproval', 'Chờ duyệt'],
              ['Active', 'Đã duyệt'],
              ['Inactive', 'Đã từ chối'],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setApprovalTab(tab)}
                className={`h-9 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest transition ${
                  approvalTab === tab ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {approvals.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle2 size={42} className="mx-auto mb-3 text-emerald-500" />
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">Không có sân trong nhóm này</p>
              <p className="mt-1 text-xs font-bold text-slate-400">Đổi bộ lọc để xem trạng thái khác.</p>
            </div>
          ) : approvals.map((item) => (
            <div key={item.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_180px_150px_140px] lg:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950 dark:text-white">{item.pitchName}</p>
                <p className="mt-1 truncate text-xs font-bold text-slate-400">{item.ownerName} · {item.ownerEmail}</p>
                <p className="mt-1 truncate text-xs font-semibold text-slate-400">{item.address}</p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày gửi</p>
                <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(item.submittedAt)}</p>
              </div>

              <span className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 ring-1 ring-slate-200">
                {approvalLabel(item.status)}
              </span>

              <div className="flex justify-end gap-2">
                {String(item.status || '').toLowerCase().includes('pending') && (
                  <>
                    <button type="button" onClick={() => handleApproval(item.id, 'approve')} className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white" title="Duyệt">
                      <CheckCircle2 size={17} />
                    </button>
                    <button type="button" onClick={() => handleApproval(item.id, 'reject')} className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-600 hover:text-white" title="Từ chối">
                      <XCircle size={17} />
                    </button>
                  </>
                )}
                <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-slate-100 dark:bg-slate-800" title="Xem">
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
