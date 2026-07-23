import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Ban,
  Briefcase,
  CheckCircle,
  Crown,
  Eye,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  UserCheck,
  UserPlus,
  UserRound,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import api from '../../../services/api';

type UserRow = {
  id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role: number;
  isActive?: boolean;
  createdAt?: string;
  avatar?: string;
};

type UserTab = 'all' | 'customers' | 'owners' | 'staff' | 'admins' | 'locked';

type FormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: number;
};

const emptyForm: FormState = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  role: 1,
};

const roleLabel = (role: number) => {
  if (role === 3) return 'Admin';
  if (role === 4) return 'Nhân viên';
  if (role === 2) return 'Chủ sân';
  return 'Khách hàng';
};

const roleStyle = (role: number) => {
  if (role === 3) return 'bg-violet-100 text-violet-700';
  if (role === 4) return 'bg-emerald-100 text-emerald-700';
  if (role === 2) return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-700';
};

const roleIcon = (role: number) => {
  if (role === 3) return Crown;
  if (role === 4) return Briefcase;
  if (role === 2) return ShieldCheck;
  return UserRound;
};

const initials = (name?: string) =>
  String(name || 'U')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

const normalize = (value?: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const formatDate = (value?: string) => {
  if (!value) return 'Chưa rõ';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa rõ' : date.toLocaleDateString('vi-VN');
};

const unwrapUsers = (response: any): UserRow[] => {
  const raw = response?.data ?? response;
  const data = raw?.data ?? raw;

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(data)) return data;
  if (Array.isArray(raw)) return raw;

  return [];
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<UserTab>('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState<FormState>(emptyForm);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const roleFilter =
        tab === 'owners'
          ? 2
          : tab === 'customers'
            ? 1
            : tab === 'staff'
              ? 4
              : tab === 'admins'
                ? 3
                : undefined;

      const res = await api.get('/admin/users', {
        params: {
          search: search || undefined,
          role: roleFilter,
          pageSize: 100,
        },
      });

      setUsers(unwrapUsers(res));
    } catch {
      setUsers([]);
      setError('Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUsers();
    }, search ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [tab, search]);

  const handleAddUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await api.post('/admin/users', formData);
      setIsModalOpen(false);
      setFormData(emptyForm);
      setMessage('Đã tạo tài khoản người dùng mới.');
      await fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tạo tài khoản người dùng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (userId: string) => {
    setProcessingId(userId);

    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      setMessage('Đã cập nhật trạng thái tài khoản.');
      await fetchUsers();
    } catch {
      alert('Thao tác thất bại');
    } finally {
      setProcessingId('');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;

    setProcessingId(userId);

    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage('Đã xóa người dùng khỏi hệ thống.');
      setSelectedUser(null);
      await fetchUsers();
    } catch {
      alert('Không thể xóa người dùng.');
    } finally {
      setProcessingId('');
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((item) => item.isActive !== false).length;
    const locked = total - active;
    const customers = users.filter((item) => item.role === 1).length;
    const owners = users.filter((item) => item.role === 2).length;
    const staff = users.filter((item) => item.role === 4).length;
    const admins = users.filter((item) => item.role === 3).length;

    return { total, active, locked, customers, owners, staff, admins };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const keyword = normalize(search);

    return users.filter((item) => {
      const matchTab =
        tab === 'all' ||
        (tab === 'customers' && item.role === 1) ||
        (tab === 'owners' && item.role === 2) ||
        (tab === 'admins' && item.role === 3) ||
        (tab === 'staff' && item.role === 4) ||
        (tab === 'locked' && item.isActive === false);

      const matchKeyword =
        !keyword ||
        [item.fullName, item.email, item.phoneNumber, roleLabel(item.role)].some((value) =>
          normalize(value).includes(keyword),
        );

      return matchTab && matchKeyword;
    });
  }, [users, tab, search]);

  const tabItems: Array<{ id: UserTab; label: string; count: number }> = [
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'customers', label: 'Khách hàng', count: stats.customers },
    { id: 'owners', label: 'Chủ sân', count: stats.owners },
    { id: 'staff', label: 'Nhân viên', count: stats.staff },
    { id: 'admins', label: 'Admin', count: stats.admins },
    { id: 'locked', label: 'Tạm khóa', count: stats.locked },
  ];

  const kpis = [
    {
      label: 'Tổng tài khoản',
      value: stats.total,
      note: `${filteredUsers.length} đang hiển thị`,
      icon: UsersIcon,
      color: 'text-blue-600 bg-blue-50',
      onClick: () => setTab('all'),
    },
    {
      label: 'Hoạt động',
      value: stats.active,
      note: 'Đang sử dụng hệ thống',
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50',
      onClick: () => setTab('all'),
    },
    {
      label: 'Tạm khóa',
      value: stats.locked,
      note: 'Cần rà soát',
      icon: Ban,
      color: 'text-red-600 bg-red-50',
      onClick: () => setTab('locked'),
    },
    {
      label: 'Chủ sân',
      value: stats.owners,
      note: 'Tài khoản đối tác',
      icon: ShieldCheck,
      color: 'text-violet-600 bg-violet-50',
      onClick: () => setTab('owners'),
    },
  ];

  return (
    <div className="mx-auto max-w-350 space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">QUẢN TRỊ HỆ THỐNG</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Quản lý người dùng</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Theo dõi tài khoản, vai trò và trạng thái hoạt động. Admin chỉ quản lý tài khoản, không can thiệp kinh doanh của chủ sân.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <UserPlus size={16} />
            Tạo tài khoản
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.button
              key={item.label}
              type="button"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={item.onClick}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg p-2 ${item.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-600">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{item.note}</p>
            </motion.button>
          );
        })}
      </div>

      {(message || error) && (
        <section className="space-y-3">
          {message && <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</div>}
          {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên, email, số điện thoại..."
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {tabItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  tab === item.id
                    ? item.id === 'locked'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Danh sách tài khoản</h2>
            <p className="text-sm text-slate-600">{filteredUsers.length} tài khoản phù hợp bộ lọc hiện tại</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-sm font-semibold text-slate-500">Đang tải người dùng...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <UsersIcon size={52} className="mb-4 text-slate-200" />
            <h3 className="text-lg font-bold text-slate-800">Không có tài khoản phù hợp</h3>
            <p className="mt-2 text-sm font-semibold text-slate-400">Thử đổi nhóm quyền hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="hidden grid-cols-[1.3fr_0.9fr_0.7fr_0.7fr_120px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 xl:grid">
              <span>Người dùng</span>
              <span>Liên hệ</span>
              <span>Vai trò</span>
              <span>Trạng thái</span>
              <span className="text-right">Thao tác</span>
            </div>

            {filteredUsers.map((user) => {
              const RoleIcon = roleIcon(user.role);

              return (
                <article key={user.id} className="grid gap-4 px-5 py-4 transition hover:bg-slate-50 xl:grid-cols-[1.3fr_0.9fr_0.7fr_0.7fr_120px] xl:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                      {user.avatar ? <img src={user.avatar} className="h-full w-full object-cover" alt="" /> : initials(user.fullName)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{user.fullName || 'Chưa có tên'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Tham gia: {formatDate(user.createdAt)}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-700">
                      <Mail size={14} className="shrink-0 text-slate-400" />
                      {user.email || 'Chưa có email'}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
                      <Phone size={13} className="shrink-0 text-slate-400" />
                      {user.phoneNumber || 'Chưa có SĐT'}
                    </p>
                  </div>

                  <div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${roleStyle(user.role)}`}>
                      <RoleIcon size={13} />
                      {roleLabel(user.role)}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      user.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.isActive !== false ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </div>

                  <div className="flex justify-start gap-1 xl:justify-end">
                    <button
                      type="button"
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết"
                      onClick={() => setSelectedUser(user)}
                      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye size={17} />
                      <span className="pointer-events-none absolute -top-9 right-0 z-20 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
                        Xem chi tiết
                      </span>
                    </button>

                    <button
                      type="button"
                      title={user.isActive !== false ? 'Khóa tài khoản' : 'Mở khóa'}
                      aria-label={user.isActive !== false ? 'Khóa tài khoản' : 'Mở khóa'}
                      onClick={() => handleStatusToggle(user.id)}
                      disabled={processingId === user.id}
                      className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition disabled:opacity-50 ${
                        user.isActive !== false ? 'hover:bg-amber-50 hover:text-amber-600' : 'hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                    >
                      {processingId === user.id ? (
                        <Loader2 className="animate-spin" size={17} />
                      ) : user.isActive !== false ? (
                        <Ban size={17} />
                      ) : (
                        <UserCheck size={17} />
                      )}
                      <span className="pointer-events-none absolute -top-9 right-0 z-20 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
                        {user.isActive !== false ? 'Khóa tài khoản' : 'Mở khóa'}
                      </span>
                    </button>

                    <button
                      type="button"
                      title="Xóa tài khoản"
                      aria-label="Xóa tài khoản"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={processingId === user.id}
                      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={17} />
                      <span className="pointer-events-none absolute -top-9 right-0 z-20 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
                        Xóa tài khoản
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedUser && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex cursor-default items-end justify-end bg-slate-950/35 p-3 text-left backdrop-blur-sm sm:p-5"
          onClick={() => setSelectedUser(null)}
        >
          <aside
            className="h-full w-full max-w-lg cursor-auto overflow-y-auto rounded-lg bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-lg bg-blue-50 text-lg font-bold text-blue-700">
                  {initials(selectedUser.fullName)}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-600">Chi tiết tài khoản</p>
                  <h2 className="mt-1 truncate text-2xl font-black text-slate-950">{selectedUser.fullName || 'Chưa có tên'}</h2>
                </div>
              </div>

              <button type="button" onClick={() => setSelectedUser(null)} className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500 transition hover:text-slate-900">
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { icon: Mail, label: 'Email', value: selectedUser.email || 'Chưa cập nhật' },
                { icon: Phone, label: 'Số điện thoại', value: selectedUser.phoneNumber || 'Chưa cập nhật' },
                { icon: UserIcon, label: 'Vai trò', value: roleLabel(selectedUser.role) },
                { icon: CheckCircle, label: 'Trạng thái', value: selectedUser.isActive !== false ? 'Hoạt động' : 'Tạm khóa' },
              ].map((row) => {
                const Icon = row.icon;

                return (
                  <div key={row.label} className="flex gap-3 rounded-lg bg-slate-50 p-4">
                    <Icon size={18} className="mt-0.5 shrink-0 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-500">{row.label}</p>
                      <p className="mt-1 text-sm font-bold leading-6 text-slate-700">{row.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleStatusToggle(selectedUser.id)}
                disabled={processingId === selectedUser.id}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg text-sm font-bold transition disabled:opacity-50 ${
                  selectedUser.isActive !== false ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {selectedUser.isActive !== false ? <Ban size={18} /> : <UserCheck size={18} />}
                {selectedUser.isActive !== false ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteUser(selectedUser.id)}
                disabled={processingId === selectedUser.id}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-red-50 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 size={18} />
                Xóa tài khoản
              </button>
            </div>
          </aside>
        </button>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Đóng modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Tạo tài khoản</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Thêm người dùng mới và cấp quyền ban đầu.</p>
                </div>

                <button type="button" onClick={() => setIsModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4 p-6">
                {error && (
                  <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-500">Họ và tên</span>
                  <input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Họ và tên đầy đủ"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-500">Email</span>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="email@example.com"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-500">Số điện thoại</span>
                    <input
                      required
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })}
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Số điện thoại"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-500">Vai trò</span>
                    <select
                      value={formData.role}
                      onChange={(event) => setFormData({ ...formData, role: parseInt(event.target.value, 10) })}
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value={1}>Khách hàng</option>
                      <option value={2}>Chủ sân</option>
                      <option value={3}>Admin</option>
                      <option value={4}>Nhân viên sân</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-500">Mật khẩu</span>
                  <input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Thiết lập mật khẩu"
                  />
                </label>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-11 flex-1 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50">
                    Hủy
                  </button>

                  <button type="submit" disabled={isSubmitting} className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                    Tạo tài khoản
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
