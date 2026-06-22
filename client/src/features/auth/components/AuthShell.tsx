import React, { useState } from 'react';
import { CalendarDays, Eye, EyeOff, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logoMark from '../../../assets/logo-smartsport.svg';

const authBannerUrl = 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1600&q=85';

export const AuthShell = ({ children }: React.PropsWithChildren<{ title: string; text: string }>) => (
  <main className="min-h-screen bg-slate-100 px-4 pb-12 pt-32 sm:px-6 lg:pt-32 lg:pb-16">
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-auto mt-4 grid w-full max-w-6xl overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/15 lg:mt-6 lg:min-h-170 lg:grid-cols-[.96fr_.84fr]">
      <aside className="relative hidden overflow-hidden bg-blue-700 p-10 text-white lg:block">
        <img src={authBannerUrl} alt="Sân thể thao SmartSport" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-blue-800/75" />
        <div className="relative flex h-full flex-col">
          <Link to="/" className="inline-flex w-fit items-center gap-3 text-2xl font-black"><span className="grid h-12 w-12 place-items-center rounded-xl bg-white p-2 shadow-lg"><img src={logoMark} alt="SmartSport" className="h-full w-full object-contain" /></span><span>Smart<span className="text-amber-300">Sport</span></span></Link>
          <div className="mt-14 max-w-md"><p className="text-sm font-black uppercase tracking-widest text-blue-100">Nền tảng đặt sân thể thao</p><h1 className="mt-5 text-5xl font-black leading-tight">Dễ đặt sân cho người chơi và <span className="text-amber-300">chủ sân</span> thể thao.</h1><p className="mt-6 text-base font-semibold leading-7 text-blue-50">Quản lý sân, lịch đặt, doanh thu và kết nối cộng đồng thể thao theo một quy trình rõ ràng.</p></div>
          <div className="mt-10 space-y-4 text-sm font-bold">{[[CalendarDays, 'Quản lý sân và lịch đặt dễ dàng'], [TrendingUp, 'Theo dõi doanh thu trực quan'], [Users, 'Kết nối hàng ngàn người chơi']].map(([Icon, label]) => { const FeatureIcon = Icon as React.ElementType; return <p key={label as string} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-amber-200"><FeatureIcon size={20} /></span>{label as string}</p>; })}</div>
          <div className="mt-auto rounded-2xl border border-white/20 bg-blue-950/30 p-5"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-blue-500 text-white"><ShieldCheck size={25} /></span><div><p className="font-black">An toàn, bảo mật, tin cậy</p><p className="mt-1 text-xs font-semibold leading-5 text-blue-100">Thông tin được bảo vệ bằng công nghệ bảo mật tiên tiến.</p></div></div></div>
        </div>
      </aside>
      <div className="flex min-h-full items-center px-6 py-10 sm:px-12 lg:px-14"><div className="mx-auto w-full max-w-sm"><Link to="/" className="inline-flex items-center gap-2 text-lg font-black text-slate-950 lg:hidden"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 p-1.5"><img src={logoMark} alt="SmartSport" className="h-full w-full object-contain" /></span>Smart<span className="text-amber-500">Sport</span></Link><div className="mt-7 lg:mt-0">{children}</div></div></div>
    </motion.section>
  </main>
);

export const AuthInput = ({ label, icon, type, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  return <label className="block"><span className="mb-2 block text-sm font-black text-slate-700">{label}</span><span className="relative block">{icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">{icon}</span>}<input {...props} type={isPassword ? (isPasswordVisible ? 'text' : 'password') : type} className={`h-14 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${icon ? 'pl-12' : ''} ${isPassword ? 'pr-12' : ''}`} />{isPassword && <button type="button" onClick={() => setIsPasswordVisible((value) => !value)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-700" aria-label={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}</button>}</span></label>;
};

export const AuthError = ({ message }: { message: string }) => message ? <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p> : null;
