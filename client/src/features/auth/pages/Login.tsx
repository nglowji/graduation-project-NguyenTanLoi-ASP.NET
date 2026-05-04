import React, { useState } from 'react';
import { Mail, Lock, ChevronRight, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-light relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card p-8 md:p-12 relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              S
            </div>
            <span className="text-2xl font-bold tracking-tight">SmartSport</span>
          </Link>
          <h2 className="text-3xl font-bold mb-2">Chào mừng trở lại</h2>
          <p className="text-text/50">Nhập thông tin để đăng nhập vào tài khoản của bạn</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text/70 ml-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@vídu.com" 
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-medium text-text/70">Mật khẩu</label>
              <button type="button" className="text-xs text-primary hover:underline">Quên mật khẩu?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-all shadow-sm"
              />
            </div>
          </div>

          <button className="btn-primary w-full py-4 mt-4 flex items-center justify-center gap-2">
            Đăng nhập <ChevronRight size={18} />
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-text/30">Hoặc tiếp tục với</span>
            </div>
          </div>

          <button className="w-full py-3 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm">
            <Globe size={18} />
            Tài khoản GitHub
          </button>
        </div>

        <p className="mt-10 text-center text-sm text-text/50">
          Chưa có tài khoản? <Link to="/register" className="text-primary font-bold hover:underline">Đăng ký miễn phí</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
