import React from 'react';
import { ArrowRight, BarChart3, CalendarCheck, Check, CheckCircle2, ClipboardList, DollarSign, Medal, ShieldCheck, Star, Store, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useVietnamLocations } from '../../../hooks/useVietnamLocations';
import { authService } from '../../../services/authService';
const ownerBanner = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=85';

const toneClasses = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
  yellow: 'bg-amber-50 text-amber-600',
  cyan: 'bg-cyan-50 text-cyan-600',
} as const;

const toneTextClasses = {
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  violet: 'text-violet-600',
  amber: 'text-amber-600',
} as const;

const benefits = [
  [CalendarCheck, 'Quản lý lịch sân', 'Tránh trùng lịch, cập nhật lịch xác nhận tự động.', 'blue'],
  [BarChart3, 'Theo dõi doanh thu', 'Thống kê doanh thu theo ngày, tuần, tháng trực quan.', 'emerald'],
  [Users, 'Quản lý khách hàng', 'Lưu lịch sử đặt sân, chăm sóc khách hiệu quả.', 'violet'],
  [ClipboardList, 'Báo cáo thông minh', 'Biểu đồ trực quan, phân tích hiệu quả vận hành.', 'amber'],
  [Star, 'Đánh giá khách hàng', 'Nhận phản hồi, đánh giá và cải thiện chất lượng.', 'yellow'],
  [Store, 'Quản lý đa sân', 'Một tài khoản quản lý nhiều sân dễ dàng.', 'cyan'],
] as const;

const overviewStats = [
  { Icon: CalendarCheck, value: '10.000+', label: 'Lượt đặt sân mỗi tháng', color: 'blue' },
  { Icon: Users, value: '500+', label: 'Chủ sân đang hoạt động', color: 'emerald' },
  { Icon: UserPlus, value: '30.000+', label: 'Người dùng đang sử dụng', color: 'violet' },
  { Icon: ShieldCheck, value: '99.9%', label: 'Tỷ lệ ổn định hệ thống', color: 'amber' },
] as const;

const PartnerPortal: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [provinceCode, setProvinceCode] = React.useState<number>();
  const [districtCode, setDistrictCode] = React.useState<number>();
  const [selectedWard, setSelectedWard] = React.useState('');
  const [formData, setFormData] = React.useState({ fullName: '', phone: '', email: '', businessName: '', fieldCount: '', address: '', note: '' });
  const { provinces, districts, wards } = useVietnamLocations(provinceCode, districtCode);

  React.useEffect(() => {
    if (auth.user) setFormData((value) => ({ ...value, fullName: value.fullName || auth.user?.fullName || '', phone: value.phone || auth.user?.phoneNumber || '', email: value.email || auth.user?.email || '' }));
  }, [auth.user]);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault(); setIsLoading(true); setError('');
    try {
      if (!auth.isAuthenticated) throw new Error('Vui lòng đăng nhập trước khi đăng ký làm chủ sân.');
      const province = provinces.find((item) => item.code === provinceCode); const district = districts.find((item) => item.code === districtCode);
      if (!province || !district || !selectedWard || !formData.address.trim()) throw new Error('Vui lòng nhập đầy đủ địa chỉ cơ sở.');
      const response = await authService.registerOwnerCenter({ businessName: formData.businessName.trim(), phoneNumber: formData.phone.replace(/\s/g, ''), street: formData.address.trim(), ward: selectedWard, district: district.name, city: province.name });
      auth.login(response); setIsSuccess(true);
    } catch (err: any) { setError(err.message || 'Đăng ký đối tác thất bại. Vui lòng thử lại.'); }
    finally { setIsLoading(false); }
  };

  return <main className="bg-slate-50 pt-20 text-slate-900">
    <section className="mx-auto max-w-7xl px-5 py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[.74fr_1.26fr] lg:items-center">
        <div>
          <p className="inline-flex rounded-full bg-blue-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">Nền tảng quản lý sân thể thao</p>
          <h1 className="mt-5 text-4xl font-black leading-[1.15] tracking-tight sm:text-5xl">Tăng lượng khách đặt sân <span className="text-blue-600">mà không cần quảng cáo.</span></h1>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-slate-600">SmartSport giúp chủ sân quản lý lịch đặt, doanh thu và khách hàng trên một nền tảng duy nhất.</p>
          <div className="mt-6 space-y-3 text-sm font-bold text-slate-700">{['Quản lý lịch sân theo thời gian thực', 'Theo dõi doanh thu trực quan', 'Nhận đơn đặt sân 24/7', 'Chủ sân giữ 100% doanh thu dịch vụ'].map(item => <p key={item} className="flex items-center gap-3"><CheckCircle2 size={18} className="fill-amber-300 text-amber-500" />{item}</p>)}</div>
          <div className="mt-8 flex flex-wrap gap-3"><a href="#register" className="inline-flex h-12 items-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-200">Đăng ký làm chủ sân <ArrowRight size={17} /></a><a href="#dashboard" className="inline-flex h-12 items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 text-sm font-black text-blue-800 transition hover:bg-blue-50">Xem demo dashboard <ArrowRight size={17} /></a></div>
        </div>
        <div id="dashboard" className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-blue-950/10"><DashboardPreview /></div>
      </div>
      <div className="mt-8 grid divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">{overviewStats.map(({ Icon, value, label, color }) => <div key={label} className="flex items-center gap-4 p-5"><span className={`grid h-12 w-12 place-items-center rounded-full ${toneClasses[color]}`}><Icon size={23} /></span><div><p className={`text-2xl font-black ${toneTextClasses[color]}`}>{value}</p><p className="mt-1 text-xs font-bold text-slate-600">{label}</p></div></div>)}</div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_1.05fr]">
      <div><h2 className="text-2xl font-black">Chủ sân được gì khi sử dụng <span className="text-blue-600">SmartSport?</span></h2><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{benefits.map(([Icon,title,text,color]) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`grid h-11 w-11 place-items-center rounded-full ${toneClasses[color]}`}><Icon size={21} /></span><h3 className="mt-4 text-sm font-black">{title}</h3><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{text}</p></article>)}</div></div>
      <aside className="relative overflow-hidden rounded-2xl bg-amber-300 p-7 text-slate-950 shadow-sm"><Medal className="absolute -right-4 top-4 h-40 w-40 text-amber-400/60" /><div className="relative"><p className="text-sm font-black">Chỉ <strong className="text-4xl text-blue-700">10%</strong> trên doanh thu tiền sân</p><p className="mt-4 max-w-md text-sm font-semibold leading-6">Chủ sân chỉ trả 10% hoa hồng trên giá trị tiền thuê sân của mỗi đơn đặt sân thành công.</p><div className="mt-5 space-y-2 text-xs font-bold">{['Chỉ áp dụng cho tiền thuê sân', 'Không tính trên nước uống', 'Không tính trên thuê vợt, giày', 'Không phí duy trì hàng tháng'].map(item => <p key={item} className="flex gap-2"><Check size={15} />{item}</p>)}</div><div className="mt-7 rounded-xl bg-white p-4 text-sm"><p className="font-black">Ví dụ minh họa</p><div className="mt-3 grid grid-cols-2 gap-4 border-t border-slate-100 pt-3"><div className="space-y-2 text-xs font-bold text-slate-500"><p>Tiền thuê sân <b className="float-right text-slate-900">200.000đ</b></p><p>Thuê vợt <b className="float-right text-slate-900">50.000đ</b></p><p>Nước uống <b className="float-right text-slate-900">20.000đ</b></p><p className="border-t pt-2 text-slate-900">Tổng cộng <b className="float-right text-blue-700">270.000đ</b></p></div><div className="border-l border-slate-100 pl-4 text-xs font-bold"><p>Hoa hồng SmartSport (10% tiền sân)</p><p className="mt-2 text-sm text-red-600">200.000đ x 10% = 20.000đ</p><p className="mt-6">Chủ sân nhận</p><p className="text-2xl font-black text-emerald-600">250.000đ</p></div></div></div></div></aside>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-10"><h2 className="text-center text-2xl font-black">Quy trình hợp tác với <span className="text-blue-600">SmartSport</span></h2><div className="mt-7 grid gap-3 md:grid-cols-4">{[[UserPlus,'Đăng ký thông tin','Điền thông tin sân của bạn để SmartSport liên hệ.'],[ShieldCheck,'Xác thực sân','SmartSport xác thực thông tin và hỗ trợ thiết lập.'],[CalendarCheck,'Nhận đơn đặt sân','Cần của bạn hiển thị trên hệ thống và bắt đầu nhận đơn.'],[DollarSign,'Nhận doanh thu','Đối soát tự động, nhận doanh thu sau trừ hoa hồng.']].map(([Icon,title,text],index) => { const I=Icon as React.ElementType; return <article key={title as string} className="relative rounded-xl border border-slate-200 bg-white p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-700"><I size={19}/></span><span className="absolute right-4 top-5 text-lg font-black text-amber-500">{index + 1}</span><h3 className="mt-4 text-sm font-black">{title as string}</h3><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{text as string}</p></article>})}</div></section>

    <section id="register" className="mx-auto max-w-7xl px-5 pb-16"><div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[.58fr_1.42fr]"><div className="relative min-h-80 overflow-hidden bg-blue-950 p-7 text-white"><img src={ownerBanner} alt="Sân thể thao" className="absolute inset-0 h-full w-full object-cover opacity-35"/><div className="relative"><h2 className="max-w-xs text-3xl font-black leading-tight">Bắt đầu chuyển đổi số sân thể thao của bạn ngay hôm nay!</h2><div className="mt-7 space-y-3 text-sm font-bold">{['Tăng doanh thu', 'Tiết kiệm thời gian', 'Quản lý chuyên nghiệp'].map(item => <p key={item} className="flex gap-2"><CheckCircle2 size={16} className="text-amber-300"/>{item}</p>)}</div></div></div>{isSuccess ? <div className="grid min-h-80 place-items-center p-8 text-center"><div><CheckCircle2 className="mx-auto text-emerald-600" size={48}/><h3 className="mt-4 text-2xl font-black">Hồ sơ đang chờ duyệt</h3><button onClick={() => navigate('/profile?tab=notifications')} className="mt-5 rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white">Xem thông báo</button></div></div> : <form onSubmit={handleRegister} className="grid gap-4 p-6 sm:grid-cols-3"><h2 className="sm:col-span-3 text-2xl font-black">Đăng ký trở thành chủ sân cùng <span className="text-blue-600">SmartSport</span></h2>{error && <p className="sm:col-span-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}<Input label="Họ và tên" value={formData.fullName} onChange={value => setFormData({...formData,fullName:value})} placeholder="Nhập họ và tên"/><Input label="Số điện thoại" value={formData.phone} onChange={value => setFormData({...formData,phone:value})} placeholder="Nhập số điện thoại"/><Input label="Email" value={formData.email} onChange={value => setFormData({...formData,email:value})} placeholder="Nhập email" type="email"/><Input label="Tên sân / Cơ sở" value={formData.businessName} onChange={value => setFormData({...formData,businessName:value})} placeholder="Nhập tên sân hoặc cơ sở"/><Select label="Tỉnh / Thành phố" value={provinceCode || ''} onChange={value => {setProvinceCode(Number(value)||undefined);setDistrictCode(undefined);setSelectedWard('')}}><option value="">Chọn tỉnh thành</option>{provinces.map(i=><option key={i.code} value={i.code}>{i.name}</option>)}</Select><Input label="Số lượng sân" value={formData.fieldCount} onChange={value => setFormData({...formData,fieldCount:value})} placeholder="Ví dụ: 3"/><Select label="Quận / Huyện" value={districtCode || ''} onChange={value => {setDistrictCode(Number(value)||undefined);setSelectedWard('')}} disabled={!provinceCode}><option value="">Chọn quận huyện</option>{districts.map(i=><option key={i.code} value={i.code}>{i.name}</option>)}</Select><Select label="Phường / Xã" value={selectedWard} onChange={setSelectedWard} disabled={!districtCode}><option value="">Chọn phường xã</option>{wards.map(i=><option key={i.code} value={i.name}>{i.name}</option>)}</Select><Input label="Địa chỉ sân" value={formData.address} onChange={value => setFormData({...formData,address:value})} placeholder="Nhập địa chỉ sân" className="sm:col-span-3"/><Input label="Ghi chú" value={formData.note} onChange={value => setFormData({...formData,note:value})} placeholder="Nhập thêm thông tin nếu có" className="sm:col-span-3"/><button disabled={isLoading} className="sm:col-span-3 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-300 text-sm font-black text-slate-950 transition hover:bg-amber-200 disabled:opacity-60">{isLoading ? 'Đang gửi hồ sơ...' : <>Đăng ký trở thành chủ sân <ArrowRight size={17}/></>}</button></form>}</div></section>
  </main>;
};

const DashboardPreview = () => <div className="grid min-h-95 overflow-hidden rounded-xl bg-slate-50 text-slate-800 sm:grid-cols-[116px_1fr]">
  <aside className="hidden border-r border-slate-100 bg-white p-3 sm:block">
    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-950"><span className="grid h-5 w-5 place-items-center rounded-md bg-blue-600 text-white">S</span>SmartSport</div>
    <div className="mt-6 space-y-1 text-[9px] font-bold text-slate-500"><p className="rounded-md bg-blue-50 px-2 py-2 text-blue-700">Tổng quan</p>{['Lịch sân', 'Đơn đặt sân', 'Doanh thu', 'Khách hàng', 'Dịch vụ', 'Đánh giá'].map(item => <p key={item} className="px-2 py-1.5">{item}</p>)}</div>
  </aside>
  <div className="p-3 sm:p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-black">Tổng quan</p><p className="mt-0.5 text-[8px] font-bold text-slate-400">Hôm nay, 21/06/2026</p></div><span className="rounded-md bg-white px-2 py-1 text-[8px] font-bold shadow-sm">Sân Navy</span></div>
    <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">{[['Doanh thu hôm nay','12,450,000đ','text-blue-700'],['Đơn đặt sân','28','text-emerald-600'],['Công suất sân','78%','text-violet-600'],['Sân hoạt động','6/8','text-amber-600']].map(([label,value,tone]) => <div key={label} className="rounded-lg bg-white p-2 shadow-sm"><p className="text-[8px] font-bold text-slate-400">{label}</p><p className={`mt-1 text-xs font-black ${tone}`}>{value}</p><p className="mt-1 text-[7px] font-bold text-emerald-600">↑ tăng so với hôm qua</p></div>)}</div>
    <div className="mt-3 grid gap-2 lg:grid-cols-[1.18fr_.82fr]"><div className="rounded-lg bg-white p-3 shadow-sm"><div className="flex justify-between text-[8px] font-bold"><span>Doanh thu 7 ngày qua</span><span className="text-slate-400">7 ngày</span></div><svg viewBox="0 0 280 94" className="mt-2 h-20 w-full" role="img" aria-label="Biểu đồ doanh thu tăng dần"><path d="M4 80 L38 67 L68 58 L101 29 L133 58 L168 35 L202 57 L236 38 L276 9" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-600" /><path d="M4 88H276" stroke="#e2e8f0" strokeWidth="1" /></svg></div><div className="rounded-lg bg-white p-3 shadow-sm"><div className="flex justify-between text-[8px] font-bold"><span>Lịch đặt hôm nay</span><span className="text-blue-600">Xem tất cả</span></div><div className="mt-2 space-y-2">{['06:00 · Sân 1 · Nguyễn Văn A','08:00 · Sân 2 · Trần Minh B','18:00 · Sân 3 · Lê Hoàng C'].map(item => <div key={item} className="flex items-center justify-between gap-1 text-[7px] font-bold"><span>{item}</span><span className="rounded bg-emerald-50 px-1 py-0.5 text-emerald-600">Đã xác nhận</span></div>)}</div></div></div>
    <div className="mt-2 grid gap-2 lg:grid-cols-2"><div className="rounded-lg bg-white p-3 shadow-sm"><p className="text-[8px] font-bold">Top khách hàng</p>{['Nguyễn Văn A','Trần Minh B','Lê Hoàng C'].map((name,index) => <p key={name} className="mt-2 flex justify-between text-[8px] font-bold text-slate-500"><span>{index + 1}. {name}</span><span>{12 - index * 3} đơn</span></p>)}</div><div className="rounded-lg bg-white p-3 shadow-sm"><p className="text-[8px] font-bold">Đánh giá mới nhất</p><p className="mt-2 text-[8px] font-bold">Nguyễn Văn A <span className="text-amber-500">★★★★★</span></p><p className="mt-1 text-[7px] text-slate-500">Sân đẹp, dịch vụ tốt.</p></div></div>
  </div>
</div>;

const Input = ({label,value,onChange,placeholder,type='text',className=''}:{label:string;value:string;onChange:(value:string)=>void;placeholder:string;type?:string;className?:string}) => {
  if (label === 'Số lượng sân' || label === 'Ghi chú') return null;
  return <label className={className}><span className="mb-2 block text-xs font-black text-slate-700">{label} <b className="text-red-500">*</b></span><input required type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"/></label>;
};
const Select = ({label,value,onChange,children,disabled=false,className=''}:React.PropsWithChildren<{label:string;value:string|number;onChange:(value:string)=>void;disabled?:boolean;className?:string}>) => <label className={className}><span className="mb-2 block text-xs font-black text-slate-700">{label} <b className="text-red-500">*</b></span><select required disabled={disabled} value={value} onChange={e=>onChange(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-400 focus:bg-white disabled:opacity-50">{children}</select></label>;
export default PartnerPortal;
