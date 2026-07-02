import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Star, CheckCircle2, ShieldCheck,
  Loader2, Calendar, ArrowRight, ChevronLeft, ChevronRight,
  User, ArrowLeft, Navigation, Clock, Wifi, Car, Shield,
  Coffee, Package, Trophy, Zap, Phone, Share2, Heart,
  Lock, Headphones,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { pitchService, type PitchResponse, type ReviewResponse } from '../../../services/pitchService';
import { signalRService } from '../../../services/signalRService';
import api from '../../../services/api';
import { formatCompactAddress } from '../../../utils/address';
import Pagination from '../../../components/Pagination';

declare global {
  interface Window { L?: any; }
}

type Coordinates = { lat: number; lng: number };
type RouteInfo = {
  distanceKm: number;
  durationMin: number;
  userAddress: string;
  steps: RouteStep[];
};
type RouteStep = {
  instruction: string;
  distanceM: number;
  durationMin: number;
};

// ── helpers ──────────────────────────────────────────────────────────────────
const extractCoordinatesFromMapLink = (value?: string | null): Coordinates | null => {
  const text = String(value || '').trim();
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
      if (match) return { lat: Number(match[1]), lng: Number(match[2]) };
    }
  } catch { return null; }
  return null;
};

const extractSearchTextFromMapLink = (value?: string | null) => {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const decoded = decodeURIComponent(text.replace(/\+/g, ' '));
    const queryMatch = decoded.match(/[?&]q=([^&]+)/i);
    if (queryMatch?.[1]) return queryMatch[1].replace(/\s+/g, ' ').trim();
    const placeMatch = decoded.match(/\/place\/([^/@?]+)/i);
    if (placeMatch?.[1]) return placeMatch[1].replace(/\s+/g, ' ').trim();
    if (!/^https?:\/\//i.test(decoded)) return decoded;
  } catch {
    if (!/^https?:\/\//i.test(text)) return text;
  }
  return '';
};

const getVietnamDateInputValue = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const loadLeaflet = () => {
  if (window.L) return Promise.resolve(window.L);
  return new Promise<any>((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.dataset.leafletCss = 'true';
      document.head.appendChild(link);
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet-js]');
    if (existing) { existing.addEventListener('load', () => resolve(window.L)); existing.addEventListener('error', reject); return; }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.async = true; s.dataset.leafletJs = 'true';
    s.onload = () => resolve(window.L); s.onerror = reject;
    document.body.appendChild(s);
  });
};

const reverseGeocode = async (loc: Coordinates) => {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2'); url.searchParams.set('lat', String(loc.lat));
  url.searchParams.set('lon', String(loc.lng)); url.searchParams.set('accept-language', 'vi');
  const r = await fetch(url.toString()); if (!r.ok) throw new Error();
  const d = await r.json(); return d.display_name || `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
};

const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  if (!address.trim()) return null;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2'); url.searchParams.set('limit', '1');
  url.searchParams.set('q', address); url.searchParams.set('accept-language', 'vi');
  const r = await fetch(url.toString()); if (!r.ok) return null;
  const d = await r.json(); const first = Array.isArray(d) ? d[0] : null;
  if (!first?.lat || !first?.lon) return null;
  return { lat: Number(first.lat), lng: Number(first.lon) };
};

const formatOsrmInstruction = (step: any) => {
  const { type = '', modifier = '' } = step?.maneuver || {};
  const road = step?.name ? ` vào ${step.name}` : '';
  if (type === 'depart') return `Bắt đầu${road}`;
  if (type === 'arrive') return 'Đến sân';
  if (type === 'roundabout') return `Vào vòng xoay${road}`;
  if (modifier.includes('left')) return `${modifier.includes('slight') ? 'Chếch trái' : 'Rẽ trái'}${road}`;
  if (modifier.includes('right')) return `${modifier.includes('slight') ? 'Chếch phải' : 'Rẽ phải'}${road}`;
  if (modifier.includes('uturn')) return `Quay đầu${road}`;
  return road ? `Tiếp tục${road}` : 'Tiếp tục đi thẳng';
};

const mapOsrmSteps = (route: any): RouteStep[] =>
  (route?.legs || []).flatMap((l: any) => l?.steps || [])
    .map((s: any) => ({
      instruction: formatOsrmInstruction(s),
      distanceM: Number(s.distance || 0),
      durationMin: Number(s.duration || 0) / 60,
    })).filter((s: RouteStep) => s.instruction && s.distanceM >= 1);

const getBestBrowserPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
  const samples: GeolocationPosition[] = [];
  const w = { id: undefined as number | undefined };
  const finish = () => {
    if (w.id !== undefined) navigator.geolocation.clearWatch(w.id);
    const best = samples.sort((a, b) => a.coords.accuracy - b.coords.accuracy)[0];
    if (best) resolve(best);
    else reject(new Error('Thiết bị chưa cung cấp được vị trí.'));
  };
  const timer = window.setTimeout(finish, 8000);
  w.id = navigator.geolocation.watchPosition(
    (p) => { samples.push(p); if (p.coords.accuracy <= 100) { window.clearTimeout(timer); finish(); } },
    (e) => { window.clearTimeout(timer); if (w.id !== undefined) navigator.geolocation.clearWatch(w.id); reject(new Error(e.code === e.PERMISSION_DENIED ? 'Bạn chưa cấp quyền vị trí.' : 'Không thể lấy vị trí chính xác.')); },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
  );
});

const isInsideVietnam = ({ lat, lng }: Coordinates) => lat >= 8.0 && lat <= 23.5 && lng >= 102.0 && lng <= 110.0;

const resolveMapLink = async (mapLink?: string | null): Promise<Coordinates | null> => {
  const text = String(mapLink || '').trim();
  if (!text || !/^https?:\/\//i.test(text)) return null;
  const response = await api.get('/pitches/resolve-map-link', { params: { url: text } });
  const data = response?.data || response;
  if (!data?.latitude || !data?.longitude) return null;
  return { lat: Number(data.latitude), lng: Number(data.longitude) };
};

const AMENITIES = [
  { icon: Car,     label: 'Bãi đỗ xe',       sub: 'Rộng rãi, miễn phí' },
  { icon: Wifi,    label: 'Wifi',             sub: 'Tốc độ cao' },
  { icon: Shield,  label: 'An ninh',          sub: 'Camera 24/7' },
  { icon: Coffee,  label: 'Giải khát',        sub: 'Có phục vụ' },
  { icon: Package, label: 'Cho thuê đồ',      sub: 'Giá tốt' },
  { icon: Zap,     label: 'Đèn chiếu sáng',  sub: 'Đêm sáng rõ' },
];

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 13 }) => (
  <span className="inline-flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={size} className={i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
    ))}
  </span>
);

// ── main component ────────────────────────────────────────────────────────────
const FieldDetails: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const guidMatch = (slug || '').match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
  const pitchId = id || guidMatch?.[0];

  const [pitch, setPitch] = useState<PitchResponse | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(getVietnamDateInputValue());
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewFilter, setReviewFilter] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [saved, setSaved] = useState(false);
  const reviewPageSize = 4;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapLayerGroupRef = useRef<any>(null);
  const [pitchLocation, setPitchLocation] = useState<Coordinates | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [routeLine, setRouteLine] = useState<Coordinates[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeError, setRouteError] = useState('');
  const [isRouting, setIsRouting] = useState(false);

  const formatMoney = (value?: number | null) =>
    new Intl.NumberFormat('vi-VN').format(Number(value || 0));

  const fullAddress = pitch?.address?.fullAddress?.trim()
    || (typeof pitch?.address === 'string' ? pitch.address : '')
    || formatCompactAddress(pitch?.address);

  const hasPreciseCoordinates = (lat?: number, lng?: number) => {
    if (!lat || !lng) return false;
    if (Math.abs(lat - 10) < 0.0001 && Math.abs(lng - 106) < 0.0001) return false;
    if (Math.abs(lat - 10.762622) < 0.0001 && Math.abs(lng - 106.660172) < 0.0001) return false;
    return true;
  };

  useEffect(() => {
    let mounted = true;
    const resolve = async () => {
      if (!pitch?.address) { setPitchLocation(null); return; }
      const { latitude, longitude } = pitch.address;
      if (hasPreciseCoordinates(latitude, longitude)) { setPitchLocation({ lat: Number(latitude), lng: Number(longitude) }); return; }
      const fromLink = extractCoordinatesFromMapLink(pitch.mapLink);
      if (fromLink) { setPitchLocation(fromLink); return; }
      const resolved = await resolveMapLink(pitch.mapLink).catch(() => null);
      if (!mounted) return;
      if (resolved) { setPitchLocation(resolved); return; }
      const text = extractSearchTextFromMapLink(pitch.mapLink);
      const geo = await geocodeAddress(text || fullAddress);
      if (!mounted) return;
      setPitchLocation(geo);
    };
    resolve().catch(() => { if (mounted) setRouteError('Không thể định vị sân.'); });
    return () => { mounted = false; };
  }, [pitch, fullAddress]);

  useEffect(() => {
    let cancelled = false;
    const renderMap = async () => {
      if (!mapContainerRef.current || !pitchLocation) return;
      const L = await loadLeaflet();
      if (cancelled || !mapContainerRef.current) return;
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, { scrollWheelZoom: false, zoomControl: false })
          .setView([pitchLocation.lat, pitchLocation.lng], 17);
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(mapInstanceRef.current);
        mapLayerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      }
      const map = mapInstanceRef.current; const layers = mapLayerGroupRef.current;
      layers.clearLayers();
      const pitchIcon = L.divIcon({
        className: '',
        html: '<div style="display:grid;height:40px;width:40px;place-items:center;border:3px solid #fff;border-radius:50% 50% 50% 8px;background:#1d4ed8;color:#fff;box-shadow:0 4px 16px rgba(29,78,216,.35);transform:rotate(-45deg)"><span style="display:block;height:12px;width:12px;border-radius:50%;background:#93c5fd;transform:rotate(45deg)"></span></div>',
        iconSize: [40, 40], iconAnchor: [12, 38],
      });
      L.marker([pitchLocation.lat, pitchLocation.lng], { icon: pitchIcon }).addTo(layers).bindPopup(pitch?.name || 'Sân');
      if (userLocation) {
        L.circleMarker([userLocation.lat, userLocation.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#10b981', fillOpacity: 1 }).addTo(layers).bindPopup('Vị trí của bạn');
      }
      if (routeLine.length > 1) {
        const pts = routeLine.map(p => [p.lat, p.lng]);
        L.polyline(pts, { color: '#0f172a', weight: 8, opacity: 0.12 }).addTo(layers);
        L.polyline(pts, { color: '#1d4ed8', weight: 4, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(layers);
        map.fitBounds(L.latLngBounds(pts).pad(0.18));
      } else if (userLocation) {
        map.fitBounds(L.latLngBounds([[userLocation.lat, userLocation.lng], [pitchLocation.lat, pitchLocation.lng]]).pad(0.22));
      } else {
        map.setView([pitchLocation.lat, pitchLocation.lng], 17);
      }
      requestAnimationFrame(() => map.invalidateSize(true));
      setTimeout(() => map.invalidateSize(true), 150);
    };
    renderMap().catch(() => setRouteError('Không thể tải bản đồ.'));
    return () => { cancelled = true; };
  }, [pitchLocation, userLocation, routeLine, pitch?.name]);

  useEffect(() => () => {
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; mapLayerGroupRef.current = null; }
  }, []);

  useEffect(() => {
    if (!pitchId) return;
    fetchPitchDetails(pitchId);
    fetchSlots(pitchId);
    const setup = async () => {
      try {
        await signalRService.startConnection();
        await signalRService.joinPitchGroup(pitchId);
        signalRService.onTimeSlotStatusChanged((tsId, status, date) => {
          if (date === selectedDate) setAvailableSlots(p => p.map(s => s.id === tsId ? { ...s, isAvailable: status === 'Available' } : s));
        });
        signalRService.onBookingCreated((_pid, tsId, date) => {
          if (date === selectedDate) setAvailableSlots(p => p.map(s => s.id === tsId ? { ...s, isAvailable: false } : s));
        });
      } catch (e) { console.error('SignalR error', e); }
    };
    setup();
    return () => { signalRService.leavePitchGroup(pitchId); signalRService.off('TimeSlotStatusChanged'); signalRService.off('BookingCreated'); };
  }, [pitchId, selectedDate]);

  const fetchPitchDetails = async (cid: string) => {
    setIsLoading(true);
    try {
      const data = await pitchService.getById(cid);
      const reviewResult = await pitchService.getReviews(cid).catch(() => null);
      const reviews = reviewResult?.items?.map(normalizeReview) ?? data.reviews ?? [];
      const avg = reviews.length ? reviews.reduce((s: number, r: any) => s + Number(r.rating || 0), 0) / reviews.length : 0;
      setPitch({ ...data, reviews, averageRating: avg, totalReviews: reviewResult?.totalCount ?? reviews.length });
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const normalizeReview = (r: ReviewResponse): ReviewResponse => ({
    ...r, userName: r.userName || r.userFullName || 'Người dùng SmartSport',
  });

  const filteredReviews = (pitch?.reviews || []).filter(r => reviewFilter === 0 || r.rating === reviewFilter);
  const pagedReviews = filteredReviews.slice((reviewPage - 1) * reviewPageSize, reviewPage * reviewPageSize);
  useEffect(() => setReviewPage(1), [reviewFilter, pitch?.id]);

  const fetchSlots = async (cid: string) => {
    try {
      const r = await api.get(`/pitches/${cid}/available-slots`, { params: { date: selectedDate } });
      setAvailableSlots(r.data || []);
    } catch (e) { console.error(e); }
  };

  const parseSlotMinutes = (v?: string) => {
    const [h, m] = String(v || '00:00').split(':').map(Number);
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
  };

  const timelineSlots = availableSlots
    .map(s => ({ ...s, start: parseSlotMinutes(s.startTime), end: parseSlotMinutes(s.endTime) }))
    .sort((a, b) => a.start - b.start);

  const selectedSlots = timelineSlots.filter((slot) => selectedTimes.includes(slot.id) && slot.isAvailable);
  const selectedTotal = selectedSlots.reduce((sum, slot) => sum + Number(slot.price ?? pitch?.minPrice ?? 0), 0);

  useEffect(() => {
    setSelectedTimes((current) => current.filter((id) => {
      const slot = availableSlots.find((item) => item.id === id);
      return slot?.isAvailable;
    }));
  }, [availableSlots]);

  const toggleSlot = (slot: any) => {
    if (!slot.isAvailable) return;

    setSelectedTimes((current) =>
      current.includes(slot.id)
        ? current.filter((id) => id !== slot.id)
        : [...current, slot.id],
    );
  };

  const handleBooking = async () => {
    if (selectedSlots.length === 0) return;
    setIsBooking(true);

    try {
      const sortedSlots = [...selectedSlots].sort((a, b) => parseSlotMinutes(a.startTime) - parseSlotMinutes(b.startTime));
      const firstSlot = sortedSlots[0];
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      const totalPrice = selectedTotal || Number(pitch?.minPrice || 0) * sortedSlots.length;

      sessionStorage.setItem('bookingDraft', JSON.stringify({
        timeSlotId: firstSlot.id,
        timeSlotIds: sortedSlots.map((slot) => slot.id),
        pitchId: pitch?.id,
        bookingDate: selectedDate,
        preview: {
          pitchName: pitch?.name,
          pitchType: pitch?.type,
          pitchAddress: pitch?.address,
          pitchImage: pitchImages[activeImageIndex]?.imageUrl,
          startTime: firstSlot?.startTime,
          endTime: lastSlot?.endTime,
          selectedSlots: sortedSlots.map((slot) => ({
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            price: Number(slot.price ?? pitch?.minPrice ?? 0),
          })),
          fieldPrice: totalPrice,
          totalPrice,
        },
      }));

      navigate('/booking-review/new');
    } catch (e: any) {
      alert(e.message || 'Không thể mở trang xác nhận.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) { setRouteError('Trình duyệt không hỗ trợ vị trí.'); return; }
    if (!pitchLocation) { setRouteError('Chưa xác định được vị trí sân.'); return; }
    setIsRouting(true); setRouteError(''); setUserLocation(null); setRouteLine([]); setRouteInfo(null);
    try {
      const pos = await getBestBrowserPosition();
      let ul = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (!isInsideVietnam(ul)) {
        const addr = window.prompt('Nhập địa chỉ xuất phát:', '')?.trim();
        if (!addr) throw new Error('Hãy nhập địa chỉ xuất phát.');
        const geo = await geocodeAddress(addr);
        if (!geo) throw new Error('Không tìm thấy địa chỉ.');
        ul = geo;
      }
      setUserLocation(ul);
      const [address, routeRes] = await Promise.all([
        reverseGeocode(ul).catch(() => `${ul.lat.toFixed(6)}, ${ul.lng.toFixed(6)}`),
        fetch(`https://router.project-osrm.org/route/v1/driving/${ul.lng},${ul.lat};${pitchLocation.lng},${pitchLocation.lat}?overview=full&geometries=geojson&steps=true`),
      ]);
      if (!routeRes.ok) throw new Error('Không thể tính đường đi.');
      const rd = await routeRes.json(); const route = rd?.routes?.[0];
      if (!route) throw new Error('Không tìm thấy tuyến đường.');
      setRouteLine((route.geometry?.coordinates || []).map(([lng, lat]: [number, number]) => ({ lat, lng })));
      setRouteInfo({ distanceKm: Number(route.distance || 0) / 1000, durationMin: Number(route.duration || 0) / 60, userAddress: address, steps: mapOsrmSteps(route) });
    } catch (e: any) { setRouteError(e?.message || 'Không thể lấy vị trí.'); } finally { setIsRouting(false); }
  };

  // ── loading / not-found ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 pt-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={28} />
          <p className="text-sm text-slate-400">Đang tải thông tin sân...</p>
        </div>
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-20">
        <div className="text-center">
          <p className="text-base font-semibold text-slate-700">Không tìm thấy sân phù hợp.</p>
          <button onClick={() => navigate('/explore')} className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Quay lại khám phá
          </button>
        </div>
      </div>
    );
  }

  const pitchImages = pitch.images?.length
    ? pitch.images.map((img, i) => ({ ...img, displayOrder: img.displayOrder ?? i }))
    : [{ imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1600' }];

  const venueType = (pitch as any).isIndoor === true ? 'Trong nhà' : (pitch as any).isIndoor === false ? 'Ngoài trời' : null;
  const avgRating = Number(pitch.averageRating ?? 0);
  const availableCount = timelineSlots.filter((slot) => slot.isAvailable).length;
  const bookedCount = timelineSlots.filter((slot) => !slot.isAvailable).length;
  const selectedCount = selectedSlots.length;
  const totalSlotCount = timelineSlots.length;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f6f8] pt-20 text-slate-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── TOP NAV BAR ──────────────────────────────────────────────────── */}
      <div className="sticky top-20 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-5">
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Danh sách sân
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved(s => !s)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${saved ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600'}`}
            >
              <Heart size={15} className={saved ? 'fill-red-500' : ''} />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition">
              <Share2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-5 pb-5">

        {/* ── IMAGE GALLERY ─────────────────────────────────────────────── */}
        <div className="mb-5 grid h-[360px] grid-cols-[1fr_240px] gap-2 overflow-hidden rounded-xl">
          {/* Main image */}
          <div className="relative overflow-hidden rounded-l-xl">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={pitchImages[activeImageIndex].imageUrl}
                alt={pitch.name}
                className="h-full w-full object-cover"
              />
            </AnimatePresence>
            {pitchImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex(i => i > 0 ? i - 1 : pitchImages.length - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActiveImageIndex(i => i < pitchImages.length - 1 ? i + 1 : 0)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white transition"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
          {/* Thumb column */}
          <div className="flex flex-col gap-2 rounded-r-xl overflow-hidden">
            {pitchImages.slice(1, 3).map((img, i) => (
              <div
                key={i}
                className="relative flex-1 cursor-pointer overflow-hidden"
                onClick={() => setActiveImageIndex(i + 1)}
              >
                <img src={img.imageUrl} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" alt="" />
                {i === 1 && pitchImages.length > 3 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                    <span className="text-sm font-semibold text-white">+{pitchImages.length - 3} ảnh</span>
                  </div>
                )}
              </div>
            ))}
            {pitchImages.length < 2 && (
              <div className="flex-1 bg-slate-200 rounded-r-xl" />
            )}
          </div>
        </div>

        {/* ── MAIN BODY: left content + right booking ────────────────────── */}
        <div className="grid grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Title card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              {/* Tags */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{pitch.typeDisplay}</span>
                {venueType && <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{venueType}</span>}
                {availableCount > 0
                  ? <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{availableCount} khung giờ trống</span>
                  : <span className="rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600">Hết khung giờ trống</span>
                }
              </div>
              <h1 className="text-2xl font-bold leading-snug text-slate-900">{pitch.name}</h1>
              <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-blue-500" /> {fullAddress}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-800">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-slate-400">({pitch.totalReviews || 0} đánh giá)</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock size={13} /> Mở cửa 06:00 – 23:00
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Phone size={13} /> {(pitch as any).phone || '0901 234 567'}
                </span>
              </div>
            </div>

            {/* About + Amenities */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-2 text-base font-semibold text-slate-800">Giới thiệu sân</h2>
              <p className="text-sm leading-relaxed text-slate-500">
                {pitch.description || 'Sân sạch sẽ, không gian thoáng đãng, lịch trống được cập nhật liên tục để bạn yên tâm chọn giờ phù hợp. Hệ thống ánh sáng đầy đủ, cỏ nhân tạo thế hệ 3 được bảo dưỡng định kỳ, phù hợp cho cả giờ cao điểm ban ngày lẫn buổi tối.'}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {AMENITIES.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100">
                      <Icon size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{label}</p>
                      <p className="text-[11px] text-slate-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Vị trí sân</h2>
                <button
                  onClick={handleUseCurrentLocation}
                  disabled={!pitchLocation || isRouting}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
                >
                  {isRouting ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                  Chỉ đường
                </button>
              </div>

              {routeInfo && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    🛣 {routeInfo.distanceKm.toFixed(1)} km
                  </span>
                  <span className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    ⏱ {Math.max(1, Math.round(routeInfo.durationMin))} phút
                  </span>
                  <span className="max-w-[240px] truncate rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                    Từ: {routeInfo.userAddress}
                  </span>
                </div>
              )}

              {routeError && (
                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{routeError}</p>
              )}

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div ref={mapContainerRef} className="h-56 w-full" />
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Đánh giá</h2>
                  <p className="mt-0.5 text-sm text-slate-400">{pitch.totalReviews || 0} lượt nhận xét từ khách đặt sân</p>
                </div>
                <div className="flex flex-col items-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
                  <span className="text-2xl font-bold text-amber-500">{avgRating.toFixed(1)}</span>
                  <StarRow rating={avgRating} />
                  <span className="mt-0.5 text-[10px] text-amber-600">/ 5 sao</span>
                </div>
              </div>

              {/* Rating bars */}
              <div className="mb-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map(r => {
                  const count = (pitch.reviews || []).filter(rv => Number(rv.rating) === r).length;
                  const total = Math.max(pitch.totalReviews || pitch.reviews?.length || 0, 1);
                  return (
                    <button
                      key={r}
                      onClick={() => setReviewFilter(r)}
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <span className="w-10 text-right text-xs text-slate-500">{r} sao</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-slate-100" style={{ height: 5 }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / total) * 100}%` }}
                          className="h-full rounded-full bg-amber-400"
                        />
                      </div>
                      <span className="w-6 text-right text-xs text-slate-400">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filter chips */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {[0, 5, 4, 3, 2, 1].map(r => (
                  <button
                    key={r}
                    onClick={() => setReviewFilter(r)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      reviewFilter === r ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r === 0 ? `Tất cả (${pitch.totalReviews || 0})` : `${r} ★`}
                  </button>
                ))}
              </div>

              {/* Review list */}
              <div className="divide-y divide-slate-100">
                {pagedReviews.length > 0 ? pagedReviews.map(rev => (
                  <article key={rev.id} className="py-4 first:pt-0">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                        {rev.userName?.charAt(0)?.toUpperCase() || <User size={14} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <p className="text-sm font-semibold text-slate-800">{rev.userName}</p>
                          <div className="flex items-center gap-2">
                            <StarRow rating={Number(rev.rating)} />
                            <span className="text-xs text-slate-400">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{rev.comment || 'Khách hàng hài lòng về dịch vụ.'}</p>
                        {rev.ownerReply && (
                          <div className="mt-2.5 rounded-lg border-l-2 border-blue-400 bg-blue-50 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Phản hồi từ chủ sân</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">{rev.ownerReply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
                    <p className="text-sm text-slate-400">Chưa có đánh giá phù hợp</p>
                  </div>
                )}
              </div>

              {filteredReviews.length > reviewPageSize && (
                <Pagination
                  page={reviewPage}
                  totalItems={filteredReviews.length}
                  pageSize={reviewPageSize}
                  onPageChange={setReviewPage}
                  label="đánh giá"
                />
              )}
            </div>
          </div>

          {/* ── RIGHT: BOOKING CARD (sticky) ────────────────────────────── */}
          <div className="sticky top-[8.75rem]">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">

              {/* Price header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Giá thuê / giờ</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">{formatMoney(pitch.minPrice)}</span>
                    <span className="text-sm text-slate-400">đ</span>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={12} /> Còn chỗ
                </span>
              </div>

              <div className="px-5 py-4">
                {/* Date picker */}
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Chọn ngày</p>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(); d.setDate(d.getDate() + i);
                    const v = toDateInputValue(d);
                    const sel = selectedDate === v;
                    return (
                      <button
                        key={v}
                        onClick={() => { setSelectedDate(v); setSelectedTimes([]); }}
                        className={`flex flex-col items-center rounded-lg py-2 text-center transition ${
                          sel ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`text-[9px] font-medium ${sel ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(d)}
                        </span>
                        <span className="mt-0.5 text-sm font-semibold">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Time slots */}
                <div className="mt-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Khung giờ</p>
                      <p className="mt-1 text-[11px] font-medium text-slate-400">Có thể chọn nhiều khung giờ cùng lúc</p>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Trống
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Đang chọn
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        Đã đặt
                      </span>
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-emerald-50 px-2 py-2">
                      <p className="text-sm font-black text-emerald-700">{availableCount}</p>
                      <p className="text-[10px] font-bold text-emerald-600">Trống</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 px-2 py-2">
                      <p className="text-sm font-black text-blue-700">{selectedCount}</p>
                      <p className="text-[10px] font-bold text-blue-600">Đang chọn</p>
                    </div>
                    <div className="rounded-lg bg-red-50 px-2 py-2">
                      <p className="text-sm font-black text-red-600">{bookedCount}</p>
                      <p className="text-[10px] font-bold text-red-500">Đã đặt</p>
                    </div>
                  </div>

                  {timelineSlots.length > 0 ? (
                    <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                      {timelineSlots.map((slot) => {
                        const isSelected = selectedTimes.includes(slot.id);
                        const isBooked = !slot.isAvailable;
                        const isPast = slot.isExpired || slot.isPast || false;
                        const price = Number(slot.price ?? pitch.minPrice ?? 0);

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isBooked || isPast}
                            onClick={() => toggleSlot(slot)}
                            className={`relative rounded-lg border px-2.5 py-2.5 text-left transition ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                : isBooked
                                  ? 'cursor-not-allowed border-red-100 bg-red-50 text-red-300'
                                  : isPast
                                    ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300'
                                    : 'border-emerald-200 bg-white text-slate-800 hover:border-emerald-400 hover:bg-emerald-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-black leading-tight">
                                  {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                </p>
                                <p className={`mt-1 text-[10px] font-bold ${
                                  isSelected
                                    ? 'text-blue-100'
                                    : isBooked
                                      ? 'text-red-300'
                                      : isPast
                                        ? 'text-slate-300'
                                        : 'text-emerald-600'
                                }`}>
                                  {isBooked ? 'Sân đã đặt' : isPast ? 'Hết khung giờ' : 'Còn trống'}
                                </p>
                              </div>

                              <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                                isSelected ? 'bg-white' : isBooked ? 'bg-red-400' : isPast ? 'bg-slate-300' : 'bg-emerald-500'
                              }`} />
                            </div>

                            {!isBooked && !isPast && (
                              <p className={`mt-2 text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                {formatMoney(price)}đ
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-slate-50 py-6 text-center text-xs text-slate-400">
                      Không có khung giờ trong ngày này
                    </div>
                  )}
                </div>

                {/* Selected slot summary */}
                {selectedSlots.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} />
                      Đã chọn {selectedSlots.length} khung giờ
                    </div>
                    <div className="mt-1 truncate text-[11px] text-blue-600">
                      {[...selectedSlots]
                        .sort((a, b) => parseSlotMinutes(a.startTime) - parseSlotMinutes(b.startTime))
                        .map((slot) => `${slot.startTime.slice(0, 5)}-${slot.endTime.slice(0, 5)}`)
                        .join(', ')}
                    </div>
                  </motion.div>
                )}

                {/* Total & CTA */}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-sm text-slate-500">Tổng tiền</span>
                    <span className="text-xl font-bold text-blue-600">
                      {selectedSlots.length > 0 ? `${formatMoney(selectedTotal || Number(pitch.minPrice || 0) * selectedSlots.length)}đ` : '—'}
                    </span>
                  </div>
                  <button
                    onClick={handleBooking}
                    disabled={selectedSlots.length === 0 || isBooking}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {isBooking ? <Loader2 size={15} className="animate-spin" /> : <>Đặt sân ngay <ArrowRight size={15} /></>}
                  </button>
                </div>

                {/* Trust signals */}
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck size={13} className="shrink-0 text-emerald-500" />
                    Hoàn tiền trong 24 giờ nếu hủy đúng hạn
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Lock size={13} className="shrink-0 text-blue-400" />
                    Thanh toán bảo mật, mã hóa SSL
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Headphones size={13} className="shrink-0 text-violet-400" />
                    Hỗ trợ 24/7 qua SmartSport Chat
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FieldDetails;
