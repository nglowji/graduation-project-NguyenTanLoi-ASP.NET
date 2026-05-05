import React from 'react';
import { motion } from 'framer-motion';
import { authService, UserRole } from '../../../services/authService';
import { 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  ChevronRight, 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Wallet,
  CheckCircle2,
  FileText,
  UserPlus,
  MapPin
} from 'lucide-react';

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
const PartnerPortal: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);
  
  const [selectedProvince, setSelectedProvince] = React.useState('');
  const [selectedDistrict, setSelectedDistrict] = React.useState('');
  const [districts, setDistricts] = React.useState<string[]>([]);
  const [wards, setWards] = React.useState<string[]>([]);

  const [formData, setFormData] = React.useState({
    fullName: '',
    phone: '',
    email: '',
    businessName: '',
    address: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
        setWards(["Phường Trung Tâm", "Phường 1", "Phường 2", "Xã Bình Minh", "Xã Hòa Bình"]);
      }
    } else {
      setWards([]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        role: UserRole.PitchOwner
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.Detail || 'Đăng ký đối tác thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-white pt-20 selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <section className="relative py-32 bg-[#0a0f1d] overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-3/5 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm mb-8"
              >
                <TrendingUp size={16} /> Đối tác tin cậy của 500+ chủ sân
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight"
              >
                Số hóa sân bãi <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Đột phá doanh thu</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-slate-400 max-w-2xl lg:mx-0 mx-auto mb-12 leading-relaxed"
              >
                Gia nhập hệ sinh thái SmartSport để tối ưu vận hành, loại bỏ bùng lịch và tiếp cận tệp khách hàng tiềm năng lớn nhất Việt Nam.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center lg:justify-start gap-5"
              >
                <a href="#register" className="group bg-primary hover:bg-primary-dark text-white py-5 px-10 rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1 flex items-center gap-2">
                  Bắt đầu hợp tác <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#benefits" className="bg-white/5 backdrop-blur-md border border-white/10 text-white py-5 px-10 rounded-2xl font-black text-lg hover:bg-white/10 transition-all border-b-4 border-b-white/5 active:border-b-0 active:translate-y-1">
                  Xem mô hình
                </a>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="lg:w-2/5 relative"
            >
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                <img 
                  src="https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Stadium Management" 
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d]/60 via-transparent to-transparent" />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl z-20 animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doanh thu tăng</p>
                    <p className="text-2xl font-black text-slate-900">+35%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits & Model */}
      <section id="benefits" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Lợi ích vượt trội</h2>
            <p className="text-slate-600 text-lg">Tại sao hàng trăm chủ sân đã tin tưởng SmartSport?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BenefitCard 
              icon={<TrendingUp size={32} />}
              title="Tăng trưởng doanh thu"
              description="Tiếp cận tệp khách hàng khổng lồ. Tỷ lệ lấp đầy sân tăng trung bình 30-45% sau khi lên sàn."
            />
            <BenefitCard 
              icon={<ShieldCheck size={32} />}
              title="Quản lý rủi ro"
              description="Hệ thống thanh toán đặt cọc trước giúp loại bỏ hoàn toàn tình trạng bùng lịch, đặt sân ảo."
            />
            <BenefitCard 
              icon={<Users size={32} />}
              title="Marketing 0 đồng"
              description="Chúng tôi thực hiện các chiến dịch truyền thông giúp sân của bạn luôn nổi bật trên công cụ tìm kiếm."
            />
          </div>

          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10" />
            <div className="bg-slate-900 rounded-[3rem] p-10 md:p-20 text-white flex flex-col md:flex-row items-center gap-16 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="flex-1 relative z-10">
                <div className="inline-block px-4 py-1 rounded-lg bg-green-500/20 text-green-400 font-black text-xs uppercase mb-6 tracking-widest">Mô hình kinh doanh</div>
                <h3 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Hợp tác cùng phát triển <br/><span className="text-primary">Win-Win</span></h3>
                <p className="text-slate-400 text-xl leading-relaxed mb-10">
                  Chúng tôi không thu phí duy trì. Bạn chỉ trả phí khi thực sự có doanh thu từ nền tảng.
                </p>
                <ul className="space-y-6">
                  <li className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold">Miễn phí 100% phí đăng ký & khởi tạo</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold">Hỗ trợ chụp ảnh & truyền thông miễn phí</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-green-400">Giữ trọn 100% doanh thu dịch vụ phụ trợ</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-primary to-blue-600 rounded-[2.5rem] p-1 shadow-2xl relative z-10 group transition-transform hover:scale-105 duration-500">
                <div className="bg-slate-900 rounded-[2.3rem] p-12 text-center">
                  <span className="text-sm font-black text-primary uppercase tracking-[0.3em] block mb-4">Chiết khấu</span>
                  <div className="relative inline-block">
                    <span className="text-8xl font-black text-white">10</span>
                    <span className="text-4xl font-black text-primary absolute -top-2 -right-10">%</span>
                  </div>
                  <div className="w-full h-[1px] bg-white/10 my-8" />
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Chỉ thu trên mỗi <br/> đơn đặt sân thành công</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Simulation */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                Quản lý mọi lúc <br />
                <span className="text-primary">Mọi nơi</span>
              </h2>
              <p className="text-slate-600 text-lg mb-10 leading-relaxed">
                Giao diện quản trị thông minh giúp bạn nắm bắt tình hình kinh doanh chỉ trong vài giây. Theo dõi doanh thu, lịch đặt sân và phản hồi khách hàng tập trung tại một nơi duy nhất.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Lịch biểu trực quan</h4>
                    <p className="text-slate-500">Xem sơ đồ sân bãi và các khung giờ đã đặt dưới dạng Grid/List.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Báo cáo doanh thu</h4>
                    <p className="text-slate-500">Biểu đồ phân tích doanh thu theo ngày, tuần, tháng tự động.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Rút tiền nhanh</h4>
                    <p className="text-slate-500">Yêu cầu rút tiền về tài khoản ngân hàng chỉ với 1 click.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dashboard Simulation UI */}
            <div className="lg:w-1/2 relative group">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] group-hover:bg-primary/30 transition-colors" />
              <div className="bg-[#0a0f1d] rounded-[3rem] p-4 shadow-2xl relative overflow-hidden border border-white/10">
                <div className="bg-white rounded-2xl h-full p-8 text-slate-900">
                  <div className="flex items-center justify-between mb-10 pb-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <LayoutDashboard size={20} />
                      </div>
                      <span className="text-lg font-black tracking-tight">SmartCenter</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users size={16} />
                      </div>
                      <div className="w-24 h-2 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden group/card">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8" />
                      <span className="text-xs text-slate-400 font-black uppercase tracking-widest block mb-2">Tổng doanh thu</span>
                      <span className="text-2xl font-black text-slate-900">42,500,000đ</span>
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-green-600 font-black">+12.5%</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                      <span className="text-xs text-slate-400 font-black uppercase tracking-widest block mb-2">Tỷ lệ lấp đầy</span>
                      <span className="text-2xl font-black text-slate-900">86.4%</span>
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] text-blue-600 font-black">Cao điểm</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex justify-between items-center px-2">
                      <h5 className="text-sm font-black uppercase tracking-widest text-slate-400">Lịch đặt sân hôm nay</h5>
                      <span className="text-[10px] font-black text-primary hover:underline cursor-pointer">Xem tất cả</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 hover:bg-primary/10 transition-colors group/item">
                      <div className="w-12 h-12 bg-primary rounded-xl flex flex-col items-center justify-center text-white font-black shadow-lg shadow-primary/20">
                        <span className="text-[10px] opacity-80 uppercase leading-none mb-1">Time</span>
                        <span className="text-sm leading-none">17:00</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-black block leading-tight">Sân bóng đá số 1</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-4 h-4 rounded-full bg-slate-200" />
                          <span className="text-xs text-slate-500 font-bold">Nguyễn Văn A</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] bg-green-500 text-white px-3 py-1 rounded-full font-black uppercase tracking-tighter">Đã cọc</span>
                        <span className="text-[10px] font-bold text-slate-400">450,000đ</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-60">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 font-black">
                        <span className="text-[10px] opacity-80 uppercase leading-none mb-1">Time</span>
                        <span className="text-sm leading-none">18:30</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-black block leading-tight">Sân bóng đá số 2</span>
                        <span className="text-xs text-slate-400 font-bold">Đang chờ khách đặt...</span>
                      </div>
                      <button className="text-[10px] font-black text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all">Mở lịch</button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating UI element */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -right-4 -bottom-8 bg-white p-5 rounded-2xl shadow-2xl border border-slate-100 hidden xl:block z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Weekly Growth</p>
                    <p className="text-lg font-black text-slate-900">+18%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <FileText className="text-primary" size={32} />
            <h2 className="text-3xl font-black">Điều khoản hợp tác</h2>
          </div>
          <div className="space-y-8 text-slate-400 leading-relaxed">
            <div>
              <h4 className="text-white font-bold mb-2">1. Cam kết chất lượng dịch vụ</h4>
              <p>Đối tác cam kết duy trì cơ sở vật chất (mặt cỏ, ánh sáng, tiện ích) đúng như hình ảnh và mô tả đã đăng tải trên nền tảng SmartSport.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-2">2. Chính sách hủy lịch và hoàn tiền</h4>
              <p>Mọi thay đổi về lịch đặt từ phía chủ sân phải được thông báo ít nhất 24h trước khi trận đấu bắt đầu. Vi phạm có thể dẫn đến việc hoàn 100% tiền cọc cho khách và bồi thường theo quy định.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-2">3. Đối soát và thanh toán</h4>
              <p>Nền tảng thực hiện đối soát tự động hàng ngày. Doanh thu sau khi trừ phí nền tảng sẽ được cộng vào ví chủ sân và có thể rút về tài khoản ngân hàng bất cứ lúc nào.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/3 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <UserPlus className="text-primary mb-6" size={56} />
                <h3 className="text-4xl font-black mb-6 leading-tight">Gửi thông tin hợp tác</h3>
                <p className="text-xl text-slate-300 font-medium leading-relaxed">Chúng tôi sẽ liên hệ tư vấn <br/> trong vòng <span className="text-primary font-black">24 giờ</span> làm việc.</p>
              </div>
              <div className="relative z-10 pt-10">
                <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">Hotline hỗ trợ</p>
                <p className="text-2xl font-black">1900 6789</p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
            </div>
            <div className="md:w-2/3 p-12 bg-white">
              {isSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4">Gửi thông tin thành công!</h3>
                  <p className="text-slate-600 text-lg mb-8">
                    Cảm ơn bạn đã tin tưởng SmartSport. <br/>
                    Đội ngũ của chúng tôi sẽ liên hệ với bạn qua số điện thoại <span className="font-bold text-slate-900">{formData.phone}</span> trong vòng 24h tới.
                  </p>
                  <button onClick={() => setIsSuccess(false)} className="text-primary font-bold hover:underline">Gửi lại đơn khác</button>
                </div>
              ) : (
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleRegister}>
                  {error && (
                    <div className="md:col-span-2 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Họ và tên chủ sân</label>
                    <input 
                      required
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      type="text" 
                      placeholder="Nguyễn Văn A" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Số điện thoại</label>
                    <input 
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      type="tel" 
                      placeholder="0912 345 678" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Email tài khoản</label>
                    <input 
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      type="email" 
                      placeholder="owner@example.com" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                    <input 
                      required
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Tên cơ sở kinh doanh</label>
                    <input 
                      required
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      type="text" 
                      placeholder="Ví dụ: Sân bóng Thống Nhất" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Tỉnh / Thành phố</label>
                      <select 
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium text-sm appearance-none cursor-pointer"
                      >
                        <option value="">Chọn Tỉnh/Thành</option>
                        {VIETNAM_PROVINCES.map(province => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Quận / Huyện</label>
                      <select 
                        value={selectedDistrict}
                        onChange={handleDistrictChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium text-sm appearance-none cursor-pointer"
                      >
                        <option value="">Chọn Quận/Huyện</option>
                        {districts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Phường / Xã</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium text-sm appearance-none cursor-pointer">
                      <option value="">Chọn Phường/Xã</option>
                      {wards.map(ward => (
                        <option key={ward} value={ward}>{ward}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Địa chỉ cụ thể</label>
                    <input 
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      type="text" 
                      placeholder="Ví dụ: 123 Đào Duy Từ, Phường 6..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium" 
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <MapPin size={18} className="text-primary" /> Thiết lập vị trí Google Maps
                        </h4>
                        <p className="text-xs text-slate-500">Giúp người chơi tìm đường đến sân chính xác hơn.</p>
                      </div>
                      <button type="button" className="text-xs font-bold text-primary px-3 py-2 bg-white border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all">
                        Mở bản đồ chọn vị trí
                      </button>
                    </div>
                    <input type="text" placeholder="Dán link Google Maps hoặc tọa độ (Lat, Long)" className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all font-medium text-sm" />
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <button 
                      disabled={isLoading}
                      className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Gửi đơn đăng ký ngay <ChevronRight size={20} /></>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const BenefitCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300">
    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
      {icon}
    </div>
    <h4 className="text-2xl font-bold text-slate-900 mb-3">{title}</h4>
    <p className="text-slate-600 leading-relaxed font-medium">{description}</p>
  </div>
);

export default PartnerPortal;
