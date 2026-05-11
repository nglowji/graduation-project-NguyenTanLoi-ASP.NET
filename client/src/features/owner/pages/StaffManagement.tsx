import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Mail, Phone, Lock, Shield, 
  Trash2, Edit2, Search, X, AlertCircle,
  ShieldAlert, Calendar, MessageSquare
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
      // Giả định API lấy danh sách nhân viên của chủ sân
      const res = await api.get('/owner/staff');
      setStaff(res.data || []);
    } catch {
      // Nếu chưa có API thực tế, trả về mảng rỗng như yêu cầu (không dữ liệu mẫu)
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
      setError(err.response?.data?.message || 'Không thể tạo tài khoản nhân viên.');
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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Quản lý nhân viên</h1>
          <p className="text-white/40 text-sm mt-1">Cấp quyền nhân sự hỗ trợ vận hành và chăm sóc khách hàng</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <UserPlus size={18} /> Thêm nhân viên mới
        </button>
      </div>

      {/* Permissions Info Card */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/20">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h4 className="font-black text-white text-sm mb-1">Giới hạn quyền hạn nhân viên</h4>
          <p className="text-blue-400/80 text-xs font-medium leading-relaxed">
            Tài khoản nhân viên <span className="text-white font-bold">chỉ có quyền</span> xử lý đơn đặt sân và phản hồi đánh giá. 
            Nhân viên <span className="text-white font-bold">không thể</span> thêm, sửa hoặc xóa thông tin sân bãi của bạn.
          </p>
        </div>
        <div className="flex gap-3 md:ml-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
            <Calendar size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Đơn đặt</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
            <MessageSquare size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Đánh giá</span>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Đang tải dữ liệu nhân sự...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-32 text-center">
              <Users size={48} className="mx-auto mb-4 text-white/5" />
              <p className="text-white/20 font-black uppercase tracking-widest text-sm">Chưa có nhân viên nào</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-blue-500 text-xs font-black uppercase tracking-widest hover:text-blue-400 transition-colors"
              >
                + Bắt đầu thêm nhân viên
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-8 py-6">Nhân viên</th>
                  <th className="px-4 py-6">Liên hệ</th>
                  <th className="px-4 py-6">Ngày tham gia</th>
                  <th className="px-4 py-6">Trạng thái</th>
                  <th className="px-8 py-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 font-black text-sm border border-blue-500/10 shadow-lg">
                          {s.fullName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{s.fullName}</p>
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Staff Member</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white/60 flex items-center gap-2">
                          <Mail size={12} className="text-blue-500" /> {s.email}
                        </p>
                        <p className="text-xs font-bold text-white/60 flex items-center gap-2">
                          <Phone size={12} className="text-blue-500" /> {s.phoneNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-xs font-bold text-white/40">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${s.isActive ? 'text-emerald-500' : 'text-red-400'}`}>
                          {s.isActive ? 'Đang làm việc' : 'Tạm nghỉ'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleToggleStatus(s.id)}
                          className="w-9 h-9 flex items-center justify-center bg-white/5 text-white/30 hover:text-white rounded-xl transition-all border border-white/5"
                          title={s.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          <Shield size={16} />
                        </button>
                        <button 
                          className="w-9 h-9 flex items-center justify-center bg-white/5 text-white/30 hover:text-white rounded-xl transition-all border border-white/5"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)}
                          className="w-9 h-9 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/10"
                        >
                          <Trash2 size={16} />
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

      {/* Add Staff Modal */}
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
                <h3 className="text-xl font-black text-white tracking-tight">Thêm nhân viên mới</h3>
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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Họ và tên</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
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
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Email liên lạc</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="nhanvien@smartsport.vn"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      required
                      type="tel" 
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="09xx xxx xxx"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Mật khẩu khởi tạo</label>
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
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all"
                  >
                    Xác nhận thêm
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
