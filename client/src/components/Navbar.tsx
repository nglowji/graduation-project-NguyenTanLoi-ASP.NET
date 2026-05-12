import React from 'react';
import { motion } from 'framer-motion';
import { Menu, LogIn, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoMark from '../assets/logo-smartsport.svg';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin, isOwner } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-[100] bg-surface-light/90 backdrop-blur-lg border-b border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logoMark}
            alt="SmartSport"
            className="w-11 h-11 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">SmartSport</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/">Trang chủ</NavLink>
          <NavLink to="/explore">Khám phá sân</NavLink>
          <NavLink to="/partner">Dành cho chủ sân</NavLink>
        </div>

        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-semibold">
                <LogIn size={18} />
                Đăng nhập
              </Link>
              <Link to="/register" className="btn-primary py-2 px-5 text-sm inline-block">
                Bắt đầu ngay
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs text-slate-500 font-medium leading-none mb-1">Xin chào,</p>
                  <p className="text-sm font-bold text-slate-900 leading-none">{user?.fullName}</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 overflow-hidden"
                >
                  <div className="px-3 py-2 mb-2 border-b border-slate-50 sm:hidden">
                    <p className="text-xs text-slate-500">Đang đăng nhập với</p>
                    <p className="text-sm font-bold truncate">{user?.email}</p>
                  </div>

                  {(isAdmin || isOwner) && (
                    <Link 
                      to={isAdmin ? "/dashboard/admin" : "/dashboard/owner"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-primary hover:text-white transition-all mb-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} />
                      Trang quản trị
                    </Link>
                  )}

                  <Link 
                    to="/profile" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all mb-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} />
                    Hồ sơ cá nhân
                  </Link>

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut size={18} />
                    Đăng xuất
                  </button>
                </motion.div>
              )}
            </div>
          )}
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
