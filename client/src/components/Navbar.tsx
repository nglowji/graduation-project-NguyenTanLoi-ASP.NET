import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, User, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoMark from '../assets/logo-smartsport.svg';

const publicLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/explore', label: 'Khám phá sân' },
  { to: '/partner', label: 'Dành cho chủ sân' },
];

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin, isOwner } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const [isPublicMenuOpen, setIsPublicMenuOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsAccountMenuOpen(false);
    setIsPublicMenuOpen(false);
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed left-0 right-0 top-0 z-[100] border-b border-slate-200 bg-surface-light/95 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-lg"
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex min-w-0 items-center gap-2">
          <img src={logoMark} alt="SmartSport" className="h-11 w-11 shrink-0 object-contain transition-transform group-hover:scale-105" />
          <span className="truncate text-xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-primary">SmartSport</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {publicLinks.map((item) => (
            <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hidden items-center gap-2 rounded-lg px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:flex">
                <LogIn size={18} />
                Đăng nhập
              </Link>
              <Link to="/register" className="btn-primary inline-flex h-10 items-center px-4 text-sm sm:px-5">
                Bắt đầu
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-2 transition-all hover:border-slate-200 hover:bg-slate-100 sm:px-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="mb-1 text-xs font-medium leading-none text-slate-500">Xin chào,</p>
                  <p className="max-w-[140px] truncate text-sm font-bold leading-none text-slate-900">{user?.fullName}</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAccountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl sm:w-64"
                >
                  <div className="mb-2 border-b border-slate-50 px-3 py-2 sm:hidden">
                    <p className="text-xs text-slate-500">Đang đăng nhập với</p>
                    <p className="truncate text-sm font-bold">{user?.email}</p>
                  </div>

                  {(isAdmin || isOwner) && (
                    <Link
                      to={isAdmin ? '/dashboard/admin' : '/dashboard/owner'}
                      className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-primary hover:text-white"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} />
                      Trang quản trị
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    <User size={18} />
                    Hồ sơ cá nhân
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Đăng xuất
                  </button>
                </motion.div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsPublicMenuOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-label="Mở menu"
          >
            {isPublicMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isPublicMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-slate-200 bg-white px-4 py-4 shadow-xl md:hidden"
        >
          <div className="grid gap-2">
            {publicLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsPublicMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsPublicMenuOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-black text-slate-700"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsPublicMenuOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-black text-white"
                  >
                    Bắt đầu
                  </Link>
                </>
              ) : (
                <Link
                  to={isAdmin ? '/dashboard/admin' : isOwner ? '/dashboard/owner' : '/profile'}
                  onClick={() => setIsPublicMenuOpen(false)}
                  className="col-span-2 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-black text-white"
                >
                  {isAdmin || isOwner ? 'Vào dashboard' : 'Hồ sơ cá nhân'}
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to} className="group relative text-sm font-bold text-slate-600 transition-colors hover:text-primary">
    {children}
    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
  </Link>
);

export default Navbar;
