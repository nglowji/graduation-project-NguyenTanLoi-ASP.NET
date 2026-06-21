import React, { useState } from 'react';
import { Building2, CheckCircle2, Headphones, Mail, MessageSquareText, Phone, Send, UserRound } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const Contact: React.FC = () => {
  const { user } = useAuth();
  const [role, setRole] = useState('Khách đặt sân');
  const [topic, setTopic] = useState('Hỗ trợ kỹ thuật');
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [message, setMessage] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const subject = `[SmartSport] ${topic} - ${role}`;
    const body = `Người gửi: ${name}\nVai trò: ${role}\nEmail: ${email}\nSố điện thoại: ${phone || 'Không cung cấp'}\n\nNội dung:\n${message}`;
    window.location.href = `mailto:support@smartsport.vn?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <main className="flex-1 bg-slate-50 pt-20">
      <section className="border-b border-blue-900 bg-blue-950 px-5 py-14 text-slate-50 [&_p.text-slate-500]:text-blue-100 [&_p.text-blue-600]:text-blue-200">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Kết nối với SmartSport</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Bạn cần hỗ trợ điều gì?</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">Gửi câu hỏi, phản ánh hoặc đề xuất. Đội ngũ quản trị sẽ tiếp nhận và phản hồi đúng nội dung bạn cần.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-10 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          {[{ icon: Headphones, title: 'Tổng đài hỗ trợ', value: '1900 6868', href: 'tel:19006868' }, { icon: Mail, title: 'Email admin', value: 'support@smartsport.vn', href: 'mailto:support@smartsport.vn' }].map((item) => <a key={item.title} href={item.href} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><item.icon size={20} /></span><span><span className="block text-xs font-black uppercase tracking-widest text-slate-400">{item.title}</span><span className="mt-1 block text-sm font-black text-slate-950">{item.value}</span></span></a>)}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><CheckCircle2 className="text-emerald-700" size={22} /><p className="mt-3 text-sm font-black text-emerald-950">Thông tin nên đầy đủ</p><p className="mt-2 text-xs font-semibold leading-5 text-emerald-800">Với lỗi đặt sân hoặc thanh toán, hãy ghi thêm mã đơn để admin kiểm tra nhanh.</p></div>
        </aside>

        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700"><MessageSquareText size={21} /></span><div><h2 className="text-xl font-black text-slate-950">Gửi thông tin đến admin</h2><p className="mt-1 text-xs font-semibold text-slate-500">Các trường có dấu * là bắt buộc.</p></div></div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-black text-slate-700">Bạn là<select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-blue-500"><option>Khách đặt sân</option><option>Chủ sân</option><option>Nhân viên sân</option><option>Đối tác khác</option></select></label>
            <label className="text-xs font-black text-slate-700">Chủ đề<select value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-blue-500"><option>Hỗ trợ kỹ thuật</option><option>Khiếu nại đặt sân</option><option>Thanh toán và hoàn tiền</option><option>Đăng ký chủ sân</option><option>Góp ý nền tảng</option></select></label>
            <label className="text-xs font-black text-slate-700">Họ tên *<div className="relative mt-2"><UserRound className="absolute left-3 top-3.5 text-slate-400" size={17} /><input required value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-bold outline-none focus:border-blue-500" /></div></label>
            <label className="text-xs font-black text-slate-700">Email *<div className="relative mt-2"><Mail className="absolute left-3 top-3.5 text-slate-400" size={17} /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-bold outline-none focus:border-blue-500" /></div></label>
            <label className="text-xs font-black text-slate-700 sm:col-span-2">Số điện thoại<div className="relative mt-2"><Phone className="absolute left-3 top-3.5 text-slate-400" size={17} /><input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-bold outline-none focus:border-blue-500" /></div></label>
            <label className="text-xs font-black text-slate-700 sm:col-span-2">Nội dung *<textarea required minLength={10} value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Mô tả chi tiết vấn đề, mã đơn hoặc đề xuất của bạn..." className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-blue-500" /></label>
          </div>
          <button type="submit" className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white transition hover:bg-blue-800"><Send size={17} />Gửi đến admin</button>
          <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-400"><Building2 size={14} />Email sẽ được mở với nội dung đã điền sẵn.</p>
        </form>
      </section>
    </main>
  );
};

export default Contact;
