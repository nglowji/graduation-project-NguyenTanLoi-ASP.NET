import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, Search, Filter, Mail, Shield, 
  Ban, Eye, MoreVertical, UserCheck, UserPlus, X,
  AlertCircle, CheckCircle, Phone, Lock, User as UserIcon
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
      const res = await api.get('/admin/users', { params: { search: search || undefined, role: roleFilter, pageSize: 50 } });
      setUsers(res.data?.items || res.data || []);
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
      setError(err.response?.data?.message || 'Không thể tạo tài khoản người dùng.');
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

  const roleLabel = (r: number) => r === 3 ? 'Quản trị viên' : r === 2 ? 'Đối tác chủ sân' : 'Khách hàng';
  const roleStyles = (r: number) => {
    if (r === 3) return 'bg-blue-600/10 text-blue-400 border-blue-500/20';
    if (r === 2) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Quản lý người dùng</h1>
          <p className="text-white/40 text-sm mt-1">Toàn quyền kiểm soát và phân quyền người dùng trong hệ thống</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <UserPlus size={18} /> Thêm nhân sự
        </button>
      </div>

      <div className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex p-1 bg-white/5 rounded-2xl self-start">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'owners', label: 'Chủ sân' },
              { id: 'customers', label: 'Khách hàng' },
            ].map((t) => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t.id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="text" 
                placeholder="Tìm ID, Tên, Email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Đang khởi tạo danh sách...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-32 text-center">
              <UsersIcon size={48} className="mx-auto mb-4 text-white/5" />
              <p className="text-white/20 font-black uppercase tracking-widest text-sm">Chưa có dữ liệu người dùng</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-8 py-6">Người dùng</th>
                  <th className="px-4 py-6">Vai trò</th>
                  <th className="px-4 py-6">Tham gia</th>
                  <th className="px-4 py-6">Trạng thái</th>
                  <th className="px-8 py-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u, i) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-lg bg-blue-600/20 border border-blue-500/20`}>
                          {u.fullName?.split(' ').pop()?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{u.fullName}</p>
                          <p className="text-xs text-white/30 font-medium flex items-center gap-1.5 mt-0.5">
                            <Mail size={12} /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${roleStyles(u.role)}`}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-xs font-bold text-white/40">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'text-emerald-500' : 'text-red-400'}`}>
                          {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="w-10 h-10 flex items-center justify-center bg-white/5 text-white/30 hover:text-white rounded-xl transition-all border border-white/5">
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleStatusToggle(u.id)}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${
                            u.isActive 
                            ? 'bg-red-500/10 text-red-400 border-red-500/10 hover:bg-red-500 hover:text-white' 
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10 hover:bg-emerald-500 hover:text-white'
                          }`}
                          title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {u.isActive ? <Ban size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="w-10 h-10 flex items-center justify-center bg-white/5 text-white/30 hover:text-red-400 rounded-xl transition-all border border-white/5"
                        >
                          <Trash2 size={18} />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1c26] border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 opacity-[0.03] rounded-bl-[5rem]" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white tracking-tight">Thêm tài khoản mới</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleAddUser} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Họ và tên</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      required
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                      <input 
                        required
                        type="tel" 
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all"
                        placeholder="09xxx"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Vai trò</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value={1} className="bg-[#1a1c26]">Khách hàng</option>
                      <option value={2} className="bg-[#1a1c26]">Chủ sân</option>
                      <option value={3} className="bg-[#1a1c26]">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      required
                      type="password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-white/5 text-white/40 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-white transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} />}
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
