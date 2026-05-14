import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertCircle, Zap, Save, Loader2 } from 'lucide-react';
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

const PITCH_TYPE_NAME_TO_ID: Record<string, string> = {
  'Football5': '1', 'Football7': '2', 'Football11': '3',
  'Tennis': '4', 'Badminton': '5', 'Pickleball': '6',
  'Basketball': '7', 'Volleyball': '8', 'TableTennis': '9'
};

const PitchEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    sportCategory: 'football',
    pitchType: '1',
    isIndoor: false,
    images: [''],
    timeSlots: [] as { startTime: string, endTime: string, price: string }[]
  });

  const [autoGen, setAutoGen] = useState({
    startTime: '07:00',
    endTime: '22:00',
    duration: 1,
    price: '200000'
  });


  useEffect(() => {
    if (isEditing) {
      fetchPitchData();
    }
  }, [id]);

  const fetchPitchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/pitches/my') as any[];
      const pitch = res.find(p => p.id === id);
      
      if (!pitch) {
        setError('Không tìm thấy sân thi đấu này.');
        return;
      }

      const normalizePitchTypeId = (rawType: unknown) => {
        if (typeof rawType === 'number') return rawType > 0 ? rawType.toString() : '1';
        if (typeof rawType === 'string') {
          if (PITCH_TYPE_NAME_TO_ID[rawType]) return PITCH_TYPE_NAME_TO_ID[rawType];
          const numericType = Number(rawType);
          if (Number.isFinite(numericType) && numericType > 0) return numericType.toString();
        }
        return '1';
      };

      const pitchTypeId = normalizePitchTypeId(pitch.pitchType ?? pitch.type);
      let category = 'football';
      for (const cat of SPORT_CATEGORIES) {
        if (cat.types.some(t => t.id === pitchTypeId)) {
          category = cat.id;
          break;
        }
      }

      const activeTimeSlots = (pitch.timeSlots || []).filter((ts: any) => ts.isActive !== false);

      setFormData({
        name: pitch.name || '',
        address: pitch.address || '',
        description: pitch.description || '',
        sportCategory: category,
        pitchType: pitchTypeId,
        isIndoor: pitch.isIndoor || false,
        images: pitch.images?.length > 0 ? pitch.images.map((img: any) => img.imageUrl || img) : [''],
        timeSlots: activeTimeSlots.map((ts: any) => ({
          startTime: ts.startTime.substring(0, 5),
          endTime: ts.endTime.substring(0, 5),
          price: (ts.price ?? ts.amount ?? 0).toString()
        }))
      });
    } catch (err: any) {
      setError('Lỗi khi tải dữ liệu sân.');
    } finally {
      setIsLoading(false);
    }
  };

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

    const peakStart = parseTime('17:00');
    const peakEnd = parseTime('22:00');

    const newSlots = [];
    while (current + dur <= end) {
      let finalPrice = parseInt(autoGen.price);
      
      // Kiểm tra nếu khung giờ nằm trong hoặc giao với Giờ Vàng (17h - 22h)
      if (current < peakEnd && (current + dur) > peakStart) {
        finalPrice = Math.round((finalPrice * 1.2) / 1000) * 1000; // Tăng 20% và làm tròn
      }

      newSlots.push({
        startTime: formatTime(current),
        endTime: formatTime(current + dur),
        price: finalPrice.toString()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const buildTimeSlots = formData.timeSlots.map(ts => ({
        startTime: ts.startTime.includes(':') && ts.startTime.split(':').length === 2 ? ts.startTime + ':00' : ts.startTime,
        endTime: ts.endTime.includes(':') && ts.endTime.split(':').length === 2 ? ts.endTime + ':00' : ts.endTime,
        price: parseFloat(ts.price) || 0
      }));

      const payload = {
        name: formData.name,
        description: formData.description,
        pitchType: parseInt(formData.pitchType, 10),
        isIndoor: formData.isIndoor,
        images: formData.images.filter(i => i.trim() !== ''),
        timeSlots: buildTimeSlots
      };

      if (isEditing) {
        await api.put(`/pitches/${id}`, payload);
      } else {
        await api.post('/pitches', {
          ...payload,
          address: formData.address
        });
      }
      
      navigate('/dashboard/owner/pitches');
    } catch (err: any) {
      if (err?.errors) {
        setError(Object.values(err.errors).flat().join(', '));
      } else {
        setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-700">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Synchronizing infrastructure...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-in fade-in duration-500">
      <header className="mb-12">
        <button 
          onClick={() => navigate('/dashboard/owner/pitches')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Quay lại danh sách</span>
        </button>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {isEditing ? 'Cập nhật thông tin sân' : 'Thêm sân bóng mới'}
        </h1>
        <p className="text-slate-500 mt-2">Điền đầy đủ các thông tin bên dưới để quản lý sân hiệu quả hơn.</p>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <span className="font-bold text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* THÔNG TIN CHÍNH */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-4">1. Thông tin cơ bản</h2>
          
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tên sân thi đấu *</label>
            <input 
              required type="text" value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              placeholder="Ví dụ: Sân số 1 - Khu A" 
            />
          </div>

          {!isEditing && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Địa chỉ cụ thể</label>
              <input 
                type="text" value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="VD: 123 Đường số 4, Quận..." 
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Môn thể thao</label>
              <select 
                value={formData.sportCategory}
                onChange={(e) => {
                  const cat = SPORT_CATEGORIES.find(c => c.id === e.target.value);
                  setFormData({...formData, sportCategory: e.target.value, pitchType: cat?.types[0].id || '1'});
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {SPORT_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Loại sân</label>
              <select 
                value={formData.pitchType}
                onChange={(e) => setFormData({...formData, pitchType: e.target.value})}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {(SPORT_CATEGORIES.find(c => c.id === formData.sportCategory) || SPORT_CATEGORIES[0]).types.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Hình thức sân</label>
            <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setFormData({...formData, isIndoor: false})} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!formData.isIndoor ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Sân ngoài trời</button>
              <button type="button" onClick={() => setFormData({...formData, isIndoor: true})} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.isIndoor ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Sân trong nhà</button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Mô tả chi tiết</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]" 
              placeholder="Thông tin về chất lượng cỏ, hệ thống đèn..." 
            />
          </div>
        </div>

        {/* LỊCH TRÌNH */}
        <div className="space-y-6 pt-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-4">2. Khung giờ & Giá tiền</h2>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <Zap size={16} className="text-blue-600" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Công cụ tạo nhanh danh sách</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Giờ mở</label>
                <input type="time" value={autoGen.startTime} onChange={(e) => setAutoGen({...autoGen, startTime: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Giờ đóng</label>
                <input type="time" value={autoGen.endTime} onChange={(e) => setAutoGen({...autoGen, endTime: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Suất (Giờ)</label>
                <input type="number" step="0.5" value={autoGen.duration} onChange={(e) => setAutoGen({...autoGen, duration: parseFloat(e.target.value)})} className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Giá sàn</label>
                <input type="number" value={autoGen.price} onChange={(e) => setAutoGen({...autoGen, price: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button 
              type="button" onClick={handleGenerateSlots}
              className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Tự động áp dụng khung giờ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.timeSlots.map((ts, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl group">
                <div className="flex items-center gap-2">
                  <input type="time" value={ts.startTime} onChange={(e) => {
                    const slots = [...formData.timeSlots]; slots[idx].startTime = e.target.value; setFormData({...formData, timeSlots: slots});
                  }} className="font-bold text-slate-900 dark:text-white outline-none w-16 text-sm" />
                  <span className="text-slate-300">-</span>
                  <input type="time" value={ts.endTime} onChange={(e) => {
                    const slots = [...formData.timeSlots]; slots[idx].endTime = e.target.value; setFormData({...formData, timeSlots: slots});
                  }} className="font-bold text-slate-900 dark:text-white outline-none w-16 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={ts.price} onChange={(e) => {
                    const slots = [...formData.timeSlots]; slots[idx].price = e.target.value; setFormData({...formData, timeSlots: slots});
                  }} className="font-bold text-blue-600 outline-none w-24 text-right text-sm" />
                  <button type="button" onClick={() => setFormData({...formData, timeSlots: formData.timeSlots.filter((_, i) => i !== idx)})} className="p-1 text-slate-200 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, timeSlots: [...formData.timeSlots, { startTime: '07:00', endTime: '08:00', price: autoGen.price }] })}
              className="flex items-center justify-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 font-bold text-sm hover:border-blue-500 hover:text-blue-500 transition-all"
            >
              + Thêm khung giờ lẻ
            </button>
          </div>
        </div>

        {/* HÌNH ẢNH */}
        <div className="space-y-6 pt-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-4">3. Hình ảnh sân bóng</h2>
          <div className="grid grid-cols-1 gap-4">
            {formData.images.map((img, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="text" value={img} 
                    onChange={(e) => { const imgs = [...formData.images]; imgs[idx] = e.target.value; setFormData({...formData, images: imgs}); }} 
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder={idx === 0 ? "Nhập link ảnh bìa chính..." : "Nhập link ảnh mô tả..."} 
                  />
                  {idx > 0 && (
                    <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})} className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                {img && <img src={img} className="w-40 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" alt="Preview" />}
              </div>
            ))}
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}
              className="w-full py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 font-bold text-sm hover:border-blue-500 hover:text-blue-500 transition-all"
            >
              + Thêm ảnh khác
            </button>
          </div>
        </div>

        {/* LƯU */}
        <div className="flex flex-col sm:flex-row gap-4 pt-10">
          <button 
            type="submit" disabled={isSubmitting}
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {isEditing ? 'Lưu thay đổi' : 'Đăng sân ngay'}
          </button>
          <button 
            type="button" onClick={() => navigate('/dashboard/owner/pitches')}
            className="sm:w-32 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-200 transition-all"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default PitchEditor;
