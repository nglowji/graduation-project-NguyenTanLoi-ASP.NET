import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, Search, Mail, 
  Ban, UserCheck, UserPlus, X,
  AlertCircle, CheckCircle, Phone, Lock, User as UserIcon, Trash2,
  ChevronRight
} from 'lucide-react';
import api from '../../../services/api';

const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 1 // Default Customer
  });

  useEffect(() => {
    fetchUsers();
  }, [tab, search]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const roleFilter = tab === 'owners' ? 2 : tab === 'customers' ? 1 : undefined;
      const res = await api.get('/admin/users', { params: { search: search || undefined, role: roleFilter, pageSize: 50 } }) as any;
      setUsers(res?.items || res || []);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/admin/users', formData);
      setIsModalOpen(false);
      setFormData({ fullName: '', email: '', phoneNumber: '', password: '', role: 1 });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo tài khoản người dùng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      fetchUsers();
    } catch {
      alert('Thao tác thất bại');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch {
      alert('Không thể xóa người dùng.');
    }
  };

  const roleLabel = (r: number) => r === 3 ? 'Admin' : r === 2 ? 'Chủ sân' : 'Khách hàng';
  const roleStyles = (r: number) => {
    if (r === 3) return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
    if (r === 2) return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">User Management</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Người dùng hệ thống</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Toàn quyền kiểm soát và phân quyền người dùng trong hệ thống.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <UserPlus size={18} /> Thêm nhân sự
        </button>
      </div>

      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50/50 dark:bg-transparent">
          <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800 rounded-xl self-start">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'owners', label: 'Chủ sân' },
              { id: 'customers', label: 'Khách' },
            ].map((t) => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  tab === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group min-w-[320px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Tìm tên, email, SĐT..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Đang khởi tạo...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <UsersIcon size={40} className="text-slate-200 dark:text-slate-700" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Chưa có dữ liệu người dùng</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800/50">
                  <th className="px-8 py-5">Người dùng</th>
                  <th className="px-4 py-5">Phân quyền</th>
                  <th className="px-4 py-5">Ngày tham gia</th>
                  <th className="px-4 py-5 text-center">Trạng thái</th>
                  <th className="px-8 py-5 text-right">Tùy chọn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black text-indigo-600 shadow-sm bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 overflow-hidden`}>
                          {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.fullName?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-none mb-1.5">{u.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                            <Mail size={12} className="shrink-0" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${roleStyles(u.role)}`}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleStatusToggle(u.id)}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${
                            u.isActive 
                            ? 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 dark:bg-slate-800 dark:border-slate-700' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                          }`}
                          title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt'}
                        >
                          {u.isActive ? <Ban size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 border border-slate-100 dark:border-slate-700 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 border border-slate-100 dark:border-slate-700 rounded-xl transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] p-10 overflow-hidden border border-white/20"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Thêm nhân sự</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">New Administrative Access</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-bold flex items-center gap-3">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleAddUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block">Thông tin cơ bản</label>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        required
                        type="text" 
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                        placeholder="Họ và tên đầy đủ"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                        placeholder="Địa chỉ Email"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block">Liên lạc & Phân quyền</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        required
                        type="tel" 
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                        placeholder="Số điện thoại"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 pt-[22px]">
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value={1}>Khách hàng</option>
                      <option value={2}>Chủ sân</option>
                      <option value={3}>Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block">Bảo mật</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      required
                      type="password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="Thiết lập mật khẩu"
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 dark:border-slate-700"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} />}
                    Xác nhận tạo
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
