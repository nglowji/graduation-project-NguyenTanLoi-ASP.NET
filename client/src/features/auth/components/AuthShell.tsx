import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const AuthShell = ({ children, title, text }: React.PropsWithChildren<{ title: string; text: string }>) => (
  <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-cyan-50 px-4 pb-12 pt-28 sm:px-6">
    <div className="absolute -left-20 top-36 h-56 w-56 rounded-full border-[34px] border-blue-200" />
    <div className="absolute -right-16 bottom-16 h-64 w-64 rounded-full border-[42px] border-cyan-200" />
    <div className="absolute left-[8%] top-[32%] hidden grid-cols-3 gap-3 opacity-80 lg:grid">
      {Array.from({ length: 9 }).map((_, index) => <span key={index} className={`h-3 w-3 rounded-full ${index % 4 === 0 ? 'bg-amber-400' : 'bg-blue-300'}`} />)}
    </div>
    <div className="absolute right-[10%] top-[24%] hidden h-20 w-20 rotate-12 rounded-2xl bg-emerald-300 lg:block" />
    <section className="relative w-full max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.24 }} className="overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-2xl shadow-blue-950/10">
        <header className="relative overflow-hidden bg-blue-700 px-6 py-5 text-white sm:px-8">
          <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full border-[18px] border-cyan-400" />
          <div className="relative flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 text-base font-black"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-300 text-blue-950"><Trophy size={18} /></span>SmartSport</Link>
            <span className="hidden items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-100 sm:flex"><Sparkles size={14} className="text-amber-300" /> Đặt sân thông minh</span>
          </div>
        </header>
        <div className="p-6 sm:p-8">{children}</div>
      </motion.div>
      <div className="mx-auto mt-4 max-w-xl text-center">
        <p className="text-sm font-black text-blue-950">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{text}</p>
      </div>
    </section>
  </main>
);

export const AuthInput = ({ label, icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode }) => <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">{label}</span><span className="relative block">{icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">{icon}</span>}<input {...props} className={`h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${icon ? 'pl-10' : ''}`} /></span></label>;

export const AuthError = ({ message }: { message: string }) => message ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p> : null;
