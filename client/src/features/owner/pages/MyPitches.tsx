import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, Star,
  X, Image as ImageIcon, DollarSign, Type, 
  AlertCircle, Clock, MapPin,
  LayoutGrid, List, Activity, Zap,
  Building2, ChevronRight
} from 'lucide-react';
import api from '../../../services/api';

const SPORT_CATEGORIES = [
  { id: 'football', label: 'Bóng đá', icon: '⚽', types: [
    { id: '1', label: 'Sân 5' },
    { id: '2', label: 'Sân 7' },
    { id: '3', label: 'Sân 11' },
  ]},
  { id: 'volleyball', label: 'Bóng chuyền', icon: '🏐', types: [
    { id: '8', label: 'Sân chuẩn' },
  ]},
  { id: 'basketball', label: 'Bóng rổ', icon: '🏀', types: [
    { id: '7', label: 'Sân chuẩn' },
  ]},
  { id: 'badminton', label: 'Cầu lông', icon: '🏸', types: [
    { id: '5', label: 'Sân chuẩn' },
  ]},
  { id: 'tennis', label: 'Tennis', icon: '🎾', types: [
    { id: '4', label: 'Sân chuẩn' },
  ]},
  { id: 'table_tennis', label: 'Bóng bàn', icon: '🏓', types: [
    { id: '9', label: 'Bàn chuẩn' },
  ]},
  { id: 'pickleball', label: 'Pickleball', icon: '🥎', types: [
    { id: '6', label: 'Sân chuẩn' },
  ]},
];

const MyPitches: React.FC = () => {
  const [pitches, setPitches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPitch, setEditingPitch] = useState<any>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filterSport, setFilterSport] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterIndoor, setFilterIndoor] = useState<'all' | 'indoor' | 'outdoor'>('all');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    sportCategory: 'football',
    pitchType: '1',
    isIndoor: false,
    images: [''],
    timeSlots: [] as { startTime: string, endTime: string, price: string }[]
  });

  // Auto-generate state
  const [autoGen, setAutoGen] = useState({
    startTime: '07:00',
    endTime: '22:00',
    duration: 1,
    price: '200000'
  });

  const handleGenerateSlots = () => {
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    const formatTime = (m: number) => {
      const h = Math.floor(m / 60);
      const min = m % 60;
      return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    };

    let current = parseTime(autoGen.startTime);
    const end = parseTime(autoGen.endTime);
    const dur = autoGen.duration * 60;

    if (end <= current) {
      setError('Giờ đóng cửa phải sau giờ mở cửa');
      return;
    }

    const newSlots = [];
    while (current + dur <= end) {
      newSlots.push({
        startTime: formatTime(current),
        endTime: formatTime(current + dur),
        price: autoGen.price
      });
      current += dur;
    }

    if (newSlots.length > 0) {
      setFormData({ ...formData, timeSlots: newSlots });
      setError('');
    } else {
      setError('Không thể tạo khung giờ với thiết lập này.');
    }
  };

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


  const [isSportOpen, setIsSportOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const handleOpenEdit = (pitch: any) => {
    setEditingPitch(pitch);
    let category = 'football';
    for (const cat of SPORT_CATEGORIES) {
      if (cat.types.some(t => t.id === pitch.type?.toString())) {
        category = cat.id;
        break;
      }
    }

    setFormData({
      name: pitch.name,
      address: pitch.address || '',
      sportCategory: category,
      pitchType: pitch.type?.toString() || '1',
      isIndoor: pitch.isIndoor || false,
      images: pitch.images?.length > 0 ? pitch.images.map((img: any) => img.imageUrl) : [''],
      timeSlots: pitch.timeSlots?.length > 0 ? pitch.timeSlots.map((ts: any) => ({
        startTime: ts.startTime.substring(0, 5),
        endTime: ts.endTime.substring(0, 5),
        price: ts.price.toString()
      })) : [{ startTime: '05:00', endTime: '17:00', price: '200000' }]
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        address: formData.address || undefined,
        type: parseInt(formData.pitchType, 10),
        isIndoor: formData.isIndoor,
        images: formData.images.filter(i => i.trim() !== ''),
        timeSlots: formData.timeSlots.map(ts => ({
          startTime: ts.startTime + ':00',
          endTime: ts.endTime + ':00',
          price: parseFloat(ts.price) || 0
        }))
      };

      if (editingPitch) {
        await api.put(`/pitches/${editingPitch.id}`, payload);
      } else {
        await api.post('/pitches', payload);
      }
      
      setIsDrawerOpen(false);
      fetchPitches();
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors) {
        const errorMessages = Object.values(data.errors).flat().join(', ');
        setError(errorMessages);
      } else {
        const msg = data?.detail || data?.message || data || 'Thao tác thất bại.';
        setError(typeof msg === 'string' ? msg : 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPitches = pitches.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    
    // Robust category detection
    const pitchTypeIdStr = p.type?.toString();
    let category = '';
    for (const cat of SPORT_CATEGORIES) {
      if (cat.types.some(t => t.id === pitchTypeIdStr)) {
        category = cat.id;
        break;
      }
    }

    const matchesSport = filterSport === 'all' || category === filterSport;
    const matchesType = filterType === 'all' || pitchTypeIdStr === filterType;
    const matchesIndoor = filterIndoor === 'all' || 
      (filterIndoor === 'indoor' ? p.isIndoor : !p.isIndoor);

    return matchesSearch && matchesSport && matchesType && matchesIndoor;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Pitch Management</span>
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Sân của tôi</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm font-medium">Quản lý hạ tầng và lịch thi đấu tại cơ sở của bạn.</p>
        </div>

        <button 
          onClick={() => { 
            setEditingPitch(null); 
            setFormData({ 
              name: '', 
              address: '',
              sportCategory: 'football', 
              pitchType: '1', 
              isIndoor: false, 
              images: [''], 
              timeSlots: [] 
            }); 
            setIsDrawerOpen(true); 
          }}
          className="flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-primary/20"
        >
          <Plus size={18} strokeWidth={3} /> Tạo sân mới
        </button>
      </header>

      {/* Toolbar & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 p-2 rounded-[2rem] shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" placeholder="Tìm kiếm theo tên sân..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none py-5 pl-14 pr-6 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10 focus:ring-0 font-bold"
            />
          </div>
          <div className="flex items-center gap-2 px-4 border-l border-slate-100 dark:border-white/5">
            <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-300 dark:text-white/20 hover:text-primary'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-300 dark:text-white/20 hover:text-primary'}`}><List size={20} /></button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sport Filter */}
          <select 
            value={filterSport} 
            onChange={(e) => { setFilterSport(e.target.value); setFilterType('all'); }}
            className="bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white/60 focus:ring-primary focus:border-primary"
          >
            <option value="all">Tất cả môn thể thao</option>
            {SPORT_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white/60 focus:ring-primary focus:border-primary"
          >
            <option value="all">Tất cả loại sân</option>
            {filterSport !== 'all' && SPORT_CATEGORIES.find(c => c.id === filterSport)?.types.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          {/* Indoor Filter */}
          <div className="flex bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 p-1 rounded-xl">
            {(['all', 'indoor', 'outdoor'] as const).map(mode => (
              <button 
                key={mode}
                onClick={() => setFilterIndoor(mode)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterIndoor === mode ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
              >
                {mode === 'all' ? 'Tất cả' : mode === 'indoor' ? 'Trong nhà' : 'Ngoài trời'}
              </button>
            ))}
          </div>

          {(filterSport !== 'all' || filterType !== 'all' || filterIndoor !== 'all' || search !== '') && (
            <button 
              onClick={() => { setFilterSport('all'); setFilterType('all'); setFilterIndoor('all'); setSearch(''); }}
              className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors flex items-center gap-1.5 ml-2"
            >
              <X size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredPitches.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-32 bg-slate-50 dark:bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5"
        >
          <Building2 size={48} className="mx-auto mb-4 text-slate-300 dark:text-white/10" />
          <h3 className="text-xl font-black text-slate-400 dark:text-white/20">
            {pitches.length === 0 ? 'Chưa có sân nào' : 'Không tìm thấy sân phù hợp'}
          </h3>
          {(filterSport !== 'all' || filterType !== 'all' || filterIndoor !== 'all' || search !== '') && (
            <button 
              onClick={() => { setFilterSport('all'); setFilterType('all'); setFilterIndoor('all'); setSearch(''); }}
              className="mt-6 px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90"
            >
              Thiết lập lại bộ lọc
            </button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {viewMode === 'grid' ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              {filteredPitches.map((p) => (
                <motion.div 
                  layout
                  key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="h-44 relative overflow-hidden">
                    <img src={p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=500"} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-sm">
                        {p.typeDisplay || 'Standard'}
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${p.isIndoor ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        {p.isIndoor ? 'Indoor' : 'Outdoor'}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1">{p.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                          <Building2 size={12} /> {p.sportCenterName || 'Trung tâm thể thao'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 text-amber-600 rounded-xl">
                        <Star size={12} className="fill-current" />
                        <span className="text-xs font-black">{p.averageRating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-4 border-t border-slate-100 dark:border-white/5">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase mb-1">Giá từ</p>
                        <p className="text-lg font-black text-primary">{new Intl.NumberFormat('vi-VN').format(p.minPrice || 0)}đ</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(p)} className="p-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 hover:bg-primary hover:text-white rounded-2xl transition-all active:scale-90"><Edit2 size={18} /></button>
                        <button onClick={() => { if(window.confirm("Xóa sân này?")) api.delete(`/pitches/${p.id}`).then(() => fetchPitches()) }} className="p-4 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-90"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              layout
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sân thi đấu</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loại hình</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Môi trường</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Giá thấp nhất</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Đánh giá</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredPitches.map((p) => (
                    <motion.tr 
                      layout
                      key={p.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shadow-inner flex-shrink-0">
                            <img src={p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=100"} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{p.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5 line-clamp-1">{p.address || 'Địa chỉ mặc định'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5">
                          {p.typeDisplay || 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${p.isIndoor ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                            {p.isIndoor ? 'Indoor' : 'Outdoor'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-primary">{new Intl.NumberFormat('vi-VN').format(p.minPrice || 0)}đ</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <Star size={14} className="fill-current" />
                          <span className="text-xs font-black">{p.averageRating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenEdit(p)} className="p-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 hover:bg-primary hover:text-white rounded-xl transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => { if(window.confirm("Xóa sân này?")) api.delete(`/pitches/${p.id}`).then(() => fetchPitches()) }} className="p-3 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
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
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0f1117] rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border border-white/20"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-[#0f1117]/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    {editingPitch ? <Activity size={24} /> : <Plus size={24} strokeWidth={3} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                      {editingPitch ? 'Cấu hình Sân thi đấu' : 'Thiết lập Sân mới'}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
                      Professional Infrastructure Setup
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
              <div className="flex-1 overflow-y-auto p-8 pb-40 custom-scrollbar">
                <form id="pitch-form" onSubmit={handleSubmit} className="space-y-10">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold flex items-center gap-2"
                    >
                      <AlertCircle size={16} /> {error}
                    </motion.div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left Column: Basic Info & Images */}
                    <div className="space-y-10">
                      <section className="space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-primary rounded-full" />
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Thông tin cơ bản</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tên sân thi đấu</label>
                            <div className="relative">
                              <Type size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                              <input 
                                required 
                                type="text" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-primary transition-all" 
                                placeholder="VD: Sân A1 - Khu A" 
                              />
                            </div>
                          </div>

                          <div className="group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Địa chỉ sân</label>
                            <div className="relative">
                              <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                              <input 
                                type="text" 
                                value={formData.address} 
                                onChange={(e) => setFormData({...formData, address: e.target.value})} 
                                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-primary transition-all" 
                                placeholder="VD: 123 Đường ABC, Quận X, TP. HCM" 
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Môn thể thao & Quy mô</label>
                            
                            {/* Custom Sport Dropdown */}
                            <div className="relative">
                              <button 
                                type="button"
                                onClick={() => setIsSportOpen(!isSportOpen)}
                                className="w-full flex items-center justify-between bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl py-5 px-6 text-sm font-bold focus:outline-none focus:border-primary transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">{(SPORT_CATEGORIES.find(c => c.id === formData.sportCategory) || SPORT_CATEGORIES[0]).icon}</span>
                                  <span className="text-slate-900 dark:text-white">{(SPORT_CATEGORIES.find(c => c.id === formData.sportCategory) || SPORT_CATEGORIES[0]).label}</span>
                                </div>
                                <ChevronRight className={`text-slate-400 transition-transform duration-300 ${isSportOpen ? 'rotate-90' : ''}`} size={18} />
                              </button>

                              <AnimatePresence>
                                {isSportOpen && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                    animate={{ opacity: 1, y: 5, scale: 1 }} 
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 z-[200] bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
                                  >
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                      {SPORT_CATEGORIES.map(cat => (
                                        <button 
                                          key={cat.id} type="button"
                                          onClick={() => {
                                            setFormData({...formData, sportCategory: cat.id, pitchType: cat.types[0].id});
                                            setIsSportOpen(false);
                                          }}
                                          className={`w-full flex items-center gap-4 px-5 py-3.5 text-left rounded-xl hover:bg-primary/5 transition-all ${formData.sportCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400'}`}
                                        >
                                          <span className="text-xl">{cat.icon}</span>
                                          <span className="text-sm font-black">{cat.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {/* Custom Type Dropdown */}
                              <div className="relative">
                                <button 
                                  type="button"
                                  onClick={() => setIsTypeOpen(!isTypeOpen)}
                                  className="w-full flex items-center justify-between bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-primary transition-all"
                                >
                                  <span className="text-slate-900 dark:text-white">
                                    {(SPORT_CATEGORIES.find(c => c.id === formData.sportCategory) || SPORT_CATEGORIES[0]).types.find(t => t.id === formData.pitchType)?.label || 'Chọn loại sân'}
                                  </span>
                                  <ChevronRight className={`text-slate-400 transition-transform duration-300 ${isTypeOpen ? 'rotate-90' : ''}`} size={16} />
                                </button>

                                <AnimatePresence>
                                  {isTypeOpen && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                      animate={{ opacity: 1, y: 5, scale: 1 }} 
                                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                      className="absolute top-full left-0 right-0 z-[200] bg-white dark:bg-[#1a1c26] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
                                    >
                                      <div className="p-2 space-y-1">
                                        {(SPORT_CATEGORIES.find(c => c.id === formData.sportCategory) || SPORT_CATEGORIES[0]).types.map(t => (
                                          <button 
                                            key={t.id} type="button"
                                            onClick={() => {
                                              setFormData({...formData, pitchType: t.id});
                                              setIsTypeOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-4 px-5 py-3 text-left rounded-xl hover:bg-primary/5 transition-all ${formData.pitchType === t.id ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400'}`}
                                          >
                                            <span className="text-xs font-black">{t.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                                <button type="button" onClick={() => setFormData({...formData, isIndoor: false})} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${!formData.isIndoor ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-slate-400'}`}>Outdoor</button>
                                <button type="button" onClick={() => setFormData({...formData, isIndoor: true})} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${formData.isIndoor ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-slate-400'}`}>Indoor</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary rounded-full" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Hình ảnh trực quan</h4>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })} 
                            className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                          >
                            <Plus size={16} strokeWidth={3} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Main Image */}
                          <div className="relative group">
                            <label className="text-[9px] font-black text-primary uppercase tracking-widest ml-1 mb-2 block">Ảnh chính (Banner)</label>
                            <div className="relative">
                              <ImageIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                              <input 
                                type="text" 
                                value={formData.images[0] || ''} 
                                onChange={(e) => { 
                                  const imgs = [...formData.images]; 
                                  imgs[0] = e.target.value; 
                                  setFormData({...formData, images: imgs}); 
                                }} 
                                className="w-full bg-primary/5 border border-primary/20 rounded-2xl py-5 pl-14 pr-6 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-primary" 
                                placeholder="Link ảnh chính..." 
                              />
                            </div>
                            {formData.images[0] && (
                              <div className="mt-3 rounded-2xl overflow-hidden h-32 border-2 border-primary/10">
                                <img src={formData.images[0]} className="w-full h-full object-cover" alt="Preview Main" />
                              </div>
                            )}
                          </div>

                          {/* Gallery Images */}
                          <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {formData.images.slice(1).map((img, idx) => (
                              <div key={idx + 1} className="relative group animate-in slide-in-from-right-4">
                                <input 
                                  type="text" 
                                  value={img} 
                                  onChange={(e) => { 
                                    const imgs = [...formData.images]; 
                                    imgs[idx + 1] = e.target.value; 
                                    setFormData({...formData, images: imgs}); 
                                  }} 
                                  className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-5 pr-12 text-[11px] font-medium focus:border-primary" 
                                  placeholder={`Ảnh phụ ${idx + 1}...`} 
                                />
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const newImgs = formData.images.filter((_, i) => i !== idx + 1);
                                    setFormData({ ...formData, images: newImgs });
                                  }} 
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Pricing & Schedule - Simplified to Auto-only */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Cấu hình khung giờ (Tự động)</h4>
                      </div>

                      <div className="space-y-6">
                        {/* Auto-generator UI - Now the Primary Interface */}
                        <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-8 shadow-inner">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Zap size={14} fill="currentColor" />
                              </div>
                              <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Thiết lập nhanh</h5>
                            </div>
                            {formData.timeSlots.length > 0 && (
                              <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">
                                Đã tạo {formData.timeSlots.length} ca
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-6">
                             <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Giờ mở cửa trung tâm</label>
                               <div className="relative group cursor-pointer">
                                 <div className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-white transition-all duration-500 group-focus-within:scale-110 pointer-events-none">
                                   <Clock size={22} />
                                 </div>
                                 <input 
                                   type="time" 
                                   value={autoGen.startTime} 
                                   onClick={(e) => (e.currentTarget as any).showPicker?.()}
                                   onChange={(e) => setAutoGen({...autoGen, startTime: e.target.value})} 
                                   className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-3xl py-6 pl-20 pr-8 text-xl font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer" 
                                 />
                               </div>
                             </div>
                             <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Giờ đóng cửa trung tâm</label>
                               <div className="relative group cursor-pointer">
                                 <div className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-white transition-all duration-500 group-focus-within:scale-110 pointer-events-none">
                                   <Clock size={22} />
                                 </div>
                                 <input 
                                   type="time" 
                                   value={autoGen.endTime} 
                                   onClick={(e) => (e.currentTarget as any).showPicker?.()}
                                   onChange={(e) => setAutoGen({...autoGen, endTime: e.target.value})} 
                                   className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-3xl py-6 pl-20 pr-8 text-xl font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer" 
                                 />
                               </div>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời lượng mỗi trận</label>
                             <div className="grid grid-cols-4 gap-2">
                               {[1, 1.5, 2, 2.5].map(d => (
                                 <button key={d} type="button" onClick={() => setAutoGen({...autoGen, duration: d})} className={`py-3.5 rounded-2xl text-[10px] font-black border transition-all ${autoGen.duration === d ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-primary/30'}`}>{d}h</button>
                               ))}
                             </div>
                          </div>

                          <div className="space-y-3">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá thuê mặc định (VND)</label>
                             <div className="relative">
                               <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                               <input 
                                 type="text" 
                                 value={new Intl.NumberFormat('vi-VN').format(Number(autoGen.price))} 
                                 onChange={(e) => setAutoGen({...autoGen, price: e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')})} 
                                 className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-black focus:border-primary focus:outline-none" 
                               />
                             </div>
                          </div>

                          <button 
                            type="button" 
                            onClick={handleGenerateSlots} 
                            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                          >
                             <Zap size={16} fill="currentColor" />
                             Tự động phân bổ khung giờ
                          </button>
                        </div>

                        {/* Read-only Preview of Generated Slots */}
                        {formData.timeSlots.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Xem trước danh sách ({formData.timeSlots.length})</h5>
                              <button type="button" onClick={() => setFormData({...formData, timeSlots: []})} className="text-[9px] font-black text-red-400 uppercase hover:text-red-500">Xóa trắng</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                              {formData.timeSlots.map((ts, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                  <span className="text-[10px] font-black text-slate-600 dark:text-white/60">{ts.startTime} - {ts.endTime}</span>
                                  <span className="text-[9px] font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(Number(ts.price))}đ</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
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
                  form="pitch-form"
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
                      <span>{editingPitch ? 'Lưu thay đổi' : 'Xác nhận tạo sân'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MyPitches;
