import React from 'react';
import { CalendarDays, MapPinned, ShieldCheck } from 'lucide-react';

const AboutSection: React.FC = () => <section className="bg-white py-16 sm:py-20">
  <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
    <div><p className="text-xs font-black uppercase tracking-widest text-blue-700">SmartSport</p><h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">Từ tìm sân đến lịch sử thanh toán, mọi thứ ở đúng nơi cần có.</h2><p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600">SmartSport giúp người chơi ra quyết định nhanh hơn và giúp chủ sân giảm thao tác vận hành lặp lại. Thông tin sân, giá, lịch trống và trạng thái đơn luôn được đặt cạnh nhau để dễ kiểm tra.</p></div>
    <div className="grid gap-3">
      <div className="flex items-center gap-4 border border-slate-200 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><MapPinned size={20} /></span><div><p className="text-sm font-black text-slate-950">Tìm đúng sân</p><p className="mt-1 text-xs font-semibold text-slate-500">So sánh vị trí, giá, loại sân và đánh giá.</p></div></div>
      <div className="flex items-center gap-4 border border-slate-200 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarDays size={20} /></span><div><p className="text-sm font-black text-slate-950">Theo dõi đúng lịch</p><p className="mt-1 text-xs font-semibold text-slate-500">Đơn đặt, tiền cọc và dịch vụ phát sinh đều có lịch sử.</p></div></div>
      <div className="flex items-center gap-4 border border-slate-200 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><ShieldCheck size={20} /></span><div><p className="text-sm font-black text-slate-950">Thanh toán minh bạch</p><p className="mt-1 text-xs font-semibold text-slate-500">Trạng thái giao dịch được cập nhật rõ ràng trong đơn.</p></div></div>
    </div>
  </div>
</section>;

export default AboutSection;
