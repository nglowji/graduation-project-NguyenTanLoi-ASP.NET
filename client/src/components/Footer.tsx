import React from 'react';
import { GraduationCap, Mail, MapPin, Phone, Send, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoMark from '../assets/logo-smartsport.svg';

const Footer: React.FC = () => <footer className="border-t-4 border-amber-300 bg-blue-950 text-slate-50">
  <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6"><div className="grid gap-10 lg:grid-cols-[1.2fr_.7fr_.8fr_1fr]">
    <div><Link to="/" className="inline-flex items-center gap-3 text-xl font-black"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white p-1.5"><img src={logoMark} alt="SmartSport" className="h-full w-full object-contain" /></span>SmartSport</Link><p className="mt-5 max-w-sm text-sm font-semibold leading-7 text-blue-100">Nền tảng tìm sân, giữ lịch và theo dõi đơn đặt cho người chơi cùng chủ sân.</p><Link to="/explore" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-amber-300 hover:text-amber-200">Khám phá sân <Send size={15} /></Link></div>
    <div><h3 className="text-xs font-black uppercase tracking-widest text-blue-200">Điều hướng</h3><div className="mt-4 space-y-3 text-sm font-semibold text-blue-100"><Link className="block hover:text-white" to="/explore">Khám phá sân</Link><Link className="block hover:text-white" to="/partner">Dành cho chủ sân</Link><Link className="block hover:text-white" to="/contact">Liên hệ</Link></div></div>
    <div><h3 className="text-xs font-black uppercase tracking-widest text-blue-200">Hỗ trợ</h3><div className="mt-4 space-y-3 text-sm font-semibold text-blue-100"><a className="flex items-center gap-2 hover:text-white" href="mailto:support@smartsport.vn"><Mail size={15} />support@smartsport.vn</a><a className="flex items-center gap-2 hover:text-white" href="tel:19006868"><Phone size={15} />1900 6868</a><p className="flex items-center gap-2"><MapPin size={15} />Trà Vinh, Việt Nam</p></div></div>
    <div className="border border-amber-200 bg-amber-300 p-5 text-blue-950"><div className="flex items-center gap-2"><GraduationCap size={19} /><p className="text-xs font-black uppercase tracking-widest">Đồ án tốt nghiệp</p></div><p className="mt-3 text-lg font-black">Đại học Trà Vinh</p><p className="mt-3 flex items-center gap-2 text-sm font-black"><UserRound size={16} />Nguyễn Tấn Lợi</p><p className="mt-1 text-sm font-bold">MSSV: 110122014 · DA22TTA</p><p className="mt-4 border-t border-blue-950/15 pt-4 text-xs font-black leading-5">Giảng viên hướng dẫn: ThS. Phạm Thị Trúc Mai</p></div>
  </div><div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-blue-800 pt-5 text-xs font-semibold text-blue-200"><span>© 2026 SmartSport.</span><span>Nền tảng đặt sân thể thao.</span></div></div>
</footer>;

export default Footer;
