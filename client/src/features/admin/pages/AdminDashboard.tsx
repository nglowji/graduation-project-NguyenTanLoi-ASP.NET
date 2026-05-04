import React from 'react';
import { Users, AlertTriangle, CheckCircle, Ban, Search, Filter } from 'lucide-react';
import DashboardLayout from '../../../layouts/DashboardLayout';

const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản trị hệ thống</h1>
            <p className="text-text/50">Quản lý người dùng, sân bãi và báo cáo toàn hệ thống.</p>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminStatCard title="Tổng người dùng" value="1,284" icon={<Users className="text-primary" />} color="bg-primary/10" />
          <AdminStatCard title="Báo cáo chờ xử lý" value="12" icon={<AlertTriangle className="text-secondary" />} color="bg-secondary/10" />
          <AdminStatCard title="Chủ sân đã xác minh" value="48" icon={<CheckCircle className="text-green-500" />} color="bg-green-500/10" />
        </div>

        {/* User Management Table */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Quản lý Người dùng</h3>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm người dùng..." 
                  className="bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm">
                <Filter size={16} /> Lọc
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-text/30 text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="px-4 py-3 font-bold">Người dùng</th>
                  <th className="px-4 py-3 font-bold">Vai trò</th>
                  <th className="px-4 py-3 font-bold">Ngày tham gia</th>
                  <th className="px-4 py-3 font-bold">Trạng thái</th>
                  <th className="px-4 py-3 font-bold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <UserRow name="Lợi Nguyễn" email="loi@example.com" role="Admin" date="12/05/2024" status="Hoạt động" />
                <UserRow name="Phước Hữu" email="phuoc@example.com" role="Chủ sân" date="04/06/2024" status="Hoạt động" />
                <UserRow name="Minh Trí" email="tri@example.com" role="Khách hàng" date="15/06/2024" status="Đình chỉ" />
                <UserRow name="Quốc Anh" email="anh@example.com" role="Khách hàng" date="01/07/2024" status="Hoạt động" />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const AdminStatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
  <div className="glass-card flex items-center gap-6">
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-text/50">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </div>
);

const UserRow: React.FC<{ name: string, email: string, role: string, date: string, status: string }> = ({ name, email, role, date, status }) => (
  <tr className="hover:bg-white/5 transition-colors group">
    <td className="px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
          {name[0]}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-text/30">{email}</p>
        </div>
      </div>
    </td>
    <td className="px-4 py-4">
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
        role === 'Admin' ? 'bg-purple-500/10 text-purple-400' :
        role === 'Chủ sân' ? 'bg-blue-500/10 text-blue-400' :
        'bg-text/10 text-text/50'
      }`}>
        {role}
      </span>
    </td>
    <td className="px-4 py-4 text-sm text-text/50">{date}</td>
    <td className="px-4 py-4">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status === 'Hoạt động' ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs">{status}</span>
      </div>
    </td>
    <td className="px-4 py-4 text-right">
      <button className="p-2 hover:bg-red-500/10 text-text/30 hover:text-red-500 rounded-lg transition-colors">
        <Ban size={16} />
      </button>
    </td>
  </tr>
);

export default AdminDashboard;
