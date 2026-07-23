import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  X,
  XCircle,
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

type ApprovalStatus = 'pending' | 'approved' | 'all';

const formatDate = (value?: string) => {
  if (!value) return 'Chưa rõ ngày';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa rõ ngày' : date.toLocaleDateString('vi-VN');
};

const formatTimeAgo = (value: string | undefined, now: number) => {
  if (!value) return 'Chưa rõ thời gian';

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 'Chưa rõ thời gian';

  const diff = Math.max((now || time) - time, 0);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${Math.max(minutes, 1)} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
};

const initials = (value?: string) =>
  String(value || 'C')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';

const shortAddress = (value?: string) => {
  const text = String(value || '').trim();
  if (text.length <= 90) return text || 'Chưa có địa chỉ';
  return `${text.slice(0, 90)}...`;
};

const normalize = (value?: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const statusLabel = (status?: string) => {
  const value = String(status || '').toLowerCase();

  if (value.includes('pending')) return 'Chờ duyệt';
  if (value.includes('approved')) return 'Đã duyệt';
  if (value.includes('reject')) return 'Từ chối';

  return 'Khác';
};

const statusColor = (status?: string) => {
  const value = String(status || '').toLowerCase();

  if (value.includes('pending')) return 'border-amber-100 bg-amber-50 text-amber-700';
  if (value.includes('approved')) return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  if (value.includes('reject')) return 'border-red-100 bg-red-50 text-red-600';

  return 'border-slate-200 bg-slate-100 text-slate-600';
};

const unwrapApprovals = (response: any): OwnerRegistration[] => {
  const raw = response?.data ?? response;
  const data = raw?.data ?? raw;

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(data)) return data;
  if (Array.isArray(raw)) return raw;

  return [];
};

const isPendingStatus = (status?: string) => String(status || '').toLowerCase().includes('pending');

const Approvals: React.FC = () => {
  const [pending, setPending] = useState<OwnerRegistration[]>([]);
  const [approved, setApproved] = useState<OwnerRegistration[]>([]);
  const [status, setStatus] = useState<ApprovalStatus>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OwnerRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState('');
  const [message, setMessage] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [now, setNow] = useState(0);

  const load = async () => {
    setLoading(true);
    setMessage('');

    try {
      const [pendingRes, approvedRes] = await Promise.all([
        api.get('/admin/owner-approvals', { params: { status: 'pending' } }),
        api.get('/admin/owner-approvals', { params: { status: 'approved' } }),
      ]);

      setPending(unwrapApprovals(pendingRes));
      setApproved(unwrapApprovals(approvedRes));
    } catch {
      setPending([]);
      setApproved([]);
      setMessage('Không thể tải hồ sơ đăng ký chủ sân.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNow(new Date().getTime());
    void load();
  }, []);

  const allItems = useMemo(() => [...pending, ...approved], [pending, approved]);
  const items = status === 'pending' ? pending : status === 'approved' ? approved : allItems;

  const filtered = useMemo(() => {
    const keyword = normalize(search);

    return items
      .filter((item) => {
        if (!keyword) return true;

        return [item.businessName, item.applicantName, item.applicantEmail, item.applicantPhone, item.address].some((value) =>
          normalize(value).includes(keyword),
        );
      })
      .sort((a, b) => {
        if (sortBy === 'name') return String(a.businessName || '').localeCompare(String(b.businessName || ''), 'vi');
        if (sortBy === 'oldest') return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }, [items, search, sortBy]);

  const totalProfiles = pending.length + approved.length;
  const approvalRate = totalProfiles ? Math.round((approved.length / totalProfiles) * 100) : 0;

  const oldPendingCount = useMemo(
    () =>
      pending.filter((item) => {
        const submittedTime = new Date(item.submittedAt).getTime();
        if (Number.isNaN(submittedTime)) return false;

        return now > 0 && now - submittedTime > 1000 * 60 * 60 * 24 * 2;
      }).length,
    [now, pending],
  );

  const recentPending = useMemo(
    () => [...pending].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 4),
    [pending],
  );

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

  const exportList = () => {
    const rows = filtered.map((item) => ({
      businessName: item.businessName,
      applicantName: item.applicantName,
      applicantEmail: item.applicantEmail,
      applicantPhone: item.applicantPhone || '',
      address: item.address,
      submittedAt: formatDate(item.submittedAt),
      status: statusLabel(item.status),
    }));

    const content = JSON.stringify(rows, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'owner-approvals.json';
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const kpis = [
    {
      label: 'Chờ duyệt',
      value: pending.length,
      detail: 'Cần xử lý',
      icon: Clock3,
      color: 'text-amber-600 bg-amber-50',
      onClick: () => setStatus('pending'),
    },
    {
      label: 'Đã duyệt',
      value: approved.length,
      detail: 'Đã nâng cấp',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
      onClick: () => setStatus('approved'),
    },
    {
      label: 'Tổng hồ sơ',
      value: totalProfiles,
      detail: 'Toàn hệ thống',
      icon: Building2,
      color: 'text-blue-600 bg-blue-50',
      onClick: () => setStatus('all'),
    },
    {
      label: 'Tỷ lệ duyệt',
      value: `${approvalRate}%`,
      detail: 'Hồ sơ hợp lệ',
      icon: FileCheck2,
      color: 'text-violet-600 bg-violet-50',
      onClick: () => setStatus('approved'),
    },
  ];

  const recommendations = [
    {
      show: pending.length > 0,
      icon: AlertCircle,
      title: `${pending.length} hồ sơ đang chờ duyệt`,
      desc: oldPendingCount > 0 ? `${oldPendingCount} hồ sơ đã chờ hơn 2 ngày, nên ưu tiên xử lý trước.` : 'Nên kiểm tra trong ngày để chủ sân không chờ lâu.',
      color: 'text-amber-600 bg-amber-50',
      action: () => setStatus('pending'),
    },
    {
      show: recentPending.length > 0,
      icon: Clock3,
      title: 'Ưu tiên hồ sơ mới gửi',
      desc: 'Kiểm tra tên cơ sở, người đại diện, email, số điện thoại và địa chỉ trước khi duyệt.',
      color: 'text-blue-600 bg-blue-50',
      action: () => recentPending[0] && setSelected(recentPending[0]),
    },
    {
      show: pending.length === 0,
      icon: CheckCircle2,
      title: 'Không có hồ sơ chờ',
      desc: 'Danh sách đang ổn định. Tiếp tục theo dõi hồ sơ mới phát sinh.',
      color: 'text-emerald-600 bg-emerald-50',
      action: () => setStatus('approved'),
    },
  ].filter((item) => item.show);

  return (
    <main className="mx-auto max-w-350 space-y-6 pb-16">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">QUẢN LÝ CHỦ SÂN</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Hồ sơ chủ sân</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Theo dõi và xét duyệt các trung tâm đăng ký tham gia nền tảng. Admin chỉ kiểm tra quyền tham gia, không can thiệp hoạt động kinh doanh của chủ sân.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={exportList}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Download size={16} />
            Xuất danh sách
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <button
              key={kpi.label}
              type="button"
              onClick={kpi.onClick}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg p-2 ${kpi.color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-400">{kpi.detail}</span>
              </div>

              <p className="text-xs font-semibold text-slate-600">{kpi.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{kpi.value}</p>
            </button>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Khuyến nghị vận hành</h2>
            <p className="text-sm font-semibold text-slate-500">Gợi ý giúp admin xử lý hồ sơ nhất quán và đúng phạm vi quyền hạn.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {recommendations.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.action}
                  className="group flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-4 text-left transition hover:bg-blue-50"
                >
                  <span className="flex gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${item.color}`}>
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-slate-900">{item.title}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.desc}</span>
                    </span>
                  </span>
                  <ArrowRight size={17} className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">QUY TRÌNH</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Luồng xét duyệt</h2>
          </div>

          <div className="space-y-4">
            {[
              { title: 'Chủ sân gửi hồ sơ', desc: 'Cung cấp thông tin cơ sở và người đại diện.' },
              { title: 'Admin kiểm tra', desc: 'Đối chiếu tên, liên hệ, địa chỉ và tính hợp lệ.' },
              { title: 'Duyệt hoặc từ chối', desc: 'Tài khoản được nâng cấp nếu hồ sơ đạt yêu cầu.' },
            ].map((item, index) => (
              <div key={item.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
                    {index + 1}
                  </span>
                  {index < 2 && <span className="mt-2 h-8 w-px bg-slate-200" />}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[auto_minmax(260px,1fr)_180px_auto] lg:items-center">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {[
              { id: 'pending', label: 'Chờ duyệt', count: pending.length },
              { id: 'approved', label: 'Đã duyệt', count: approved.length },
              { id: 'all', label: 'Tất cả', count: totalProfiles },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatus(item.id as ApprovalStatus)}
                className={`flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-bold transition ${
                  status === item.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {item.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${status === item.id ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          <label className="relative min-w-0">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm cơ sở, người đăng ký, email, SĐT hoặc địa chỉ..."
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name">Tên A-Z</option>
          </select>

          <span className="text-sm font-bold text-slate-400">{filtered.length} hồ sơ</span>
        </div>
      </section>

      {message && (
        <section className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {message}
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {status === 'pending' ? 'Hồ sơ chờ xét duyệt' : status === 'approved' ? 'Hồ sơ đã nâng cấp' : 'Tất cả hồ sơ'}
            </h2>
            <p className="text-sm font-semibold text-slate-500">{filtered.length} hồ sơ đang hiển thị theo bộ lọc hiện tại</p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center gap-3 text-sm font-bold text-slate-400">
            <Loader2 size={20} className="animate-spin text-blue-600" />
            Đang tải hồ sơ...
          </div>
        ) : !filtered.length ? (
          <div className="py-20 text-center">
            <Clock3 className="mx-auto text-slate-300" size={42} />
            <p className="mt-3 font-black text-slate-800">Không có hồ sơ phù hợp</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">Danh sách sẽ cập nhật khi có hồ sơ mới.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <article key={item.id} className="grid gap-4 px-5 py-4 transition hover:bg-slate-50 xl:grid-cols-[1.2fr_1fr_1.25fr_130px_120px] xl:items-center">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-black text-blue-700">
                      <Building2 size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{item.businessName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Gửi {formatTimeAgo(item.submittedAt, now)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-black text-slate-700">
                    {initials(item.applicantName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{item.applicantName}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.applicantEmail}</p>
                  </div>
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="flex items-center gap-2 truncate text-xs font-semibold text-slate-600">
                    <Phone size={14} className="text-slate-400" />
                    {item.applicantPhone || 'Chưa cập nhật SĐT'}
                  </p>
                  <p className="flex items-center gap-2 truncate text-xs font-semibold text-slate-500" title={item.address}>
                    <MapPin size={14} className="text-slate-400" />
                    {shortAddress(item.address)}
                  </p>
                </div>

                <div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>

                <div className="flex justify-start gap-1 xl:justify-end">
                  <IconButton label="Xem hồ sơ" onClick={() => setSelected(item)} icon={<Eye size={17} />} />

                  {isPendingStatus(item.status) && (
                    <>
                      <IconButton
                        label="Từ chối"
                        onClick={() => decide(item, 'reject')}
                        icon={processingId === item.id ? <Loader2 className="animate-spin" size={17} /> : <XCircle size={17} />}
                        disabled={processingId === item.id}
                        danger
                      />

                      <IconButton
                        label="Duyệt"
                        onClick={() => decide(item, 'approve')}
                        icon={processingId === item.id ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
                        disabled={processingId === item.id}
                        success
                      />
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex cursor-default items-end justify-end bg-slate-950/35 p-3 text-left backdrop-blur-sm sm:p-5"
          onClick={() => setSelected(null)}
        >
          <aside
            className="h-full w-full max-w-2xl cursor-auto overflow-y-auto rounded-lg bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Hồ sơ đăng ký chủ sân</p>
                  <h2 className="mt-2 truncate text-2xl font-black text-slate-950">{selected.businessName}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor(selected.status)}`}>
                      {statusLabel(selected.status)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                      Gửi ngày {formatDate(selected.submittedAt)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-blue-600 text-xl font-black text-white">
                    {initials(selected.businessName)}
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">{selected.businessName}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{selected.address}</p>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <InfoCard icon={UserRound} title="Người đại diện" value={selected.applicantName} />
                <InfoCard icon={Mail} title="Email" value={selected.applicantEmail} />
                <InfoCard icon={Phone} title="Số điện thoại" value={selected.applicantPhone || 'Chưa cập nhật'} />
                <InfoCard icon={Clock3} title="Ngày gửi hồ sơ" value={formatDate(selected.submittedAt)} />
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-black text-slate-950">Checklist kiểm tra</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Admin nên đối chiếu các thông tin này trước khi duyệt.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    'Tên cơ sở rõ ràng',
                    'Email người đại diện hợp lệ',
                    'Số điện thoại có thể liên hệ',
                    'Địa chỉ cơ sở đầy đủ',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="text-xs font-bold text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-black text-slate-950">Tiến trình xử lý</h3>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Đã gửi hồ sơ', done: true },
                    { title: 'Admin đang kiểm tra', done: true },
                    { title: isPendingStatus(selected.status) ? 'Chờ quyết định' : statusLabel(selected.status), done: !isPendingStatus(selected.status) },
                  ].map((step, index) => (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${step.done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {index + 1}
                        </span>
                        {index < 2 && <span className="mt-2 h-6 w-px bg-slate-200" />}
                      </div>
                      <p className="pt-1 text-sm font-bold text-slate-700">{step.title}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {isPendingStatus(selected.status) && (
              <div className="sticky bottom-0 grid grid-cols-2 gap-3 border-t border-slate-100 bg-white p-5">
                <button
                  type="button"
                  disabled={processingId === selected.id}
                  onClick={() => decide(selected, 'reject')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-red-50 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <XCircle size={18} />
                  Từ chối
                </button>

                <button
                  type="button"
                  disabled={processingId === selected.id}
                  onClick={() => decide(selected, 'approve')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {processingId === selected.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Duyệt hồ sơ
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
};

const IconButton = ({
  icon,
  label,
  onClick,
  disabled,
  danger,
  success,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  success?: boolean;
}) => {
  const color = danger
    ? 'hover:bg-red-50 hover:text-red-600'
    : success
      ? 'hover:bg-emerald-50 hover:text-emerald-600'
      : 'hover:bg-blue-50 hover:text-blue-600';

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition disabled:opacity-50 ${color}`}
    >
      {icon}
      <span className="pointer-events-none absolute -top-9 right-0 z-20 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
        {label}
      </span>
    </button>
  );
};

const InfoCard = ({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
}) => (
  <div className="flex gap-3 rounded-lg bg-slate-50 p-4">
    <Icon size={18} className="mt-0.5 shrink-0 text-blue-600" />
    <div className="min-w-0">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="mt-1 wrap-break-word text-sm font-bold leading-6 text-slate-700">{value}</p>
    </div>
  </div>
);

export default Approvals;
