import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-primary h-32 md:h-48 relative">
             <div className="absolute -bottom-16 left-8 md:left-12">
               <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center text-4xl font-black text-primary">
                 {user.fullName.charAt(0).toUpperCase()}
               </div>
             </div>
          </div>
          
          <div className="pt-20 pb-12 px-8 md:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">{user.fullName}</h1>
                <p className="text-slate-500 font-medium">{user.email}</p>
              </div>
              <button className="btn-primary py-2.5 px-6 rounded-xl text-sm">
                Chỉnh sửa hồ sơ
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Thông tin tài khoản</h3>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Họ và tên</p>
                    <p className="font-bold text-slate-900">{user.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Email</p>
                    <p className="font-bold text-slate-900">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Bảo mật & Vai trò</h3>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Vai trò</p>
                    <p className="font-bold text-slate-900">
                      {user.role === 1 ? 'Khách hàng' : user.role === 2 ? 'Chủ sân' : 'Quản trị viên'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Ngày gia nhập</p>
                    <p className="font-bold text-slate-900">01/01/2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
