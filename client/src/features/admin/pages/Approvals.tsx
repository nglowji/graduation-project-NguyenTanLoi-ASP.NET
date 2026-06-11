import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Mail, MapPin, Phone, Search, ShieldCheck, UserRound, XCircle } from 'lucide-react';
import api from '../../../services/api';

type OwnerRegistration = {
  id: string;
  businessName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  address: string;
  submittedAt: string;
  status: string;
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa rõ ngày';

const Approvals: React.FC = () => {
  const [items, setItems] = useState<OwnerRegistration[]>([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api.get('/admin/owner-approvals', { params: { status } }) as OwnerRegistration[]);
    } catch {
      setItems([]);
      setMessage('Không thể tải hồ sơ đăng ký chủ sân.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(item => [item.businessName, item.applicantName, item.applicantEmail, item.applicantPhone, item.address]
      .some(value => String(value || '').toLowerCase().includes(keyword)));
  }, [items, search]);

  const decide = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/admin/owner-approvals/${id}/${action}`);
      setMessage(action === 'approve' ? 'Đã nâng cấp tài khoản thành chủ sân.' : 'Đã từ chối hồ sơ đăng ký.');
      load();
    } catch {
      setMessage('Không thể xử lý hồ sơ. Vui lòng thử lại.');
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700"><ShieldCheck size={18} /> Quản lý chủ sân</div>
            <h1 className="mt-3 text-3xl font-black text-slate-950">Duyệt hồ sơ nâng cấp tài khoản</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Trang này chỉ xử lý hồ sơ đăng ký từ khách hàng. Khi được duyệt, tài khoản Customer sẽ trở thành PitchOwner và có quyền tạo sân.</p>
          </div>
          <div className="text-sm font-black text-slate-600">Có {filtered.length} hồ sơ phù hợp</div>
        </div>
      </header>

      <section className="flex flex-col gap-3 border-b border-slate-200 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-2">
          {[{ id: 'pending', label: 'Chờ xét duyệt' }, { id: 'approved', label: 'Đã nâng cấp' }].map(item => (
            <button key={item.id} onClick={() => setStatus(item.id)} className={`h-11 rounded-xl px-4 text-sm font-black ${status === item.id ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>
          ))}
        </div>
        <label className="relative w-full xl:w-96"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm người đăng ký, email, cơ sở..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold" /></label>
      </section>

      {message && <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</div>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-[minmax(240px,.85fr)_minmax(240px,.8fr)_minmax(260px,1fr)_150px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-400 lg:grid"><span>Cơ sở đăng ký</span><span>Người đăng ký</span><span>Địa chỉ và thời gian</span><span className="text-right">Xử lý</span></div>
        {loading ? <div className="py-20 text-center text-sm font-bold text-slate-400">Đang tải hồ sơ...</div> : !filtered.length ? <div className="py-20 text-center"><Clock3 className="mx-auto text-slate-300" size={40} /><p className="mt-3 font-black text-slate-800">Không có hồ sơ phù hợp</p></div> :
          <div className="divide-y divide-slate-100">{filtered.map(item => (
            <article key={item.id} className="grid gap-4 px-4 py-4 hover:bg-blue-50/30 lg:grid-cols-[minmax(240px,.85fr)_minmax(240px,.8fr)_minmax(260px,1fr)_150px] lg:items-center">
              <div className="min-w-0"><h2 className="truncate text-base font-black text-slate-950">{item.businessName}</h2><span className="mt-1.5 inline-flex rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">Hồ sơ nâng cấp chủ sân</span></div>
              <div className="min-w-0 space-y-2"><p className="flex items-center gap-2 font-black text-slate-800"><UserRound size={16} className="text-blue-700" />{item.applicantName}</p><p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-500"><Mail size={15} />{item.applicantEmail}</p><p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Phone size={15} />{item.applicantPhone || 'Chưa cập nhật SĐT'}</p></div>
              <div className="min-w-0"><p className="flex items-start gap-2 text-sm font-semibold leading-5 text-slate-600"><MapPin size={15} className="mt-0.5 shrink-0 text-rose-500" /><span className="line-clamp-2">{item.address}</span></p><p className="mt-1.5 text-xs font-bold text-slate-400">Gửi ngày {formatDate(item.submittedAt)}</p></div>
              <div className="flex justify-end gap-2">{item.status === 'pending' ? <><button onClick={() => decide(item.id, 'approve')} title="Duyệt và nâng cấp tài khoản" className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white"><CheckCircle2 size={19} /></button><button onClick={() => decide(item.id, 'reject')} title="Từ chối hồ sơ" className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-100"><XCircle size={19} /></button></> : <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Đã là chủ sân</span>}</div>
            </article>
          ))}</div>}
      </section>
    </div>
  );
};

export default Approvals;
