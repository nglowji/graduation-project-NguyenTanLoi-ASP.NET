import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  Clock,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import api from '../../../services/api';
import { useVietnamLocations } from '../../../hooks/useVietnamLocations';

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

type PitchFormState = {
  name: string;
  address: string;
  mapLink: string;
  description: string;
  sportCategory: string;
  pitchType: string;
  isIndoor: boolean;
  images: string[];
  timeSlots: { startTime: string; endTime: string; price: string }[];
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

const toTimeInputValue = (value: unknown) => {
  const text = String(value || '');
  return text.includes(':') ? text.substring(0, 5) : '';
};

const toAddressInputValue = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.fullAddress
    || [value.street, value.ward, value.district, value.city].filter(Boolean).join(', ');
};

const toApiTimeValue = (value: string) => value.length === 5 ? `${value}:00` : value;
const resolveLocalImageUrl = (value?: string) => String(value || '').replace('http://localhost:5164', 'http://127.0.0.1:5164');

const parseMoneyInput = (value: string | number) => {
  const normalized = String(value || '').replace(/\D/g, '');
  return normalized ? Number(normalized) : 0;
};

const formatMoneyInput = (value: string | number) => {
  const amount = parseMoneyInput(value);
  return amount > 0 ? new Intl.NumberFormat('vi-VN').format(amount) : '';
};

const parseMinutes = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.NaN;
  return hour * 60 + minute;
};

const formatTimeFromMinutes = (value: number) => {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const formatSlotTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const normalizeSlotTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return value;

  const hourText = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2);
  const minuteText = digits.length === 3 ? digits.slice(1) : digits.slice(2);
  const hour = Math.min(Number(hourText) || 0, 23);
  const minute = Math.min(Number(minuteText) || 0, 59);

  return formatTimeFromMinutes(hour * 60 + minute);
};

type MapCoordinates = {
  latitude: number;
  longitude: number;
};

const extractCoordinatesFromGoogleMapLink = (value: string): MapCoordinates | null => {
  const text = value.trim();
  if (!text) return null;

  try {
    const decoded = decodeURIComponent(text.replace(/\+/g, ' '));
    const patterns = [
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
      /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i,
    ];

    for (const pattern of patterns) {
      const match = decoded.match(pattern);
      if (match) {
        return {
          latitude: Number(match[1]),
          longitude: Number(match[2]),
        };
      }
    }
  } catch {
    return null;
  }

  return null;
};

const extractSearchTextFromMapInput = (value: string) => {
  const text = value.trim();
  if (!text) return '';

  try {
    const decoded = decodeURIComponent(text.replace(/\+/g, ' '));
    const queryMatch = decoded.match(/[?&]q=([^&]+)/i);
    if (queryMatch?.[1]) return queryMatch[1].replace(/\s+/g, ' ').trim();

    const placeMatch = decoded.match(/\/place\/([^/@?]+)/i);
    if (placeMatch?.[1]) return placeMatch[1].replace(/\s+/g, ' ').trim();

    return decoded;
  } catch {
    return text;
  }
};

const geocodeMapInput = async (mapInput: string, fallbackAddress: string): Promise<MapCoordinates | null> => {
  const directCoordinates = extractCoordinatesFromGoogleMapLink(mapInput);
  if (directCoordinates) return directCoordinates;

  const query = extractSearchTextFromMapInput(mapInput) || fallbackAddress.trim();
  if (!query || /^https?:\/\//i.test(query)) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', query);
  url.searchParams.set('accept-language', 'vi');

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;
  if (!first?.lat || !first?.lon) return null;

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
  };
};

const TIME_HOURS = Array.from({ length: 24 }, (_, index) => index);
const TIME_MINUTES = [0, 15, 30, 45];

type TimePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const InlineTimePicker: React.FC<TimePickerProps> = ({ label, value, onChange }) => {
  const [hourText, minuteText] = value.split(':');
  const selectedHour = Number(hourText || 0);
  const selectedMinute = Number(minuteText || 0);

  const commit = (hour: number, minute: number) => {
    onChange(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  };

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/40">{value}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={selectedHour}
          onChange={(event) => commit(Number(event.target.value), selectedMinute)}
          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        >
          {TIME_HOURS.map((hour) => (
            <option key={hour} value={hour}>{hour.toString().padStart(2, '0')} giờ</option>
          ))}
        </select>
        <select
          value={selectedMinute}
          onChange={(event) => commit(selectedHour, Number(event.target.value))}
          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-300 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        >
          {TIME_MINUTES.map((minute) => (
            <option key={minute} value={minute}>{minute.toString().padStart(2, '0')} phút</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const PitchEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<PitchFormState>({
    name: '',
    address: '',
    mapLink: '',
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
  const [autoGenerateError, setAutoGenerateError] = useState('');
  const [autoGenTouched, setAutoGenTouched] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [provinceCode, setProvinceCode] = useState<number>();
  const [districtCode, setDistrictCode] = useState<number>();
  const [wardName, setWardName] = useState('');
  const { provinces, districts, wards } = useVietnamLocations(provinceCode, districtCode);

  useEffect(() => {
    if (isEditing) fetchPitchData();
  }, [id]);

  const selectedCategory = useMemo(
    () => SPORT_CATEGORIES.find((category) => category.id === formData.sportCategory) || SPORT_CATEGORIES[0],
    [formData.sportCategory]
  );

  const coverImage = formData.images.find((image) => image.trim());

  const uploadImages = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
    if (imageFiles.length === 0) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
      return;
    }

    setIsUploadingImages(true);
    setError('');
    try {
      const uploadedUrls = await Promise.all(imageFiles.map(async (file) => {
        const payload = new FormData();
        payload.append('file', file);
        const response: any = await api.post('/pitches/images', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
        return response.imageUrl || response.data?.imageUrl;
      }));
      setFormData((current) => ({ ...current, images: [...current.images.filter(Boolean), ...uploadedUrls.filter(Boolean)] }));
    } catch (uploadError: any) {
      setError(uploadError.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const buildGeneratedSlots = () => {
    let current = parseMinutes(autoGen.startTime);
    const end = parseMinutes(autoGen.endTime);
    const duration = Number(autoGen.duration) * 60;
    const basePrice = parseMoneyInput(autoGen.price);

    if (
      !Number.isFinite(current) ||
      !Number.isFinite(end) ||
      end <= current ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !Number.isFinite(basePrice) ||
      basePrice <= 0
    ) {
      return {
        slots: [] as PitchFormState['timeSlots'],
        error: 'Giờ kết thúc phải sau giờ bắt đầu, thời lượng và giá phải hợp lệ.',
      };
    }

    const nextSlots: PitchFormState['timeSlots'] = [];

    while (current + duration <= end) {
      nextSlots.push({
        startTime: formatTimeFromMinutes(current),
        endTime: formatTimeFromMinutes(current + duration),
        price: basePrice.toString(),
      });
      current += duration;
    }

    if (nextSlots.length === 0) {
      return {
        slots: nextSlots,
        error: 'Không thể tạo khung giờ với thiết lập này.',
      };
    }

    return { slots: nextSlots, error: '' };
  };

  const updateAutoGen = (nextAutoGen: typeof autoGen) => {
    setAutoGenTouched(true);
    setAutoGen(nextAutoGen);
  };

  useEffect(() => {
    if (isLoading || (isEditing && !autoGenTouched)) return;

    const generated = buildGeneratedSlots();
    setAutoGenerateError(generated.error);

    if (!generated.error) {
      setFormData((currentForm) => ({ ...currentForm, timeSlots: generated.slots }));
    }
  }, [autoGen.startTime, autoGen.endTime, autoGen.duration, autoGen.price, isEditing, isLoading, autoGenTouched]);

  const handleMapLinkChange = (value: string) => {
    setFormData((currentForm) => ({
      ...currentForm,
      mapLink: value,
    }));
  };

  const fetchPitchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/pitches/my') as any[];
      const pitch = res.find((item) => item.id === id);

      if (!pitch) {
        setError('Không tìm thấy sân này.');
        return;
      }

      const pitchTypeId = normalizePitchTypeId(pitch.pitchType ?? pitch.type);
      const category = SPORT_CATEGORIES.find((item) => item.types.some((type) => type.id === pitchTypeId))?.id || 'football';
      const activeTimeSlots = (pitch.timeSlots || []).filter((slot: any) => slot.isActive !== false);
      const mappedTimeSlots = activeTimeSlots.map((slot: any) => ({
        startTime: toTimeInputValue(slot.startTime),
        endTime: toTimeInputValue(slot.endTime),
        price: (slot.price ?? slot.amount ?? 0).toString(),
      }));

      if (mappedTimeSlots.length > 0) {
        const sortedSlots = [...mappedTimeSlots].sort((a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime));
        const firstSlot = sortedSlots[0];
        const lastSlot = sortedSlots[sortedSlots.length - 1];
        const durationMinutes = Math.max(parseMinutes(firstSlot.endTime) - parseMinutes(firstSlot.startTime), 30);

        setAutoGen({
          startTime: firstSlot.startTime,
          endTime: lastSlot.endTime,
          duration: durationMinutes / 60,
          price: firstSlot.price,
        });
        setAutoGenTouched(false);
      }

      setFormData({
        name: pitch.name || '',
        address: toAddressInputValue(pitch.address),
        mapLink: pitch.mapLink || '',
        description: pitch.description || '',
        sportCategory: category,
        pitchType: pitchTypeId,
        isIndoor: pitch.isIndoor || false,
        images: pitch.images?.length > 0 ? pitch.images.map((image: any) => image.imageUrl || image) : [''],
        timeSlots: mappedTimeSlots,
      });
    } catch {
      setError('Lỗi khi tải dữ liệu sân.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateTimeSlots = () => {
    if (formData.timeSlots.length === 0) {
      return 'Vui lòng thêm ít nhất một khung giờ.';
    }

    const normalized = formData.timeSlots.map((slot, index) => ({
      index,
      start: parseMinutes(slot.startTime),
      end: parseMinutes(slot.endTime),
      price: parseMoneyInput(slot.price),
    }));

    const invalid = normalized.find((slot) =>
      !Number.isFinite(slot.start) ||
      !Number.isFinite(slot.end) ||
      slot.end <= slot.start ||
      !Number.isFinite(slot.price) ||
      slot.price <= 0
    );

    if (invalid) {
      return `Khung giờ ${invalid.index + 1} chưa hợp lệ. Giờ kết thúc phải sau giờ bắt đầu và giá phải lớn hơn 0.`;
    }

    const sorted = [...normalized].sort((a, b) => a.start - b.start);
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index].start < sorted[index - 1].end) {
        return `Khung giờ ${sorted[index - 1].index + 1} và ${sorted[index].index + 1} đang bị trùng nhau.`;
      }
    }

    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const validationError = validateTimeSlots();
      if (validationError) {
        setError(validationError);
        return;
      }

      const timeSlots = formData.timeSlots.map((slot) => ({
        startTime: toApiTimeValue(slot.startTime),
        endTime: toApiTimeValue(slot.endTime),
        price: parseMoneyInput(slot.price),
      }));

      const mapCoordinates = await geocodeMapInput(formData.mapLink, formData.address);
      const payload = {
        name: `Sân ${selectedCategory.label}`,
        description: formData.description.trim(),
        pitchType: Number(formData.pitchType),
        isIndoor: formData.isIndoor,
        images: formData.images.map((image) => image.trim()).filter(Boolean),
        timeSlots,
        services: [],
        address: [formData.address.trim(), wardName, districts.find((district) => district.code === districtCode)?.name, provinces.find((province) => province.code === provinceCode)?.name].filter(Boolean).join(', '),
        mapLink: formData.mapLink.trim() || undefined,
        latitude: mapCoordinates?.latitude,
        longitude: mapCoordinates?.longitude,
      };

      if (isEditing) {
        await api.put(`/pitches/${id}`, payload);
      } else {
        await api.post('/pitches', payload);
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
    <div className="mx-auto max-w-[1500px] min-w-0 space-y-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate('/dashboard/owner/pitches')}
            className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Quay lại danh sách sân
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Pitch setup</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {isEditing ? 'Cập nhật thông tin sân' : 'Thêm sân mới'}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Thiết lập thông tin hiển thị, loại sân, hình ảnh và khung giờ đặt sân.</p>
        </div>

        <button
          type="submit"
          form="pitch-editor-form"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isEditing ? 'Lưu thay đổi' : 'Đăng sân'}
        </button>
      </header>

      <div className="hidden">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"><span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[9px] text-blue-700">1</span>Thông tin sân</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600"><span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[9px] text-slate-500">2</span>Khung giờ và giá</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600"><span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[9px] text-slate-500">3</span>Ảnh hiển thị</span>
      </div>

      {error && (
        <div className="flex min-w-0 items-start gap-3 overflow-hidden rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form id="pitch-editor-form" onSubmit={handleSubmit} className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div className="min-w-0 space-y-6">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
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
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">Tên sân sẽ dùng theo tên cơ sở đã đăng ký của chủ sân.</div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Link Google Maps nếu có</label>
                    <div className="relative">
                      <LinkIcon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={formData.mapLink}
                        onChange={(event) => handleMapLinkChange(event.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        placeholder="Dán link /place, ?q= hoặc tọa độ"
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
                      Link này chỉ dùng để lấy đúng tọa độ marker trên bản đồ.
                    </p>
                  </div>

                  <div><label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Tỉnh / Thành phố</label><select value={provinceCode || ''} onChange={(event) => { setProvinceCode(Number(event.target.value) || undefined); setDistrictCode(undefined); setWardName(''); }} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-300"><option value="">Chọn tỉnh / thành</option>{provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}</select></div>
                </div>

              <div className="grid gap-4 md:grid-cols-3"><div><label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Quận / Huyện</label><select disabled={!provinceCode} value={districtCode || ''} onChange={(event) => { setDistrictCode(Number(event.target.value) || undefined); setWardName(''); }} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-300 disabled:opacity-50"><option value="">Chọn quận / huyện</option>{districts.map((district) => <option key={district.code} value={district.code}>{district.name}</option>)}</select></div><div><label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Phường / Xã</label><select disabled={!districtCode} value={wardName} onChange={(event) => setWardName(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-300 disabled:opacity-50"><option value="">Chọn phường / xã</option>{wards.map((ward) => <option key={ward.code} value={ward.name}>{ward.name}</option>)}</select></div><div><label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Địa chỉ cụ thể</label><input value={formData.address} onChange={(event) => setFormData({ ...formData, address: event.target.value })} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white" placeholder="Số nhà, tên đường" /></div></div>

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

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Khung giờ & giá</h2>
                <p className="text-xs font-bold text-slate-400">Tạo nhanh lịch đặt, có tự tăng giá khung giờ cao điểm.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40 sm:p-4">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Wand2 size={15} className="text-blue-600" />
                Tạo nhanh khung giờ
              </div>
              <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <InlineTimePicker label="Bắt đầu" value={autoGen.startTime} onChange={(startTime) => updateAutoGen({ ...autoGen, startTime })} />
                <InlineTimePicker label="Kết thúc" value={autoGen.endTime} onChange={(endTime) => updateAutoGen({ ...autoGen, endTime })} />
              </div>

              <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-[0.8fr_1.2fr]">
                <label className="min-w-0">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Mỗi khung</span>
                  <input type="number" min="0.5" step="0.5" value={autoGen.duration} onChange={(event) => updateAutoGen({ ...autoGen, duration: Number(event.target.value) })} className="h-12 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-white" placeholder="Số giờ" />
                </label>
                <label className="min-w-0">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Giá thường</span>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatMoneyInput(autoGen.price)}
                      onChange={(event) => updateAutoGen({ ...autoGen, price: event.target.value.replace(/\D/g, '') })}
                      className="h-12 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 pr-11 text-right text-sm font-black outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      placeholder="200.000"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">đ</span>
                  </div>
                </label>
              </div>
              <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${
                autoGenerateError
                  ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300'
                  : 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
              }`}>
                {autoGenerateError || `Đã tự tạo ${formData.timeSlots.length} khung giờ cùng mức giá ${formatMoneyInput(autoGen.price)}đ.`}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Danh sách khung giờ</h3>
                <p className="text-xs font-semibold text-slate-400">Có thể chỉnh từng khung sau khi hệ thống tự chia.</p>
              </div>
              <span className="inline-flex h-8 w-fit items-center rounded-full bg-slate-100 px-3 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {formData.timeSlots.length} khung
              </span>
            </div>

            <div className="mt-3 grid min-w-0 gap-2">
              {formData.timeSlots.map((slot, index) => (
                <div key={`${slot.startTime}-${index}`} className="grid min-w-0 grid-cols-[1fr_auto_1fr_minmax(112px,1.15fr)_34px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-100/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    aria-label={`Giờ bắt đầu khung ${index + 1}`}
                    title="Giờ bắt đầu"
                    value={slot.startTime}
                    onChange={(event) => {
                      const slots = [...formData.timeSlots];
                      slots[index].startTime = formatSlotTimeInput(event.target.value);
                      setFormData({ ...formData, timeSlots: slots });
                    }}
                    onBlur={() => {
                      const slots = [...formData.timeSlots];
                      slots[index].startTime = normalizeSlotTimeInput(slot.startTime);
                      setFormData({ ...formData, timeSlots: slots });
                    }}
                    className="h-9 min-w-0 w-full rounded-lg bg-slate-50 px-1.5 text-center text-[12px] font-black leading-none outline-none transition placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-900 dark:text-white"
                    placeholder="07:00"
                  />
                  <span className="text-center text-xs font-black text-slate-300">-</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    aria-label={`Giờ kết thúc khung ${index + 1}`}
                    title="Giờ kết thúc"
                    value={slot.endTime}
                    onChange={(event) => {
                      const slots = [...formData.timeSlots];
                      slots[index].endTime = formatSlotTimeInput(event.target.value);
                      setFormData({ ...formData, timeSlots: slots });
                    }}
                    onBlur={() => {
                      const slots = [...formData.timeSlots];
                      slots[index].endTime = normalizeSlotTimeInput(slot.endTime);
                      setFormData({ ...formData, timeSlots: slots });
                    }}
                    className="h-9 min-w-0 w-full rounded-lg bg-slate-50 px-1.5 text-center text-[12px] font-black leading-none outline-none transition placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-900 dark:text-white"
                    placeholder="08:00"
                  />
                  <div className="relative min-w-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Giá khung ${index + 1}`}
                      value={formatMoneyInput(slot.price)}
                      onChange={(event) => {
                        const slots = [...formData.timeSlots];
                        slots[index].price = event.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, timeSlots: slots });
                      }}
                      className="h-9 min-w-0 w-full rounded-lg bg-blue-50 px-2 pr-7 text-right text-[12px] font-black text-blue-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:bg-blue-950/40"
                      placeholder="200.000"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-400">đ</span>
                  </div>
                  <button type="button" onClick={() => setFormData({ ...formData, timeSlots: formData.timeSlots.filter((_, itemIndex) => itemIndex !== index) })} className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {formData.timeSlots.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950/50">
                  Chưa có khung giờ. Dùng tạo nhanh hoặc thêm từng khung giờ bên dưới.
                </div>
              )}
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

        <aside className="min-w-0 space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
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
              {coverImage ? <img src={resolveLocalImageUrl(coverImage)} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={36} className="text-slate-300" />}
            </div>

            <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => { if (event.target.files) uploadImages(event.target.files); event.target.value = ''; }} />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); uploadImages(event.dataTransfer.files); }}
              className="mb-4 flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 px-4 text-center transition hover:border-blue-500 hover:bg-blue-50"
            >
              {isUploadingImages ? <Loader2 size={22} className="animate-spin text-blue-600" /> : <Upload size={22} className="text-blue-600" />}
              <span className="text-xs font-black text-slate-800">{isUploadingImages ? 'Đang tải ảnh...' : 'Kéo thả ảnh vào đây hoặc chọn từ thiết bị'}</span>
              <span className="text-[10px] font-semibold text-slate-500">JPG, PNG, WEBP. Tối đa 10 MB mỗi ảnh.</span>
            </button>

            <div className="space-y-3">
              {formData.images.map((image, index) => (
                <div key={index} className="flex min-w-0 gap-2">
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

          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tóm tắt</p>
            <div className="mt-4 space-y-3 text-sm font-bold">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Môn</span>
                <span className="min-w-0 break-words text-right text-slate-800 dark:text-slate-200">{selectedCategory.label}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Loại</span>
                <span className="min-w-0 break-words text-right text-slate-800 dark:text-slate-200">{selectedCategory.types.find((type) => type.id === formData.pitchType)?.label}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Hình thức</span>
                <span className="min-w-0 break-words text-right text-slate-800 dark:text-slate-200">{formData.isIndoor ? 'Trong nhà' : 'Ngoài trời'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Khung giờ</span>
                <span className="min-w-0 break-words text-right text-slate-800 dark:text-slate-200">{formData.timeSlots.length}</span>
              </div>
            </div>
            {formData.address && (
              <div className="mt-4 flex min-w-0 gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:bg-slate-800">
                <MapPin size={15} className="shrink-0 text-blue-600" />
                <span className="min-w-0 break-words">{formData.address}</span>
              </div>
            )}
          </section>
        </aside>
      </form>
    </div>
  );
};

export default PitchEditor;
