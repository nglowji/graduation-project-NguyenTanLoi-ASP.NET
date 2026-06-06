import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, Phone, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { authService, UserRole } from '../../../services/authService';
import { AuthError, AuthInput, AuthShell } from '../components/AuthShell';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

const Register: React.FC = () => {
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const set = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        address: '',
        role: UserRole.Customer,
      });
      auth.login(response);
      navigate('/profile');
      window.setTimeout(() => {
        alert('Tài khoản đã được tạo. Bạn hãy cập nhật địa chỉ trong hồ sơ để đặt sân thuận tiện hơn.');
      }, 250);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Một tài khoản, nhiều trận đấu đáng nhớ." text="Tạo tài khoản để lưu lịch đặt, tìm sân quanh bạn và nhận thông báo khi đơn thay đổi.">
      <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Tham gia cộng đồng</p>
      <h2 className="mt-2 text-3xl font-black">Tạo tài khoản mới</h2>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><AuthError message={error} /></div>
        <AuthInput required label="Họ và tên" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Nguyễn Văn A" icon={<User size={16} />} />
        <AuthInput required label="Số điện thoại" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="0912 345 678" icon={<Phone size={16} />} />
        <div className="sm:col-span-2">
          <AuthInput required type="email" label="Email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@example.com" icon={<Mail size={16} />} />
        </div>
        <AuthInput required type="password" label="Mật khẩu" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" icon={<Lock size={16} />} />
        <AuthInput required type="password" label="Xác nhận mật khẩu" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="••••••••" icon={<Lock size={16} />} />
        <button disabled={loading} className="sm:col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">
          {loading ? 'Đang tạo tài khoản...' : <>Tạo tài khoản <ArrowRight size={17} /></>}
        </button>
      </form>
      <SocialAuthButtons onAuthenticated={(response) => { auth.login(response); navigate('/profile'); }} onError={setError} />
      <p className="mt-5 text-center text-sm font-semibold text-slate-500">Đã có tài khoản? <Link to="/login" className="font-black text-blue-700">Đăng nhập</Link></p>
    </AuthShell>
  );
};

export default Register;
