import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2, CheckCircle2, ChevronRight, Clock3, Loader2, Mail, MapPin,
  Phone, RefreshCw, Search, ShieldCheck, UserRound, X, XCircle,
} from 'lucide-react';
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
const initials = (value?: string) => String(value || 'C').trim().charAt(0).toUpperCase();

const Approvals: React.FC = () => {
  const [pending, setPending] = useState<OwnerRegistration[]>([]);
  const [approved, setApproved] = useState<OwnerRegistration[]>([]);
  const [status, setStatus] = useState<'pending' | 'approved'>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OwnerRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        api.get('/admin/owner-approvals', { params: { status: 'pending' } }) as Promise<OwnerRegistration[]>,
        api.get('/admin/owner-approvals', { params: { status: 'approved' } }) as Promise<OwnerRegistration[]>,
      ]);
      setPending(Array.isArray(pendingRes) ? pendingRes : []);
      setApproved(Array.isArray(approvedRes) ? approvedRes : []);
    } catch {
      setPending([]);
      setApproved([]);
      setMessage('Không thể tải hồ sơ đăng ký chủ sân.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const items = status === 'pending' ? pending : approved;
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(item => [item.businessName, item.applicantName, item.applicantEmail, item.applicantPhone, item.address]
      .some(value => String(value || '').toLowerCase().includes(keyword)));
  }, [items, search]);

  const decide = async (item: OwnerRegistration, action: 'approve' | 'reject') => {
    setProcessingId(item.id);
    setMessage('');
    try {
      await api.patch(`/admin/owner-approvals/${item.id}/${action}`);
      setSelected(null);
      setMessage(action === 'approve' ? `Đã nâng cấp ${item.applicantName} thành chủ sân.` : `Đã từ chối hồ sơ ${item.businessName}.`);
      await load();
    } catch {
      setMessage('Không thể xử lý hồ sơ. Vui lòng thử lại.');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-600"><ShieldCheck size={17} /> Quản lý chủ sân</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Xét duyệt quyền quản lý sân</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Kiểm tra hồ sơ doanh nghiệp trước khi nâng cấp tài khoản khách hàng thành chủ sân. Việc duyệt sân cụ thể được xử lý riêng tại trang kiểm duyệt nội dung.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:border-blue-200 hover:text-blue-700"><RefreshCw size={16} /> Làm mới</button>
      </header>

      <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-3">
        <div className="flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600"><Clock3 size={20} /></span><div><b className="text-2xl text-slate-950">{pending.length}</b><p className="text-xs font-black uppercase tracking-wider text-slate-400">Đang chờ duyệt</p></div></div>
        <div className="flex items-center gap-4 border-t border-slate-200 p-5 sm:border-l sm:border-t-0"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={20} /></span><div><b className="text-2xl text-slate-950">{approved.length}</b><p className="text-xs font-black uppercase tracking-wider text-slate-400">Đã là chủ sân</p></div></div>
        <div className="flex items-center gap-4 border-t border-slate-200 p-5 sm:border-l sm:border-t-0"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={20} /></span><div><b className="text-2xl text-slate-950">{pending.length + approved.length}</b><p className="text-xs font-black uppercase tracking-wider text-slate-400">Tổng hồ sơ</p></div></div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="flex rounded-xl bg-slate-100 p-1">
          {[{ id: 'pending', label: 'Chờ xét duyệt', count: pending.length }, { id: 'approved', label: 'Đã nâng cấp', count: approved.length }].map(item => (
            <button key={item.id} onClick={() => setStatus(item.id as typeof status)} className={`flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-black transition ${status === item.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{item.label}<span className={`rounded-full px-2 py-0.5 text-[9px] ${status === item.id ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>{item.count}</span></button>
          ))}
        </div>
        <label className="relative min-w-0 flex-1"><Search className="absolute left-4 top-3 text-slate-400" size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm theo người đăng ký, email, cơ sở hoặc địa chỉ..." className="h-11 w-full rounded-xl border-0 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-blue-300" /></label>
        <span className="px-2 text-xs font-bold text-slate-400">{filtered.length} hồ sơ phù hợp</span>
      </section>

      {message && <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(220px,.9fr)_minmax(240px,1fr)_minmax(260px,1.2fr)_150px] gap-4 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 lg:grid"><span>Cơ sở đăng ký</span><span>Người đăng ký</span><span>Thông tin liên hệ</span><span className="text-right">Trạng thái</span></div>
        {loading ? <div className="flex min-h-72 items-center justify-center gap-3 text-sm font-bold text-slate-400"><Loader2 size={20} className="animate-spin text-blue-600" />Đang tải hồ sơ...</div> : !filtered.length ? <div className="py-20 text-center"><Clock3 className="mx-auto text-slate-300" size={40} /><p className="mt-3 font-black text-slate-800">Không có hồ sơ phù hợp</p><p className="mt-1 text-sm font-semibold text-slate-400">Danh sách sẽ cập nhật khi có hồ sơ mới.</p></div> :
          <div className="divide-y divide-slate-100">{filtered.map(item => (
            <button type="button" key={item.id} onClick={() => setSelected(item)} className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-blue-50/40 lg:grid-cols-[minmax(220px,.9fr)_minmax(240px,1fr)_minmax(260px,1.2fr)_150px] lg:items-center">
              <div className="min-w-0"><p className="truncate text-base font-black text-slate-950">{item.businessName}</p><p className="mt-1 text-xs font-bold text-slate-400">Gửi ngày {formatDate(item.submittedAt)}</p></div>
              <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">{initials(item.applicantName)}</span><div className="min-w-0"><p className="truncate text-sm font-black text-slate-800">{item.applicantName}</p><p className="mt-1 truncate text-xs font-semibold text-slate-400">{item.applicantEmail}</p></div></div>
              <div className="min-w-0 space-y-1"><p className="flex items-center gap-2 truncate text-xs font-bold text-slate-600"><Phone size={14} className="text-blue-600" />{item.applicantPhone || 'Chưa cập nhật SĐT'}</p><p className="flex items-center gap-2 truncate text-xs font-semibold text-slate-400"><MapPin size={14} className="text-rose-500" />{item.address}</p></div>
              <div className="flex items-center justify-end gap-3"><span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${item.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.status === 'pending' ? 'Chờ duyệt' : 'Đã duyệt'}</span><ChevronRight size={17} className="text-slate-300" /></div>
            </button>
          ))}</div>}
      </section>

      {selected && <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/30 p-3 sm:p-5" onClick={() => setSelected(null)}>
        <aside className="h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Hồ sơ đăng ký chủ sân</p><h2 className="mt-2 text-2xl font-black text-slate-950">{selected.businessName}</h2></div><button type="button" onClick={() => setSelected(null)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"><X size={18} /></button></div>
          <div className="mt-6 space-y-3">
            {[{ icon: UserRound, label: 'Người đăng ký', value: selected.applicantName }, { icon: Mail, label: 'Email', value: selected.applicantEmail }, { icon: Phone, label: 'Số điện thoại', value: selected.applicantPhone || 'Chưa cập nhật' }, { icon: MapPin, label: 'Địa chỉ cơ sở', value: selected.address }, { icon: Clock3, label: 'Ngày gửi hồ sơ', value: formatDate(selected.submittedAt) }].map(row => { const Icon = row.icon; return <div key={row.label} className="flex gap-3 rounded-xl bg-slate-50 p-4"><Icon size={18} className="mt-0.5 shrink-0 text-blue-600" /><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{row.label}</p><p className="mt-1 text-sm font-bold leading-6 text-slate-700">{row.value}</p></div></div>; })}
          </div>
          {selected.status === 'pending' && <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" disabled={processingId === selected.id} onClick={() => decide(selected, 'reject')} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"><XCircle size={18} /> Từ chối</button><button type="button" disabled={processingId === selected.id} onClick={() => decide(selected, 'approve')} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50">{processingId === selected.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Duyệt hồ sơ</button></div>}
        </aside>
      </div>}
    </div>
  );
};

export default Approvals;
