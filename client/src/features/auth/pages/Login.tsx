import React, { useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';
import { AuthError, AuthInput, AuthShell } from '../components/AuthShell';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await authService.login({ email, password }); auth.login(response);
      const from = (location.state as any)?.from?.pathname;
      navigate(response.role === 3 ? '/dashboard/admin' : response.role === 2 || response.role === 4 ? '/dashboard/owner' : from || '/', { replace: true });
    } catch (err: any) { setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'); } finally { setLoading(false); }
  };
  const finishLogin = (response: Awaited<ReturnType<typeof authService.login>>) => {
    auth.login(response);
    const from = (location.state as any)?.from?.pathname;
    navigate(response.role === 3 ? '/dashboard/admin' : response.role === 2 || response.role === 4 ? '/dashboard/owner' : from || '/', { replace: true });
  };
  return <AuthShell title="Trở lại sân đấu chỉ trong vài giây." text="Đăng nhập để tiếp tục đặt sân, theo dõi lịch và quản lý trải nghiệm thể thao của bạn.">
    <div className="mx-auto max-w-md">
    <p className="text-xs font-black uppercase tracking-widest text-blue-700">Chào mừng trở lại</p><h2 className="mt-2 text-3xl font-black">Đăng nhập SmartSport</h2><p className="mt-2 text-sm font-semibold text-slate-500">Tiếp tục hành trình thể thao của bạn.</p>
    <form onSubmit={submit} className="mt-7 space-y-4"><AuthError message={error} /><AuthInput required type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" icon={<Mail size={17} />} /><div><AuthInput required type="password" label="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={<Lock size={17} />} /><Link to="/forgot-password" className="mt-2 block text-right text-xs font-black text-blue-700 hover:text-blue-900">Quên mật khẩu?</Link></div><button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-50">{loading ? 'Đang đăng nhập...' : <>Đăng nhập <ArrowRight size={17} /></>}</button></form>
    <SocialAuthButtons onAuthenticated={finishLogin} onError={setError} />
    <p className="mt-6 text-center text-sm font-semibold text-slate-500">Chưa có tài khoản? <Link to="/register" className="font-black text-blue-700">Đăng ký miễn phí</Link></p>
    </div>
  </AuthShell>;
};
export default Login;
