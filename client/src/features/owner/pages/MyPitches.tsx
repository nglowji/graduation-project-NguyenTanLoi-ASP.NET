import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Plus, Search, Edit2, Trash2, ExternalLink, 
  Star, X, Image as ImageIcon, DollarSign, Type, 
  Info, CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../../../services/api';

const MyPitches: React.FC = () => {
  const [pitches, setPitches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPitch, setEditingPitch] = useState<any>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    basePrice: '',
    pitchType: 'Football5',
    images: ['']
  });

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/pitches/my');
      setPitches(res.data || []);
    } catch {
      setPitches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (pitch: any) => {
    setEditingPitch(pitch);
    setFormData({
      name: pitch.name,
      address: pitch.address,
      description: pitch.description || '',
      basePrice: pitch.basePrice.toString(),
      pitchType: pitch.pitchType,
      images: pitch.images?.length > 0 ? [pitch.images[0]] : ['']
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        images: formData.images.filter(i => i.trim() !== '')
      };

      if (editingPitch) {
        await api.put(`/pitches/${editingPitch.id}`, payload);
      } else {
        await api.post('/pitches', payload);
      }
      
      setIsModalOpen(false);
      setEditingPitch(null);
      setFormData({ name: '', address: '', description: '', basePrice: '', pitchType: 'Football5', images: [''] });
      fetchPitches();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePitch = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sân bóng này?')) return;
    try {
      await api.delete(`/pitches/${id}`);
      fetchPitches();
    } catch {
      alert('Không thể xóa sân bóng.');
    }
  };

  const filteredPitches = pitches.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.address?.toLowerCase().includes(search.toLowerCase())
  );

  const pitchTypes = [
    { id: 'Football5', label: 'Sân 5' },
    { id: 'Football7', label: 'Sân 7' },
    { id: 'Football11', label: 'Sân 11' },
    { id: 'Tennis', label: 'Tennis' },
    { id: 'Badminton', label: 'Cầu lông' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Đang tải danh sách sân...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Sân bóng của tôi</h1>
          <p className="text-white/40 text-sm mt-1">Quản lý và cập nhật thông tin các sân bãi bạn đang sở hữu</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <Plus size={18} /> Thêm sân mới
        </button>
      </div>

      <div className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sân bóng..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        {filteredPitches.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
            <MapPin size={48} className="mx-auto mb-4 text-white/5" />
            <p className="text-white/20 font-black uppercase tracking-widest">Không tìm thấy sân bóng nào</p>
            <button onClick={() => setIsModalOpen(true)} className="mt-4 text-blue-500 text-xs font-black uppercase tracking-widest hover:text-blue-400">
              + Tạo sân đầu tiên ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPitches.map((pitch) => (
              <motion.div 
                key={pitch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-[#1e202b] border border-white/5 rounded-[2rem] overflow-hidden hover:border-blue-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row h-full">
                  <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden shrink-0">
                    {pitch.images?.[0] ? (
                      <img src={pitch.images[0]} alt={pitch.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <MapPin size={32} />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">
                      {pitch.pitchType}
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">{pitch.name}</h3>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                        <Star size={12} className="fill-current" />
                        <span className="text-[10px] font-black">{pitch.averageRating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    
                    <p className="text-white/30 text-xs mb-6 line-clamp-1 flex items-center gap-2">
                      <MapPin size={12} /> {pitch.address}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-auto mb-6">
                      <div className="bg-white/5 p-3 rounded-2xl">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Giá cơ bản</p>
                        <p className="text-sm font-black text-blue-400">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pitch.basePrice)}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Trạng thái</p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${pitch.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-white/20'}`} />
                          <span className="text-xs font-bold text-white/60">{pitch.status === 'Active' ? 'Hoạt động' : 'Chờ duyệt'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                      <button 
                        onClick={() => handleOpenEdit(pitch)}
                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                      >
                        <Edit2 size={14} /> Chỉnh sửa
                      </button>
                      <button 
                        onClick={() => handleDeletePitch(pitch.id)}
                        className="w-11 h-11 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 rounded-xl transition-all flex items-center justify-center border border-white/5"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="w-11 h-11 bg-white/5 hover:bg-blue-500/10 text-white/40 hover:text-blue-400 rounded-xl transition-all flex items-center justify-center border border-white/5">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Pitch Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#1a1c26] border border-white/10 rounded-[2.5rem] shadow-2xl p-8 my-8"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600 opacity-[0.02] rounded-bl-[10rem]" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {editingPitch ? 'Cập nhật thông tin sân' : 'Thêm sân bóng mới'}
                  </h3>
                  <p className="text-white/40 text-xs font-medium mt-1 uppercase tracking-widest">SmartSport Partner Portal</p>
                </div>
                <button 
                  onClick={() => { setIsModalOpen(false); setEditingPitch(null); }}
                  className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Type size={12} /> Tên sân bóng
                    </label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="Sân vận động Mỹ Đình"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Info size={12} /> Loại sân
                    </label>
                    <select 
                      value={formData.pitchType}
                      onChange={(e) => setFormData({...formData, pitchType: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {pitchTypes.map(t => <option key={t.id} value={t.id} className="bg-[#1a1c26]">{t.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <MapPin size={12} /> Địa chỉ chi tiết
                    </label>
                    <input 
                      required
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="Số 1 Hùng Vương, Ba Đình, Hà Nội"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <DollarSign size={12} /> Giá cơ bản (1h)
                    </label>
                    <input 
                      required
                      type="number" 
                      value={formData.basePrice}
                      onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="200000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <ImageIcon size={12} /> URL Hình ảnh
                    </label>
                    <input 
                      type="text" 
                      value={formData.images[0]}
                      onChange={(e) => setFormData({...formData, images: [e.target.value]})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Info size={12} /> Mô tả sân bóng
                    </label>
                    <textarea 
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                      placeholder="Sân cỏ nhân tạo chất lượng cao, có đèn chiếu sáng ban đêm..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-white/5 text-white/40 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-white transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} />}
                    {editingPitch ? 'Cập nhật sân' : 'Xác nhận thêm sân'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyPitches;
