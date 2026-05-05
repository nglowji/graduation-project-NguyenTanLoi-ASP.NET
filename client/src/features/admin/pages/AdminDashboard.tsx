import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, DollarSign, ShieldCheck, TrendingUp, TrendingDown,
  Search, CheckCircle, XCircle, Eye, Ban,
  Activity, MoreVertical, MapPin, Loader2
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const fadeIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

interface AdminStats {
  totalUsers: number;
  activeOwners: number;
  platformCommission: number;
  pendingApprovals: number;
  userGrowth: number;
  commissionGrowth: number;
}

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: number;
  createdAt: string;
  isActive: boolean;
}

interface ApprovalItem {
  id: string;
  pitchName: string;
  ownerName: string;
  ownerEmail: string;
  submittedAt: string;
  pitchType: string;
  address: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userTab, setUserTab] = useState<'all' | 'owners' | 'customers'>('all');
  const [search, setSearch] = useState('');
  const [approvalTab, setApprovalTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [userTab, search]);

  useEffect(() => {
    fetchApprovals();
  }, [approvalTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await api.get('/dashboard/admin/stats');
      setStats(statsRes.data);
    } catch {
      setError('Không thể tải dữ liệu thống kê.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const roleFilter = userTab === 'owners' ? 2 : userTab === 'customers' ? 1 : undefined;
      const res = await api.get('/admin/users', { params: { search: search || undefined, role: roleFilter, pageSize: 20 } });
      setUsers(res.data?.items || res.data || []);
    } catch {
      setUsers([]);
    }
  };

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/admin/pitch-approvals', { params: { status: approvalTab } });
      setApprovals(res.data?.items || res.data || []);
    } catch {
      setApprovals([]);
    }
  };

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/admin/pitch-approvals/${id}/${action}`);
      fetchApprovals();
      fetchData();
    } catch {
      alert('Không thể thực hiện thao tác này.');
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      fetchUsers();
    } catch {
      alert('Không thể đình chỉ tài khoản này.');
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const roleLabel = (r: number) => r === 3 ? 'Admin' : r === 2 ? 'Chủ sân' : 'Khách hàng';
  const roleColor = (r: number) => {
    if (r === 3) return 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
    if (r === 2) return 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
    return 'bg-white/5 text-white/50 border border-white/10';
  };

  const pitchTypeLabel = (t: string) => ({ Football5: 'Sân 5 người', Football7: 'Sân 7 người', Tennis: 'Tennis', Badminton: 'Cầu lông' }[t] || t);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-purple-400" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Quản trị hệ thống</h1>
          <p className="text-white/40 text-sm mt-1">
            Chào mừng, <span className="text-purple-400 font-semibold">{user?.fullName}</span> • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00C896]/10 border border-[#00C896]/20 rounded-full">
          <Activity size={13} className="text-[#00C896]" />
          <span className="text-xs font-bold text-[#00C896]">Hệ thống hoạt động</span>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Tổng người dùng', value: stats.totalUsers.toString(), change: `+${stats.userGrowth}%`, up: true, icon: <Users size={22} />, color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400', border: 'border-blue-500/20' },
            { title: 'Chủ sân hoạt động', value: stats.activeOwners.toString(), change: '', up: true, icon: <MapPin size={22} />, color: 'from-[#00C896]/20 to-[#00C896]/5', iconColor: 'text-[#00C896]', border: 'border-[#00C896]/20' },
            { title: 'Hoa hồng tháng này', value: formatCurrency(stats.platformCommission), change: `+${stats.commissionGrowth}%`, up: true, icon: <DollarSign size={22} />, color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400', border: 'border-amber-500/20' },
            { title: 'Yêu cầu chờ duyệt', value: stats.pendingApprovals.toString(), change: '', up: false, icon: <ShieldCheck size={22} />, color: 'from-purple-500/20 to-purple-500/5', iconColor: 'text-purple-400', border: 'border-purple-500/20' },
          ].map((s, i) => (
            <motion.div key={s.title} variants={fadeIn} initial="hidden" animate="show" transition={{ delay: i * 0.08 }}
              className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 bg-white/5 rounded-xl ${s.iconColor}`}>{s.icon}</div>
                {s.change && (
                  <span className={`flex items-center gap-1 text-xs font-bold ${s.up ? 'text-[#00C896]' : 'text-red-400'}`}>
                    {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {s.change}
                  </span>
                )}
              </div>
              <p className="text-white/40 text-xs mb-1">{s.title}</p>
              <h3 className="text-xl font-black text-white">{s.value}</h3>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-5 animate-pulse h-28" />)}
        </div>
      )}

      {/* Approval Requests */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-purple-400" /> Duyệt đăng ký chủ sân
          </h3>
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
            {(['pending', 'approved', 'rejected'] as const).map(tab => (
              <button key={tab} onClick={() => setApprovalTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${approvalTab === tab ? 'bg-purple-500/30 text-purple-300' : 'text-white/40 hover:text-white'}`}>
                {tab === 'pending' ? 'Chờ duyệt' : tab === 'approved' ? 'Đã duyệt' : 'Từ chối'}
              </button>
            ))}
          </div>
        </div>

        {approvals.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <CheckCircle size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Không có yêu cầu nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5 hover:border-purple-500/20 transition-colors">
                <div className="flex gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{a.pitchName}</p>
                    <p className="text-xs text-white/40">{a.ownerName} • {a.ownerEmail}</p>
                    <p className="text-xs text-white/25 mt-0.5">{a.address} • {pitchTypeLabel(a.pitchType)} • Gửi: {new Date(a.submittedAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 text-white/50 rounded-lg text-xs font-bold hover:bg-white/10 border border-white/10">
                    <Eye size={13} /> Hồ sơ
                  </button>
                  {a.status === 'pending' && (
                    <>
                      <button onClick={() => handleApproval(a.id, 'approve')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C896]/15 text-[#00C896] rounded-lg text-xs font-bold hover:bg-[#00C896]/25 border border-[#00C896]/20">
                        <CheckCircle size={13} /> Duyệt
                      </button>
                      <button onClick={() => handleApproval(a.id, 'reject')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 border border-red-500/20">
                        <XCircle size={13} /> Từ chối
                      </button>
                    </>
                  )}
                  {a.status === 'approved' && <span className="text-xs font-bold px-3 py-1.5 bg-[#00C896]/10 text-[#00C896] rounded-full border border-[#00C896]/20">✓ Đã duyệt</span>}
                  {a.status === 'rejected' && <span className="text-xs font-bold px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">✗ Từ chối</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Users size={18} className="text-blue-400" /> Quản lý người dùng
          </h3>
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                type="text" placeholder="Tìm người dùng..."
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 w-48" />
            </div>
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
              {(['all', 'owners', 'customers'] as const).map(tab => (
                <button key={tab} onClick={() => setUserTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userTab === tab ? 'bg-blue-500/30 text-blue-300' : 'text-white/40 hover:text-white'}`}>
                  {tab === 'all' ? 'Tất cả' : tab === 'owners' ? 'Chủ sân' : 'Khách hàng'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Không tìm thấy người dùng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-white/30 text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="pb-3 font-bold">Người dùng</th>
                  <th className="pb-3 font-bold">Vai trò</th>
                  <th className="pb-3 font-bold">Ngày tham gia</th>
                  <th className="pb-3 font-bold">Trạng thái</th>
                  <th className="pb-3 font-bold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/70">
                          {u.fullName?.split(' ').pop()?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{u.fullName}</p>
                          <p className="text-xs text-white/30">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${roleColor(u.role)}`}>{roleLabel(u.role)}</span>
                    </td>
                    <td className="py-3.5 text-sm text-white/40">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-[#00C896]' : 'bg-red-500'}`} />
                        <span className={`text-xs ${u.isActive ? 'text-[#00C896]' : 'text-red-400'}`}>{u.isActive ? 'Hoạt động' : 'Đình chỉ'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 hover:bg-white/5 text-white/30 hover:text-blue-400 rounded-lg"><Eye size={15} /></button>
                        {u.role !== 3 && (
                          <button onClick={() => handleBanUser(u.id)}
                            className="p-1.5 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-lg"><Ban size={15} /></button>
                        )}
                        <button className="p-1.5 hover:bg-white/5 text-white/30 hover:text-white rounded-lg"><MoreVertical size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
