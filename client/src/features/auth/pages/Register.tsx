import React, { useState } from 'react';
import { Mail, Lock, ChevronRight, User, Phone, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService, UserRole } from '../../../services/authService';

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

const LOCATION_DATA: Record<string, Record<string, string[]>> = {
  "TP. Hồ Chí Minh": {
    "Quận 1": ["Phường Bến Nghé", "Phường Bến Thành", "Phường Đa Kao", "Phường Tân Định"],
    "Quận 3": ["Phường Võ Thị Sáu", "Phường 1", "Phường 2", "Phường 5"],
    "Quận 7": ["Phường Tân Phong", "Phường Tân Phú", "Phường Phú Mỹ", "Phường Tân Kiểng"],
    "Quận 10": ["Phường 1", "Phường 12", "Phường 14", "Phường 15"],
    "Quận Tân Bình": ["Phường 2", "Phường 12", "Phường 13", "Phường 15"],
    "Quận Bình Thạnh": ["Phường 1", "Phường 2", "Phường 25", "Phường 26"],
    "TP. Thủ Đức": ["Phường Thảo Điền", "Phường An Phú", "Phường Hiệp Bình Chánh"],
  },
  "Hà Nội": {
    "Quận Ba Đình": ["Phường Cống Vị", "Phường Điện Biên", "Phường Đội Cấn", "Phường Kim Mã"],
    "Quận Hoàn Kiếm": ["Phường Chương Dương", "Phường Cửa Đông", "Phường Đồng Xuân", "Phường Hàng Bạc"],
    "Quận Tây Hồ": ["Phường Bưởi", "Phường Thụy Khuê", "Phường Yên Phụ"],
    "Quận Cầu Giấy": ["Phường Dịch Vọng", "Phường Nghĩa Đô", "Phường Quan Hoa"],
  },
  "Đà Nẵng": {
    "Quận Hải Châu": ["Phường Hòa Cường Bắc", "Phường Hòa Cường Nam", "Phường Nam Dương"],
    "Quận Thanh Khê": ["Phường An Khê", "Phường Chính Gián", "Phường Hòa Khê"],
  },
  "Bà Rịa – Vũng Tàu": {
    "TP. Vũng Tàu": ["Phường 1", "Phường 2", "Phường 3", "Phường Thắng Tam", "Phường Rạch Dừa"],
    "TP. Bà Rịa": ["Phường Phước Trung", "Phường Phước Hiệp", "Phường Phước Nguyên"],
    "Thị xã Phú Mỹ": ["Phường Phú Mỹ", "Phường Mỹ Xuân", "Phường Hắc Dịch"],
    "Huyện Long Điền": ["Thị trấn Long Điền", "Thị trấn Long Hải", "Xã Phước Hưng"],
  },
  "An Giang": {
    "TP. Long Xuyên": ["Phường Mỹ Bình", "Phường Mỹ Long", "Phường Mỹ Xuyên"],
    "TP. Châu Đốc": ["Phường Châu Phú A", "Phường Châu Phú B", "Phường Vĩnh Mỹ"],
  },
  "Khánh Hòa": {
    "TP. Nha Trang": ["Phường Lộc Thọ", "Phường Vĩnh Nguyên", "Phường Vĩnh Hải"],
    "TP. Cam Ranh": ["Phường Cam Linh", "Phường Cam Lộc", "Phường Cam Lợi"],
  },
  "Quảng Ninh": {
    "TP. Hạ Long": ["Phường Bãi Cháy", "Phường Hồng Gai", "Phường Hòn Gai"],
    "TP. Móng Cái": ["Phường Ka Long", "Phường Trần Phú", "Phường Hòa Lạc"],
  }
};

const VIETNAM_PROVINCES = [
  "An Giang", "Bà Rịa – Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lạng Sơn", "Lào Cai", "Lâm Đồng", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

const Register: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districts, setDistricts] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = e.target.value;
    setSelectedProvince(province);
    setSelectedDistrict('');
    setWards([]);
    
    if (province) {
      const districtData = LOCATION_DATA[province];
      if (districtData) {
        setDistricts(Object.keys(districtData));
      } else {
        // Dynamic generator for other provinces
        setDistricts([`Thành phố ${province}`, `Huyện Đông ${province}`, `Huyện Tây ${province}`, `Huyện Nam ${province}`, `Huyện Bắc ${province}`]);
      }
    } else {
      setDistricts([]);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    
    if (district) {
      const wardData = LOCATION_DATA[selectedProvince]?.[district];
      if (wardData) {
        setWards(wardData);
      } else {
        // Dynamic generator for wards
        setWards(["Phường Trung Tâm", "Phường 1", "Phường 2", "Xã Bình Minh", "Xã Hòa Bình"]);
      }
    } else {
      setWards([]);
    }
  };

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.register({
        email,
        password,
        fullName: name,
        phoneNumber: phone,
        role: UserRole.Customer
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.Detail || 'Đăng ký thất bại. Vui lòng thử lại.');
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
          <h2 className="text-6xl font-black mb-6 leading-tight drop-shadow-2xl">Gia nhập cộng đồng <br/><span className="text-primary">SmartSport</span></h2>
          <p className="text-2xl text-slate-100 leading-relaxed font-medium drop-shadow-lg">Trở thành một phần của mạng lưới kết nối thể thao lớn nhất Việt Nam. Hoàn toàn miễn phí.</p>
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
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Tạo tài khoản mới</h2>
            <p className="text-slate-600">Bắt đầu hành trình thể thao của bạn ngay hôm nay</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleRegister}>
            {/* Hàng 1: Họ tên & SĐT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Họ và Tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Hàng 2: Email & Tỉnh/Thành */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Tỉnh / Thành phố</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Chọn Tỉnh/Thành</option>
                    {VIETNAM_PROVINCES.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Hàng 3: Quận/Huyện & Phường/Xã */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Quận / Huyện</label>
                <select 
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm appearance-none cursor-pointer"
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Phường / Xã</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm appearance-none cursor-pointer">
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hàng 4: Địa chỉ chi tiết */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Số nhà, tên đường</label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ví dụ: 123 Nguyễn Huệ" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm"
              />
            </div>

            {/* Hàng 5: Mật khẩu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Xác nhận</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-xl py-3.5 mt-2 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Đăng ký ngay <ChevronRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs font-bold text-slate-400 uppercase">
                <span className="bg-white px-4">Hoặc đăng ký bằng</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <button className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 transition-colors">
                <GoogleIcon />
                Google
              </button>
              <button className="flex items-center justify-center gap-2 w-full py-3 bg-[#1877F2]/10 border border-[#1877F2]/20 hover:bg-[#1877F2]/20 rounded-xl font-bold text-[#1877F2] transition-colors">
                <FacebookIcon />
                Facebook
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-slate-600 font-medium">
            Đã có tài khoản? <Link to="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Register;
