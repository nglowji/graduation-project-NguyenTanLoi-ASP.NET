import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Trash2, DollarSign, 
  CheckCircle, AlertCircle, Activity, X,
  Box, Image as ImageIcon, LayoutGrid, List,
  Zap
} from 'lucide-react';
import api from '../../../services/api';

const Services: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stockQuantity: '0',
    imageUrl: '',
    isActive: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/additional-services/my');
      setServices(res.data || []);
    } catch {
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (svc: any) => {
    setEditingService(svc);
    setFormData({
      name: svc.name || '',
      price: (svc.price || 0).toString(),
      stockQuantity: (svc.stockQuantity || 0).toString(),
      imageUrl: svc.imageUrl || '',
      isActive: svc.isActive ?? true
    });
    setIsDrawerOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({ name: '', price: '', stockQuantity: '0', imageUrl: '', isActive: true });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        icon: "📦", // Default fallback icon for database compatibility
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
        imageUrl: formData.imageUrl.trim() || null,
        isActive: formData.isActive
      };

      if (editingService) {
        await api.put(`/additional-services/${editingService.id}`, payload);
      } else {
        await api.post('/additional-services', payload);
      }

      setIsDrawerOpen(false);
      fetchServices();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.response?.data || 'Thao tác thất bại.';
      setError(typeof msg === 'string' ? msg : 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xác nhận xóa dịch vụ này?')) return;
    try {
      await api.delete(`/additional-services/${id}`);
      fetchServices();
    } catch {
      alert('Không thể xóa dịch vụ.');
    }
  };

  const filteredServices = Array.isArray(services) ? services.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Inventory Management</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Dịch vụ & Kho hàng</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm font-medium">Quản lý danh mục hàng hóa, giá bán và số lượng tồn kho.</p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-primary/20"
        >
          <Plus size={18} strokeWidth={3} /> Thêm dịch vụ mới
        </button>
      </header>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 p-2 rounded-[2rem]">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" placeholder="Tìm kiếm dịch vụ..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none py-5 pl-14 pr-6 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10 focus:ring-0 font-medium"
          />
        </div>
        <div className="flex items-center gap-2 px-4 border-l border-slate-100 dark:border-white/5">
          <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-slate-300'}`}><LayoutGrid size={20} /></button>
          <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-slate-300'}`}><List size={20} /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-32 bg-slate-50 dark:bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5">
          <Box size={48} className="mx-auto mb-4 text-slate-300 dark:text-white/10" />
          <h3 className="text-xl font-black text-slate-400 dark:text-white/20">Kho hàng trống</h3>
          <button onClick={handleOpenCreate} className="mt-6 px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90">Nhập hàng ngay</button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3"}>
          {filteredServices.map((svc) => (
            <motion.div 
              key={svc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] overflow-hidden flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500">
                  {svc.imageUrl ? (
                    <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-300">
                      <ImageIcon size={32} />
                      <span className="text-[8px] font-black uppercase">No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${svc.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    {svc.isActive ? 'Active' : 'Draft'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${svc.stockQuantity > 0 ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                    {svc.stockQuantity || 0} items
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">{svc.name}</h3>
                <p className="text-2xl font-black text-primary">
                  {new Intl.NumberFormat('vi-VN').format(svc.price || 0)}đ
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleOpenEdit(svc)} className="flex-1 py-4 bg-slate-50 dark:bg-white/5 hover:bg-primary dark:hover:bg-primary text-slate-600 dark:text-white/40 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Sửa</button>
                <button onClick={() => handleDelete(svc.id)} className="w-14 h-14 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all flex items-center justify-center"><Trash2 size={20} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal - Redesigned Centered Form */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsDrawerOpen(false)} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0f1117] rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border border-white/20"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-[#0f1117]/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    {editingService ? <Box size={24} /> : <Plus size={24} strokeWidth={3} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                      {editingService ? 'Cập nhật Dịch vụ' : 'Thêm Dịch vụ mới'}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
                      Inventory Management System
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar max-h-[70vh]">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold flex items-center gap-2"
                  >
                    <AlertCircle size={16} /> {error}
                  </motion.div>
                )}
                
                <form id="service-form" onSubmit={handleSubmit} className="space-y-8">
                  {/* Tên dịch vụ */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên dịch vụ / Sản phẩm</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                        <Box size={18} />
                      </div>
                      <input 
                        required 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-primary transition-all" 
                        placeholder="VD: Nước suối Lavie 500ml" 
                      />
                    </div>
                  </div>

                  {/* Giá & Tồn kho */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá bán lẻ (VND)</label>
                      <div className="relative group">
                        <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                        <input 
                          required 
                          type="text" 
                          value={new Intl.NumberFormat('vi-VN').format(Number(formData.price || 0))} 
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                            setFormData({...formData, price: rawValue});
                          }}
                          className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 text-lg font-black text-primary focus:outline-none focus:border-primary transition-all" 
                          placeholder="0" 
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">VND</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số lượng tồn kho</label>
                      <div className="relative group">
                        <LayoutGrid size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          required 
                          type="number" 
                          value={formData.stockQuantity} 
                          onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} 
                          className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-primary transition-all" 
                          placeholder="0" 
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Items</span>
                      </div>
                    </div>
                  </div>

                  {/* Hình ảnh */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hình ảnh minh họa</label>
                    <div className="relative group">
                      <ImageIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text" 
                        value={formData.imageUrl} 
                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 text-[11px] font-medium focus:outline-none focus:border-primary transition-all" 
                        placeholder="Dán link ảnh sản phẩm tại đây..." 
                      />
                    </div>
                    {formData.imageUrl && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 relative group/img h-48 rounded-[2rem] overflow-hidden border-2 border-primary/10 shadow-lg">
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-white text-[10px] font-black uppercase tracking-widest">Image Preview</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Trạng thái */}
                  <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] group transition-all hover:border-primary/20">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${formData.isActive ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-200 text-slate-400'}`}>
                        <Zap size={24} className={formData.isActive ? 'fill-current' : ''} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Công khai dịch vụ</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hiển thị cho khách hàng đặt sân</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})} 
                      className={`w-16 h-9 rounded-full transition-all relative p-1.5 ${formData.isActive ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-300'}`}
                    >
                      <motion.div 
                        animate={{ x: formData.isActive ? 28 : 0 }}
                        className="w-6 h-6 rounded-full bg-white shadow-md"
                      />
                    </button>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50/50 dark:bg-[#0f1117]/50 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="flex-1 py-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  form="service-form"
                  disabled={isSubmitting} 
                  className="flex-[2] py-5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang xử lý...</span>
                    </div>
                  ) : (
                    <>
                      <Zap size={18} fill="currentColor" />
                      <span>{editingService ? 'Lưu thay đổi dịch vụ' : 'Xác nhận thêm dịch vụ'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
};

export default Services;
