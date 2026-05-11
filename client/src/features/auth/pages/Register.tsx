import React, { useState } from 'react';
import { Mail, Lock, ChevronRight, User, Phone, MapPin, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService, UserRole } from '../../../services/authService';
import { useVietnamLocations } from '../../../hooks/useVietnamLocations';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
  </svg>
);

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Basic Data
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Location Data from Hook
  const { 
    provinces, districts, wards,
    selectedProvince, setSelectedProvince,
    selectedDistrict, setSelectedDistrict,
    selectedWard, setSelectedWard
  } = useVietnamLocations();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      setError('Vui lòng chọn đầy đủ địa chỉ.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const fullAddress = `${detailAddress ? detailAddress + ', ' : ''}${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;
      
      await authService.register({
        email,
        password,
        fullName: name,
        phoneNumber: phone,
        address: fullAddress,
        role: UserRole.Customer
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.Detail || 'Đăng ký thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex-1 flex pt-20"
    >
      {/* Cột Phải: Hình ảnh */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900 overflow-hidden order-2">
        <img 
          src="https://images.unsplash.com/photo-1595435066359-6286386730b9?q=80&w=1500" 
          alt="Sports Complex" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-16 left-16 right-16 text-white">
          <h2 className="text-6xl font-black mb-6 leading-tight drop-shadow-2xl font-heading">Gia nhập <br/><span className="text-primary">SmartSport</span></h2>
          <p className="text-xl text-slate-100 leading-relaxed font-bold drop-shadow-lg">Trở thành một phần của mạng lưới kết nối thể thao lớn nhất Việt Nam. Hoàn toàn miễn phí.</p>
        </div>
      </div>

      {/* Cột Trái: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white order-1">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Tạo tài khoản mới</h2>
            <p className="text-slate-500 font-bold">Bắt đầu hành trình thể thao của bạn ngay hôm nay</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-lg shadow-red-500/5"
            >
              <Lock size={18} /> {error}
            </motion.div>
          )}

          <form className="flex flex-col gap-6" onSubmit={handleRegister}>
            {/* Hàng 1: Họ tên & SĐT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và Tên</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A" 
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Số điện thoại</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678" 
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Hàng 2: Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Địa chỉ Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm"
                />
              </div>
            </div>

            {/* Hàng 3: Tỉnh/Thành - Quận/Huyện (Thực tế) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tỉnh / Thành phố</label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                  <select 
                    value={selectedProvince?.code || ''}
                    onChange={(e) => {
                        const p = provinces.find(x => x.code === e.target.value);
                        if (p) setSelectedProvince(p);
                    }}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Chọn Tỉnh/Thành</option>
                    {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quận / Huyện</label>
                <select 
                  value={selectedDistrict?.code || ''}
                  onChange={(e) => {
                    const d = districts.find(x => x.code === e.target.value);
                    if (d) setSelectedDistrict(d);
                  }}
                  required
                  disabled={!selectedProvince}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm appearance-none cursor-pointer disabled:opacity-40"
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
              </div>
            </div>

            {/* Hàng 4: Phường/Xã & Số nhà */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phường / Xã</label>
                <select 
                  value={selectedWard?.code || ''}
                  onChange={(e) => {
                    const w = wards.find(x => x.code === e.target.value);
                    if (w) setSelectedWard(w);
                  }}
                  required
                  disabled={!selectedDistrict}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm appearance-none cursor-pointer disabled:opacity-40"
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Số nhà, tên đường</label>
                <input 
                  type="text" 
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="Ví dụ: 123 Nguyễn Huệ" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm"
                />
              </div>
            </div>

            {/* Hàng 5: Mật khẩu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mật khẩu</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Xác nhận</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-primary text-white font-black rounded-[1.5rem] py-5 mt-4 flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>Tạo tài khoản ngay <ChevronRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-10 flex flex-col gap-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="bg-white px-6">Hoặc đăng ký bằng</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 w-full py-4 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-700 transition-all shadow-sm">
                <GoogleIcon />
                Google
              </button>
              <button className="flex items-center justify-center gap-3 w-full py-4 bg-[#1877F2]/5 border border-[#1877F2]/10 hover:bg-[#1877F2]/10 rounded-2xl font-black text-xs uppercase tracking-widest text-[#1877F2] transition-all shadow-sm">
                <FacebookIcon />
                Facebook
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-slate-500 font-bold">
            Đã có tài khoản? <Link to="/login" className="text-primary font-black hover:underline underline-offset-4">Đăng nhập ngay</Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Register;
