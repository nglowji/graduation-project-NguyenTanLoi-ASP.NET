import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Mail, Phone, Lock, Shield, 
  Trash2, Edit2, Search, X, AlertCircle,
  ShieldAlert, Calendar, MessageSquare, ChevronRight
} from 'lucide-react';
import api from '../../../services/api';

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  isActive: boolean;
}

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/owner/staff') as any;
      setStaff(Array.isArray(res) ? res : res?.items || []);
    } catch {
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      alert('Thao tác thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
    try {
      await api.delete(`/owner/staff/${id}`);
      fetchStaff();
    } catch {
      alert('Không thể xóa nhân viên.');
    }
  };

  const filteredStaff = staff.filter(s => 
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Personnel Hub</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Quản lý nhân viên</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cấp quyền nhân sự hỗ trợ vận hành và chăm sóc khách hàng.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <UserPlus size={20} strokeWidth={3} /> Thêm nhân viên
        </button>
      </header>

      <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
        
        <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-2xl shadow-blue-600/30">
          <ShieldAlert size={32} />
        </div>
        
        <div className="space-y-2 relative">
          <h4 className="font-black text-slate-900 dark:text-white text-lg">Phân quyền vận hành</h4>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
            Tài khoản nhân viên được thiết kế để <span className="text-blue-600 font-bold">xử lý booking và tương tác khách hàng</span>. 
            Mọi thao tác quản lý hạ tầng và doanh thu đều được bảo mật tuyệt đối cho chủ sân.
          </p>
        </div>
        
        <div className="flex gap-4 md:ml-auto relative">
          {[
            { icon: Calendar, label: 'Booking' },
            { icon: MessageSquare, label: 'Review' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 rounded-3xl border border-blue-100 dark:border-blue-500/10 shadow-sm">
              <item.icon size={20} className="text-blue-600" />
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/30">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc email nhân viên..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center gap-6">
              <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Registry...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-40 text-center">
              <Users size={64} className="mx-auto mb-6 text-slate-100 dark:text-slate-800" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm mb-6">Chưa có nhân viên nào</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-3 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100 dark:border-blue-500/10"
              >
                Khởi tạo nhân sự
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Staff Identity</th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Communication</th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Activity</th>
                  <th className="px-10 py-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredStaff.map((s) => (
                  <tr key={s.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 font-black text-lg border border-blue-100 dark:border-blue-500/20 shadow-sm">
                          {s.fullName[0]}
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-none mb-2">{s.fullName}</p>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Member</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <Mail size={14} className="text-blue-500" /> {s.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <Phone size={14} className="text-blue-500" /> {s.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                          s.isActive 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' 
                            : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:border-red-500/20'
                        }`}>
                          {s.isActive ? 'On Duty' : 'Inactive'}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Joined {new Date(s.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => handleToggleStatus(s.id)}
                          className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-blue-600 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm transition-all"
                          title={s.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          <Shield size={18} />
                        </button>
                        <button 
                          className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-blue-600 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)}
                          className="w-11 h-11 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl border border-red-100 dark:border-red-500/20 transition-all shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="w-8 h-8 flex items-center justify-center text-slate-200 dark:text-slate-700">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/[0.03] rounded-bl-[6rem]" />
              
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Thêm nhân sự</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Khởi tạo tài khoản vận hành cho nhân viên mới.</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all border border-slate-100 dark:border-slate-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                {error && (
                  <div className="mb-8 p-5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-3xl text-red-600 text-xs font-black flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-600/20">
                      <AlertCircle size={20} />
                    </div>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên nhân viên</label>
                    <div className="relative group">
                      <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <input 
                        required
                        type="text" 
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4.5 pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email liên lạc</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4.5 pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="name@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                    <div className="relative group">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <input 
                        required
                        type="tel" 
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4.5 pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="09xx xxx xxx"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu khởi tạo</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <input 
                        required
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4.5 pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-6 md:col-span-2 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
                    >
                      Hủy thao tác
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-2xl shadow-blue-600/20 transition-all active:scale-95"
                    >
                      Xác nhận thêm mới
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffManagement;
