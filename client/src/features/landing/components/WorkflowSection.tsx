import React, { useState } from 'react';
import { CalendarCheck, ChartNoAxesCombined, CreditCard, MapPin, Settings2, UserPlus } from 'lucide-react';

const playerSteps = [
  ['01', MapPin, 'Chọn sân phù hợp', 'Lọc theo môn, vị trí, mức giá và đánh giá.'],
  ['02', CalendarCheck, 'Giữ khung giờ', 'Xem lịch trống thực tế, thêm dịch vụ khi cần.'],
  ['03', CreditCard, 'Thanh toán cọc', 'Xác nhận nhanh, theo dõi đơn trong hồ sơ.'],
] as const;

const ownerSteps = [
  ['01', UserPlus, 'Đăng ký cơ sở', 'Gửi thông tin sân để hệ thống xét duyệt.'],
  ['02', Settings2, 'Thiết lập vận hành', 'Thêm sân, giá, khung giờ và dịch vụ bán kèm.'],
  ['03', ChartNoAxesCombined, 'Theo dõi hoạt động', 'Quản lý lịch đặt, đánh giá và doanh thu mỗi ngày.'],
] as const;

const WorkflowSection: React.FC = () => {
  const [mode, setMode] = useState<'player' | 'owner'>('player');
  const steps = mode === 'player' ? playerSteps : ownerSteps;

  return <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-5 sm:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Cách vận hành</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Mọi bước đều có trạng thái rõ ràng</h2></div>
        <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1">
          <button type="button" onClick={() => setMode('player')} className={`h-10 rounded-lg px-4 text-sm font-black transition ${mode === 'player' ? 'bg-blue-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Người chơi</button>
          <button type="button" onClick={() => setMode('owner')} className={`h-10 rounded-lg px-4 text-sm font-black transition ${mode === 'owner' ? 'bg-blue-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Chủ sân</button>
        </div>
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {steps.map(([number, Icon, title, description]) => <article key={number} className="border-t-2 border-slate-200 bg-white p-5 transition hover:border-blue-600">
          <div className="flex items-center justify-between"><span className="text-xs font-black tracking-widest text-slate-400">{number}</span><Icon size={21} className="text-blue-700" /></div>
          <h3 className="mt-8 text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{description}</p>
        </article>)}
      </div>
    </div>
  </section>;
};

export default WorkflowSection;
