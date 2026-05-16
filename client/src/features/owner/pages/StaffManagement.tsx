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
  Search,
  Shield,
  Trash2,
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
    if (!keyword) return staff;

    return staff.filter((item) =>
      [item.fullName, item.email, item.phoneNumber]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [staff, search]);

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

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Personnel hub</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Quản lý nhân viên</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Nhân viên có thể đăng nhập trang quản trị với quyền hạn chế: tổng quan, lịch đặt sân và đánh giá.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <UserPlus size={18} strokeWidth={3} />
          Thêm nhân viên
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Users className="mb-5 text-blue-600" size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng nhân viên</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 className="mb-5 text-emerald-600" size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang hoạt động</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Shield className="mb-5 text-amber-600" size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tạm khóa</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{stats.inactive}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">Quyền hạn nhân viên</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tài khoản nhân viên dùng role `PitchStaff`, chỉ nhìn thấy menu cần vận hành. Các trang quản lý sân, dịch vụ, doanh thu và nhân sự vẫn dành cho chủ sân.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Calendar, label: 'Lịch đặt sân' },
              { icon: MessageSquare, label: 'Đánh giá' },
              { icon: Shield, label: 'Quyền hạn chế' },
            ].map((item) => (
              <span key={item.label} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-blue-700 shadow-sm dark:bg-slate-900">
                <item.icon size={15} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
            <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-500" />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải nhân viên</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
            <Users size={54} className="mb-4 text-slate-200" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Chưa có nhân viên phù hợp</h3>
            <p className="mt-2 text-sm font-semibold text-slate-400">Thêm nhân viên để hỗ trợ vận hành lịch đặt sân.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStaff.map((item) => (
              <div key={item.id} className="grid gap-4 p-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 xl:grid-cols-[minmax(260px,1fr)_minmax(260px,1fr)_140px_120px] xl:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700 dark:bg-blue-500/10">
                    {item.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">{item.fullName}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">Tham gia {formatDate(item.createdAt)}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
                    <Mail size={13} className="text-blue-600" />
                    {item.email}
                  </p>
                  <p className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
                    <Phone size={13} className="text-blue-600" />
                    {item.phoneNumber}
                  </p>
                </div>

                <span className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-[10px] font-black uppercase tracking-widest ${
                  item.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-red-50 text-red-700 ring-1 ring-red-100'
                }`}>
                  {item.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                </span>

                <div className="flex gap-2 xl:justify-end">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800"
                    title={item.isActive ? 'Tạm khóa' : 'Kích hoạt'}
                  >
                    <Shield size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:bg-slate-800"
                    title="Xóa"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
                <div>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white">Thêm nhân viên</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Tạo tài khoản đăng nhập quản trị với quyền hạn chế.</p>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:text-slate-900 dark:bg-slate-800 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                {error && (
                  <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <input required value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} placeholder="Họ tên nhân viên" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                <input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} placeholder="Email đăng nhập" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                <input required value={formData.phoneNumber} onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })} placeholder="Số điện thoại" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input required type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} placeholder="Mật khẩu khởi tạo" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                    Hủy
                  </button>
                  <button type="submit" className="h-12 flex-[2] rounded-xl bg-blue-600 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-700">
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
