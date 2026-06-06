import React from 'react';
import { Bell, Megaphone, Settings, SlidersHorizontal, Tags, Trophy } from 'lucide-react';

const modules = [
  { title: 'Danh mục loại sân', desc: 'Quản lý quy cách sân: bóng đá 5 người, sân chuẩn, trong nhà, ngoài trời.', icon: Tags, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
  { title: 'Danh mục môn thể thao', desc: 'Quản lý bộ môn hiển thị trên khám phá sân và form tạo sân.', icon: Trophy, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { title: 'Banner, thông báo', desc: 'Quản lý banner trang chủ, thông báo bảo trì, khuyến nghị và tin hệ thống.', icon: Megaphone, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  { title: 'Cấu hình hệ thống', desc: 'Cấu hình phí nền tảng, thời gian giữ chỗ, chính sách thanh toán và thông báo.', icon: SlidersHorizontal, tone: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
];

const SystemManagement: React.FC = () => (
  <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">System settings</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Quản lý hệ thống</h1>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
        Khu vực dành cho các cấu hình nền tảng: danh mục sân, môn thể thao, banner, thông báo và chính sách vận hành.
      </p>
    </section>

    <section className="grid gap-4 md:grid-cols-2">
      {modules.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${item.tone}`}>
              <Icon size={22} />
            </div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">{item.title}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{item.desc}</p>
            <button className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-indigo-700">
              <Settings size={16} />
              Cấu hình
            </button>
          </article>
        );
      })}
    </section>

    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 text-blue-700" size={22} />
        <div>
          <h2 className="font-black text-blue-950">Gợi ý cấu hình quan trọng</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-blue-800">
            Thời gian giữ chỗ hiện đang dùng 15 phút. Nếu thay đổi chính sách này, cần đồng bộ frontend countdown, backend timeout và mô tả thanh toán.
          </p>
        </div>
      </div>
    </section>
  </div>
);

export default SystemManagement;
