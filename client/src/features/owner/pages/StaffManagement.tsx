import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import api from '../../../services/api';

type StaffMember = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt?: string;
  isActive: boolean;
};

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/owner/staff') as any;
      setStaff(Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : []);
    } catch {
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/owner/staff', formData);
      setIsModalOpen(false);
      setFormData({ fullName: '', email: '', phoneNumber: '', password: '' });
      fetchStaff();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo tài khoản nhân viên.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/owner/staff/${id}/toggle-status`);
      fetchStaff();
    } catch {
      alert('Không thể cập nhật trạng thái nhân viên.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa nhân viên này?')) return;
    try {
      await api.delete(`/owner/staff/${id}`);
      fetchStaff();
    } catch {
      alert('Không thể xóa nhân viên.');
    }
  };

  const filteredStaff = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return staff.filter((item) =>
      (!keyword || [item.fullName, item.email, item.phoneNumber]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))) &&
      (statusFilter === 'all' || (statusFilter === 'active' ? item.isActive : !item.isActive))
    );
  }, [staff, search, statusFilter]);

  const stats = useMemo(() => {
    const active = staff.filter((item) => item.isActive).length;
    return {
      total: staff.length,
      active,
      inactive: staff.length - active,
    };
  }, [staff]);

  const formatDate = (value?: string) => {
    if (!value) return 'Chưa có';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
  };

  const initials = (name?: string) =>
    String(name || 'NV')
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'NV';

  const activeFilterCount = [
    search,
    statusFilter !== 'all',
  ].filter(Boolean).length;

  const hasActiveFilters = search || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-16">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
            QUẢN TRỊ NHÂN SỰ
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Nhân sự vận hành
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Quản lý tài khoản nhân viên hỗ trợ xử lý đơn đặt sân, phản hồi khách hàng với quyền truy cập giới hạn.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchStaff}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <UserPlus size={16} />
            Thêm nhân viên
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: 'Tổng nhân viên',
            value: stats.total,
            sub: 'Toàn bộ tài khoản nhân viên',
            icon: Users,
            color: 'text-blue-600 bg-blue-50',
            onClick: () => setStatusFilter('all'),
          },
          {
            label: 'Đang hoạt động',
            value: stats.active,
            sub: 'Được phép đăng nhập',
            icon: UserCheck,
            color: 'text-emerald-600 bg-emerald-50',
            onClick: () => setStatusFilter('active'),
          },
          {
            label: 'Tạm khóa',
            value: stats.inactive,
            sub: 'Đã ngưng quyền truy cập',
            icon: UserX,
            color: 'text-amber-600 bg-amber-50',
            onClick: () => setStatusFilter('inactive'),
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg p-2 ${item.color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-400">{item.sub}</span>
              </div>
              <p className="text-xs font-semibold text-slate-600">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
            </button>
          );
        })}
      </section>

      {/* Permission Summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quyền hạn nhân viên</h2>
                <p className="text-sm text-slate-600">
                  Tài khoản nhân viên chỉ dùng để hỗ trợ vận hành hàng ngày, không can thiệp vào cấu hình kinh doanh.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { icon: Calendar, label: 'Đơn đặt sân' },
              { icon: MessageSquare, label: 'Phản hồi khách hàng' },
              { icon: Shield, label: 'Quyền hạn giới hạn' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-50 px-3 text-xs font-bold text-slate-700"
                >
                  <Icon size={15} className="text-blue-600" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Đang hoạt động' },
              { id: 'inactive', label: 'Tạm khóa' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={`h-10 rounded-lg px-3 text-sm font-semibold transition ${
                  statusFilter === item.id
                    ? item.id === 'inactive'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-lg bg-red-50 px-3 text-sm font-semibold text-red-600 hover:bg-red-100"
              >
                Xóa lọc {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Staff List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách nhân viên</h2>
              <p className="mt-1 text-sm text-slate-600">
                {staff.length} nhân viên tổng · {filteredStaff.length} phù hợp bộ lọc
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <UserPlus size={16} />
              Thêm nhân viên
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4">
            <RefreshCw className="animate-spin text-blue-600" size={38} />
            <p className="text-sm font-semibold text-slate-500">Đang tải nhân viên...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
            <Users size={54} className="mb-4 text-slate-200" />
            <h3 className="text-lg font-bold text-slate-800">Chưa có nhân viên phù hợp</h3>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Thêm nhân viên để hỗ trợ vận hành lịch đặt sân.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStaff.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 transition hover:bg-slate-50"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_minmax(260px,1fr)_160px_180px] lg:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                      item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {initials(item.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{item.fullName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Tham gia {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-600">
                      <Mail size={14} className="shrink-0 text-blue-600" />
                      {item.email}
                    </p>
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-600">
                      <Phone size={14} className="shrink-0 text-blue-600" />
                      {item.phoneNumber || 'Chưa cập nhật'}
                    </p>
                  </div>

                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                    </span>
                  </div>

                  <div className="flex justify-start gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id)}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${
                        item.isActive
                          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title={item.isActive ? 'Tạm khóa' : 'Kích hoạt'}
                    >
                      <Shield size={14} />
                      {item.isActive ? 'Tạm khóa' : 'Kích hoạt'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                      Xóa
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Create Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Thêm nhân viên</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Tạo tài khoản đăng nhập quản trị với quyền hạn chế.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                {error && (
                  <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-500">Họ tên nhân viên</label>
                  <input
                    required
                    value={formData.fullName}
                    onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-500">Email đăng nhập</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    placeholder="staff@example.com"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-500">Số điện thoại</label>
                  <input
                    required
                    value={formData.phoneNumber}
                    onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })}
                    placeholder="Số điện thoại nhân viên"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-500">Mật khẩu khởi tạo</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                      placeholder="Tối thiểu 6 ký tự"
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-11 flex-1 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="h-11 flex-[2] rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Tạo tài khoản nhân viên
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

export default StaffManagement;
