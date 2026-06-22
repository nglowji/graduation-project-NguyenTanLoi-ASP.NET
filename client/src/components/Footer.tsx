import React from 'react';
import { ArrowRight, GraduationCap, Heart, Mail, MapPin, Phone, Search, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoMark from '../assets/logo-smartsport.svg';

const Footer: React.FC = () => (
  <footer className="border-t-4 border-amber-300 bg-blue-950 text-slate-50">
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.25fr_.72fr_.88fr_1.05fr] lg:gap-8">
        <section>
          <Link to="/" className="inline-flex items-center gap-3 text-xl font-black text-white">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white p-1.5 shadow-sm">
              <img src={logoMark} alt="SmartSport" className="h-full w-full object-contain" />
            </span>
            Smart<span className="text-amber-300">Sport</span>
          </Link>
          <p className="mt-5 max-w-xs text-sm font-medium leading-7 text-blue-100">
            Nền tảng tìm sân, giữ lịch và theo dõi đơn đặt cho người chơi cùng chủ sân.
          </p>
          <Link to="/explore" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-amber-300 transition hover:text-amber-200">
            Khám phá sân <ArrowRight size={16} />
          </Link>
        </section>

        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-white">Điều hướng</h3>
          <span className="mt-3 block h-0.5 w-6 bg-amber-300" />
          <nav className="mt-5 space-y-4 text-sm font-semibold text-blue-100">
            <Link className="flex items-center gap-3 transition hover:text-white" to="/explore"><Search size={16} />Khám phá sân</Link>
            <Link className="flex items-center gap-3 transition hover:text-white" to="/partner"><GraduationCap size={16} />Dành cho chủ sân</Link>
            <Link className="flex items-center gap-3 transition hover:text-white" to="/contact"><Phone size={16} />Liên hệ</Link>
          </nav>
        </section>

        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-white">Hỗ trợ</h3>
          <span className="mt-3 block h-0.5 w-6 bg-amber-300" />
          <div className="mt-5 space-y-4 text-sm font-semibold text-blue-100">
            <a className="flex items-center gap-3 transition hover:text-white" href="mailto:support@smartsport.vn"><Mail size={16} />support@smartsport.vn</a>
            <a className="flex items-center gap-3 font-black text-amber-300 transition hover:text-amber-200" href="tel:19006868"><Phone size={16} />1900 6868</a>
            <p className="flex items-center gap-3"><MapPin size={16} />Trà Vinh, Việt Nam</p>
          </div>
        </section>

        <section className="rounded-2xl bg-amber-300 p-5 text-blue-950 shadow-lg shadow-blue-950/20">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
            <GraduationCap size={18} /> Đồ án tốt nghiệp
          </div>
          <h3 className="mt-4 text-xl font-black">Đại học Trà Vinh</h3>
          <div className="mt-4 border-t border-blue-950/15 pt-4 text-sm font-semibold leading-6">
            <p className="flex items-center gap-2 font-black"><UserRound size={16} />Nguyễn Tấn Lợi</p>
            <p>MSSV: 110122014 <br />Lớp: DA22TTA</p>
          </div>
          <p className="mt-4 border-t border-blue-950/15 pt-4 text-xs font-bold leading-5">
            Giảng viên hướng dẫn:<br />ThS. Phạm Thị Trúc Mai
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-col gap-4 border-t border-blue-800 pt-5 text-xs font-semibold text-blue-200 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-blue-300" />© 2026 SmartSport. All rights reserved.</span>
        <span className="flex items-center gap-2"><Heart size={15} className="fill-amber-300 text-amber-300" />Nền tảng đặt sân thể thao hàng đầu Việt Nam.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
