import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Archive,
  Box,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Eye,
  Filter,
  Image as ImageIcon,
  Loader2,
  Package,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import api from '../../../services/api';

type ServiceItem = {
  id: string;
  name?: string;
  price?: number;
  stockQuantity?: number;
  imageUrl?: string | null;
  isActive?: boolean;
};

const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under50' | '50to100' | 'over100'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'priceAsc' | 'priceDesc' | 'stockAsc' | 'stockDesc'>('name');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stockQuantity: '0',
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/additional-services/my') as any;
      setServices(Array.isArray(res) ? res : []);
    } catch {
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingService(null);
    setFormData({ name: '', price: '', stockQuantity: '0', imageUrl: '', isActive: true });
    setError('');
    setIsDrawerOpen(true);
  };

  const openEdit = (service: ServiceItem) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      price: String(service.price || 0),
      stockQuantity: String(service.stockQuantity || 0),
      imageUrl: service.imageUrl || '',
      isActive: service.isActive ?? true,
    });
    setError('');
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        setError('Vui lòng nhập tên dịch vụ.');
        return;
      }

      const priceValue = Number(formData.price);
      if (!Number.isFinite(priceValue) || priceValue < 0) {
        setError('Giá bán phải là số hợp lệ.');
        return;
      }

      const stockValue = Number(formData.stockQuantity);
      if (!Number.isFinite(stockValue) || stockValue < 0) {
        setError('Tồn kho không được âm.');
        return;
      }

      const payload = {
        name: trimmedName,
        price: priceValue || 0,
        icon: 'service',
        stockQuantity: stockValue || 0,
        imageUrl: formData.imageUrl.trim() || null,
        isActive: formData.isActive,
      };

      if (editingService) {
        await api.put(`/additional-services/${editingService.id}`, payload);
      } else {
        await api.post('/additional-services', payload);
      }

      setIsDrawerOpen(false);
      fetchServices();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu dịch vụ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa dịch vụ này?')) return;
    try {
      await api.delete(`/additional-services/${id}`);
      fetchServices();
    } catch {
      alert('Không thể xóa dịch vụ.');
    }
  };

  const formatMoney = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return services.filter((service) => {
      const nameMatch = !keyword || String(service.name || '').toLowerCase().includes(keyword);
      const isActive = service.isActive !== false;
      const statusMatch = statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive);
      const stock = Number(service.stockQuantity || 0);
      const price = Number(service.price || 0);
      const stockMatch =
        stockFilter === 'all' ||
        (stockFilter === 'in' && stock > 0) ||
        (stockFilter === 'low' && stock > 0 && stock <= 5) ||
        (stockFilter === 'out' && stock <= 0);
      const priceMatch =
        priceFilter === 'all' ||
        (priceFilter === 'under50' && price < 50000) ||
        (priceFilter === '50to100' && price >= 50000 && price <= 100000) ||
        (priceFilter === 'over100' && price > 100000);
      return nameMatch && statusMatch && stockMatch && priceMatch;
    }).sort((a, b) => {
      if (sortBy === 'priceAsc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'priceDesc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'stockAsc') return Number(a.stockQuantity || 0) - Number(b.stockQuantity || 0);
      if (sortBy === 'stockDesc') return Number(b.stockQuantity || 0) - Number(a.stockQuantity || 0);
      return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
    });
  }, [services, search, statusFilter, stockFilter, priceFilter, sortBy]);

  const stats = useMemo(() => {
    const active = services.filter((service) => service.isActive !== false).length;
    const outOfStock = services.filter((service) => Number(service.stockQuantity || 0) <= 0).length;
    const lowStock = services.filter((service) => Number(service.stockQuantity || 0) > 0 && Number(service.stockQuantity || 0) <= 5).length;
    const inventoryValue = services.reduce(
      (sum, service) => sum + Number(service.price || 0) * Number(service.stockQuantity || 0),
      0
    );
    return { total: services.length, active, outOfStock, lowStock, inventoryValue };
  }, [services]);
  const activeFilterCount = [
    statusFilter !== 'all',
    stockFilter !== 'all',
    priceFilter !== 'all',
    sortBy !== 'name',
  ].filter(Boolean).length;
  const resetFilters = () => {
    setStatusFilter('all');
    setStockFilter('all');
    setPriceFilter('all');
    setSortBy('name');
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Service inventory</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Dịch vụ & kho hàng</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Quản lý dịch vụ bán kèm, tồn kho và trạng thái kinh doanh.</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} strokeWidth={3} />
          Thêm dịch vụ
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Package size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng dịch vụ</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{stats.total}</p></div></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang bán</p><p className="mt-1 text-2xl font-black text-emerald-600">{stats.active}</p></div></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><AlertCircle size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sắp hết hàng</p><p className="mt-1 text-2xl font-black text-amber-600">{stats.lowStock}</p></div></div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-red-600"><Archive size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-red-600">Hết hàng</p><p className="mt-1 text-2xl font-black text-red-600">{stats.outOfStock}</p></div></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><WalletCards size={19} /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giá trị tồn</p><p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{formatMoney(stats.inventoryValue)}</p></div></div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap gap-2">
          {([
            ['all', 'Tất cả'],
            ['in', 'Còn hàng'],
            ['low', 'Sắp hết'],
            ['out', 'Hết hàng'],
          ] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setStockFilter(id)} className={`rounded-full px-4 py-2 text-xs font-black transition ${stockFilter === id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}>{label}</button>)}
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm dịch vụ theo tên..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>
          <button type="button" onClick={() => setIsFiltersOpen((value) => !value)} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-widest transition ${isFiltersOpen || activeFilterCount > 0 ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            <Filter size={16} /> Bộ lọc
            {activeFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[10px] text-white">{activeFilterCount}</span>}
            <ChevronDown size={15} className={`transition ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
          <p className="text-sm font-bold text-slate-400 lg:text-right">{filteredServices.length} / {services.length} dịch vụ</p>
        </div>

        {isFiltersOpen && <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <span className="text-slate-400">Trạng thái</span>
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Đang bán' },
              { id: 'inactive', label: 'Tạm ẩn' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`rounded-full px-3 py-1 transition ${
                statusFilter === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}

          <span className="ml-1 text-slate-400">Tồn kho</span>
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'in', label: 'Còn hàng' },
              { id: 'low', label: 'Sắp hết' },
              { id: 'out', label: 'Hết hàng' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStockFilter(item.id)}
              className={`rounded-full px-3 py-1 transition ${
                stockFilter === item.id
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label><span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><DollarSign size={15} className="text-blue-600" />Mức giá</span><select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value as typeof priceFilter)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-600 outline-none"><option value="all">Mọi mức giá</option><option value="under50">Dưới 50.000đ</option><option value="50to100">50.000đ - 100.000đ</option><option value="over100">Trên 100.000đ</option></select></label>
          <label><span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><SlidersHorizontal size={15} className="text-blue-600" />Sắp xếp</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-600 outline-none"><option value="name">Tên A-Z</option><option value="priceAsc">Giá thấp trước</option><option value="priceDesc">Giá cao trước</option><option value="stockAsc">Tồn kho ít trước</option><option value="stockDesc">Tồn kho nhiều trước</option></select></label>
        </div>
        {activeFilterCount > 0 && <button type="button" onClick={resetFilters} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 transition hover:bg-red-600 hover:text-white"><X size={14} />Xóa lọc</button>}
        </div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex min-h-90 flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={38} />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải dịch vụ</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex min-h-90 flex-col items-center justify-center text-center">
            <Package size={54} className="mb-4 text-slate-200" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Chưa có dịch vụ phù hợp</h3>
            <p className="mt-2 text-sm font-semibold text-slate-400">Thêm dịch vụ mới để bán kèm khi đặt sân.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredServices.map((service) => {
              const isExpanded = expandedServiceId === service.id;
              const stock = Number(service.stockQuantity || 0);

              return (
                <div key={service.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <div className="grid gap-4 p-4 xl:grid-cols-[minmax(240px,1fr)_150px_130px_130px_112px] xl:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {service.imageUrl ? (
                          <img src={service.imageUrl} alt={service.name || 'Dịch vụ'} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={22} className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950 dark:text-white">{service.name || 'Dịch vụ chưa đặt tên'}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{service.isActive !== false ? 'Đang bán' : 'Tạm ẩn'} · Tồn kho {stock}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn giá</p>
                      <p className="mt-1 text-sm font-black text-blue-600">{formatMoney(service.price)}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tồn kho</p>
                      <p className={`mt-1 text-sm font-black ${stock > 0 ? 'text-slate-950 dark:text-white' : 'text-red-600'}`}>{stock}</p>
                    </div>

                    <span className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-[10px] font-black uppercase tracking-widest ${
                      service.isActive !== false ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                    }`}>
                      {service.isActive !== false ? 'Đang bán' : 'Tạm ẩn'}
                    </span>

                    <div className="flex gap-2 xl:justify-end">
                      <button type="button" onClick={() => setExpandedServiceId(isExpanded ? null : service.id)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white" title="Xem chi tiết">
                        <Eye size={17} />
                      </button>
                      <button type="button" onClick={() => handleDelete(service.id)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:bg-slate-800" title="Xóa">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="grid gap-4 border-t border-slate-100 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40 md:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <Box size={14} className="text-blue-600" />
                          Thông tin
                        </p>
                        <p className="text-sm font-black text-slate-950 dark:text-white">{service.name || 'Dịch vụ'}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-500">ID: {service.id.substring(0, 8).toUpperCase()}</p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <DollarSign size={14} className="text-emerald-600" />
                          Kho hàng
                        </p>
                        <dl className="space-y-2 text-xs font-bold">
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Đơn giá</dt>
                            <dd className="text-slate-800 dark:text-slate-200">{formatMoney(service.price)}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Tồn kho</dt>
                            <dd className="text-slate-800 dark:text-slate-200">{stock}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-slate-400">Giá trị</dt>
                            <dd className="text-slate-800 dark:text-slate-200">{formatMoney(stock * Number(service.price || 0))}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Thao tác</p>
                        <button type="button" onClick={() => openEdit(service)} className="mb-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-black text-white transition hover:bg-blue-700">
                          <Archive size={15} />
                          Cập nhật dịch vụ
                        </button>
                        <button type="button" onClick={() => handleDelete(service.id)} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-black text-red-600 transition hover:bg-red-600 hover:text-white">
                          <Trash2 size={15} />
                          Xóa dịch vụ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="absolute inset-0 bg-slate-950/50" />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <aside className="hidden">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
                      <Package size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Service setup</p>
                    <h3 className="mt-3 text-2xl font-black text-white">{editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h3>
                    <p className="mt-3 text-sm font-semibold text-slate-300">Thiết lập tên, giá bán, tồn kho và ảnh hiển thị cho dịch vụ bán kèm.</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">Xem trước</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-white/10">
                        {formData.imageUrl ? <img src={formData.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={20} />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{formData.name || 'Tên dịch vụ'}</p>
                        <p className="mt-1 text-xs font-bold text-slate-300">{formatMoney(Number(formData.price || 0))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="flex max-h-[90vh] flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
                  <div>
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white">{editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Thông tin nhập ở đây sẽ hiển thị cho khách khi đặt sân.</p>
                  </div>
                  <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:text-slate-900 dark:bg-slate-800 dark:hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
                  {error && (
                    <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Thông tin chính</p>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Tên dịch vụ</label>
                          <input
                            required
                            value={formData.name}
                            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            placeholder="VD: Nước suối Lavie 500ml"
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Giá bán</label>
                            <input
                              required
                              inputMode="numeric"
                              value={formData.price}
                              onChange={(event) => setFormData({ ...formData, price: event.target.value.replace(/[^0-9]/g, '') })}
                              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Tồn kho</label>
                            <input
                              required
                              type="number"
                              min="0"
                              value={formData.stockQuantity}
                              onChange={(event) => setFormData({ ...formData, stockQuantity: event.target.value })}
                              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Hiển thị</p>
                      <div className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)]">
                        <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                          {formData.imageUrl ? <img src={formData.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={24} className="text-slate-300" />}
                        </div>
                        <div>
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Ảnh dịch vụ</label>
                          <input
                            value={formData.imageUrl}
                            onChange={(event) => setFormData({ ...formData, imageUrl: event.target.value })}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={`mt-4 flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-black transition ${
                          formData.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 size={17} />
                          {formData.isActive ? 'Đang bán' : 'Tạm ẩn'}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest">Nhấn để đổi</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                    <button type="button" onClick={() => setIsDrawerOpen(false)} className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                      Hủy
                    </button>
                    <button type="submit" disabled={isSubmitting} className="flex h-12 flex-2 items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-700 disabled:opacity-60">
                      {isSubmitting ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                      {editingService ? 'Lưu thay đổi' : 'Thêm dịch vụ'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Services;
