import React from 'react';
import { motion } from 'framer-motion';
import { Menu, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoMark from '../assets/logo-smartsport.svg';

const Navbar: React.FC = () => {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-surface-light/90 backdrop-blur-lg border-b border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logoMark}
            alt="SmartSport"
            className="w-11 h-11 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">SmartSport</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/">Trang chủ</NavLink>
          <NavLink to="/explore">Khám phá sân</NavLink>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-semibold">
            <LogIn size={18} />
            Đăng nhập
          </Link>
          <Link to="/register" className="btn-primary py-2 px-5 text-sm inline-block">
            Bắt đầu ngay
          </Link>
          <button className="md:hidden p-2">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

const NavLink: React.FC<{ to: string, children: React.ReactNode }> = ({ to, children }) => (
  <Link 
    to={to} 
    className="text-sm font-bold text-slate-600 hover:text-primary transition-colors relative group"
  >
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
  </Link>
);

export default Navbar;
