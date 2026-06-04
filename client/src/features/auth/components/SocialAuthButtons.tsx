import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { authService, type AuthResponse } from '../../../services/authService';

declare global {
  interface Window {
    FB?: {
      init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (callback: (response: { authResponse?: { accessToken: string } }) => void, options: { scope: string }) => void;
    };
    fbAsyncInit?: () => void;
  }
}

let facebookSdkPromise: Promise<void> | undefined;
const loadFacebookSdk = () => {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;
  if (!appId) return Promise.reject(new Error('Facebook Login chưa được cấu hình VITE_FACEBOOK_APP_ID.'));
  if (window.FB) return Promise.resolve();
  if (facebookSdkPromise) return facebookSdkPromise;

  facebookSdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, cookie: true, xfbml: false, version: 'v22.0' });
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Không thể tải Facebook Login. Vui lòng thử lại.'));
    document.body.appendChild(script);
  });
  return facebookSdkPromise;
};

export const SocialAuthButtons = ({ onAuthenticated, onError }: { onAuthenticated: (response: AuthResponse) => void; onError: (message: string) => void }) => {
  const [provider, setProvider] = useState<'google' | 'facebook'>();
  const finish = async (task: () => Promise<AuthResponse>) => {
    try { onAuthenticated(await task()); } catch (error: any) { onError(error.message || 'Không thể đăng nhập bằng mạng xã hội.'); } finally { setProvider(undefined); }
  };
  const googleLogin = useGoogleLogin({ onSuccess: ({ access_token }) => finish(() => authService.googleLogin(access_token)), onError: () => { setProvider(undefined); onError('Không thể kết nối Google Login.'); } });
  const facebookLogin = async () => {
    setProvider('facebook');
    try {
      await loadFacebookSdk();
      window.FB?.login((response) => {
        const token = response.authResponse?.accessToken;
        if (!token) { setProvider(undefined); onError('Bạn chưa cấp quyền đăng nhập Facebook.'); return; }
        finish(() => authService.facebookLogin(token));
      }, { scope: 'public_profile,email' });
    } catch (error: any) { setProvider(undefined); onError(error.message); }
  };
  return <><div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hoặc tiếp tục với</span><span className="h-px flex-1 bg-slate-200" /></div><div className="grid gap-3 sm:grid-cols-2"><button type="button" disabled={!!provider} onClick={() => { setProvider('google'); googleLogin(); }} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white text-sm font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50">{provider === 'google' ? <Loader2 size={17} className="animate-spin text-blue-600" /> : <span className="text-base font-black text-blue-600">G</span>}Google</button><button type="button" disabled={!!provider} onClick={facebookLogin} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white text-sm font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50">{provider === 'facebook' ? <Loader2 size={17} className="animate-spin text-blue-600" /> : <span className="grid h-5 w-5 place-items-center rounded bg-blue-600 text-sm font-black text-white">f</span>}Facebook</button></div></>;
};
