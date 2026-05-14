import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, DollarSign, ShieldCheck,
  Search, CheckCircle, XCircle, Eye, Ban,
  Activity, MoreVertical,
  Lock, UserCheck, AlertCircle, ChevronRight, BarChart3,
  Calendar, Zap, TrendingUp, ArrowUpRight, ArrowDownRight,
  Filter, Globe, Server
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userTab, setUserTab] = useState<'all' | 'owners' | 'customers'>('all');
  const [search, setSearch] = useState('');
  const [approvalTab, setApprovalTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
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
      const statsRes = await api.get('/dashboard/admin/stats') as any;
      setStats(statsRes);
    } catch {
      setError('Không thể tải dữ liệu thống kê.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const roleFilter = userTab === 'owners' ? 2 : userTab === 'customers' ? 1 : undefined;
      const res = await api.get('/admin/users', { params: { search: search || undefined, role: roleFilter, pageSize: 20 } }) as any;
      setUsers(res?.items || res || []);
    } catch {
      setUsers([]);
    }
  };

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/admin/pitch-approvals', { params: { status: approvalTab } }) as any;
      setApprovals(res?.items || res || []);
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
    if (r === 3) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (r === 2) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    return 'bg-slate-50 text-slate-500 border-slate-100';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-8 animate-in fade-in duration-700">
        <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Initializing system core...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Administrative Engine</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">SmartSport HQ</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Quản trị viên: <span className="text-blue-600 font-bold">{user?.fullName}</span> • {new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}
          </p>
        </div>
        
        <div className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-4 shadow-sm group">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest italic">System Status: Optimal</span>
        </div>
      </header>

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-[2rem] text-red-600 text-xs font-black flex items-center gap-4">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: 'Tổng người dùng', value: stats?.totalUsers?.toLocaleString() || '0', change: `+${stats?.userGrowth || 0}%`, up: true, icon: <Users size={24} />, color: 'blue-600' },
          { title: 'Chủ sân hoạt động', value: stats?.activeOwners?.toLocaleString() || '0', change: 'Stable', up: true, icon: <UserCheck size={24} />, color: 'indigo-600' },
          { title: 'Hoa hồng nền tảng', value: formatCurrency(stats?.platformCommission || 0), change: `+${stats?.commissionGrowth || 0}%`, up: true, icon: <DollarSign size={24} />, color: 'emerald-600' },
          { title: 'Chờ phê duyệt', value: stats?.pendingApprovals?.toLocaleString() || '0', change: 'Critical', up: false, icon: <ShieldCheck size={24} />, color: 'rose-600' },
        ].map((s, i) => (
          <motion.div 
            key={s.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-xl hover:border-blue-600/20 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-${s.color} border border-slate-100 dark:border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                {s.icon}
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black ${s.up ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {s.change}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{s.title}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{s.value}</h3>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-50 dark:bg-slate-900/50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-10 shadow-sm group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-500/20">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Tăng trưởng hệ thống</h3>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-13">Thống kê doanh thu & Người dùng mới</p>
              </div>
              <div className="flex items-center gap-2">
                {['Revenue', 'Users'].map(t => (
                  <button key={t} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${t === 'Revenue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{t}</button>
                ))}
              </div>
            </div>
            
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-700/50 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/30 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
              <BarChart3 size={48} className="text-slate-200 dark:text-slate-800 mb-6" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Analyzing market trends...</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-100">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <Users size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Quản lý người dùng</h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative group flex-1 md:w-64">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="ID, Tên, Email..."
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-600 transition-all shadow-inner"
                  />
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl">
                  {(['all', 'owners', 'customers'] as const).map(tab => (
                    <button 
                      key={tab} onClick={() => setUserTab(tab)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        userTab === tab ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      {tab === 'all' ? 'Tất cả' : tab === 'owners' ? 'Chủ sân' : 'Khách'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800">Identity</th>
                    <th className="px-6 py-6 border-b border-slate-100 dark:border-slate-800">Role</th>
                    <th className="px-6 py-6 border-b border-slate-100 dark:border-slate-800">Status</th>
                    <th className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                            {u.fullName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{u.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${roleStyles(u.role)}`}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {u.isActive ? 'Active' : 'Locked'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:text-blue-600 rounded-xl border border-slate-100 dark:border-slate-800 transition-all"><Eye size={18} /></button>
                          {u.role !== 3 && (
                            <button onClick={() => handleBanUser(u.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl border border-red-100 dark:border-red-500/20 transition-all"><Ban size={18} /></button>
                          )}
                          <button className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-100 dark:border-slate-800 transition-all"><MoreVertical size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-500/20">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Phê duyệt</h3>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
                {(['pending', 'approved'] as const).map(tab => (
                  <button 
                    key={tab} onClick={() => setApprovalTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      approvalTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab === 'pending' ? 'Chờ' : 'Xong'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {approvals.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/30 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                  <CheckCircle size={40} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">All queues cleared</p>
                </div>
              ) : (
                approvals.map((a) => (
                  <div key={a.id} className="p-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-blue-600/30 transition-all shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">{a.pitchName}</h4>
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <Calendar size={12} /> {new Date(a.submittedAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[8px] font-black text-slate-400 uppercase border border-slate-100 dark:border-slate-700">
                        {a.pitchType}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-indigo-600/20">{a.ownerName[0]?.toUpperCase()}</div>
                        <span className="text-[10px] font-black text-slate-500 truncate max-w-[100px]">{a.ownerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproval(a.id, 'approve')} className="w-10 h-10 flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><CheckCircle size={16} /></button>
                            <button onClick={() => handleApproval(a.id, 'reject')} className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><XCircle size={16} /></button>
                          </>
                        )}
                        <button className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"><ChevronRight size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group">
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="font-black text-2xl tracking-tight leading-none flex items-center gap-3">
                  <Globe className="text-blue-500 animate-spin-slow" /> Network Node
                </h3>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-3 italic">Live Infrastructure Status</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md group-hover:bg-white/10 transition-colors">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                    <Zap size={10} className="text-blue-400" /> Latency
                  </p>
                  <p className="text-2xl font-black italic tracking-tighter leading-none">14ms</p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md group-hover:bg-white/10 transition-colors">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                    <Server size={10} className="text-indigo-400" /> Clusters
                  </p>
                  <p className="text-2xl font-black italic tracking-tighter leading-none">04 Node</p>
                </div>
              </div>
            </div>
            <Activity className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
