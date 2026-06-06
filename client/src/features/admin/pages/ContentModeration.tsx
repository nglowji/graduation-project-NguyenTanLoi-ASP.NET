import React from 'react';
import { CheckCircle2, Flag, Image, MessageSquareWarning, Star, Store } from 'lucide-react';

const queues = [
  { title: 'Thông tin sân mới', desc: 'Kiểm tra tên sân, địa chỉ, loại sân, mô tả và khung giờ trước khi cho hiển thị.', icon: Store, count: 0, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
  { title: 'Hình ảnh sân', desc: 'Loại ảnh mờ, sai nội dung, ảnh không phải cơ sở thể thao hoặc vi phạm bản quyền.', icon: Image, count: 0, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { title: 'Đánh giá, bình luận', desc: 'Ẩn đánh giá spam, công kích cá nhân hoặc thông tin nhạy cảm.', icon: Star, count: 0, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  { title: 'Báo cáo vi phạm', desc: 'Xử lý báo cáo từ người dùng về sân, chủ sân, booking hoặc hành vi gian lận.', icon: MessageSquareWarning, count: 0, tone: 'bg-rose-50 text-rose-700 border-rose-100' },
];

const ContentModeration: React.FC = () => (
  <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600">Moderation center</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Kiểm duyệt nội dung</h1>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
        Quản lý thông tin sân mới, hình ảnh sân, đánh giá, bình luận và báo cáo vi phạm. Các hàng chờ này đã sẵn sàng để nối endpoint kiểm duyệt chi tiết.
      </p>
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {queues.map((item) => {
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
            <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
              <Flag size={16} />
              Xem hàng chờ
            </button>
          </article>
        );
      })}
    </section>

    <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 text-emerald-700" size={22} />
        <div>
          <h2 className="font-black text-emerald-950">Nguyên tắc kiểm duyệt</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-emerald-800">
            Nội dung hợp lệ phải đúng sân, đúng địa chỉ, không lừa đảo, không công kích cá nhân và không chứa thông tin nhạy cảm.
          </p>
        </div>
      </div>
    </section>
  </div>
);

export default ContentModeration;
