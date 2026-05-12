import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, ShoppingBag, Bell, Lock, LogOut, 
  Camera, MapPin, Phone, Mail, ChevronRight,
  ShieldCheck, Clock,
  AlertCircle, Save, Loader2, Edit3, X,
  ExternalLink, MailCheck, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { useVietnamLocations, type Province, type District, type Ward } from '../../../hooks/useVietnamLocations';

type TabType = 'profile' | 'bookings' | 'notifications' | 'security';

const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Location selection states
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // Vietnam Locations Hook integration
  const { 
    provinces, districts, wards
  } = useVietnamLocations(selectedProvince?.code, selectedDistrict?.code);

  // Form states
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    mapLink: user?.mapLink || ''
  });

  useEffect(() => {
    fetchProfile();
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data) {
        setFormData({
          fullName: res.data.fullName || '',
          email: res.data.email || '',
          phoneNumber: res.data.phoneNumber || '',
          address: res.data.address || '',
          mapLink: res.data.mapLink || ''
        });
        updateUser(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404 && err.response?.data?.title === 'User not found') {
         setNotification({ type: 'error', message: 'Dữ liệu người dùng đã thay đổi. Vui lòng đăng xuất và đăng nhập lại để tiếp tục.' });
      }
    }
  };

  // Auto-clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data?.items || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: <User size={20} />, color: 'text-blue-500' },
    { id: 'bookings', label: 'Lịch sử đặt sân', icon: <ShoppingBag size={20} />, color: 'text-emerald-500' },
    { id: 'notifications', label: 'Thông báo', icon: <Bell size={20} />, color: 'text-rose-500' },
    { id: 'security', label: 'Xác thực Email', icon: <Lock size={20} />, color: 'text-indigo-500' },
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const locationString = `${selectedWard?.name || ''}, ${selectedDistrict?.name || ''}, ${selectedProvince?.name || ''}`;
      const finalAddress = locationString.trim() === ', ,' ? formData.address : locationString;

      await api.patch('/users/profile', {
        ...formData,
        address: finalAddress
      });
      
      // Update global context immediately
      updateUser({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        address: finalAddress,
        mapLink: formData.mapLink
      });

      setIsEditing(false);
      setNotification({ type: 'success', message: 'Cập nhật thành công!' });
    } catch (err: any) {
      const data = err.response?.data;
      let msg = data?.detail || data?.message || (typeof data === 'string' ? data : null) || 'Không thể cập nhật thông tin.';
      
      if (msg === 'User not found') {
        msg = 'Phiên đăng nhập đã hết hạn hoặc dữ liệu không khớp. Vui lòng ĐĂNG XUẤT và ĐĂNG NHẬP lại.';
      }

      if (data?.errors) {
        const validationErrors = Object.values(data.errors).flat().join(', ');
        setNotification({ type: 'error', message: `Lỗi: ${validationErrors}` });
      } else {
        setNotification({ type: 'error', message: msg });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-32 pb-24 font-body">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar */}
            <aside className="w-full lg:w-80 shrink-0">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden sticky top-32">
                {/* User Brief */}
                <div className="p-8 text-center border-b border-slate-50 bg-gradient-to-b from-slate-50/50 to-transparent">
                  <div className="relative inline-block mb-4 group">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-500/20">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all group-hover:scale-110 active:scale-90">
                      <Camera size={18} />
                    </button>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{user?.fullName}</h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {user?.role === 3 ? 'Quản trị viên' : user?.role === 2 ? 'Chủ sân' : 'Thành viên'}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Đang hoạt động</span>
                  </div>
                </div>

                {/* Nav Menu */}
                <nav className="p-4">
                  <div className="space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id as TabType); setIsEditing(false); }}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                          activeTab === item.id 
                          ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl transition-colors ${activeTab === item.id ? 'bg-white/10 text-white' : item.color + ' bg-slate-50 group-hover:bg-white'}`}>
                            {item.icon}
                          </div>
                          <span className="text-sm font-black tracking-tight">{item.label}</span>
                        </div>
                        <ChevronRight size={16} className={`transition-transform ${activeTab === item.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-50">
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-sm"
                    >
                      <div className="p-2 rounded-xl bg-red-100">
                        <LogOut size={20} />
                      </div>
                      Đăng xuất
                    </button>
                  </div>
                </nav>
              </div>
            </aside>

            {/* Right Content */}
            <main className="flex-1">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-10">
                      <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <User size={24} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight font-heading">Thông tin cá nhân</h3>
                            <p className="text-sm font-bold text-slate-400">Quản lý các thông tin định danh của bạn</p>
                          </div>
                        </div>
                        
                        {!isEditing ? (
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                          >
                            <Edit3 size={16} /> Chỉnh sửa
                          </button>
                        ) : (
                          <button 
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                          >
                            <X size={16} /> Hủy bỏ
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleUpdateProfile} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Họ tên */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên</label>
                            <div className="relative group">
                              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                              <input 
                                type="text" 
                                value={formData.fullName}
                                readOnly={!isEditing}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                className={`w-full border rounded-2xl py-4 pl-14 pr-6 font-bold text-sm outline-none transition-all ${
                                  isEditing 
                                  ? 'bg-white border-primary ring-4 ring-primary/5' 
                                  : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}
                                placeholder="Nhập họ tên đầy đủ"
                              />
                            </div>
                          </div>
                          
                          {/* Email (Readonly) */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email liên hệ</label>
                            <div className="relative group opacity-60">
                              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input 
                                type="email" 
                                value={formData.email}
                                disabled
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-bold text-sm cursor-not-allowed"
                              />
                            </div>
                          </div>

                          {/* Số điện thoại */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Số điện thoại</label>
                            <div className="relative group">
                              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                              <input 
                                type="tel" 
                                value={formData.phoneNumber}
                                readOnly={!isEditing}
                                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                className={`w-full border rounded-2xl py-4 pl-14 pr-6 font-bold text-sm outline-none transition-all ${
                                  isEditing 
                                  ? 'bg-white border-primary ring-4 ring-primary/5' 
                                  : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}
                                placeholder="09xx xxx xxx"
                              />
                            </div>
                          </div>

                          {/* Tỉnh thành (Dùng Hook thực tế khi Editing) */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tỉnh / Thành phố</label>
                            <select 
                              disabled={!isEditing}
                              value={selectedProvince?.code || ''}
                              onChange={(e) => {
                                const code = Number(e.target.value);
                                const p = provinces.find(x => x.code === code);
                                if (p) setSelectedProvince(p);
                                setSelectedDistrict(null);
                                setSelectedWard(null);
                              }}
                              className={`w-full border rounded-2xl py-4 px-6 font-bold text-sm outline-none transition-all appearance-none cursor-pointer ${
                                isEditing ? 'bg-white border-primary ring-4 ring-primary/5' : 'bg-slate-50 border-slate-100 text-slate-500'
                              }`}
                            >
                              <option value="">{user?.address || 'Chọn Tỉnh / Thành'}</option>
                              {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                            </select>
                          </div>

                          {isEditing && (
                            <>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quận / Huyện</label>
                                <select 
                                  value={selectedDistrict?.code || ''}
                                  onChange={(e) => {
                                    const code = Number(e.target.value);
                                    const d = districts.find(x => x.code === code);
                                    if (d) setSelectedDistrict(d);
                                    setSelectedWard(null);
                                  }}
                                  className="w-full bg-white border-primary border rounded-2xl py-4 px-6 font-bold text-sm outline-none ring-4 ring-primary/5 appearance-none cursor-pointer"
                                >
                                  <option value="">Chọn Quận / Huyện</option>
                                  {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phường / Xã</label>
                                <select 
                                  value={selectedWard?.code || ''}
                                  onChange={(e) => {
                                    const code = Number(e.target.value);
                                    const w = wards.find(x => x.code === code);
                                    if (w) setSelectedWard(w);
                                  }}
                                  className="w-full bg-white border-primary border rounded-2xl py-4 px-6 font-bold text-sm outline-none ring-4 ring-primary/5 appearance-none cursor-pointer"
                                >
                                  <option value="">Chọn Phường / Xã</option>
                                  {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                </select>
                              </div>
                            </>
                          )}

                          {/* Địa chỉ chi tiết */}
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Địa chỉ chi tiết (hoặc địa chỉ hiện tại)</label>
                            <div className="relative group">
                              <MapPin className="absolute left-5 top-5 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                              <textarea 
                                value={formData.address}
                                readOnly={!isEditing}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                rows={2}
                                className={`w-full border rounded-2xl py-4 pl-14 pr-6 font-bold text-sm outline-none transition-all resize-none ${
                                  isEditing ? 'bg-white border-primary ring-4 ring-primary/5' : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}
                                placeholder="Số nhà, tên đường..."
                              />
                            </div>
                          </div>

                          {/* Link Google Map */}
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link Google Map (Tọa độ cụ thể)</label>
                            <div className="relative group">
                              <ExternalLink className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                              <input 
                                type="url" 
                                value={formData.mapLink}
                                readOnly={!isEditing}
                                onChange={(e) => setFormData({...formData, mapLink: e.target.value})}
                                className={`w-full border rounded-2xl py-4 pl-14 pr-6 font-bold text-sm outline-none transition-all ${
                                  isEditing ? 'bg-white border-primary ring-4 ring-primary/5' : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}
                                placeholder="https://www.google.com/maps/place/..."
                              />
                            </div>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="pt-8 flex justify-end border-t border-slate-50">
                            <button 
                              type="submit"
                              disabled={isSaving}
                              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-primary transition-all active:scale-95 flex items-center gap-3"
                            >
                              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                              Lưu thay đổi
                            </button>
                          </div>
                        )}
                      </form>
                    </div>

                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-600/20">
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <ShieldCheck size={20} />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Hệ sinh thái thông minh</span>
                        </div>
                        <h4 className="text-2xl font-black mb-4">Kết nối đam mê thể thao!</h4>
                        <p className="text-sm font-bold text-white/60 max-w-lg mb-8">Trải nghiệm đặt sân nhanh nhất Việt Nam với hệ thống SmartSport.</p>
                        <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-blue-600 transition-all"> Khám phá ngay </button>
                      </div>
                      <ShieldCheck size={200} className="absolute -bottom-10 -right-10 text-white/5" />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'bookings' && (
                  <motion.div
                    key="bookings-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight font-heading">Lịch sử đặt sân</h3>
                        <p className="text-sm font-bold text-slate-400">Theo dõi các đơn hàng và trạng thái sân</p>
                      </div>
                    </div>

                    {isLoadingBookings ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                        <Loader2 className="animate-spin text-primary mb-4" size={40} />
                        <p className="text-slate-400 font-bold">Đang tải lịch sử đặt sân...</p>
                      </div>
                    ) : bookings.length > 0 ? (
                      bookings.map((item) => (
                        <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 flex flex-col md:flex-row gap-8 group hover:border-primary/20 transition-all">
                          <div className="w-full md:w-48 h-32 rounded-3xl bg-slate-100 overflow-hidden shrink-0">
                            <img src={item.pitchImage || `https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Field" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xl font-black text-slate-900 mb-1 group-hover:text-primary transition-colors">{item.pitchName}</h4>
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                  <MapPin size={12} /> {item.address}
                                </p>
                              </div>
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                {item.status === 'Success' ? 'Thành công' : 'Đã hoàn thành'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-50">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                                <p className="text-xs font-black text-slate-700 flex items-center gap-1"><Clock size={12} /> {item.startTime} - {item.endTime}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày đặt</p>
                                <p className="text-xs font-black text-slate-700 flex items-center gap-1"><Clock size={12} /> {new Date(item.bookingDate).toLocaleDateString('vi-VN')}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Loại sân</p>
                                <p className="text-xs font-black text-slate-700">{item.pitchType}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Thanh toán</p>
                                <p className="text-sm font-black text-primary">{item.totalAmount.toLocaleString('vi-VN')}đ</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                        <ShoppingBag size={64} className="text-slate-200 mb-6" />
                        <h4 className="text-xl font-black text-slate-900 mb-2">Chưa có đơn đặt sân nào</h4>
                        <p className="text-slate-400 font-bold mb-8 text-center max-w-xs">Bắt đầu khám phá và đặt sân bóng yêu thích của bạn ngay hôm nay!</p>
                        <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-primary transition-all">Khám phá sân ngay</button>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight font-heading">Thông báo</h3>
                        <p className="text-sm font-bold text-slate-400">Cập nhật những tin tức mới nhất từ SmartSport</p>
                      </div>
                      <button className="text-xs font-black text-primary hover:underline uppercase tracking-widest">Đánh dấu đã đọc tất cả</button>
                    </div>

                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                      <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200">
                          <Bell size={48} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                        </div>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-2">Chưa có thông báo nào</h4>
                      <p className="text-slate-400 font-bold mb-8 text-center max-w-xs">Mọi cập nhật về lịch đặt sân và khuyến mãi sẽ xuất hiện tại đây.</p>
                      <button 
                        onClick={() => setActiveTab('bookings')}
                        className="bg-slate-50 text-slate-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all"
                      >
                        Kiểm tra đặt sân
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    key="security-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-10">
                      <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight font-heading">Xác thực tài khoản</h3>
                          <p className="text-sm font-bold text-slate-400">Đảm bảo an toàn tuyệt đối cho tài khoản của bạn</p>
                        </div>
                      </div>

                      <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${user?.emailConfirmed ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>
                            {user?.emailConfirmed ? <MailCheck size={32} /> : <AlertCircle size={32} />}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 mb-1">Xác thực địa chỉ Email</h4>
                            <p className="text-xs font-bold text-slate-400">Trạng thái: <span className={user?.emailConfirmed ? 'text-emerald-500' : 'text-amber-500'}>{user?.emailConfirmed ? 'Đã xác minh' : 'Chưa xác minh'}</span></p>
                          </div>
                        </div>
                        {!user?.emailConfirmed && (
                          <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all">Gửi mã xác thực</button>
                        )}
                      </div>

                      <div className="mt-8 space-y-4">
                         <div className="flex items-start gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                            <ShieldCheck className="text-blue-500 shrink-0" size={20} />
                            <div>
                               <p className="text-sm font-black text-slate-900 mb-1">Tại sao cần xác thực email?</p>
                               <p className="text-xs font-bold text-slate-500 leading-relaxed">Xác thực email giúp bạn bảo mật tài khoản, nhận thông báo đặt sân nhanh nhất và khôi phục mật khẩu khi cần thiết.</p>
                            </div>
                         </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex items-center justify-between overflow-hidden relative">
                       <div className="relative z-10">
                          <h4 className="text-xl font-black mb-2">Đổi mật khẩu</h4>
                          <p className="text-sm font-bold text-white/40 mb-6">Bạn nên thay đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
                          <button className="flex items-center gap-2 text-white font-black text-sm hover:text-primary transition-colors">
                             Thiết lập ngay <ExternalLink size={16} />
                          </button>
                       </div>
                       <Lock size={150} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>

        </div>
      </div>

      {/* Premium Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] min-w-[320px]"
          >
            <div className={`p-1 rounded-[2rem] shadow-2xl backdrop-blur-xl ${
              notification.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-emerald-500/10' 
                : 'bg-red-500/10 border border-red-500/20 shadow-red-500/10'
            }`}>
              <div className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-[#1a1c26] rounded-[1.8rem]">
                {notification.type === 'success' ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                    <AlertCircle size={20} />
                  </div>
                )}
                <div className="flex-1 pr-4">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${
                    notification.type === 'success' ? 'text-emerald-500' : 'text-red-400'
                  }`}>
                    {notification.type === 'success' ? 'Thành công' : 'Thất bại'}
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-white/80 mt-0.5 leading-tight">
                    {notification.message}
                  </p>
                </div>
                <button 
                  onClick={() => setNotification(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-all flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
