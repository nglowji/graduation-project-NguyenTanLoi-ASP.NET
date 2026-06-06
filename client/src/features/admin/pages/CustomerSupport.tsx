import React from 'react';
import { Headphones, LifeBuoy, MessageCircleWarning, ShieldAlert, Wrench } from 'lucide-react';

const supportTypes = [
  { title: 'Tiếp nhận khiếu nại', desc: 'Tổng hợp phản ánh từ khách hàng, chủ sân và nhân viên sân.', icon: MessageCircleWarning, count: 0, tone: 'bg-rose-50 text-rose-700 border-rose-100' },
  { title: 'Xử lý tranh chấp', desc: 'Theo dõi tranh chấp về cọc, hủy đơn, no-show hoặc chất lượng sân.', icon: ShieldAlert, count: 0, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  { title: 'Hỗ trợ kỹ thuật', desc: 'Ghi nhận lỗi đăng nhập, thanh toán, bản đồ, thông báo và cập nhật dữ liệu.', icon: Wrench, count: 0, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
];

const CustomerSupport: React.FC = () => (
  <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Support desk</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Hỗ trợ khách hàng</h1>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
        Nơi admin tiếp nhận khiếu nại, xử lý tranh chấp và hỗ trợ kỹ thuật cho cả khách đặt sân lẫn chủ sân.
      </p>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
      {supportTypes.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${item.tone}`}>
              <Icon size={22} />
            </div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">{item.title}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{item.count}</span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{item.desc}</p>
            <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
              <Headphones size={16} />
              Xem yêu cầu
            </button>
          </article>
        );
      })}
    </section>

    <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
      <div className="flex items-start gap-3">
        <LifeBuoy className="mt-0.5 text-emerald-700" size={22} />
        <div>
          <h2 className="font-black text-emerald-950">Luồng xử lý đề xuất</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-emerald-800">
            Tiếp nhận, phân loại, kiểm tra booking/giao dịch, phản hồi hai bên, ghi nhận kết quả và đóng yêu cầu khi đã giải quyết.
          </p>
        </div>
      </div>
    </section>
  </div>
);

export default CustomerSupport;
