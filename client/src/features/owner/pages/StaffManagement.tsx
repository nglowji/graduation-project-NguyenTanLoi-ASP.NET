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

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Users size={22} /></span><div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Quản trị nhân sự</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 ">Quản lý nhân viên</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Nhân viên có thể đăng nhập trang quản trị với quyền hạn chế: tổng quan, lịch đặt sân và đánh giá.</p>
        </div></div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
        >
          <UserPlus size={18} strokeWidth={3} />
          Thêm nhân viên
        </button>
      </header>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-3">
        <button type="button" onClick={() => setStatusFilter('all')} className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-blue-200 hover:bg-blue-50">
          <Users className="mb-5 text-blue-600" size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng nhân viên</p>
          <p className="mt-2 text-2xl font-black text-slate-950 ">{stats.total}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Bấm để xem toàn bộ nhân viên.</p>
        </button>
        <button type="button" onClick={() => setStatusFilter('active')} className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-emerald-200 hover:bg-emerald-50">
          <CheckCircle2 className="mb-5 text-emerald-600" size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang hoạt động</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{stats.active}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Theo dõi nhân viên đang được phép đăng nhập.</p>
        </button>
        <button type="button" onClick={() => setStatusFilter('inactive')} className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-amber-200 hover:bg-amber-50">
          <Shield className="mb-5 text-amber-600" size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tạm khóa</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{stats.inactive}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Bấm để kiểm tra tài khoản đã khóa.</p>
        </button>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="text-base font-black text-slate-950 ">Quyền hạn nhân viên</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600 ">
              Tài khoản nhân viên dùng role `PitchStaff`, chỉ nhìn thấy menu cần vận hành. Các trang quản lý sân, dịch vụ, doanh thu và nhân sự vẫn dành cho chủ sân.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Calendar, label: 'Lịch đặt sân' },
              { icon: MessageSquare, label: 'Đánh giá' },
              { icon: Shield, label: 'Quyền hạn chế' },
            ].map((item) => (
              <span key={item.label} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-blue-700 shadow-sm ">
                <item.icon size={15} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5   "
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {([{ id: 'all', label: 'Tất cả nhân viên' }, { id: 'active', label: 'Đang hoạt động' }, { id: 'inactive', label: 'Tạm khóa' }] as const).map((item) => <button key={item.id} type="button" onClick={() => setStatusFilter(item.id)} className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition ${statusFilter === item.id ? item.id === 'inactive' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-700 '}`}>{item.label}</button>)}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {isLoading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
            <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600  dark:border-t-blue-500" />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải nhân viên</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
            <Users size={54} className="mb-4 text-slate-200" />
            <h3 className="text-lg font-black text-slate-800 ">Chưa có nhân viên phù hợp</h3>
            <p className="mt-2 text-sm font-semibold text-slate-400">Thêm nhân viên để hỗ trợ vận hành lịch đặt sân.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredStaff.map((item) => (
              <motion.div whileHover={{ y: -2 }} key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {item.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 ">{item.fullName}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">Tham gia {formatDate(item.createdAt)}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
                  <p className="flex items-center gap-2 text-xs font-bold text-slate-500 ">
                    <Mail size={13} className="text-blue-600" />
                    {item.email}
                  </p>
                  <p className="flex items-center gap-2 text-xs font-bold text-slate-500 ">
                    <Phone size={13} className="text-blue-600" />
                    {item.phoneNumber}
                  </p>
                </div>

                <span className={`mt-4 inline-flex h-9 items-center justify-center rounded-xl px-3 text-[10px] font-black uppercase tracking-widest ${
                  item.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-red-50 text-red-700 ring-1 ring-red-100'
                }`}>
                  {item.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                </span>

                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 "
                    title={item.isActive ? 'Tạm khóa' : 'Kích hoạt'}
                  >
                    <Shield size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-600 "
                    title="Xóa"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </motion.div>
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
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl  "
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 ">
                <div>
                  <h3 className="text-2xl font-black text-slate-950 ">Thêm nhân viên</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Tạo tài khoản đăng nhập quản trị với quyền hạn chế.</p>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:text-slate-900  ">
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

                <input required value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} placeholder="Họ tên nhân viên" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white   " />
                <input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} placeholder="Email đăng nhập" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white   " />
                <input required value={formData.phoneNumber} onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })} placeholder="Số điện thoại" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white   " />
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input required type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} placeholder="Mật khẩu khởi tạo" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white   " />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-50  ">
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
