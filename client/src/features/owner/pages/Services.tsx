import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Edit3,
  Eye,
  Filter,
  Image as ImageIcon,
  Loader2,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import api, { API_BASE_URL } from '../../../services/api';

type ServiceItem = {
  id: string;
  name?: string;
  price?: number;
  stockQuantity?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  status?: string;
  icon?: string;
};

type FormState = {
  name: string;
  price: string;
  stockQuantity: string;
  imageFile: File | null;
  imagePreview: string;
  category: string;
  isActive: boolean;
};

type StatusFilter = 'all' | 'active' | 'inactive';
type StockFilter = 'all' | 'in' | 'low' | 'out';
type SortMode = 'name' | 'priceAsc' | 'priceDesc' | 'stockAsc' | 'stockDesc';

const SERVICE_CATEGORIES = ['Đồ uống', 'Dụng cụ', 'Quần áo', 'Tiện ích khác', 'Khác'];

const emptyForm: FormState = {
  name: '',
  price: '',
  stockQuantity: '0',
  imageFile: null,
  imagePreview: '',
  category: 'Đồ uống',
  isActive: true,
};

const formatMoney = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const resolveImageUrl = (value?: string | null) => {
  const imageUrl = String(value || '').trim();
  if (!imageUrl || imageUrl.startsWith('blob:')) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) {
    return imageUrl.replace('http://localhost:5164', 'http://127.0.0.1:5164');
  }

  return `${API_BASE_URL.replace('/api/v1', '').replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`;
};

const normalizeServiceStatus = (service: ServiceItem) => {
  const status = String(service.status || '').toLowerCase();
  if (status.includes('pending')) return 'pending';
  if (status.includes('hidden') || status.includes('reject')) return 'hidden';
  if (status.includes('active')) return service.isActive === false ? 'hidden' : 'active';
  if (service.isActive === true) return 'active';
  if (service.isActive === false) return 'hidden';
  return 'pending';
};

const serviceStatusLabel = (service: ServiceItem) => {
  const status = normalizeServiceStatus(service);
  if (status === 'pending') return 'Chờ duyệt';
  if (status === 'hidden') return 'Tạm ẩn';
  return 'Đang bán';
};

const serviceStatusClass = (service: ServiceItem) => {
  const status = normalizeServiceStatus(service);
  if (status === 'pending') return 'bg-amber-100 text-amber-700';
  if (status === 'hidden') return 'bg-slate-100 text-slate-600';
  return 'bg-emerald-100 text-emerald-700';
};

const unwrapArray = <T,>(response: any): T[] => {
  const data = response?.data ?? response;
  if (typeof data === 'string') return [];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
};

const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortMode>('name');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState<FormState>(emptyForm);

  const fetchServices = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/additional-services/my');
      setServices(unwrapArray<ServiceItem>(res));
    } catch (err: any) {
      console.error('Owner services: failed to load services', err);
      setError(err?.message || 'Không thể tải danh sách dịch vụ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchServices();
  }, []);

  const openCreate = () => {
    setEditingService(null);
    setFormData(emptyForm);
    setError('');
    setIsDrawerOpen(true);
  };

  const openEdit = (service: ServiceItem) => {
    const imageUrl = resolveImageUrl(service.imageUrl);
    setEditingService(service);
    setFormData({
      name: service.name || '',
      price: String(service.price || 0),
      stockQuantity: String(service.stockQuantity || 0),
      imageFile: null,
      imagePreview: imageUrl,
      category: SERVICE_CATEGORIES.includes(service.icon || '') ? String(service.icon) : 'Khác',
      isActive: service.isActive !== false,
    });
    setError('');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingService(null);
    setError('');
    if (formData.imagePreview && formData.imageFile) {
      URL.revokeObjectURL(formData.imagePreview);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (formData.imagePreview && formData.imageFile) {
        URL.revokeObjectURL(formData.imagePreview);
      }
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const removeSelectedImage = () => {
    if (formData.imagePreview && formData.imageFile) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormData((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: '',
    }));
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setStockFilter('all');
    setCategoryFilter('all');
    setSortBy('name');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const name = formData.name.trim();
      const price = Number(formData.price);
      const stockQuantity = Number(formData.stockQuantity);

      if (!name) {
        setError('Vui lòng nhập tên dịch vụ.');
        setIsSubmitting(false);
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        setError('Giá bán phải là số hợp lệ.');
        setIsSubmitting(false);
        return;
      }

      if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
        setError('Tồn kho không được âm.');
        setIsSubmitting(false);
        return;
      }

      let imageUrl: string | null = formData.imagePreview.trim() || null;
      if (formData.imageFile) {
        const uploadPayload = new FormData();
        uploadPayload.append('file', formData.imageFile);
        const uploaded = await api.post('/additional-services/images', uploadPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }) as { imageUrl?: string; data?: { imageUrl?: string } };

        imageUrl = uploaded.imageUrl || uploaded.data?.imageUrl || null;
      } else if (imageUrl?.startsWith('blob:')) {
        imageUrl = null;
      }

      const payload = {
        name,
        price,
        icon: formData.category,
        stockQuantity,
        imageUrl,
        isActive: formData.isActive,
      };

      if (editingService) {
        await api.put(`/additional-services/${editingService.id}`, payload);
      } else {
        await api.post('/additional-services', payload);
      }

      closeDrawer();
      await fetchServices();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể lưu dịch vụ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa dịch vụ này?')) return;

    try {
      await api.delete(`/additional-services/${id}`);
      await fetchServices();
    } catch {
      alert('Không thể xóa dịch vụ.');
    }
  };

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((item) => normalizeServiceStatus(item) === 'active').length;
    const lowStock = services.filter((item) => {
      const stock = Number(item.stockQuantity || 0);
      return stock > 0 && stock <= 5;
    }).length;
    const outOfStock = services.filter((item) => Number(item.stockQuantity || 0) <= 0).length;
    const inventoryValue = services.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.stockQuantity || 0),
      0,
    );

    return { total, active, lowStock, outOfStock, inventoryValue };
  }, [services]);

  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return services
      .filter((service) => {
        const stock = Number(service.stockQuantity || 0);
        const normalizedStatus = normalizeServiceStatus(service);
        const active = normalizedStatus === 'active';

        const matchKeyword = !keyword || String(service.name || '').toLowerCase().includes(keyword);
        const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? active : normalizedStatus !== 'active');
        const matchCategory = categoryFilter === 'all' || service.icon === categoryFilter;
        const matchStock =
          stockFilter === 'all' ||
          (stockFilter === 'in' && stock > 5) ||
          (stockFilter === 'low' && stock > 0 && stock <= 5) ||
          (stockFilter === 'out' && stock <= 0);

        return matchKeyword && matchStatus && matchCategory && matchStock;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return Number(a.price || 0) - Number(b.price || 0);
        if (sortBy === 'priceDesc') return Number(b.price || 0) - Number(a.price || 0);
        if (sortBy === 'stockAsc') return Number(a.stockQuantity || 0) - Number(b.stockQuantity || 0);
        if (sortBy === 'stockDesc') return Number(b.stockQuantity || 0) - Number(a.stockQuantity || 0);
        return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
      });
  }, [services, search, statusFilter, stockFilter, categoryFilter, sortBy]);

  const suggestions = useMemo(() => {
    const outActive = services.filter((item) => normalizeServiceStatus(item) === 'active' && Number(item.stockQuantity || 0) <= 0).length;
    const noImage = services.filter((item) => !item.imageUrl?.trim()).length;

    return [
      outActive > 0
        ? {
            title: `${outActive} dịch vụ hết hàng vẫn đang bán`,
            desc: 'Nên tạm ẩn hoặc cập nhật tồn kho để tránh khách đặt nhầm.',
            tone: 'warning' as const,
          }
        : null,
      stats.lowStock > 0
        ? {
            title: `${stats.lowStock} dịch vụ sắp hết hàng`,
            desc: 'Ưu tiên nhập thêm trước khung giờ cao điểm hoặc cuối tuần.',
            tone: 'warning' as const,
          }
        : null,
      noImage > 0
        ? {
            title: `${noImage} dịch vụ chưa có ảnh`,
            desc: 'Thêm ảnh giúp khách dễ nhận biết dịch vụ khi xác nhận đặt sân.',
            tone: 'info' as const,
          }
        : null,
    ].filter(Boolean);
  }, [services, stats.lowStock]);

  const kpis = [
    {
      label: 'Tổng dịch vụ',
      value: String(stats.total),
      change: `${filteredServices.length} đang hiển thị`,
      icon: Package,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Đang bán',
      value: String(stats.active),
      change: 'Sẵn sàng đặt kèm',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Sắp hết hàng',
      value: String(stats.lowStock),
      change: 'Cần nhập thêm',
      icon: AlertCircle,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Hết hàng',
      value: String(stats.outOfStock),
      change: 'Nên tạm ẩn',
      icon: Package,
      color: 'text-red-600 bg-red-50',
    },
    {
      label: 'Giá trị tồn kho',
      value: formatMoney(stats.inventoryValue),
      change: 'Theo đơn giá hiện tại',
      icon: DollarSign,
      color: 'text-violet-600 bg-violet-50',
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">DỊCH VỤ BỔ SUNG</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Dịch vụ bổ sung</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Quản lý dịch vụ bán kèm, tồn kho và trạng thái hiển thị khi khách đặt sân.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm dịch vụ
        </button>
      </div>

      {error && !isDrawerOpen && (
        <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;

          return (
            <motion.button
              key={kpi.label}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => {
                if (kpi.label === 'Đang bán') setStatusFilter('active');
                if (kpi.label === 'Sắp hết hàng') setStockFilter('low');
                if (kpi.label === 'Hết hàng') setStockFilter('out');
              }}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg p-2 ${kpi.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-600">{kpi.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{kpi.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{kpi.change}</p>
            </motion.button>
          );
        })}
      </div>

      {suggestions.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Khuyến nghị quản lý</h2>
            <p className="text-sm text-slate-600">Các hạng mục cần xử lý để đảm bảo trải nghiệm đặt sân.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {suggestions.map((item) => (
              <button
                key={item!.title}
                type="button"
                onClick={() => {
                  if (item!.title.includes('hết hàng')) setStockFilter('out');
                  if (item!.title.includes('sắp hết')) setStockFilter('low');
                }}
                className={`rounded-lg border p-4 text-left transition hover:shadow-sm ${
                  item!.tone === 'warning'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      item!.tone === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item!.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{item!.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm dịch vụ theo tên..."
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Filter size={16} />
              Bộ lọc
            </button>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="all">Tất cả danh mục</option>
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="h-11 rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              Đặt lại
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
                <label>
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                    <CheckCircle2 size={14} />
                    Trạng thái
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="active">Đang bán</option>
                    <option value="inactive">Chờ duyệt / Tạm ẩn</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Package size={14} />
                    Tồn kho
                  </span>
                  <select
                    value={stockFilter}
                    onChange={(event) => setStockFilter(event.target.value as StockFilter)}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="in">Còn hàng</option>
                    <option value="low">Sắp hết</option>
                    <option value="out">Hết hàng</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                    <SlidersHorizontal size={14} />
                    Sắp xếp
                  </span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortMode)}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold outline-none"
                  >
                    <option value="name">Tên A-Z</option>
                    <option value="priceAsc">Giá thấp trước</option>
                    <option value="priceDesc">Giá cao trước</option>
                    <option value="stockAsc">Tồn kho ít trước</option>
                    <option value="stockDesc">Tồn kho nhiều trước</option>
                  </select>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Danh sách dịch vụ</h2>
            <p className="text-sm text-slate-600">
              Hiển thị {filteredServices.length} / {services.length} dịch vụ
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-sm font-semibold text-slate-500">Đang tải dịch vụ...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <Package className="text-slate-300" size={52} />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Không có dịch vụ phù hợp</h3>
            <p className="mt-1 text-sm text-slate-500">Thử đổi bộ lọc hoặc thêm dịch vụ mới.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_120px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 xl:grid">
              <span>Dịch vụ</span>
              <span>Đơn giá</span>
              <span>Tồn kho</span>
              <span>Trạng thái</span>
              <span className="text-right">Thao tác</span>
            </div>

            {filteredServices.map((service) => {
              const stock = Number(service.stockQuantity || 0);
              const isExpanded = expandedId === service.id;
              const stockLabel = stock <= 0 ? 'Hết hàng' : stock <= 5 ? 'Sắp hết' : 'Còn hàng';

              return (
                <article key={service.id} className="bg-white">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : service.id)}
                    className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-slate-50 xl:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_120px] xl:items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
                        {resolveImageUrl(service.imageUrl) ? (
                          <img src={resolveImageUrl(service.imageUrl)} alt={service.name || 'Dịch vụ'} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="text-slate-300" size={23} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-950">
                          {service.name || 'Dịch vụ chưa đặt tên'}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {service.icon || 'Khác'} · {stockLabel}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">{formatMoney(service.price)}</p>
                      <p className="mt-1 text-xs text-slate-500">Giá bán/thuê</p>
                    </div>

                    <div>
                      <p className={`text-sm font-bold ${stock <= 0 ? 'text-red-600' : stock <= 5 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {stock}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Số lượng</p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${serviceStatusClass(service)}`}
                      >
                        {serviceStatusLabel(service)}
                      </span>
                    </div>

                    <div className="flex justify-end gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                        <Eye size={16} />
                      </span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100 bg-slate-50"
                      >
                        <div className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_220px]">
                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <h4 className="font-bold text-slate-900">Thông tin dịch vụ</h4>
                            <dl className="mt-3 space-y-2 text-sm">
                              <div className="flex justify-between gap-3">
                                <dt className="text-slate-500">Tên</dt>
                                <dd className="font-semibold text-slate-900">{service.name || '---'}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt className="text-slate-500">Danh mục</dt>
                                <dd className="font-semibold text-slate-900">{service.icon || 'Khác'}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt className="text-slate-500">Mã</dt>
                                <dd className="font-semibold text-slate-900">{service.id.slice(0, 8).toUpperCase()}</dd>
                              </div>
                            </dl>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <h4 className="font-bold text-slate-900">Kho hàng</h4>
                            <dl className="mt-3 space-y-2 text-sm">
                              <div className="flex justify-between gap-3">
                                <dt className="text-slate-500">Đơn giá</dt>
                                <dd className="font-semibold text-slate-900">{formatMoney(service.price)}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt className="text-slate-500">Tồn kho</dt>
                                <dd className="font-semibold text-slate-900">{stock}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt className="text-slate-500">Giá trị tồn</dt>
                                <dd className="font-semibold text-blue-600">{formatMoney(stock * Number(service.price || 0))}</dd>
                              </div>
                            </dl>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <h4 className="font-bold text-slate-900">Thao tác</h4>
                            <div className="mt-3 space-y-2">
                              <button
                                type="button"
                                onClick={() => openEdit(service)}
                                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
                              >
                                <Edit3 size={15} />
                                Chỉnh sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(service.id)}
                                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-50 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                <Trash2 size={15} />
                                Xóa dịch vụ
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Đóng form"
              onClick={closeDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-slate-50 shadow-2xl border-l border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                    {editingService ? 'Cập nhật' : 'Tạo mới'}
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-950">
                    {editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
                {error && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600 shadow-sm animate-shake">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Ảnh đại diện dịch vụ</span>
                  <div className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 text-center transition hover:border-blue-400 hover:bg-blue-50/30 overflow-hidden min-h-[140px]">
                    {formData.imagePreview ? (
                      <div className="relative h-28 w-full rounded-xl overflow-hidden group-hover:opacity-95 transition">
                        <img src={formData.imagePreview} alt="Preview" className="h-full w-full object-contain" />
                        <button
                          type="button"
                          onClick={removeSelectedImage}
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-900/70 text-white backdrop-blur-sm transition hover:bg-slate-900"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center">
                        <div className="rounded-xl bg-slate-50 p-3 text-slate-400 shadow-sm group-hover:bg-blue-50 group-hover:text-blue-500 transition duration-300">
                          <Upload size={22} />
                        </div>
                        <p className="mt-2.5 text-sm font-bold text-slate-700">Tải ảnh lên từ thiết bị</p>
                        <p className="mt-1 text-xs text-slate-400">Hỗ trợ định dạng JPG, PNG, WEBP</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Tên dịch vụ</span>
                  <input
                    value={formData.name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Ví dụ: Nước suối Aquafina, Thuê vợt Yonex..."
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Đơn giá (đ)</span>
                    <input
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
                      placeholder="0"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Số lượng tồn kho</span>
                    <input
                      type="number"
                      min={0}
                      value={formData.stockQuantity}
                      onChange={(event) => setFormData((prev) => ({ ...prev, stockQuantity: event.target.value }))}
                      placeholder="0"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Danh mục nhóm</span>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      {SERVICE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 border-l border-slate-200 pl-2 text-slate-400">
                      <SlidersHorizontal size={14} />
                    </div>
                  </div>
                </label>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Trạng thái hiển thị công khai</p>
                    <p className="text-xs font-medium text-slate-400">Cho phép khách nhìn thấy khi đặt sân.</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.checked }))}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-200"></div>
                  </label>
                </div>
              </form>

              <div className="border-t border-slate-200 bg-white p-5 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(event) => void handleSubmit(event as unknown as React.FormEvent)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-700 hover:shadow-blue-600/20 active:scale-[0.99] disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {editingService ? 'Cập nhật thay đổi' : 'Gửi dịch vụ chờ duyệt'}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Services;
