import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, Star, X,
  LayoutGrid, List, Building2, MapPin, Activity, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterSport, setFilterSport] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterIndoor, setFilterIndoor] = useState<'all' | 'indoor' | 'outdoor'>('all');

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/pitches/my') as any;
      setPitches(res || []);
    } catch {
      setPitches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const PITCH_TYPE_NAME_TO_ID: Record<string, string> = {
    'Football5': '1', 'Football7': '2', 'Football11': '3',
    'Tennis': '4', 'Badminton': '5', 'Pickleball': '6',
    'Basketball': '7', 'Volleyball': '8', 'TableTennis': '9'
  };

  const normalizePitchTypeId = (rawType: unknown) => {
    if (typeof rawType === 'number') return rawType > 0 ? rawType.toString() : '1';
    if (typeof rawType === 'string') {
      if (PITCH_TYPE_NAME_TO_ID[rawType]) return PITCH_TYPE_NAME_TO_ID[rawType];
      const numericType = Number(rawType);
      if (Number.isFinite(numericType) && numericType > 0) return numericType.toString();
    }
    return '1';
  };

  const getPitchTypeId = (pitch: any) => normalizePitchTypeId(pitch.pitchType ?? pitch.type);

  const getPitchTypeLabel = (pitch: any) => {
    const pitchTypeId = getPitchTypeId(pitch);
    return SPORT_CATEGORIES.flatMap(cat => cat.types).find(type => type.id === pitchTypeId)?.label;
  };

  const filteredPitches = pitches.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const pitchTypeIdStr = getPitchTypeId(p);
    let category = '';
    for (const cat of SPORT_CATEGORIES) {
      if (cat.types.some(t => t.id === pitchTypeIdStr)) { category = cat.id; break; }
    }
    const matchesSport = filterSport === 'all' || category === filterSport;
    const matchesType = filterType === 'all' || pitchTypeIdStr === filterType;
    const matchesIndoor = filterIndoor === 'all' || (filterIndoor === 'indoor' ? p.isIndoor : !p.isIndoor);
    return matchesSearch && matchesSport && matchesType && matchesIndoor;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Assets Inventory</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Sân của tôi</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Quản lý hạ tầng và lịch thi đấu tại cơ sở của bạn.</p>
        </div>

        <button 
          onClick={() => navigate('/dashboard/owner/pitches/create')}
          className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> Thêm sân mới
        </button>
      </header>

      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm p-3">
        <div className="flex flex-col xl:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sân theo tên hoặc địa chỉ..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[1.75rem] py-5 pl-16 pr-8 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-blue-600'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-blue-600'}`}><List size={20} /></button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl">
          <Activity size={16} className="text-blue-600" />
          <select 
            value={filterSport} 
            onChange={(e) => { setFilterSport(e.target.value); setFilterType('all'); }}
            className="bg-transparent border-none py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer"
          >
            <option value="all">Mọi môn thể thao</option>
            {SPORT_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl">
          <LayoutGrid size={16} className="text-indigo-600" />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent border-none py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer"
          >
            <option value="all">Tất cả loại sân</option>
            {filterSport !== 'all' && SPORT_CATEGORIES.find(c => c.id === filterSport)?.types.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="flex p-1 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl">
          {(['all', 'indoor', 'outdoor'] as const).map(mode => (
            <button 
              key={mode}
              onClick={() => setFilterIndoor(mode)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterIndoor === mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'text-slate-400 hover:text-blue-600'}`}
            >
              {mode === 'all' ? 'Tất cả' : mode === 'indoor' ? 'Trong nhà' : 'Ngoài trời'}
            </button>
          ))}
        </div>

        {(filterSport !== 'all' || filterType !== 'all' || filterIndoor !== 'all' || search !== '') && (
          <button 
            onClick={() => { setFilterSport('all'); setFilterType('all'); setFilterIndoor('all'); setSearch(''); }}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
          >
            <X size={14} /> Xóa lọc
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-40 flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filteredPitches.length === 0 ? (
        <div className="text-center py-40 bg-white dark:bg-[#1E293B] rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
          <Building2 size={64} className="mx-auto mb-6 text-slate-100 dark:text-slate-800" />
          <h3 className="text-xl font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
            Không tìm thấy sân phù hợp
          </h3>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredPitches.map((p, i) => (
                <motion.div 
                  key={p.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group"
                >
                  <div className="h-56 relative overflow-hidden">
                    <img src={p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600"} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute top-5 left-5 flex gap-2">
                      <div className="px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl shadow-black/5">
                        {getPitchTypeLabel(p) || 'Standard'}
                      </div>
                    </div>
                    <div className="absolute top-5 right-5">
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/5 ${p.isIndoor ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {p.isIndoor ? 'Indoor' : 'Outdoor'}
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1.5">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 leading-tight">{p.name}</h3>
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                          <MapPin size={12} className="text-red-500" /> 
                          <span className="line-clamp-1">{p.address || 'Address not set'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                        <Star size={14} className="fill-current" />
                        <span className="text-sm font-black leading-none">{p.averageRating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800/50">
                      <div>
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1.5">Starting at</p>
                        <p className="text-2xl font-black text-blue-600">{new Intl.NumberFormat('vi-VN').format(p.minPrice || 0)} <span className="text-sm">đ</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/dashboard/owner/pitches/edit/${p.id}`)} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all"><Edit2 size={18} /></button>
                        <button onClick={() => { if(window.confirm("Xóa sân này?")) api.delete(`/pitches/${p.id}`).then(() => fetchPitches()) }} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pitch Information</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Type</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Base Price</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
                    <th className="px-8 py-6 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredPitches.map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0">
                            <img src={p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=100"} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-none mb-2">{p.name}</p>
                            <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                              <MapPin size={10} className="text-red-500" /> {p.address || 'Location N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
                          {getPitchTypeLabel(p) || 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-base font-black text-slate-900 dark:text-white">{new Intl.NumberFormat('vi-VN').format(p.minPrice || 0)}đ</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center">
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.isIndoor ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            {p.isIndoor ? 'Indoor' : 'Outdoor'}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => navigate(`/dashboard/owner/pitches/edit/${p.id}`)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-blue-600 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => { if(window.confirm("Xóa sân này?")) api.delete(`/pitches/${p.id}`).then(() => fetchPitches()) }} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm transition-all"><Trash2 size={16} /></button>
                          <button className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm transition-all"><ChevronRight size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default MyPitches;
