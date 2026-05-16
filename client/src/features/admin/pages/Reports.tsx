import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Download,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react';
import api from '../../../services/api';

type CommissionTransaction = {
  bookingId: string;
  bookingDate: string;
  customerName: string;
  customerEmail: string;
  pitchName: string;
  pitchType: string;
  sportCenterName: string;
  ownerName: string;
  ownerEmail: string;
  grossAmount: number;
  commission: number;
  status: string;
};

type OwnerCommission = {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  grossRevenue: number;
  commission: number;
  bookings: number;
  uniqueCustomers: number;
};

type RevenueReport = {
  grossRevenue: number;
  platformCommission: number;
  ownerRevenue: number;
  commissionRate: number;
  totalBookings: number;
  completedBookings: number;
  confirmedBookings: number;
  uniqueCustomers: number;
  activeOwners: number;
  commissionGrowth: number;
  owners: OwnerCommission[];
  transactions: CommissionTransaction[];
};

const formatMoney = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

const formatDate = (value?: string) => {
  if (!value) return '--/--/----';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
};

const Reports: React.FC = () => {
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/admin/revenue', { params: { days } }) as RevenueReport;
      setReport(res);
    } catch {
      setError('Không thể tải báo cáo hoa hồng. Kiểm tra quyền admin và server API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [days]);

  const filteredTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const rows = report?.transactions ?? [];
    if (!keyword) return rows;

    return rows.filter((item) =>
      [
        item.customerName,
        item.customerEmail,
        item.pitchName,
        item.sportCenterName,
        item.ownerName,
        item.ownerEmail,
        item.pitchType,
      ].some((value) => value.toLowerCase().includes(keyword))
    );
  }, [report, search]);

  const strongestOwner = report?.owners?.[0];

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={42} />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tổng hợp báo cáo hoa hồng</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Commission report</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Báo cáo thống kê hoa hồng</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-500">
            Báo cáo truy vết từng booking: người dùng nào đặt sân nào, thuộc trung tâm nào, của chủ sân nào và nền tảng nhận bao nhiêu hoa hồng.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {[7, 30, 90].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                className={`h-10 rounded-lg px-4 text-xs font-black transition ${
                  days === value ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'
                }`}
              >
                {value} ngày
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={fetchReport}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            <RefreshCw size={18} />
            Làm mới
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tổng hoa hồng', value: formatMoney(report?.platformCommission), detail: `${report?.totalBookings || 0} booking tính phí`, icon: <Wallet size={22} />, tone: 'text-indigo-600' },
          { label: 'Khách đã đặt', value: Number(report?.uniqueCustomers || 0).toLocaleString('vi-VN'), detail: 'Không trùng người dùng', icon: <UserRound size={22} />, tone: 'text-blue-600' },
          { label: 'Chủ sân có doanh thu', value: Number(report?.activeOwners || 0).toLocaleString('vi-VN'), detail: strongestOwner ? `Cao nhất: ${strongestOwner.ownerName}` : 'Chưa phát sinh', icon: <ShieldCheck size={22} />, tone: 'text-emerald-600' },
          { label: 'Tỷ lệ hoa hồng', value: `${Math.round((report?.commissionRate || 0) * 100)}%`, detail: `${report?.commissionGrowth || 0}% so với kỳ trước`, icon: <CalendarDays size={22} />, tone: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 ${item.tone} dark:bg-slate-800`}>
              {item.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{item.value}</p>
            <p className="mt-1 truncate text-xs font-bold text-slate-400">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Chi tiết nhận hoa hồng</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">Nguồn dữ liệu thật từ `/dashboard/admin/revenue`.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm người đặt, sân, chủ sân..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none focus:border-indigo-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:w-[320px]"
                />
              </div>
              <button className="grid h-11 w-11 place-items-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800" title="Xuất báo cáo">
                <Download size={18} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Người đặt</th>
                  <th className="px-4 py-3">Sân đặt</th>
                  <th className="px-4 py-3">Chủ sân</th>
                  <th className="px-4 py-3 text-right">Tiền sân</th>
                  <th className="px-4 py-3 text-right">Hoa hồng nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((item) => (
                  <tr key={item.bookingId} className="text-sm">
                    <td className="px-4 py-4 font-bold text-slate-500">{formatDate(item.bookingDate)}</td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950 dark:text-white">{item.customerName}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{item.customerEmail || 'Chưa có email'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-700 dark:text-slate-200">{item.pitchName}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{item.sportCenterName} · {item.pitchType}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-700 dark:text-slate-200">{item.ownerName}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{item.ownerEmail || 'Chưa có email'}</p>
                    </td>
                    <td className="px-4 py-4 text-right font-black text-slate-700 dark:text-slate-200">{formatMoney(item.grossAmount)}</td>
                    <td className="px-4 py-4 text-right font-black text-indigo-600">{formatMoney(item.commission)}</td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm font-bold text-slate-400">Không có giao dịch phù hợp bộ lọc.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Đối soát theo chủ sân</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">Tổng hợp từ các dòng booking trong kỳ.</p>
            <div className="mt-5 space-y-4">
              {(report?.owners ?? []).slice(0, 8).map((owner) => {
                const max = Math.max(...(report?.owners ?? []).map((item) => item.commission), 1);
                return (
                  <div key={owner.ownerId}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-700 dark:text-slate-200">{owner.ownerName}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{owner.bookings} booking</p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-indigo-600">{formatMoney(owner.commission)}</p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-indigo-600" style={{ width: `${(owner.commission / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              {(report?.owners ?? []).length === 0 && <div className="py-8 text-center text-sm font-bold text-slate-400">Chưa có dữ liệu đối soát.</div>}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5 text-white dark:bg-indigo-950">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Công thức</p>
            <p className="mt-4 text-3xl font-black">{Math.round((report?.commissionRate || 0) * 100)}%</p>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              Hoa hồng nền tảng = tiền sân của booking hợp lệ nhân với tỷ lệ hoa hồng. Booking hợp lệ gồm trạng thái đã xác nhận và hoàn thành.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Reports;
