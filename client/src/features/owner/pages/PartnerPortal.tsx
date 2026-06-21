import React from 'react';
import { ArrowRight, BarChart3, CalendarCheck, Check, CheckCircle2, CreditCard, Store, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useVietnamLocations } from '../../../hooks/useVietnamLocations';
import { authService } from '../../../services/authService';
import ownerBanner from '../../../assets/owner.png';

const PartnerPortal: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [provinceCode, setProvinceCode] = React.useState<number>();
  const [districtCode, setDistrictCode] = React.useState<number>();
  const [selectedWard, setSelectedWard] = React.useState('');
  const [formData, setFormData] = React.useState({ phone: '', businessName: '', address: '' });
  const { provinces, districts, wards } = useVietnamLocations(provinceCode, districtCode);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (!auth.isAuthenticated) {
        setError('Vui lòng đăng nhập trước khi đăng ký làm chủ sân.');
        return;
      }
      const province = provinces.find((item) => item.code === provinceCode);
      const district = districts.find((item) => item.code === districtCode);
      if (!province || !district || !selectedWard || !formData.address.trim()) {
        setError('Vui lòng nhập đầy đủ địa chỉ cơ sở kinh doanh.');
        return;
      }
      const response = await authService.registerOwnerCenter({
        businessName: formData.businessName.trim(),
        phoneNumber: formData.phone.replace(/\s/g, ''),
        street: formData.address.trim(),
        ward: selectedWard,
        district: district.name,
        city: province.name,
      });
      auth.login(response);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Đăng ký đối tác thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-slate-50 pt-20 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:py-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">SmartSport dành cho chủ sân</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Quản lý sân rõ ràng, vận hành chủ động.</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">Theo dõi lịch đặt, tiền cọc, dịch vụ phát sinh và doanh thu trong một hệ thống dành riêng cho cơ sở của bạn.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#register" className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white transition hover:bg-blue-800">Đăng ký cơ sở <ArrowRight size={17} /></a>
              <a href="#how-it-works" className="inline-flex h-12 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">Xem quy trình</a>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-xl shadow-blue-950/15">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Store size={17} className="text-blue-300" /><span className="text-sm font-black">Trung tâm vận hành</span></div><span className="rounded-lg bg-emerald-400 px-2 py-1 text-[10px] font-black text-emerald-950">ĐANG HOẠT ĐỘNG</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/10 p-3"><p className="text-xl font-black">06</p><p className="mt-1 text-[9px] font-black uppercase text-slate-300">Đơn hôm nay</p></div><div className="rounded-xl bg-amber-300 p-3 text-slate-950"><p className="text-xl font-black">02</p><p className="mt-1 text-[9px] font-black uppercase">Chờ cọc</p></div><div className="rounded-xl bg-emerald-400 p-3 text-emerald-950"><p className="text-xl font-black">4,8tr</p><p className="mt-1 text-[9px] font-black uppercase">Doanh thu</p></div></div>
            <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-slate-800"><div className="flex items-center justify-between text-xs font-black"><span>17:00 · Bóng đá 5</span><span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">Đã cọc</span></div><div className="flex items-center justify-between text-xs font-black"><span>18:30 · Pickleball</span><span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">Chờ cọc</span></div></div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">Chủ sân và nhân viên cùng thấy việc cần xử lý trong ngày.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-100">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><img src={ownerBanner} alt="Giao diện vận hành SmartSport cho chủ sân" className="h-full min-h-[260px] w-full object-cover" /></div>
          <div><p className="text-xs font-black uppercase tracking-widest text-emerald-700">Nắm sân trong một màn hình</p><h2 className="mt-3 text-3xl font-black tracking-tight">Từ giờ trống đến doanh thu, mọi thứ đều có trạng thái rõ ràng.</h2><p className="mt-4 text-sm font-semibold leading-7 text-slate-600">Chủ sân biết đơn nào cần cọc, nhân viên biết lịch nào sắp diễn ra, và hệ thống tự tổng hợp số liệu để bạn không phải dò lại tin nhắn hay sổ ghi chép.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-black text-blue-800">Lịch và trạng thái đơn theo thời gian thực</p><p className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-black text-emerald-800">Dịch vụ phát sinh ghi nhận cùng đơn đặt</p></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-14">
        <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-widest text-blue-600">Một nơi cho vận hành hằng ngày</p><h2 className="mt-2 text-3xl font-black tracking-tight">Những việc chủ sân cần biết đều ở đúng chỗ.</h2></div>
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            [CalendarCheck, 'Lịch đặt sân', 'Xem đơn mới, giờ chơi và trạng thái từng đơn.'],
            [CreditCard, 'Tiền cọc', 'Theo dõi đơn chờ cọc để xử lý đúng thời điểm.'],
            [Store, 'Dịch vụ tại sân', 'Quản lý hàng bán thêm và tồn kho.'],
            [BarChart3, 'Doanh thu', 'Đọc doanh thu theo thời gian và loại sân.'],
          ].map(([Icon, title, text], index) => { const FeatureIcon = Icon as React.ElementType; return <article key={title as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className={`grid h-11 w-11 place-items-center rounded-xl ${index === 1 ? 'bg-emerald-50 text-emerald-600' : index === 2 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}><FeatureIcon size={21} /></span><h3 className="mt-5 text-lg font-black">{title as string}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{text as string}</p></article>; })}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">Bắt đầu trong 3 bước</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {[
              ['01', UserPlus, 'Gửi hồ sơ cơ sở', 'Điền thông tin liên hệ và địa chỉ sân.'],
              ['02', CheckCircle2, 'Chờ phê duyệt', 'Quản trị viên kiểm tra hồ sơ trước khi kích hoạt.'],
              ['03', Users, 'Mở lịch bán', 'Thêm sân, khung giờ, giá thuê và nhân viên.'],
            ].map(([number, Icon, title, text]) => { const StepIcon = Icon as React.ElementType; return <article key={number as string} className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-sm font-black text-blue-700 ring-1 ring-slate-200">{number as string}</span><div><StepIcon className="text-blue-600" size={19} /><h3 className="mt-3 font-black">{title as string}</h3><p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{text as string}</p></div></article>; })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-14">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8"><div><p className="text-xs font-black uppercase tracking-widest text-amber-700">Chi phí minh bạch</p><h2 className="mt-2 text-2xl font-black">Không phí khởi tạo, chỉ tính phí khi có đơn thành công.</h2><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Hoa hồng được đối soát theo đơn đặt sân thành công. Doanh thu dịch vụ bán thêm tại sân được quản lý riêng.</p></div><div className="mt-5 shrink-0 rounded-xl border border-amber-200 bg-white px-5 py-4 text-center sm:mt-0"><p className="text-3xl font-black text-amber-600">10%</p><p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">mỗi đơn thành công</p></div></div>
      </section>

      <section id="register" className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[980px] gap-0 px-5 py-14 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-t-2xl bg-[#050816] p-6 text-white lg:rounded-l-2xl lg:rounded-tr-none"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white"><UserPlus size={21} /></span><h2 className="mt-5 text-2xl font-black text-white">Đăng ký làm chủ sân</h2><p className="mt-3 text-sm font-semibold leading-6 text-slate-200">Hoàn thiện thông tin cơ sở để bắt đầu quy trình phê duyệt.</p><div className="mt-6 space-y-3">{['Không phí khởi tạo', 'Dashboard vận hành sau khi duyệt', 'Hỗ trợ quản lý lịch và dịch vụ'].map((item) => <p key={item} className="flex gap-2 text-xs font-bold text-white"><Check size={15} className="shrink-0 text-emerald-400" />{item}</p>)}</div></aside>
          {isSuccess ? <div className="grid min-h-80 place-items-center rounded-b-2xl border border-emerald-200 bg-emerald-50 p-8 text-center lg:rounded-l-none lg:rounded-r-2xl"><div><CheckCircle2 size={46} className="mx-auto text-emerald-600" /><h3 className="mt-4 text-2xl font-black">Hồ sơ đang chờ duyệt</h3><p className="mt-2 text-sm font-semibold text-slate-600">Bạn sẽ nhận thông báo khi cơ sở được phê duyệt.</p><button type="button" onClick={() => navigate('/profile?tab=notifications')} className="mt-5 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">Xem thông báo</button></div></div> : <form onSubmit={handleRegister} className="grid gap-4 rounded-b-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:rounded-l-none lg:rounded-r-2xl">{error && <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}<Input label="Số điện thoại" value={formData.phone} onChange={(value) => setFormData({ ...formData, phone: value })} placeholder="0912 345 678" type="tel" /><Input label="Tên cơ sở kinh doanh" value={formData.businessName} onChange={(value) => setFormData({ ...formData, businessName: value })} placeholder="Ví dụ: Sân thể thao Navy" /><Select label="Tỉnh / Thành phố" value={provinceCode || ''} onChange={(value) => { setProvinceCode(Number(value) || undefined); setDistrictCode(undefined); setSelectedWard(''); }}><option value="">Chọn tỉnh thành</option>{provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</Select><Select label="Quận / Huyện" value={districtCode || ''} disabled={!provinceCode} onChange={(value) => { setDistrictCode(Number(value) || undefined); setSelectedWard(''); }}><option value="">Chọn quận huyện</option>{districts.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</Select><Select label="Phường / Xã" value={selectedWard} disabled={!districtCode} onChange={setSelectedWard} className="sm:col-span-2"><option value="">Chọn phường xã</option>{wards.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}</Select><Input label="Địa chỉ cụ thể" value={formData.address} onChange={(value) => setFormData({ ...formData, address: value })} placeholder="Số nhà, tên đường" className="sm:col-span-2" />{auth.user && <p className="sm:col-span-2 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-700">Tài khoản đăng ký: {auth.user.fullName} · {auth.user.email}</p>}<button disabled={isLoading} className="sm:col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-50">{isLoading ? 'Đang gửi hồ sơ...' : <>Gửi đơn đăng ký <ArrowRight size={17} /></>}</button></form>}
        </div>
      </section>
    </main>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', className = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; className?: string }) => <label className={className}><span className="mb-2 block text-xs font-black text-slate-700">{label}</span><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" /></label>;
const Select = ({ label, value, onChange, children, disabled = false, className = '' }: React.PropsWithChildren<{ label: string; value: string | number; onChange: (value: string) => void; disabled?: boolean; className?: string }>) => <label className={className}><span className="mb-2 block text-xs font-black text-slate-700">{label}</span><select required disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50">{children}</select></label>;

export default PartnerPortal;
