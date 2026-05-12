import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, DollarSign, ShieldCheck,
  Search, CheckCircle, XCircle, Eye, Ban,
  Activity, MoreVertical,
  Lock, UserCheck, AlertCircle, ChevronRight, BarChart3,
  Calendar
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const fadeIn = { 
  hidden: { opacity: 0, y: 20 }, 
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } 
} as const;

const stagger = {
  show: {
    transition: {
      staggerChildren: 0.1
    }
  }
} as const;

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

  const roleLabel = (r: number) => r === 3 ? 'Admin' : r === 2 ? 'Chủ sân' : 'Khách';
  
  const roleStyles = (r: number) => {
    if (r === 3) return 'bg-primary/10 text-primary border-primary/20';
    if (r === 2) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    return 'bg-slate-400/10 text-slate-600 dark:text-slate-400 border-slate-400/20';
  };

  const pitchTypeLabel = (t: string) => ({ 
    Football5: 'Sân 5', Football7: 'Sân 7', Football11: 'Sân 11',
    Tennis: 'Tennis', Badminton: 'Cầu lông' 
  }[t] || t);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 dark:text-white/40 font-black uppercase tracking-widest text-[10px]">Initializing Admin Core...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-2">
            <Lock size={12} /> Hệ thống quản trị tập trung
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">SmartSport HQ</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-2 font-medium">
            Quản trị viên: <span className="text-primary font-bold">{user?.fullName}</span> • {new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}
          </p>
        </div>
        
        <div className="px-5 py-3 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3">
          <Activity size={20} className="text-primary animate-pulse" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">System Status: Optimal</span>
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div 
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { title: 'Người dùng', value: stats?.totalUsers.toString() || '0', change: `+${stats?.userGrowth || 0}%`, up: true, icon: <Users size={24} />, color: 'from-blue-600 to-indigo-700' },
          { title: 'Chủ sân', value: stats?.activeOwners.toString() || '0', change: 'Ổn định', up: true, icon: <UserCheck size={24} />, color: 'from-primary to-indigo-600' },
          { title: 'Hoa hồng', value: formatCurrency(stats?.platformCommission || 0), change: `+${stats?.commissionGrowth || 0}%`, up: true, icon: <DollarSign size={24} />, color: 'from-emerald-500 to-teal-600' },
          { title: 'Phê duyệt', value: stats?.pendingApprovals.toString() || '0', change: 'Priority', up: false, icon: <ShieldCheck size={24} />, color: 'from-orange-500 to-rose-600' },
        ].map((s) => (
          <motion.div 
            key={s.title} 
            variants={fadeIn}
            whileHover={{ y: -5 }}
            className="group relative bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 rounded-3xl p-6 transition-all shadow-sm hover:shadow-xl"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.color} opacity-[0.03] dark:opacity-[0.05] rounded-bl-[5rem]`} />
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                {s.icon}
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${s.up ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                {s.change}
              </span>
            </div>
            <p className="text-slate-400 dark:text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">{s.title}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{s.value}</h3>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Performance Chart Placeholder */}
          <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Tăng trưởng hệ thống</h3>
                <p className="text-slate-400 dark:text-white/40 text-xs mt-1">Tổng quan doanh thu & người dùng</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                <button className="px-4 py-1.5 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Revenue</button>
                <button className="px-4 py-1.5 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">Users</button>
              </div>
            </div>
            <div className="h-56 w-full flex items-center justify-center border border-dashed border-slate-200 dark:border-white/5 rounded-3xl bg-slate-50 dark:bg-white/[0.01]">
              <div className="text-center">
                <BarChart3 size={40} className="mx-auto mb-3 text-slate-200 dark:text-white/5" />
                <p className="text-slate-400 dark:text-white/20 text-[10px] font-black uppercase tracking-widest italic">Synchronizing assets...</p>
              </div>
            </div>
          </motion.div>

          {/* User Management */}
          <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Users size={20} />
                </div>
                Quản lý người dùng
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" size={16} />
                  <input 
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm ID, Tên, Email..."
                    className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-11 pr-5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20 w-full sm:w-64"
                  />
                </div>
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
                  {(['all', 'owners', 'customers'] as const).map(tab => (
                    <button 
                      key={tab} onClick={() => setUserTab(tab)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        userTab === tab ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-white/40'
                      }`}
                    >
                      {tab === 'all' ? 'Tất cả' : tab === 'owners' ? 'Chủ sân' : 'Khách'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 dark:text-white/20 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                    <th className="px-8 py-6 text-primary">Identity</th>
                    <th className="px-4 py-6">Privileges</th>
                    <th className="px-4 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Matrix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black shadow-lg">
                            {u.fullName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{u.fullName}</p>
                            <p className="text-[10px] text-slate-400 dark:text-white/30 font-medium">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${roleStyles(u.role)}`}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500'}`}>
                            {u.isActive ? 'Active' : 'Locked'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 hover:text-primary dark:hover:text-white rounded-xl transition-all"><Eye size={16} /></button>
                          {u.role !== 3 && (
                            <button onClick={() => handleBanUser(u.id)} className="w-9 h-9 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"><Ban size={16} /></button>
                          )}
                          <button className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"><MoreVertical size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Phê duyệt</h3>
              <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                {(['pending', 'approved'] as const).map(tab => (
                  <button 
                    key={tab} onClick={() => setApprovalTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      approvalTab === tab ? 'bg-primary text-white shadow-lg' : 'text-slate-400 dark:text-white/40'
                    }`}
                  >
                    {tab === 'pending' ? 'Chờ' : 'Xong'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {approvals.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-white/2 rounded-[2rem] border border-dashed border-slate-200 dark:border-white/5">
                  <ShieldCheck size={32} className="mx-auto mb-3 text-slate-200 dark:text-white/10" />
                  <p className="text-[10px] text-slate-400 dark:text-white/20 font-black uppercase tracking-widest italic">All clear</p>
                </div>
              ) : (
                approvals.map((a) => (
                  <div key={a.id} className="p-5 bg-slate-50 dark:bg-[#1e202b] rounded-[1.5rem] border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-tight mb-1">{a.pitchName}</h4>
                        <p className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={10} /> {new Date(a.submittedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="px-2 py-1 bg-white dark:bg-white/5 rounded-lg text-[8px] font-black text-slate-400 dark:text-white/40 uppercase">
                        {pitchTypeLabel(a.pitchType)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-white/40">
                        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">{a.ownerName[0]}</div>
                        <span className="text-[10px] font-bold line-clamp-1">{a.ownerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproval(a.id, 'approve')} className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle size={14} /></button>
                            <button onClick={() => handleApproval(a.id, 'reject')} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><XCircle size={14} /></button>
                          </>
                        )}
                        <button className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all"><ChevronRight size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-gradient-to-br from-primary to-indigo-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-4 tracking-tight leading-tight">Cấu trúc hạ tầng</h3>
              <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Server Latency</p>
                  <p className="text-xl font-black italic tracking-tighter">14ms</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Active Clusters</p>
                  <p className="text-xl font-black italic tracking-tighter">04 Nodes</p>
                </div>
              </div>
            </div>
            <Activity className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
