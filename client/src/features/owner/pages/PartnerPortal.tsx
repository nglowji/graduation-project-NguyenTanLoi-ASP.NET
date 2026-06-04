import React from 'react';
import {
  ArrowRight, BarChart3, BellRing, CalendarCheck, Check, CheckCircle2, CreditCard,
  LayoutDashboard, PackagePlus, Phone, Sparkles, Store, UserPlus, Users, WalletCards,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useVietnamLocations } from '../../../hooks/useVietnamLocations';
import { authService } from '../../../services/authService';
import ownerBanner from '../../../assets/owner.png';

const benefits = [
  { icon: CalendarCheck, title: 'Lịch sân cập nhật tức thời', text: 'Khách chỉ đặt được khung giờ còn trống. Slot đã đặt hoặc đã quá giờ được khóa rõ ràng.' },
  { icon: CreditCard, title: 'Cọc trực tuyến, giảm hủy ảo', text: 'Đơn đặt sân đi cùng trạng thái thanh toán và mã giao dịch, chủ sân không phải kiểm tra thủ công.' },
  { icon: PackagePlus, title: 'Bán thêm dịch vụ tại sân', text: 'Nhân viên có thể cộng nước uống, thuê vợt và dịch vụ khác vào đơn đặt sân đang có.' },
  { icon: BarChart3, title: 'Doanh thu nhìn theo bộ môn', text: 'Theo dõi doanh thu, số đơn và hiệu quả từng loại sân theo tuần, tháng hoặc khoảng thời gian tùy chọn.' },
  { icon: Users, title: 'Phân quyền cho nhân viên', text: 'Chủ sân tạo tài khoản nhân viên để xử lý lịch đặt và phục vụ khách mà không mở quyền quản trị nhạy cảm.' },
  { icon: BellRing, title: 'Việc cần làm luôn nổi bật', text: 'Dashboard tập trung đơn chờ cọc, đơn cần xác nhận, tồn kho dịch vụ và đánh giá chưa phản hồi.' },
];

const bookingComparison = [
  { title: 'Website giới thiệu sân', icon: Store, tone: 'bg-slate-100 text-slate-700', items: ['Khách chỉ xem thông tin cơ bản', 'Vẫn phải gọi điện để hỏi giờ trống', 'Chủ sân tự tổng hợp doanh thu'] },
  { title: 'Đặt sân qua điện thoại', icon: Phone, tone: 'bg-amber-100 text-amber-800', items: ['Phụ thuộc người trực máy', 'Dễ ghi nhầm hoặc trùng khung giờ', 'Cọc và dịch vụ theo dõi thủ công'] },
  { title: 'Nền tảng SmartSport', icon: Sparkles, tone: 'bg-blue-700 text-white', items: ['Khách tự xem slot còn trống', 'Cọc trực tuyến đi cùng trạng thái đơn', 'Dashboard quản lý lịch, dịch vụ và doanh thu'] },
];

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
        setError('Vui lòng nhập đầy đủ tỉnh thành, quận huyện, phường xã và địa chỉ cụ thể.');
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
    <div className="bg-slate-50 pt-20 text-slate-900">
      <section className="overflow-hidden border-b border-cyan-100 bg-cyan-50">
        <div className="mx-auto grid max-w-[1680px] gap-8 px-6 py-12 xl:grid-cols-[0.66fr_1.34fr] xl:items-center xl:py-16">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700"><Sparkles size={15} /> SmartSport dành cho chủ sân</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-6xl">Quản lý sân thông minh.<br /><span className="text-blue-700">Tăng hiệu quả mỗi ngày.</span></h1>
            <p className="mt-5 max-w-3xl text-base font-bold leading-7 text-slate-600 sm:text-lg">Mở lịch bán trực tuyến, giữ slot chính xác, nhận cọc rõ ràng và quản lý sân mỗi ngày trên cùng một nền tảng.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#register" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800">Đăng ký làm chủ sân <ArrowRight size={17} /></a>
              <a href="#compare" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-800 transition hover:bg-blue-100">Vì sao khác biệt?</a>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[[CalendarCheck, 'Slot theo thời gian thực'], [CreditCard, 'Cọc trực tuyến rõ ràng'], [BarChart3, 'Doanh thu dễ theo dõi']].map(([Icon, label]) => { const HeroIcon = Icon as React.ElementType; return <p key={label as string} className="flex items-center gap-2 text-xs font-black text-slate-700"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-700 text-cyan-100"><HeroIcon size={16} /></span>{label as string}</p>; })}
            </div>
          </div>
          <div className="relative mx-auto w-full overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/10">
            <img src={ownerBanner} alt="SmartSport dành cho chủ sân" className="block h-auto w-full object-contain" />
          </div>
        </div>
      </section>

      <section className="border-y border-cyan-100 bg-cyan-50">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="grid grid-cols-2 gap-3">
            <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=88" alt="Người chơi bóng đá trên sân" className="h-80 w-full rounded-2xl object-cover" />
            <div className="grid gap-3">
              <img src="https://images.unsplash.com/photo-1595435066359-6286386730b9?auto=format&fit=crop&w=700&q=88" alt="Sân tennis sẵn sàng đón khách" className="h-full min-h-32 w-full rounded-2xl object-cover" />
              <div className="rounded-2xl bg-emerald-300 p-5 text-blue-950"><Users size={21} /><p className="mt-8 text-xl font-black">Phục vụ khách tốt hơn khi sân đông.</p></div>
            </div>
          </div>
          <div className="lg:pl-5">
            <p className="text-xs font-black uppercase tracking-widest text-blue-700">Từ lịch trống đến trải nghiệm tại sân</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Ít thao tác thủ công hơn.<br />Nhiều thời gian cho khách hơn.</h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-600">SmartSport giúp chủ sân nhìn nhanh lịch sắp diễn ra, khoản cọc cần theo dõi và dịch vụ khách vừa mua thêm. Nhân viên xử lý đúng việc ngay trong ca trực.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[[BellRing, 'Nhắc việc cần xử lý'], [PackagePlus, 'Cộng dịch vụ vào đơn'], [Users, 'Phân quyền nhân viên'], [WalletCards, 'Theo dõi đối soát']].map(([Icon, label], index) => { const ContentIcon = Icon as React.ElementType; return <p key={label as string} className="flex items-center gap-3 rounded-xl border border-cyan-100 bg-white p-3 text-sm font-black text-slate-700"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white ${index === 1 ? 'bg-emerald-600' : index === 2 ? 'bg-amber-400' : 'bg-blue-700'}`}><ContentIcon size={17} /></span>{label as string}</p>; })}
            </div>
          </div>
        </div>
      </section>

      <section id="compare" className="bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-16">
          <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-widest text-blue-700">Ba cách nhận lịch đặt sân</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Khác biệt nằm ở những việc bạn không còn phải làm thủ công.</h2><p className="mt-4 text-sm font-semibold leading-6 text-slate-500">Website thông thường giúp khách biết đến sân. SmartSport đi xa hơn: biến lượt tìm kiếm thành đơn đặt có trạng thái rõ ràng.</p></div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {bookingComparison.map(({ title, icon: Icon, tone, items }) => <article key={title} className={`rounded-2xl p-5 ${tone}`}><Icon size={23} /><h3 className="mt-5 text-xl font-black">{title}</h3><div className="mt-5 space-y-3">{items.map((item) => <p key={item} className="flex items-start gap-2 text-sm font-bold leading-6"><CheckCircle2 size={16} className="mt-1 shrink-0 opacity-75" />{item}</p>)}</div></article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-blue-100 bg-blue-50">
        <div className="mx-auto max-w-[1440px] px-6 py-16">
          <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-widest text-blue-700">Bộ công cụ vận hành sân</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Những việc quan trọng nằm cùng một nơi.</h2><p className="mt-4 text-sm font-semibold leading-6 text-slate-500">SmartSport không chỉ giới thiệu sân. Nền tảng giúp đội ngũ theo dõi lịch, thanh toán, dịch vụ và doanh thu trong cùng quy trình.</p></div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{benefits.map(({ icon: Icon, title, text }, index) => <article key={title} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><span className={`grid h-11 w-11 place-items-center rounded-xl text-white ${index === 1 ? 'bg-emerald-600' : index === 2 ? 'bg-amber-400' : 'bg-blue-700'}`}><Icon size={21} /></span><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{text}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-700">Demo dashboard chủ sân</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Mở dashboard là biết hôm nay cần xử lý việc gì.</h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">Thay vì dò lại tin nhắn và file ghi chú, chủ sân nhìn được đơn chờ cọc, lịch sắp diễn ra, slot còn trống và doanh thu ngay trong một màn hình.</p>
            <ul className="mt-6 space-y-3 text-sm font-bold text-slate-700">
              {['Nhìn nhanh số đơn chờ cọc hoặc cần xác nhận', 'Theo dõi doanh thu theo bộ môn và khoảng thời gian', 'Biết sân nào còn slot để chủ động mở bán'].map((item) => <li key={item} className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />{item}</li>)}
            </ul>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xl shadow-blue-950/10">
            <div className="flex items-center justify-between border-b border-slate-200 bg-blue-950 px-5 py-4 text-white">
              <div className="flex items-center gap-2"><LayoutDashboard size={18} /><span className="text-sm font-black">Tổng quan vận hành</span></div>
              <span className="rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-black uppercase">Đang trực tuyến</span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              {[['5', 'Đơn cần xử lý', 'text-red-600'], ['12', 'Lịch hôm nay', 'text-blue-700'], ['8.460.000đ', 'Doanh thu tuần', 'text-emerald-700']].map(([value, label, tone]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className={`text-xl font-black ${tone}`}>{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p></div>)}
            </div>
            <div className="grid gap-3 px-4 pb-4 md:grid-cols-[1fr_190px]">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Lịch sắp diễn ra</h3><CalendarCheck size={16} className="text-blue-700" /></div>
                <div className="mt-4 space-y-2">
                  {[['17:00', 'Bóng đá 5 người', 'Đã cọc', 'bg-emerald-50 text-emerald-700'], ['18:00', 'Cầu lông', 'Chờ cọc', 'bg-amber-50 text-amber-700'], ['19:00', 'Pickleball', 'Đã xác nhận', 'bg-blue-50 text-blue-700']].map(([time, field, status, tone]) => <div key={`${time}-${field}`} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"><span className="text-sm font-black text-blue-800">{time}</span><span className="flex-1 text-xs font-bold text-slate-700">{field}</span><span className={`rounded-md px-2 py-1 text-[9px] font-black uppercase ${tone}`}>{status}</span></div>)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Slot hôm nay</h3>
                <div className="mt-4 flex h-32 items-end gap-2">
                  {[45, 78, 62, 92, 70, 52].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><span className="w-full rounded-t bg-blue-600" style={{ height: `${height}%` }} /><small className="text-[9px] font-bold text-slate-400">{index + 15}h</small></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-amber-200 bg-amber-50">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-14 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-700">Hoa hồng nền tảng minh bạch</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Chỉ thu hoa hồng khi nền tảng tạo ra đơn thành công.</h2>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Không thu phí khởi tạo. Hoa hồng nền tảng được tính trên tiền đặt sân của đơn hoàn thành hoặc đã xác nhận theo chính sách đối soát. Doanh thu dịch vụ bán thêm tại sân được theo dõi riêng để chủ sân dễ kiểm soát.</p>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-amber-700">Cách tính rõ ràng</p>
            <p className="mt-3 text-4xl font-black text-blue-950">10%</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">trên mỗi đơn đặt sân thành công từ SmartSport.</p>
          </div>
        </div>
      </section>

      <section className="bg-blue-700 text-white">
        <div className="mx-auto max-w-[1440px] px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-300">Một ngày vận hành rõ ràng</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Từ lúc khách tìm sân đến khi đối soát doanh thu.</h2>
              <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-blue-100">Mỗi bước đều có trạng thái để chủ sân và nhân viên biết việc tiếp theo cần làm. Không cần dò lại tin nhắn hoặc ghi chú rời rạc.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['01', CalendarCheck, 'Mở lịch bán', 'Thiết lập môn, loại sân, giá và khung giờ còn nhận khách.', 'bg-amber-300 text-blue-950', 'bg-blue-950 text-amber-300'],
                ['02', CreditCard, 'Nhận đơn và cọc', 'Slot được giữ đúng thời gian; trạng thái thanh toán đi cùng đơn.', 'bg-cyan-300 text-blue-950', 'bg-blue-700 text-white'],
                ['03', PackagePlus, 'Phục vụ tại sân', 'Nhân viên kiểm tra lịch và cộng thêm nước uống hoặc dụng cụ.', 'bg-emerald-300 text-blue-950', 'bg-emerald-800 text-white'],
                ['04', BarChart3, 'Xem báo cáo', 'Đọc doanh thu theo bộ môn, thời gian và trạng thái đơn.', 'bg-blue-950 text-white', 'bg-amber-300 text-blue-950'],
              ].map(([number, Icon, title, text, tone, iconTone]) => { const StepIcon = Icon as React.ElementType; return <article key={number as string} className={`rounded-2xl p-5 ${tone}`}><div className="flex items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-widest opacity-75">Bước {number as string}</span><span className={`grid h-10 w-10 place-items-center rounded-xl ${iconTone}`}><StepIcon size={19} /></span></div><h3 className="mt-5 text-lg font-black text-current">{title as string}</h3><p className="mt-2 text-sm font-semibold leading-6 text-current opacity-80">{text as string}</p></article>; })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div><p className="text-xs font-black uppercase tracking-widest text-emerald-700">Bắt đầu gọn gàng</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Đăng ký trung tâm, thêm sân và mở lịch bán.</h2><p className="mt-4 text-sm font-semibold leading-6 text-slate-500">Sau khi hồ sơ chủ sân được duyệt, bạn có thể thêm từng sân theo bộ môn, khung giờ, giá thuê, ảnh và vị trí bản đồ.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">{[['01', 'Gửi hồ sơ', 'Tên cơ sở và địa chỉ'], ['02', 'Được phê duyệt', 'Xác nhận tài khoản chủ sân'], ['03', 'Mở lịch bán', 'Thêm sân, giá và khung giờ']].map(([number, title, text]) => <div key={number} className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-2xl font-black text-blue-700">{number}</span><h3 className="mt-5 font-black">{title}</h3><p className="mt-2 text-sm font-semibold text-slate-500">{text}</p></div>)}</div>
        </div>
      </section>

      <section id="register" className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1180px] gap-0 px-6 py-16 lg:grid-cols-[350px_1fr]">
          <aside className="rounded-t-2xl bg-blue-700 p-7 text-white lg:rounded-l-2xl lg:rounded-tr-none">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-300 text-blue-950"><UserPlus size={23} /></span>
            <h2 className="mt-6 text-2xl font-black text-white">Đăng ký làm chủ sân</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-blue-200">Cung cấp thông tin cơ sở để bắt đầu quản lý sân trên SmartSport.</p>
            <div className="mt-7 space-y-3">
              {['Không phí khởi tạo', 'Có dashboard quản lý ngay khi được duyệt', 'Hoa hồng rõ ràng theo đơn thành công'].map((item) => <p key={item} className="flex items-start gap-2 text-xs font-bold text-blue-100"><Check size={15} className="shrink-0 text-amber-300" />{item}</p>)}
            </div>
            <p className="mt-8 flex items-center gap-2 text-sm font-black text-amber-300"><Phone size={16} /> 1900 6789</p>
          </aside>
          {isSuccess ? <div className="grid min-h-80 place-items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"><div><CheckCircle2 size={48} className="mx-auto text-emerald-600" /><h3 className="mt-4 text-2xl font-black">Hồ sơ đang chờ duyệt</h3><p className="mt-2 text-sm font-semibold text-slate-600">Bạn sẽ nhận thông báo sau khi quản trị viên phê duyệt hồ sơ.</p><button type="button" onClick={() => navigate('/profile?tab=notifications')} className="mt-5 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">Xem thông báo</button></div></div> :
          <form onSubmit={handleRegister} className="grid gap-4 rounded-b-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:rounded-l-none lg:rounded-r-2xl">
            {error && <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            <Input label="Số điện thoại" value={formData.phone} onChange={(value) => setFormData({ ...formData, phone: value })} placeholder="0912 345 678" type="tel" />
            <Input label="Tên cơ sở kinh doanh" value={formData.businessName} onChange={(value) => setFormData({ ...formData, businessName: value })} placeholder="Ví dụ: Sân thể thao Navy" />
            <Select label="Tỉnh / Thành phố" value={provinceCode || ''} onChange={(value) => { setProvinceCode(Number(value) || undefined); setDistrictCode(undefined); setSelectedWard(''); }}><option value="">Chọn tỉnh thành</option>{provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</Select>
            <Select label="Quận / Huyện" value={districtCode || ''} disabled={!provinceCode} onChange={(value) => { setDistrictCode(Number(value) || undefined); setSelectedWard(''); }}><option value="">Chọn quận huyện</option>{districts.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</Select>
            <Select label="Phường / Xã" value={selectedWard} disabled={!districtCode} onChange={setSelectedWard} className="sm:col-span-2"><option value="">Chọn phường xã</option>{wards.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}</Select>
            <Input label="Địa chỉ cụ thể" value={formData.address} onChange={(value) => setFormData({ ...formData, address: value })} placeholder="Số nhà, tên đường" className="sm:col-span-2" />
            {auth.user && <p className="sm:col-span-2 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-700">Tài khoản đăng ký: {auth.user.fullName} · {auth.user.email}</p>}
            <button disabled={isLoading} className="sm:col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-50">{isLoading ? 'Đang gửi hồ sơ...' : <>Gửi đơn đăng ký <ArrowRight size={17} /></>}</button>
          </form>}
        </div>
      </section>
    </div>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', className = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; className?: string }) => <label className={className}><span className="mb-2 block text-xs font-black text-slate-700">{label}</span><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" /></label>;
const Select = ({ label, value, onChange, children, disabled = false, className = '' }: React.PropsWithChildren<{ label: string; value: string | number; onChange: (value: string) => void; disabled?: boolean; className?: string }>) => <label className={className}><span className="mb-2 block text-xs font-black text-slate-700">{label}</span><select required disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50">{children}</select></label>;

export default PartnerPortal;
