import React, { useState } from 'react';
import { CalendarDays, Dumbbell, Eye, EyeOff, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logoMark from '../../../assets/logo-smartsport.svg';

export const AuthShell = ({ children }: React.PropsWithChildren<{ title: string; text: string }>) => (
  <main className="relative min-h-screen overflow-hidden bg-blue-100 px-4 pb-8 pt-24 sm:px-6 sm:pb-12 sm:pt-28">
    <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[22%] border-r border-blue-200 bg-blue-200/60 lg:block"><span className="absolute left-12 top-44 grid h-16 w-16 place-items-center rounded-2xl border border-blue-300 bg-white/70 text-blue-600"><Dumbbell size={30} /></span><span className="absolute bottom-28 right-10 grid h-14 w-14 place-items-center rounded-2xl bg-amber-300 text-blue-950"><Trophy size={25} /></span></div>
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[22%] border-l border-blue-200 bg-cyan-100 lg:block"><span className="absolute right-12 top-52 grid h-16 w-16 place-items-center rounded-2xl border border-cyan-200 bg-white/80 text-cyan-700"><CalendarDays size={30} /></span><span className="absolute bottom-32 left-10 h-20 w-20 rounded-full border-[14px] border-blue-300/70" /></div>
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xl shadow-blue-950/15">
      <div className="h-2 bg-amber-400" />
      <div className="p-6 sm:p-9">
        <Link to="/" className="inline-flex items-center gap-2 text-lg font-black text-slate-950"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 p-1.5"><img src={logoMark} alt="SmartSport" className="h-full w-full object-contain" /></span>SmartSport</Link>
        <div className="mt-8">{children}</div>
      </div>
    </motion.section>
  </main>
);

export const AuthInput = ({ label, icon, type, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  return <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">{label}</span><span className="relative block">{icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">{icon}</span>}<input {...props} type={isPassword ? (isPasswordVisible ? 'text' : 'password') : type} className={`h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${icon ? 'pl-10' : ''} ${isPassword ? 'pr-11' : ''}`} />{isPassword && <button type="button" onClick={() => setIsPasswordVisible((value) => !value)} className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-700" aria-label={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>}</span></label>;
};

export const AuthError = ({ message }: { message: string }) => message ? <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p> : null;
