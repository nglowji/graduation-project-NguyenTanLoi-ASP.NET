import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock3, Filter, MapPin, PackageCheck, Search, ShieldCheck, Star, Store, Trash2, UserRound, X } from 'lucide-react';
import api from '../../../services/api';

type Tab = 'pitches' | 'services' | 'reviews';
type Pitch = { id: string; pitchName: string; ownerName: string; ownerEmail: string; pitchType: string; address: string; submittedAt: string; status: string };
type Service = { id: string; name: string; price: number; stockQuantity: number; sportCenterName: string; status: string; createdAt?: string };
type Review = { id: string; rating: number; comment?: string; ownerReply?: string; userName: string; userEmail: string; pitchName: string; pitchType: string; sportCenterName: string; createdAt: string };

const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const date = (value?: string) => {
  if (!value) return 'Chưa rõ ngày';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('vi-VN');
};
const sport = (value?: string) => ({
  OwnerRegistration: 'Hồ sơ chủ sân',
  Football5: 'Bóng đá 5 người',
  Football7: 'Bóng đá 7 người',
  Football11: 'Bóng đá 11 người',
  Badminton: 'Cầu lông',
  Pickleball: 'Pickleball',
  Tennis: 'Tennis',
  Basketball: 'Bóng rổ',
  Volleyball: 'Bóng chuyền',
  TableTennis: 'Bóng bàn',
} as Record<string, string>)[String(value || '')] || value || 'Nội dung';

const ContentModeration: React.FC = () => {
  const [tab, setTab] = useState<Tab>('pitches');
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      if (tab === 'pitches') {
        const result = await api.get('/admin/pitch-approvals', { params: { status } }) as any;
        setItems(result?.items || []);
      } else if (tab === 'services') {
        const result = await api.get('/admin/service-approvals', { params: { status, search: search || undefined } }) as Service[];
        setItems(result || []);
      } else {
        const result = await api.get('/admin/reviews', { params: { search: search || undefined, rating: rating || undefined, pageSize: 60 } }) as any;
        setItems(result?.items || []);
      }
    } catch {
      setItems([]);
      setMessage('Không thể tải dữ liệu kiểm duyệt.');
    } finally {
      setLoading(false);
    }
  }, [tab, status, search, rating]);

  useEffect(() => {
    const timer = window.setTimeout(load, 220);
    return () => window.clearTimeout(timer);
  }, [load]);

  const runAction = async (url: string, method: 'patch' | 'delete', success: string) => {
    if (method === 'delete' && !window.confirm('Xác nhận xóa nội dung này?')) return;
    try {
      await api[method](url);
      setMessage(success);
      load();
    } catch {
      setMessage('Thao tác thất bại. Vui lòng thử lại.');
    }
  };

  const categories = useMemo(() => Array.from(new Set(items.map(item => tab === 'services' ? item.sportCenterName : item.pitchType).filter(Boolean))), [items, tab]);
  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const result = items.filter(item => {
      const text = tab === 'pitches' ? [item.pitchName, item.ownerName, item.ownerEmail, item.address] : tab === 'services' ? [item.name, item.sportCenterName] : [item.userName, item.comment, item.pitchName, item.sportCenterName];
      if (keyword && !text.join(' ').toLowerCase().includes(keyword)) return false;
      if (category && (tab === 'services' ? item.sportCenterName : item.pitchType) !== category) return false;
      if (tab === 'services' && stock === 'available' && item.stockQuantity <= 0) return false;
      if (tab === 'services' && stock === 'empty' && item.stockQuantity > 0) return false;
      return true;
    });
    return [...result].sort((a, b) => {
      if (sortBy === 'name') return String(a.name || a.pitchName || a.userName).localeCompare(String(b.name || b.pitchName || b.userName), 'vi');
      if (sortBy === 'priceDesc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'ratingAsc') return Number(a.rating || 0) - Number(b.rating || 0);
      return new Date(b.createdAt || b.submittedAt || 0).getTime() - new Date(a.createdAt || a.submittedAt || 0).getTime();
    });
  }, [items, search, category, stock, sortBy, tab]);

  const counts = useMemo(() => ({
    visible: visibleItems.length,
    pending: tab !== 'reviews' && status === 'pending' ? visibleItems.length : 0,
    reviewBad: tab === 'reviews' ? visibleItems.filter((item: Review) => item.rating <= 3).length : 0,
  }), [visibleItems, status, tab]);

  const tabs = [
    { id: 'pitches', label: 'Sân owner tạo', icon: Store, desc: 'Duyệt từng sân trước khi hoạt động' },
    { id: 'services', label: 'Dịch vụ', icon: PackageCheck, desc: 'Duyệt hàng bán kèm' },
    { id: 'reviews', label: 'Đánh giá', icon: Star, desc: 'Ẩn hoặc xóa vi phạm' },
  ] as const;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700"><ShieldCheck size={18} /> Kiểm duyệt nội dung</div>
            <h1 className="mt-3 text-3xl font-black text-slate-950">Kiểm duyệt sân và nội dung do chủ sân tạo</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Mỗi sân mới ở trạng thái chờ duyệt. Chỉ sau khi admin xác minh, sân mới được kích hoạt và xuất hiện với khách hàng.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-black">
            <span className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700">Hiển thị: {counts.visible}</span>
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">Chờ duyệt: {counts.pending}</span>
            <span className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">Sao thấp: {counts.reviewBad}</span>
          </div>
        </div>
      </header>

      <section className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {tabs.map(({ id, label, icon: Icon, desc }) => (
          <button key={id} onClick={() => setTab(id)} title={desc} className={`inline-flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${tab === id ? 'bg-blue-700 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}>
            <Icon size={18} />
            {label}
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-slate-700"><Filter size={18} className="text-blue-700" /> Bộ lọc kiểm duyệt</div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {tab !== 'reviews' && <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"><option value="pending">Đang chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Đã từ chối</option></select>}
            {tab === 'reviews' && <select value={rating} onChange={(event) => setRating(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"><option value="">Tất cả đánh giá</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} sao</option>)}</select>}
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"><option value="">{tab === 'services' ? 'Tất cả trung tâm' : 'Tất cả bộ môn'}</option>{categories.map(value => <option key={value} value={value}>{tab === 'services' ? value : sport(value)}</option>)}</select>
            {tab === 'services' && <select value={stock} onChange={(event) => setStock(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"><option value="">Mọi tồn kho</option><option value="available">Còn hàng</option><option value="empty">Hết hàng</option></select>}
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"><option value="newest">Mới nhất</option><option value="name">Tên A-Z</option>{tab === 'services' && <option value="priceDesc">Giá cao nhất</option>}{tab === 'reviews' && <option value="ratingAsc">Sao thấp nhất</option>}</select>
            <label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, sân, nội dung..." className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm font-semibold text-slate-700" /></label>
          </div>
        </div>

        {message && <div className="border-b border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700">{message}</div>}

        {tab === 'pitches' && !loading && items.length > 0 && <div className="hidden grid-cols-[minmax(220px,.8fr)_minmax(240px,.8fr)_minmax(280px,1.2fr)_150px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-400 xl:grid"><span>Sân và bộ môn</span><span>Chủ sân</span><span>Địa chỉ</span><span className="text-right">Xử lý</span></div>}
        {tab === 'services' && !loading && visibleItems.length > 0 && <div className="hidden grid-cols-[minmax(220px,1fr)_minmax(220px,.9fr)_120px_120px_130px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 xl:grid"><span>Dịch vụ</span><span>Trung tâm</span><span>Giá bán</span><span>Tồn kho</span><span className="text-right">Xử lý</span></div>}
        {tab === 'reviews' && !loading && visibleItems.length > 0 && <div className="hidden grid-cols-[minmax(180px,.8fr)_minmax(260px,1.3fr)_minmax(180px,.8fr)_100px_130px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 xl:grid"><span>Người đánh giá</span><span>Nội dung</span><span>Sân</span><span>Số sao</span><span className="text-right">Xử lý</span></div>}
        <div className="divide-y divide-slate-100">
          {loading && <div className="py-20 text-center text-sm font-bold text-slate-400">Đang tải hàng chờ...</div>}
          {!loading && !visibleItems.length && <div className="py-20 text-center"><Clock3 className="mx-auto text-slate-300" size={40} /><p className="mt-3 text-lg font-black text-slate-800">Không có nội dung phù hợp</p><p className="mt-1 text-sm font-semibold text-slate-400">Thử đổi bộ lọc hoặc quay lại sau.</p></div>}
          {!loading && visibleItems.map((item) => (
            <article key={item.id} className={`grid gap-4 px-4 py-4 transition hover:bg-blue-50/30 ${tab === 'pitches' ? 'xl:grid-cols-[minmax(220px,.8fr)_minmax(240px,.8fr)_minmax(280px,1.2fr)_150px]' : tab === 'services' ? 'xl:grid-cols-[minmax(220px,1fr)_minmax(220px,.9fr)_120px_120px_130px]' : 'xl:grid-cols-[minmax(180px,.8fr)_minmax(260px,1.3fr)_minmax(180px,.8fr)_100px_130px]'} xl:items-center`}>
              {tab === 'pitches' && <PitchRow item={item as Pitch} />}
              {tab === 'services' && <ServiceRow item={item as Service} />}
              {tab === 'reviews' && <ReviewRow item={item as Review} />}
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {tab !== 'reviews' && status === 'pending' && <button onClick={() => runAction(`/admin/${tab === 'pitches' ? 'pitch-approvals' : 'service-approvals'}/${item.id}/approve`, 'patch', 'Đã duyệt nội dung.')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white hover:bg-emerald-700"><Check size={16} />Duyệt</button>}
                {tab === 'pitches' && status === 'pending' && <button onClick={() => runAction(`/admin/pitch-approvals/${item.id}/reject`, 'patch', 'Đã từ chối sân.')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-50 px-4 text-xs font-black text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100"><X size={16} />Từ chối</button>}
                {(tab === 'services' || tab === 'reviews') && <button onClick={() => runAction(`/admin/${tab === 'services' ? 'service-approvals' : 'reviews'}/${item.id}`, 'delete', 'Đã xóa nội dung.')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-50 px-4 text-xs font-black text-rose-700 ring-1 ring-rose-100 hover:bg-rose-100"><Trash2 size={16} />Xóa</button>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

const PitchRow: React.FC<{ item: Pitch }> = ({ item }) => (
  <>
    <div className="min-w-0">
      <h3 className="truncate text-base font-black text-slate-950">{item.pitchName}</h3>
      <div className="mt-1.5 flex flex-wrap items-center gap-2"><span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">{sport(item.pitchType)}</span><span className="text-xs font-bold text-slate-400">Gửi {date(item.submittedAt)}</span></div>
    </div>
    <div className="min-w-0">
      <p className="flex items-center gap-2 truncate text-sm font-black text-slate-800"><UserRound size={15} className="shrink-0 text-blue-600" />{item.ownerName}</p>
      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.ownerEmail}</p>
    </div>
    <p className="flex min-w-0 items-start gap-2 text-sm font-semibold leading-5 text-slate-600"><MapPin size={15} className="mt-0.5 shrink-0 text-rose-500" /><span className="line-clamp-2">{item.address}</span></p>
  </>
);

const ServiceRow: React.FC<{ item: Service }> = ({ item }) => (
  <>
    <div className="min-w-0"><h3 className="truncate text-base font-black text-slate-950">{item.name}</h3><p className="mt-1 text-xs font-bold text-slate-400">{item.status === 'approved' ? 'Đang bán' : 'Chờ duyệt'}</p></div>
    <p className="truncate text-sm font-bold text-slate-600">{item.sportCenterName}</p>
    <p className="text-sm font-black text-emerald-700">{money(item.price)}</p>
    <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${item.stockQuantity > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{item.stockQuantity} sản phẩm</span>
  </>
);

const ReviewRow: React.FC<{ item: Review }> = ({ item }) => (
  <>
    <div className="min-w-0"><p className="truncate text-sm font-black text-slate-950">{item.userName}</p><p className="mt-1 truncate text-xs font-semibold text-slate-400">{item.userEmail}</p></div>
    <div className="min-w-0"><p className="line-clamp-2 text-sm font-semibold text-slate-700">{item.comment || 'Không có nhận xét.'}</p>{item.ownerReply && <p className="mt-1 truncate text-xs font-bold text-blue-600">Đã có phản hồi</p>}</div>
    <div className="min-w-0"><p className="truncate text-sm font-black text-slate-700">{sport(item.pitchType)}</p><p className="mt-1 truncate text-xs font-semibold text-slate-400">{item.pitchName} · {date(item.createdAt)}</p></div>
    <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">{item.rating}/5</span>
  </>
);

export default ContentModeration;
