import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  EyeOff,
  Filter,
  Loader2,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Store,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import api, { API_BASE_URL } from '../../../services/api';

type Tab = 'pitches' | 'services' | 'reviews';
type Pitch = { id: string; pitchName: string; ownerName: string; ownerEmail: string; pitchType: string; address: string; submittedAt: string; status: string; imageUrl?: string | null };
type Service = { id: string; name: string; price: number; stockQuantity: number; sportCenterName: string; status: string; createdAt?: string; imageUrl?: string | null };
type Review = { id: string; rating: number; comment?: string; ownerReply?: string; userName: string; userEmail: string; pitchName: string; pitchType: string; sportCenterName: string; createdAt: string };

const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const date = (value?: string) => {
  if (!value) return 'Chưa rõ ngày';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('vi-VN');
};

const sport = (value?: string) =>
  ({
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

const normalize = (value?: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const statusLabel = (value?: string) => {
  const status = String(value || '').toLowerCase();
  if (status.includes('pending')) return 'Chờ duyệt';
  if (status.includes('approved') || status.includes('active')) return 'Đã duyệt';
  if (status.includes('hidden') || status.includes('inactive')) return 'Tạm ẩn';
  if (status.includes('reject')) return 'Từ chối';
  return 'Khác';
};

const statusClass = (value?: string) => {
  const status = String(value || '').toLowerCase();
  if (status.includes('pending')) return 'border-amber-100 bg-amber-50 text-amber-700';
  if (status.includes('approved') || status.includes('active')) return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  if (status.includes('hidden') || status.includes('inactive')) return 'border-slate-200 bg-slate-100 text-slate-600';
  if (status.includes('reject')) return 'border-red-100 bg-red-50 text-red-600';
  return 'border-slate-200 bg-slate-100 text-slate-600';
};

const resolveImageUrl = (value?: string | null) => {
  const imageUrl = String(value || '').trim();
  if (!imageUrl || imageUrl.startsWith('blob:')) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) {
    return imageUrl.replace('http://localhost:5164', 'http://127.0.0.1:5164');
  }

  return `${API_BASE_URL.replace('/api/v1', '').replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`;
};

const unwrapItems = <T,>(response: unknown): T[] => {
  const raw = (response as { data?: unknown })?.data ?? response;
  const data = (raw as { data?: unknown })?.data ?? raw;

  if (Array.isArray((data as { items?: T[] })?.items)) return (data as { items: T[] }).items;
  if (Array.isArray((raw as { items?: T[] })?.items)) return (raw as { items: T[] }).items;
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(raw)) return raw as T[];

  return [];
};

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
        setItems(unwrapItems<Pitch>(result));
      } else if (tab === 'services') {
        const result = await api.get('/admin/service-approvals', { params: { status, search: search || undefined } }) as Service[];
        setItems(unwrapItems<Service>(result));
      } else {
        const result = await api.get('/admin/reviews', { params: { search: search || undefined, rating: rating || undefined, pageSize: 60 } }) as any;
        setItems(unwrapItems<Review>(result));
      }
    } catch (error) {
      console.error('Content moderation: failed to load data', error);
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

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => tab === 'services' ? item.sportCenterName : item.pitchType).filter(Boolean))),
    [items, tab],
  );

  const visibleItems = useMemo(() => {
    const keyword = normalize(search);
    const result = items.filter((item) => {
      const text =
        tab === 'pitches'
          ? [item.pitchName, item.ownerName, item.ownerEmail, item.address]
          : tab === 'services'
            ? [item.name, item.sportCenterName]
            : [item.userName, item.comment, item.pitchName, item.sportCenterName];

      if (keyword && !normalize(text.join(' ')).includes(keyword)) return false;
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

  const stats = useMemo(() => {
    const pendingCount = tab !== 'reviews' && status === 'pending' ? visibleItems.length : 0;
    const lowReviews = tab === 'reviews' ? visibleItems.filter((item: Review) => item.rating <= 3).length : 0;
    const outOfStock = tab === 'services' ? visibleItems.filter((item: Service) => item.stockQuantity <= 0).length : 0;
    return { visible: visibleItems.length, pending: pendingCount, lowReviews, outOfStock, total: items.length };
  }, [visibleItems, items, status, tab]);

  const tabs = [
    { id: 'pitches', label: 'Sân mới', icon: Store, desc: 'Duyệt sân trước khi hiển thị', tone: 'text-blue-600 bg-blue-50' },
    { id: 'services', label: 'Dịch vụ', icon: PackageCheck, desc: 'Duyệt dịch vụ bán kèm', tone: 'text-emerald-600 bg-emerald-50' },
    { id: 'reviews', label: 'Đánh giá', icon: Star, desc: 'Theo dõi đánh giá vi phạm', tone: 'text-amber-600 bg-amber-50' },
  ] as const;

  const recommendations = [
    {
      title: tab === 'reviews' ? `${stats.lowReviews} đánh giá sao thấp` : `${stats.pending} nội dung chờ duyệt`,
      desc:
        tab === 'reviews'
          ? 'Ưu tiên kiểm tra đánh giá 1-3 sao và nội dung phản hồi của chủ sân.'
          : 'Nên xử lý nội dung chờ duyệt trong ngày để không ảnh hưởng việc hiển thị.',
      show: tab === 'reviews' ? stats.lowReviews > 0 : stats.pending > 0,
      icon: AlertCircle,
      tone: 'text-amber-600 bg-amber-50',
    },
    {
      title: tab === 'services' ? `${stats.outOfStock} dịch vụ hết hàng` : 'Kiểm tra thông tin trước khi duyệt',
      desc:
        tab === 'services'
          ? 'Dịch vụ hết hàng không nên hiển thị nổi bật cho khách khi đặt sân.'
          : 'Đối chiếu tên sân, bộ môn, chủ sân và địa chỉ trước khi công khai.',
      show: tab === 'services' ? stats.outOfStock > 0 : true,
      icon: ShieldCheck,
      tone: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Đúng phạm vi admin',
      desc: 'Admin chỉ kiểm duyệt nội dung, không thay đổi giá bán, tồn kho hay hoạt động kinh doanh của chủ sân.',
      show: true,
      icon: CheckCircle2,
      tone: 'text-emerald-600 bg-emerald-50',
    },
  ].filter((item) => item.show);

  return (
    <main className="mx-auto max-w-350 space-y-6 pb-16">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">KIỂM DUYỆT NỘI DUNG</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Trung tâm kiểm duyệt</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Kiểm tra sân, dịch vụ và đánh giá do người dùng hoặc chủ sân tạo trước khi nội dung ảnh hưởng đến khách hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ShieldCheck} label="Đang hiển thị" value={stats.visible} note="Theo bộ lọc hiện tại" tone="text-blue-600 bg-blue-50" />
        <KpiCard icon={Clock3} label="Chờ xử lý" value={stats.pending} note="Cần admin duyệt" tone="text-amber-600 bg-amber-50" />
        <KpiCard icon={Star} label="Sao thấp" value={stats.lowReviews} note="Đánh giá cần xem" tone="text-red-600 bg-red-50" />
        <KpiCard icon={PackageCheck} label="Tổng dữ liệu" value={stats.total} note="Theo nhóm đang chọn" tone="text-emerald-600 bg-emerald-50" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Nhóm kiểm duyệt</h2>
            <p className="text-sm font-semibold text-slate-500">Chọn loại nội dung cần admin rà soát.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {tabs.map(({ id, label, icon: Icon, desc, tone }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id);
                  setSearch('');
                  setCategory('');
                  setStock('');
                  setRating('');
                  setStatus('pending');
                }}
                className={`rounded-lg border p-4 text-left transition ${
                  tab === id ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                <span className={`mb-3 grid h-10 w-10 place-items-center rounded-lg ${tone}`}>
                  <Icon size={18} />
                </span>
                <p className="text-sm font-black text-slate-950">{label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">KHUYẾN NGHỊ</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Vận hành kiểm duyệt</h2>
          </div>

          <div className="space-y-3">
            {recommendations.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 rounded-lg bg-slate-50 p-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.tone}`}>
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-700">
          <Filter size={18} className="text-blue-600" />
          Bộ lọc kiểm duyệt
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {tab !== 'reviews' && (
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
              <option value="pending">Đang chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="hidden">Tạm ẩn</option>
            </select>
          )}

          {tab === 'reviews' && (
            <select value={rating} onChange={(event) => setRating(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
              <option value="">Tất cả đánh giá</option>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} sao</option>)}
            </select>
          )}

          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
            <option value="">{tab === 'services' ? 'Tất cả trung tâm' : 'Tất cả bộ môn'}</option>
            {categories.map((value) => <option key={value} value={value}>{tab === 'services' ? value : sport(value)}</option>)}
          </select>

          {tab === 'services' && (
            <select value={stock} onChange={(event) => setStock(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
              <option value="">Mọi tồn kho</option>
              <option value="available">Còn hàng</option>
              <option value="empty">Hết hàng</option>
            </select>
          )}

          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
            <option value="newest">Mới nhất</option>
            <option value="name">Tên A-Z</option>
            {tab === 'services' && <option value="priceDesc">Giá cao nhất</option>}
            {tab === 'reviews' && <option value="ratingAsc">Sao thấp nhất</option>}
          </select>

          <label className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, sân, nội dung..." className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
          </label>
        </div>
      </section>

      {message && <section className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</section>}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{tab === 'pitches' ? 'Danh sách sân cần kiểm duyệt' : tab === 'services' ? 'Danh sách dịch vụ' : 'Danh sách đánh giá'}</h2>
            <p className="text-sm font-semibold text-slate-500">{visibleItems.length} nội dung đang hiển thị</p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{statusLabel(tab === 'reviews' ? 'approved' : status)}</span>
        </div>

        {tab === 'pitches' && !loading && visibleItems.length > 0 && <HeaderGrid columns="xl:grid-cols-[1.05fr_0.9fr_1.25fr_150px]" labels={['Sân và bộ môn', 'Chủ sân', 'Địa chỉ', 'Xử lý']} />}
        {tab === 'services' && !loading && visibleItems.length > 0 && <HeaderGrid columns="xl:grid-cols-[1fr_0.9fr_130px_130px_140px]" labels={['Dịch vụ', 'Trung tâm', 'Giá bán', 'Tồn kho', 'Xử lý']} />}
        {tab === 'reviews' && !loading && visibleItems.length > 0 && <HeaderGrid columns="xl:grid-cols-[0.8fr_1.25fr_0.9fr_100px_130px]" labels={['Người đánh giá', 'Nội dung', 'Sân', 'Số sao', 'Xử lý']} />}

        <div className="divide-y divide-slate-100">
          {loading && (
            <div className="flex min-h-80 items-center justify-center gap-3 text-sm font-bold text-slate-400">
              <Loader2 size={20} className="animate-spin text-blue-600" />
              Đang tải dữ liệu kiểm duyệt...
            </div>
          )}

          {!loading && !visibleItems.length && (
            <div className="py-20 text-center">
              <Clock3 className="mx-auto text-slate-300" size={42} />
              <p className="mt-3 text-lg font-black text-slate-800">Không có nội dung phù hợp</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">Thử đổi bộ lọc hoặc quay lại sau.</p>
            </div>
          )}

          {!loading && visibleItems.map((item) => (
            <article key={item.id} className={`grid gap-4 px-5 py-4 transition hover:bg-slate-50 ${tab === 'pitches' ? 'xl:grid-cols-[1.05fr_0.9fr_1.25fr_150px]' : tab === 'services' ? 'xl:grid-cols-[1fr_0.9fr_130px_130px_140px]' : 'xl:grid-cols-[0.8fr_1.25fr_0.9fr_100px_130px]'} xl:items-center`}>
              {tab === 'pitches' && <PitchRow item={item as Pitch} />}
              {tab === 'services' && <ServiceRow item={item as Service} />}
              {tab === 'reviews' && <ReviewRow item={item as Review} />}

              <div className="flex flex-wrap gap-2 xl:justify-end">
                {tab !== 'reviews' && (status === 'pending' || status === 'hidden') && (
                  <button type="button" onClick={() => runAction(`/admin/${tab === 'pitches' ? 'pitch-approvals' : 'service-approvals'}/${item.id}/approve`, 'patch', status === 'hidden' ? 'Đã kích hoạt lại nội dung.' : 'Đã duyệt nội dung.')} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100">
                    <Check size={15} />
                    {status === 'hidden' ? 'Duyệt lại' : 'Duyệt'}
                  </button>
                )}

                {tab === 'pitches' && status === 'pending' && (
                  <button type="button" onClick={() => runAction(`/admin/pitch-approvals/${item.id}/reject`, 'patch', 'Đã từ chối sân.')} className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-50 px-3 text-xs font-black text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100">
                    <X size={15} />
                    Từ chối
                  </button>
                )}

                {tab !== 'reviews' && status === 'approved' && (
                  <button type="button" onClick={() => runAction(`/admin/${tab === 'pitches' ? 'pitch-approvals' : 'service-approvals'}/${item.id}/hide`, 'patch', 'Đã tạm ẩn nội dung.')} className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200">
                    <EyeOff size={15} />
                    Tạm ẩn
                  </button>
                )}

                {(tab === 'services' || tab === 'reviews') && (
                  <button type="button" onClick={() => runAction(`/admin/${tab === 'services' ? 'service-approvals' : 'reviews'}/${item.id}`, 'delete', 'Đã xóa nội dung.')} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-50 px-3 text-xs font-black text-red-600 ring-1 ring-red-100 hover:bg-red-100">
                    <Trash2 size={15} />
                    Xóa
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

const KpiCard = ({ icon: Icon, label, value, note, tone }: { icon: React.ElementType; label: string; value: number; note: string; tone: string }) => (
  <article className="rounded-lg border border-slate-200 bg-white p-4 transition hover:shadow-md">
    <div className={`mb-3 w-fit rounded-lg p-2 ${tone}`}>
      <Icon size={20} />
    </div>
    <p className="text-xs font-semibold text-slate-600">{label}</p>
    <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    <p className="mt-2 text-xs font-semibold text-slate-400">{note}</p>
  </article>
);

const HeaderGrid = ({ columns, labels }: { columns: string; labels: string[] }) => (
  <div className={`hidden ${columns} gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 xl:grid`}>
    {labels.map((label, index) => (
      <span key={label} className={index === labels.length - 1 ? 'text-right' : ''}>
        {label}
      </span>
    ))}
  </div>
);

const PitchRow: React.FC<{ item: Pitch }> = ({ item }) => {
  const imageUrl = resolveImageUrl(item.imageUrl);

  return (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-14 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
          {imageUrl ? (
            <img src={imageUrl} alt={item.pitchName} className="h-full w-full object-cover" />
          ) : (
            <Store size={20} className="text-slate-300" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-slate-950">{item.pitchName}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">{sport(item.pitchType)}</span>
            <span className={`rounded-lg border px-2 py-1 text-[11px] font-black ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
            <span className="text-xs font-bold text-slate-400">Gửi {date(item.submittedAt)}</span>
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate text-sm font-black text-slate-800"><UserRound size={15} className="shrink-0 text-blue-600" />{item.ownerName}</p>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.ownerEmail}</p>
      </div>
      <p className="flex min-w-0 items-start gap-2 text-sm font-semibold leading-5 text-slate-600"><MapPin size={15} className="mt-0.5 shrink-0 text-red-500" /><span className="line-clamp-2">{item.address}</span></p>
    </>
  );
};

const ServiceRow: React.FC<{ item: Service }> = ({ item }) => {
  const imageUrl = resolveImageUrl(item.imageUrl);

  return (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
          {imageUrl ? (
            <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <PackageCheck size={20} className="text-slate-300" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-slate-950">{item.name}</h3>
          <p className="mt-1 text-xs font-bold text-slate-400">{statusLabel(item.status)}</p>
        </div>
      </div>
      <p className="truncate text-sm font-bold text-slate-600">{item.sportCenterName}</p>
      <p className="text-sm font-black text-emerald-700">{money(item.price)}</p>
      <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${item.stockQuantity > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{item.stockQuantity > 0 ? `${item.stockQuantity} sản phẩm` : 'Hết hàng'}</span>
    </>
  );
};

const ReviewRow: React.FC<{ item: Review }> = ({ item }) => (
  <>
    <div className="min-w-0"><p className="truncate text-sm font-black text-slate-950">{item.userName}</p><p className="mt-1 truncate text-xs font-semibold text-slate-400">{item.userEmail}</p></div>
    <div className="min-w-0"><p className="line-clamp-2 text-sm font-semibold text-slate-700">{item.comment || 'Không có nhận xét.'}</p>{item.ownerReply && <p className="mt-1 truncate text-xs font-bold text-blue-600">Đã có phản hồi</p>}</div>
    <div className="min-w-0"><p className="truncate text-sm font-black text-slate-700">{sport(item.pitchType)}</p><p className="mt-1 truncate text-xs font-semibold text-slate-400">{item.pitchName} · {date(item.createdAt)}</p></div>
    <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${item.rating <= 3 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{item.rating}/5</span>
  </>
);

export default ContentModeration;
