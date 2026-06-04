import React from 'react';
import { ArrowRight, CalendarCheck, CheckCircle2, MapPin, Quote, ShieldCheck, Star, Store, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const stories = [
  { quote: 'Tôi lọc được sân cầu lông gần nhà, xem giá rõ ràng và đặt lịch tối ngay trên điện thoại. Không cần nhắn hỏi từng sân như trước.', name: 'Minh Anh', role: 'Người chơi cầu lông', tone: 'bg-cyan-50 border-cyan-100', icon: Users },
  { quote: 'Lịch đặt, cọc và slot trống nằm cùng một nơi. Nhân viên giao ca dễ hơn, tôi cũng biết bộ môn nào đang tạo doanh thu tốt.', name: 'Anh Hoàng', role: 'Chủ cụm sân thể thao', tone: 'bg-amber-50 border-amber-100', icon: Store },
  { quote: 'Nhóm mình thường đặt bóng đá cuối tuần. Có trạng thái đơn và giờ chơi rõ nên cả nhóm thống nhất lịch rất nhanh.', name: 'Tuấn Khang', role: 'Đội trưởng bóng đá', tone: 'bg-emerald-50 border-emerald-100', icon: CalendarCheck },
];

const CommunityStoriesSection: React.FC = () => (
  <>
    <section className="overflow-hidden border-y border-cyan-100 bg-cyan-50">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="grid grid-cols-2 gap-3">
          <img src="https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=900&q=85" alt="Người chơi bóng đá trên sân cỏ" className="h-72 w-full rounded-2xl object-cover sm:h-96" />
          <div className="grid gap-3">
            <img src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=700&q=85" alt="Sân cầu lông trong nhà" className="h-full min-h-32 w-full rounded-2xl object-cover" />
            <div className="rounded-2xl bg-blue-700 p-5 text-white">
              <MapPin size={20} className="text-amber-300" />
              <p className="mt-6 text-xl font-black">Chọn sân theo cách bạn chơi.</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-blue-100">Bộ môn, vị trí, giá thuê và đánh giá đều ở đúng chỗ.</p>
            </div>
          </div>
        </div>
        <div className="lg:pl-6">
          <p className="text-xs font-black uppercase tracking-widest text-blue-700">Một nền tảng cho cả hai phía</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Người chơi tìm nhanh hơn.<br /><span className="text-blue-700">Chủ sân vận hành rõ hơn.</span></h2>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-600">SmartSport kết nối nhu cầu đặt sân với lịch trống thật. Người chơi ra quyết định dễ hơn; chủ sân giảm thao tác thủ công và giữ nhịp phục vụ ổn định.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {['Tìm sân theo khu vực và bộ môn', 'Khóa slot đã đặt theo thời gian thực', 'Thanh toán cọc và theo dõi trạng thái', 'Quản lý dịch vụ bán thêm tại sân'].map((item) => <p key={item} className="flex items-start gap-2 text-sm font-bold text-slate-700"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />{item}</p>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/explore" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800">Khám phá sân <ArrowRight size={17} /></Link>
            <Link to="/partner" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 hover:bg-blue-50">Dành cho chủ sân</Link>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-white py-18 sm:py-24">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Cộng đồng nói gì</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Những trải nghiệm gần với sân đấu.</h2></div>
          <div className="flex items-center gap-1 text-amber-500"><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><span className="ml-2 text-xs font-black text-slate-500">Trải nghiệm được đánh giá cao</span></div>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {stories.map(({ quote, name, role, tone, icon: Icon }) => <article key={name} className={`rounded-2xl border p-6 ${tone}`}><Quote size={23} className="text-blue-700" /><p className="mt-5 text-sm font-bold leading-7 text-slate-700">“{quote}”</p><div className="mt-6 flex items-center gap-3 border-t border-slate-900/10 pt-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white"><Icon size={18} /></span><div><p className="text-sm font-black">{name}</p><p className="mt-1 text-xs font-semibold text-slate-500">{role}</p></div></div></article>)}
        </div>
        <div className="mt-10 flex items-center gap-3 rounded-2xl bg-blue-700 px-5 py-4 text-white"><ShieldCheck size={22} className="shrink-0 text-amber-300" /><p className="text-sm font-bold">Thông tin sân, lịch trống và trạng thái đặt sân được trình bày rõ để mỗi quyết định đặt lịch bớt một bước chờ đợi.</p></div>
      </div>
    </section>
  </>
);

export default CommunityStoriesSection;
