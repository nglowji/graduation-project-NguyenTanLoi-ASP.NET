import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Trash2, DollarSign, 
  AlertCircle, X,
  Box, Image as ImageIcon, LayoutGrid, List,
  Zap, Package, Archive, Save
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
      const res = await api.get('/additional-services/my') as any;
      setServices(res || []);
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
        icon: "📦", 
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
      setError(err.message || 'Thao tác thất bại.');
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
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Inventory Hub</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Dịch vụ & Kho hàng</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Quản lý danh mục hàng hóa, giá bán và số lượng tồn kho.</p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> Thêm dịch vụ
        </button>
      </header>

      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-3 shadow-sm flex flex-col md:flex-row items-center gap-4 group">
        <div className="relative flex-1 group/search">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" placeholder="Tìm kiếm dịch vụ theo tên..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none py-5 pl-16 pr-6 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 font-bold focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2 px-6 border-l border-slate-100 dark:border-slate-700">
          <button onClick={() => setViewMode('grid')} className={`p-3.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}><LayoutGrid size={20} /></button>
          <button onClick={() => setViewMode('list')} className={`p-3.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}><List size={20} /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-8 animate-in fade-in duration-700">
          <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing inventory...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-40 bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Package size={64} className="mx-auto mb-6 text-slate-200 dark:text-slate-800" />
          <h3 className="text-xl font-black text-slate-400 dark:text-slate-600">Kho hàng trống</h3>
          <p className="text-slate-400 text-sm mb-8">Bắt đầu nhập danh mục hàng hóa để kinh doanh ngay.</p>
          <button onClick={handleOpenCreate} className="px-10 py-4 bg-slate-100 dark:bg-slate-800 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/10 hover:bg-blue-600 hover:text-white transition-all">Nhập hàng ngay</button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "space-y-4"}>
          {filteredServices.map((svc) => (
            <motion.div 
              key={svc.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-blue-600/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900/50 rounded-3xl overflow-hidden flex items-center justify-center relative border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-transform duration-700 shadow-inner">
                  {svc.imageUrl ? (
                    <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <ImageIcon size={32} />
                      <span className="text-[8px] font-black uppercase tracking-widest">No Media</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${svc.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    {svc.isActive ? 'Active' : 'Draft'}
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${svc.stockQuantity > 0 ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20' : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:border-red-500/20'}`}>
                    {svc.stockQuantity || 0} Stock
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-10">
                <h3 className="text-xl font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors leading-none mb-2">{svc.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-blue-600">
                    {new Intl.NumberFormat('vi-VN').format(svc.price || 0)}
                  </span>
                  <span className="text-xs font-black text-blue-600/60 uppercase">VND</span>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-50 dark:border-slate-700/50">
                <button onClick={() => handleOpenEdit(svc)} className="flex-1 py-4 bg-slate-50 dark:bg-slate-700 hover:bg-blue-600 text-slate-500 dark:text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-100 dark:border-slate-600 group-hover:shadow-lg">Cập nhật</button>
                <button onClick={() => handleDelete(svc.id)} className="w-14 h-14 bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all flex items-center justify-center border border-red-100 dark:border-red-500/20"><Trash2 size={20} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsDrawerOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 dark:border-slate-800"
            >
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-600/30">
                    {editingService ? <Archive size={28} /> : <Plus size={28} strokeWidth={3} />}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                      {editingService ? 'Sửa dịch vụ' : 'Dịch vụ mới'}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-3">
                      Inventory Catalog Management
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-100 dark:border-slate-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar max-h-[65vh]">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 p-6 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-3xl text-red-600 text-xs font-black flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-600/20">
                      <AlertCircle size={20} />
                    </div>
                    {error}
                  </motion.div>
                )}
                
                <form id="service-form" onSubmit={handleSubmit} className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên hàng hóa / Dịch vụ</label>
                    <div className="relative group">
                      <Box size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        required 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-6 pl-16 pr-6 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:border-blue-600 transition-all shadow-sm" 
                        placeholder="VD: Nước suối Lavie 500ml" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá bán lẻ (VND)</label>
                      <div className="relative group">
                        <DollarSign size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600" />
                        <input 
                          required 
                          type="text" 
                          value={new Intl.NumberFormat('vi-VN').format(Number(formData.price || 0))} 
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                            setFormData({...formData, price: rawValue});
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-6 pl-16 pr-6 text-2xl font-black text-blue-600 focus:outline-none focus:border-blue-600 transition-all shadow-sm" 
                          placeholder="0" 
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số lượng tồn kho</label>
                      <div className="relative group">
                        <Package size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                          required 
                          type="number" 
                          value={formData.stockQuantity} 
                          onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} 
                          className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-6 pl-16 pr-6 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all shadow-sm" 
                          placeholder="0" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hình ảnh sản phẩm (URL)</label>
                    <div className="relative group">
                      <ImageIcon size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        type="text" 
                        value={formData.imageUrl} 
                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-6 pl-16 pr-6 text-[11px] font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all shadow-sm" 
                        placeholder="Dán link ảnh tại đây..." 
                      />
                    </div>
                    {formData.imageUrl && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 relative h-56 rounded-[2rem] overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-xl group">
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay" />
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] group transition-all">
                    <div className="flex items-center gap-5">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${formData.isActive ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'}`}>
                        <Zap size={28} className={formData.isActive ? 'fill-current' : ''} />
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-white leading-none mb-2">Trạng thái kinh doanh</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hiển thị công khai trong danh mục đặt sân</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})} 
                      className={`w-20 h-11 rounded-full transition-all relative p-2 ${formData.isActive ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <motion.div 
                        animate={{ x: formData.isActive ? 36 : 0 }}
                        className="w-7 h-7 rounded-full bg-white shadow-lg"
                      />
                    </button>
                  </div>
                </form>
              </div>

              <div className="p-10 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-5">
                <button 
                  type="button" 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="flex-1 py-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                >
                  Hủy thao tác
                </button>
                <button 
                  type="submit"
                  form="service-form"
                  disabled={isSubmitting} 
                  className="flex-[2] py-6 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-4 active:scale-[0.98] transition-all group"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang xử lý...</span>
                    </div>
                  ) : (
                    <>
                      <Save size={20} className="group-hover:scale-110 transition-transform" />
                      <span>{editingService ? 'Lưu thay đổi' : 'Xác nhận thêm'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};

export default Services;
