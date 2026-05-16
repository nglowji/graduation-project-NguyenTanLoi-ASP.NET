import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  Clock,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  Wand2,
} from 'lucide-react';
import api from '../../../services/api';

const SPORT_CATEGORIES = [
  { id: 'football', label: 'Bóng đá', types: [
    { id: '1', label: 'Sân 5' },
    { id: '2', label: 'Sân 7' },
    { id: '3', label: 'Sân 11' },
  ]},
  { id: 'tennis', label: 'Tennis', types: [{ id: '4', label: 'Sân chuẩn' }] },
  { id: 'badminton', label: 'Cầu lông', types: [{ id: '5', label: 'Sân chuẩn' }] },
  { id: 'pickleball', label: 'Pickleball', types: [{ id: '6', label: 'Sân chuẩn' }] },
  { id: 'basketball', label: 'Bóng rổ', types: [{ id: '7', label: 'Sân chuẩn' }] },
  { id: 'volleyball', label: 'Bóng chuyền', types: [{ id: '8', label: 'Sân chuẩn' }] },
  { id: 'table_tennis', label: 'Bóng bàn', types: [{ id: '9', label: 'Bàn chuẩn' }] },
];

const PITCH_TYPE_NAME_TO_ID: Record<string, string> = {
  Football5: '1',
  Football7: '2',
  Football11: '3',
  Tennis: '4',
  Badminton: '5',
  Pickleball: '6',
  Basketball: '7',
  Volleyball: '8',
  TableTennis: '9',
};

const PitchEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

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
    timeSlots: [] as { startTime: string; endTime: string; price: string }[],
  });
  const [autoGen, setAutoGen] = useState({
    startTime: '07:00',
    endTime: '22:00',
    duration: 1,
    price: '200000',
  });

  useEffect(() => {
    if (isEditing) fetchPitchData();
  }, [id]);

  const selectedCategory = useMemo(
    () => SPORT_CATEGORIES.find((category) => category.id === formData.sportCategory) || SPORT_CATEGORIES[0],
    [formData.sportCategory]
  );

  const coverImage = formData.images.find((image) => image.trim());

  const fetchPitchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/pitches/my') as any[];
      const pitch = res.find((item) => item.id === id);

      if (!pitch) {
        setError('Không tìm thấy sân này.');
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
      const category = SPORT_CATEGORIES.find((item) => item.types.some((type) => type.id === pitchTypeId))?.id || 'football';
      const activeTimeSlots = (pitch.timeSlots || []).filter((slot: any) => slot.isActive !== false);

      setFormData({
        name: pitch.name || '',
        address: pitch.address || '',
        description: pitch.description || '',
        sportCategory: category,
        pitchType: pitchTypeId,
        isIndoor: pitch.isIndoor || false,
        images: pitch.images?.length > 0 ? pitch.images.map((image: any) => image.imageUrl || image) : [''],
        timeSlots: activeTimeSlots.map((slot: any) => ({
          startTime: slot.startTime.substring(0, 5),
          endTime: slot.endTime.substring(0, 5),
          price: (slot.price ?? slot.amount ?? 0).toString(),
        })),
      });
    } catch {
      setError('Lỗi khi tải dữ liệu sân.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSlots = () => {
    const parseTime = (value: string) => {
      const [hour, minute] = value.split(':').map(Number);
      return hour * 60 + (minute || 0);
    };
    const formatTime = (value: number) => {
      const hour = Math.floor(value / 60);
      const minute = value % 60;
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    let current = parseTime(autoGen.startTime);
    const end = parseTime(autoGen.endTime);
    const duration = autoGen.duration * 60;

    if (end <= current || duration <= 0) {
      setError('Giờ đóng cửa phải sau giờ mở cửa và thời lượng phải hợp lệ.');
      return;
    }

    const peakStart = parseTime('17:00');
    const peakEnd = parseTime('22:00');
    const nextSlots = [];

    while (current + duration <= end) {
      let finalPrice = Number(autoGen.price) || 0;
      if (current < peakEnd && current + duration > peakStart) {
        finalPrice = Math.round((finalPrice * 1.2) / 1000) * 1000;
      }

      nextSlots.push({
        startTime: formatTime(current),
        endTime: formatTime(current + duration),
        price: finalPrice.toString(),
      });
      current += duration;
    }

    if (nextSlots.length === 0) {
      setError('Không thể tạo khung giờ với thiết lập này.');
      return;
    }

    setFormData({ ...formData, timeSlots: nextSlots });
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const timeSlots = formData.timeSlots.map((slot) => ({
        startTime: slot.startTime.includes(':') && slot.startTime.split(':').length === 2 ? `${slot.startTime}:00` : slot.startTime,
        endTime: slot.endTime.includes(':') && slot.endTime.split(':').length === 2 ? `${slot.endTime}:00` : slot.endTime,
        price: Number(slot.price) || 0,
      }));

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        pitchType: Number(formData.pitchType),
        isIndoor: formData.isIndoor,
        images: formData.images.filter((image) => image.trim() !== ''),
        timeSlots,
      };

      if (isEditing) {
        await api.put(`/pitches/${id}`, payload);
      } else {
        await api.post('/pitches', { ...payload, address: formData.address.trim() });
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
        <Loader2 className="animate-spin text-blue-600" size={42} />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải thông tin sân</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/owner/pitches')}
            className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Quay lại danh sách sân
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Pitch setup</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {isEditing ? 'Cập nhật thông tin sân' : 'Thêm sân mới'}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Thiết lập thông tin hiển thị, loại sân, hình ảnh và khung giờ đặt sân.</p>
        </div>

        <button
          type="submit"
          form="pitch-editor-form"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isEditing ? 'Lưu thay đổi' : 'Đăng sân'}
        </button>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <form id="pitch-editor-form" onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Thông tin sân</h2>
                <p className="text-xs font-bold text-slate-400">Tên, địa chỉ, mô tả và loại sân.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Tên sân</label>
                <input
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  placeholder="VD: Sân số 1 - Khu A"
                />
              </div>

              {!isEditing && (
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Địa chỉ cụ thể</label>
                  <input
                    value={formData.address}
                    onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    placeholder="VD: 123 Đường số 4, Quận..."
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Môn thể thao</label>
                  <select
                    value={formData.sportCategory}
                    onChange={(event) => {
                      const category = SPORT_CATEGORIES.find((item) => item.id === event.target.value);
                      setFormData({ ...formData, sportCategory: event.target.value, pitchType: category?.types[0].id || '1' });
                    }}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    {SPORT_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Loại sân</label>
                  <select
                    value={formData.pitchType}
                    onChange={(event) => setFormData({ ...formData, pitchType: event.target.value })}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    {selectedCategory.types.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Hình thức sân</label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isIndoor: false })}
                    className={`h-11 rounded-lg text-sm font-black transition ${!formData.isIndoor ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}
                  >
                    Ngoài trời
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isIndoor: true })}
                    className={`h-11 rounded-lg text-sm font-black transition ${formData.isIndoor ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}
                  >
                    Trong nhà
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Mô tả chi tiết</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="min-h-[130px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  placeholder="Thông tin về chất lượng mặt sân, hệ thống đèn, tiện ích đi kèm..."
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Khung giờ & giá</h2>
                <p className="text-xs font-bold text-slate-400">Tạo nhanh lịch đặt, có tự tăng giá khung giờ cao điểm.</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/40">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Wand2 size={15} className="text-blue-600" />
                Tạo nhanh khung giờ
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <input type="time" value={autoGen.startTime} onChange={(event) => setAutoGen({ ...autoGen, startTime: event.target.value })} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
                <input type="time" value={autoGen.endTime} onChange={(event) => setAutoGen({ ...autoGen, endTime: event.target.value })} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
                <input type="number" step="0.5" value={autoGen.duration} onChange={(event) => setAutoGen({ ...autoGen, duration: Number(event.target.value) })} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" placeholder="Số giờ" />
                <input type="number" value={autoGen.price} onChange={(event) => setAutoGen({ ...autoGen, price: event.target.value })} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" placeholder="Giá" />
              </div>
              <button type="button" onClick={handleGenerateSlots} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700">
                <Wand2 size={17} />
                Áp dụng khung giờ
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {formData.timeSlots.map((slot, index) => (
                <div key={`${slot.startTime}-${index}`} className="grid grid-cols-[1fr_1fr_1.2fr_38px] gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                  <input type="time" value={slot.startTime} onChange={(event) => {
                    const slots = [...formData.timeSlots];
                    slots[index].startTime = event.target.value;
                    setFormData({ ...formData, timeSlots: slots });
                  }} className="h-9 rounded-lg bg-slate-50 px-2 text-xs font-black outline-none dark:bg-slate-900 dark:text-white" />
                  <input type="time" value={slot.endTime} onChange={(event) => {
                    const slots = [...formData.timeSlots];
                    slots[index].endTime = event.target.value;
                    setFormData({ ...formData, timeSlots: slots });
                  }} className="h-9 rounded-lg bg-slate-50 px-2 text-xs font-black outline-none dark:bg-slate-900 dark:text-white" />
                  <input type="number" value={slot.price} onChange={(event) => {
                    const slots = [...formData.timeSlots];
                    slots[index].price = event.target.value;
                    setFormData({ ...formData, timeSlots: slots });
                  }} className="h-9 rounded-lg bg-blue-50 px-2 text-right text-xs font-black text-blue-700 outline-none dark:bg-blue-950/40" />
                  <button type="button" onClick={() => setFormData({ ...formData, timeSlots: formData.timeSlots.filter((_, itemIndex) => itemIndex !== index) })} className="grid h-9 place-items-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, timeSlots: [...formData.timeSlots, { startTime: '07:00', endTime: '08:00', price: autoGen.price }] })}
                className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-sm font-black text-slate-400 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-800"
              >
                <Plus size={17} />
                Thêm khung giờ lẻ
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Camera size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Hình ảnh</h2>
                <p className="text-xs font-bold text-slate-400">Ảnh đầu tiên sẽ làm ảnh chính.</p>
              </div>
            </div>

            <div className="mb-4 grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              {coverImage ? <img src={coverImage} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={36} className="text-slate-300" />}
            </div>

            <div className="space-y-3">
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={image}
                    onChange={(event) => {
                      const images = [...formData.images];
                      images[index] = event.target.value;
                      setFormData({ ...formData, images });
                    }}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold outline-none focus:border-blue-300 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    placeholder={index === 0 ? 'Link ảnh chính...' : 'Link ảnh mô tả...'}
                  />
                  {index > 0 && (
                    <button type="button" onClick={() => setFormData({ ...formData, images: formData.images.filter((_, itemIndex) => itemIndex !== index) })} className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-xs font-black text-slate-400 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-800">
                <Plus size={16} />
                Thêm ảnh
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tóm tắt</p>
            <div className="mt-4 space-y-3 text-sm font-bold">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Môn</span>
                <span className="text-right text-slate-800 dark:text-slate-200">{selectedCategory.label}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Loại</span>
                <span className="text-right text-slate-800 dark:text-slate-200">{selectedCategory.types.find((type) => type.id === formData.pitchType)?.label}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Hình thức</span>
                <span className="text-right text-slate-800 dark:text-slate-200">{formData.isIndoor ? 'Trong nhà' : 'Ngoài trời'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Khung giờ</span>
                <span className="text-right text-slate-800 dark:text-slate-200">{formData.timeSlots.length}</span>
              </div>
            </div>
            {!isEditing && formData.address && (
              <div className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:bg-slate-800">
                <MapPin size={15} className="shrink-0 text-blue-600" />
                {formData.address}
              </div>
            )}
          </section>
        </aside>
      </form>
    </div>
  );
};

export default PitchEditor;
