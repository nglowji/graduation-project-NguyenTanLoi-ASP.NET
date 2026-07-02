import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
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

type ApprovalStatus = 'pending' | 'approved';

const formatDate = (value?: string) => {
  if (!value) return 'Chưa rõ ngày';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa rõ ngày' : date.toLocaleDateString('vi-VN');
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
  if (text.length <= 78) return text || 'Chưa có địa chỉ';
  return `${text.slice(0, 78)}...`;
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
  if (value.includes('pending')) return 'bg-amber-100 text-amber-700';
  if (value.includes('approved')) return 'bg-emerald-100 text-emerald-700';
  if (value.includes('reject')) return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
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

const Approvals: React.FC = () => {
  const [pending, setPending] = useState<OwnerRegistration[]>([]);
  const [approved, setApproved] = useState<OwnerRegistration[]>([]);
  const [status, setStatus] = useState<ApprovalStatus>('pending');
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
    void load();
  }, []);

  const items = status === 'pending' ? pending : approved;

  const filtered = useMemo(() => {
    const keyword = normalize(search);
    if (!keyword) return items;

    return items.filter((item) =>
      [item.businessName, item.applicantName, item.applicantEmail, item.applicantPhone, item.address].some((value) =>
        normalize(value).includes(keyword),
      ),
    );
  }, [items, search]);

  const totalProfiles = pending.length + approved.length;
  const approvalRate = totalProfiles ? Math.round((approved.length / totalProfiles) * 100) : 0;

  const recentPending = useMemo(
    () =>
      [...pending]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 4),
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

  const kpis = [
    {
      label: 'Chờ xét duyệt',
      value: pending.length,
      detail: 'Cần kiểm tra',
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
      detail: 'Tất cả đăng ký',
      icon: Building2,
      color: 'text-blue-600 bg-blue-50',
      onClick: () => setStatus('pending'),
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
      desc: 'Nên xử lý hồ sơ trong ngày để chủ sân không phải chờ lâu.',
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
    <div className="mx-auto max-w-[1400px] space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">QUẢN LÝ CHỦ SÂN</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Duyệt hồ sơ chủ sân</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Kiểm tra hồ sơ đăng ký trước khi nâng cấp tài khoản thành chủ sân. Admin chỉ xét duyệt quyền tham gia nền tảng, không can thiệp vào kinh doanh của chủ sân.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

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

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Khuyến nghị vận hành</h2>
          <p className="text-sm text-slate-600">Gợi ý giúp admin xử lý hồ sơ nhất quán và đúng phạm vi quyền hạn.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {recommendations.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50 hover:shadow-sm"
              >
                <div className="flex gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${item.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {[
              { id: 'pending', label: 'Chờ xét duyệt', count: pending.length },
              { id: 'approved', label: 'Đã nâng cấp', count: approved.length },
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

          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo cơ sở, người đăng ký, email, SĐT hoặc địa chỉ..."
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <span className="px-2 text-xs font-bold text-slate-400">{filtered.length} hồ sơ phù hợp</span>
        </div>
      </section>

      {message && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {message}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {status === 'pending' ? 'Hồ sơ chờ xét duyệt' : 'Hồ sơ đã nâng cấp'}
          </h2>
          <p className="text-sm text-slate-600">{filtered.length} hồ sơ đang hiển thị theo bộ lọc hiện tại</p>
        </div>

        <div className="hidden grid-cols-[1fr_1fr_1.15fr_130px_110px] gap-4 border-b border-slate-100 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 lg:grid">
          <span>Cơ sở</span>
          <span>Người đăng ký</span>
          <span>Liên hệ</span>
          <span>Trạng thái</span>
          <span className="text-right">Thao tác</span>
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
              <article
                key={item.id}
                className="grid gap-4 px-5 py-4 transition hover:bg-slate-50 lg:grid-cols-[1fr_1fr_1.15fr_130px_110px] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{item.businessName}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Gửi ngày {formatDate(item.submittedAt)}</p>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
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
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>

                <div className="flex justify-start gap-1 lg:justify-end">
                  <button
                    type="button"
                    title="Xem chi tiết"
                    aria-label="Xem chi tiết"
                    onClick={() => setSelected(item)}
                    className="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Eye size={17} />
                    <span className="pointer-events-none absolute -top-9 right-0 z-20 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
                      Xem chi tiết
                    </span>
                  </button>

                  {String(item.status).toLowerCase().includes('pending') && (
                    <>
                      <button
                        type="button"
                        title="Từ chối hồ sơ"
                        aria-label="Từ chối hồ sơ"
                        disabled={processingId === item.id}
                        onClick={() => decide(item, 'reject')}
                        className="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {processingId === item.id ? <Loader2 className="animate-spin" size={17} /> : <XCircle size={17} />}
                        <span className="pointer-events-none absolute -top-9 right-0 z-20 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
                          Từ chối
                        </span>
                      </button>

                      <button
                        type="button"
                        title="Duyệt hồ sơ"
                        aria-label="Duyệt hồ sơ"
                        disabled={processingId === item.id}
                        onClick={() => decide(item, 'approve')}
                        className="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                      >
                        {processingId === item.id ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
                        <span className="pointer-events-none absolute -top-9 right-0 z-20 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
                          Duyệt hồ sơ
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex cursor-default items-end justify-end bg-slate-950/35 p-3 text-left backdrop-blur-sm sm:p-5"
          onClick={() => setSelected(null)}
        >
          <aside
            className="h-full w-full max-w-lg cursor-auto overflow-y-auto rounded-lg bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">Hồ sơ đăng ký chủ sân</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{selected.businessName}</h2>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusColor(selected.status)}`}>
                  {statusLabel(selected.status)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { icon: UserRound, label: 'Người đăng ký', value: selected.applicantName },
                { icon: Mail, label: 'Email', value: selected.applicantEmail },
                { icon: Phone, label: 'Số điện thoại', value: selected.applicantPhone || 'Chưa cập nhật' },
                { icon: MapPin, label: 'Địa chỉ cơ sở', value: selected.address },
                { icon: Clock3, label: 'Ngày gửi hồ sơ', value: formatDate(selected.submittedAt) },
              ].map((row) => {
                const Icon = row.icon;

                return (
                  <div key={row.label} className="flex gap-3 rounded-lg bg-slate-50 p-4">
                    <Icon size={18} className="mt-0.5 shrink-0 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-500">{row.label}</p>
                      <p className="mt-1 text-sm font-bold leading-6 text-slate-700">{row.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {String(selected.status).toLowerCase().includes('pending') && (
              <div className="mt-6 grid grid-cols-2 gap-3">
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
        </button>
      )}
    </div>
  );
};

export default Approvals;
