import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Star, ShieldCheck,
  Loader2, ArrowRight, ChevronLeft, ChevronRight,
  User, Navigation, Clock, Wifi, Car, Shield,
  Coffee, Package, Zap, Phone,
  Lock, Calendar, Sun, Sunset, Moon, X,
  CheckCircle2, BadgeCheck, Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { pitchService, type PitchResponse, type ReviewResponse } from '../../../services/pitchService';
import { signalRService } from '../../../services/signalRService';
import api from '../../../services/api';
import { formatCompactAddress } from '../../../utils/address';

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
  const routeValue = id || slug || '';
  const guidMatch = routeValue.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
  const pitchId = guidMatch?.[0];

  const [pitch, setPitch] = useState<PitchResponse | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotStatusMap, setSlotStatusMap] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState(getVietnamDateInputValue());
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewFilter, setReviewFilter] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const reviewPageSize = 4;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapLayerGroupRef = useRef<any>(null);
  const mapResizeObserverRef = useRef<ResizeObserver | null>(null);
  const [pitchLocation, setPitchLocation] = useState<Coordinates | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [routeLine, setRouteLine] = useState<Coordinates[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [, setRouteError] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [showRouteSteps, setShowRouteSteps] = useState(false);

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

        // Tự động vẽ lại bản đồ mỗi khi khung chứa đổi kích thước (đổi bố cục, thu/phóng cửa sổ, ...)
        if (typeof ResizeObserver !== 'undefined' && !mapResizeObserverRef.current) {
          mapResizeObserverRef.current = new ResizeObserver(() => {
            mapInstanceRef.current?.invalidateSize(true);
          });
          mapResizeObserverRef.current.observe(mapContainerRef.current);
        }
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
    if (mapResizeObserverRef.current) { mapResizeObserverRef.current.disconnect(); mapResizeObserverRef.current = null; }
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; mapLayerGroupRef.current = null; }
  }, []);

  useEffect(() => {
    if (!pitchId) {
      setIsLoading(false);
      setLoadError('Đường dẫn sân không hợp lệ.');
      return;
    }
    setLoadError('');
    fetchPitchDetails(pitchId);
    fetchSlots(pitchId);
    const setup = async () => {
      try {
        await signalRService.startConnection();
        await signalRService.joinPitchGroup(pitchId);
        signalRService.onTimeSlotStatusChanged((tsId, status, date) => {
          if (date !== selectedDate) return;
          const normalizedStatus = status || 'Available';
          setSlotStatusMap((current) => ({ ...current, [getSlotStatusKey(tsId, date)]: normalizedStatus }));
          setAvailableSlots((current) => current.map((slot) => (
            slot.id === tsId
              ? { ...slot, status: normalizedStatus, isAvailable: normalizedStatus === 'Available' }
              : slot
          )));
        });
        signalRService.onBookingCreated((_pid, tsId, date) => {
          if (date !== selectedDate) return;
          setSlotStatusMap((current) => ({ ...current, [getSlotStatusKey(tsId, date)]: 'Booked' }));
          setAvailableSlots((current) => current.map((slot) => (
            slot.id === tsId
              ? { ...slot, status: 'Booked', isAvailable: false }
              : slot
          )));
        });
      } catch (e) { console.error('SignalR error', e); }
    };
    setup();
    return () => {
      void signalRService.leavePitchGroup(pitchId);
      signalRService.off('TimeSlotStatusChanged');
      signalRService.off('BookingCreated');
      void signalRService.stopConnection();
    };
  }, [pitchId, selectedDate]);

  useEffect(() => {
    if (!pitchId) return;
    fetchSlots(pitchId);
    setSelectedTimes([]);
  }, [pitchId, selectedDate]);

  const fetchPitchDetails = async (cid: string) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await pitchService.getById(cid);
      const initialReviews = data.reviews ?? [];
      setPitch({ ...data, reviews: initialReviews });
      setIsLoading(false);

      const reviewResult = await pitchService.getReviews(cid).catch(() => null);
      if (!reviewResult) return;

      const reviews = reviewResult.items?.map(normalizeReview) ?? [];
      const avg = reviews.length
        ? reviews.reduce((s: number, r: any) => s + Number(r.rating || 0), 0) / reviews.length
        : Number(data.averageRating || 0);
      setPitch((current) => current?.id === data.id
        ? { ...current, reviews, averageRating: avg, totalReviews: reviewResult.totalCount ?? reviews.length }
        : current);
    } catch (e) {
      console.error(e);
      setLoadError('Không thể tải thông tin sân. Vui lòng thử lại hoặc quay về trang khám phá sân.');
      setIsLoading(false);
    } finally { setIsLoading(false); }
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
      const data = r.data || [];
      setAvailableSlots(data.map((slot: any) => {
        const status = slotStatusMap[getSlotStatusKey(slot.id, selectedDate)] ?? (slot.isAvailable ? 'Available' : 'Booked');
        return { ...slot, status };
      }));
    } catch (e) { console.error(e); }
  };

  const parseSlotMinutes = (v?: string) => {
    const [h, m] = String(v || '00:00').split(':').map(Number);
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
  };

  const getSlotStatusKey = (slotId: string, date = selectedDate) => `${date}:${slotId}`;

  const isSlotPast = (slot: any) => {
    if (slot.isExpired || slot.isPast) return true;
    const today = getVietnamDateInputValue();
    if (selectedDate < today) return true;
    if (selectedDate > today) return false;

    const nowParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const hour = Number(nowParts.find((part) => part.type === 'hour')?.value || 0);
    const minute = Number(nowParts.find((part) => part.type === 'minute')?.value || 0);
    return slot.start <= hour * 60 + minute;
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

  useEffect(() => {
    setSelectedTimes([]);
  }, [selectedDate]);

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

    try { // Attempt to handle booking
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
    setIsRouting(true); setRouteError(''); setUserLocation(null); setRouteLine([]); setRouteInfo(null); setShowRouteSteps(false);
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
          <p className="text-base font-semibold text-slate-700">{loadError || 'Không tìm thấy sân phù hợp.'}</p>
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

  const selectedSlotText = [...selectedSlots]
    .sort((a, b) => parseSlotMinutes(a.startTime) - parseSlotMinutes(b.startTime))
    .map((slot) => `${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}`)
    .join(' • ');

  const selectedDateLabel = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${selectedDate}T00:00:00`));

  const shiftSelectedDate = (deltaDays: number) => {
    const nextDate = new Date(`${selectedDate}T12:00:00`);
    nextDate.setDate(nextDate.getDate() + deltaDays);
    setSelectedDate(toDateInputValue(nextDate));
    setSelectedTimes([]);
  };

  const daySessions = [
    { title: 'Sáng', range: '06:00 - 12:00', Icon: Sun, bandColor: 'bg-amber-50', iconColor: 'text-amber-500', min: 6 * 60, max: 12 * 60 },
    { title: 'Chiều', range: '12:00 - 18:00', Icon: Sunset, bandColor: 'bg-teal-50', iconColor: 'text-teal-600', min: 12 * 60, max: 18 * 60 },
    { title: 'Tối', range: '18:00 - 23:00', Icon: Moon, bandColor: 'bg-violet-50', iconColor: 'text-violet-500', min: 18 * 60, max: 23 * 60 + 1 },
  ].map((session) => ({
    ...session,
    slots: timelineSlots.filter((slot) => slot.start >= session.min && slot.start < session.max),
  }));

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc] pt-20 text-slate-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      <div className="mx-auto max-w-[1440px] px-5 pb-5">

        {/* ── IMAGE GALLERY ─────────────────────────────────────────────── */}
        <div className="mb-5 grid gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm lg:grid-cols-[minmax(0,1.3fr)_220px]">
          <div className="relative aspect-[16/10] min-h-[240px] overflow-hidden rounded-xl bg-slate-100">
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
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 p-3.5 text-white">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Ảnh sân</p>
                <h2 className="mt-1 truncate text-lg font-black leading-tight">{pitch.name}</h2>
                <p className="mt-1 text-xs text-white/80">
                  {activeImageIndex + 1}/{pitchImages.length} ảnh, kéo hoặc bấm để xem thêm.
                </p>
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                {pitchImages.length} ảnh
              </div>
            </div>
            {pitchImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex(i => i > 0 ? i - 1 : pitchImages.length - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/90 text-slate-700 shadow-lg transition hover:bg-white"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActiveImageIndex(i => i < pitchImages.length - 1 ? i + 1 : 0)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/90 text-slate-700 shadow-lg transition hover:bg-white"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1 lg:grid-rows-2">
            {pitchImages.slice(1, 3).map((img, i) => (
              <div
                key={i}
                className={`group relative min-h-[118px] cursor-pointer overflow-hidden rounded-xl border bg-slate-100 transition ${activeImageIndex === i + 1 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => setActiveImageIndex(i + 1)}
              >
                <img src={img.imageUrl} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2 text-white">
                  <span className="truncate text-[11px] font-semibold">Ảnh phụ {i + 1}</span>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    Xem
                  </span>
                </div>
                {i === 1 && pitchImages.length > 3 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">+{pitchImages.length - 3} ảnh</span>
                  </div>
                )}
              </div>
            ))}
            {pitchImages.length < 2 && (
              <div className="min-h-[118px] rounded-xl border border-slate-200 bg-slate-100" />
            )}
          </div>
        </div>

        {/* ── LỊCH ĐẶT SÂN DẠNG THỜI KHÓA BIỂU ──────────────────────────────── */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-700 px-6 py-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-blue-100">Lịch đặt sân</h2>
              <p className="mt-0.5 text-xs font-bold text-blue-50">{pitch.name} · Chọn khung giờ trống để đặt sân</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-black text-white">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} strokeWidth={3} className="text-emerald-200" /> Trống</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} strokeWidth={3} className="text-white" /> Đã chọn</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={14} strokeWidth={3} className="text-blue-100" /> Đã đặt</span>
              <span className="inline-flex items-center gap-1.5"><Lock size={14} strokeWidth={3} className="text-amber-200" /> Đang giữ</span>
              <span className="inline-flex items-center gap-1.5"><Ban size={14} strokeWidth={3} className="text-slate-200" /> Quá hạn</span>
            </div>
          </div>

          {timelineSlots.length === 0 ? (
            <div className="py-14 text-center text-sm font-semibold text-slate-400">
              Chưa có khung giờ nào được thiết lập cho ngày này.
            </div>
          ) : (
            <div className="space-y-5 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Ngày chơi</p>
                    <p className="mt-1 flex items-center gap-2 text-base font-black text-slate-900">
                      <Calendar size={16} className="text-teal-600" />
                      {selectedDateLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => shiftSelectedDate(-1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                      aria-label="Ngày trước"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <input
                      type="date"
                      value={selectedDate}
                      min={getVietnamDateInputValue()}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-400"
                    />
                    <button
                      type="button"
                      onClick={() => shiftSelectedDate(1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                      aria-label="Ngày sau"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">Chỉ hiển thị các khung giờ trong ngày đã chọn. Khi đổi ngày, các khung giờ đang chọn sẽ được làm mới.</p>
              </div>

              {daySessions.some((session) => session.slots.length > 0) ? (
                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-20 w-[104px] min-w-[104px] border border-slate-200 bg-slate-100 px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                            Buổi \ Giờ
                          </th>
                          {timelineSlots.map((slot) => (
                            <th
                              key={slot.id}
                              scope="col"
                              className="min-w-[76px] border border-slate-200 bg-slate-50 px-1.5 py-2.5 text-center text-[11px] font-black leading-tight text-slate-600"
                            >
                              {slot.startTime.slice(0, 5)}
                              <span className="block text-[9px] font-semibold text-slate-400">{slot.endTime.slice(0, 5)}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {daySessions.map((session) => (
                          <tr key={session.title}>
                            <th
                              scope="row"
                              className={`${session.bandColor} sticky left-0 z-10 border border-slate-200 px-3 py-3 text-left align-top`}
                            >
                              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700">
                                <session.Icon size={13} className={session.iconColor} />
                                {session.title}
                              </div>
                              <p className="mt-1 text-[9px] font-bold text-slate-400">{session.range}</p>
                            </th>
                            {timelineSlots.map((slot) => {
                              const inSession = slot.start >= session.min && slot.start < session.max;
                              if (!inSession) {
                                return (
                                  <td key={slot.id} className="border border-slate-200 bg-white" />
                                );
                              }

                              const isSelected = selectedTimes.includes(slot.id);
                              const isPast = isSlotPast(slot);
                              const isHolding = (slot as any).status === 'Holding' || (slot as any).status === 'Locked';
                              const isBooked = (slot as any).status === 'Booked' || (!slot.isAvailable && !isPast && !isHolding);
                              const disabled = isBooked || isPast || isHolding;

                              let cellStyles = 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500';
                              let label = 'Trống';
                              let SlotIcon = CheckCircle2;
                              let iconStyles = 'text-emerald-600';
                              if (isSelected) {
                                cellStyles = 'border border-blue-600 bg-blue-600 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';
                                label = 'Đã chọn';
                                SlotIcon = CheckCircle2;
                                iconStyles = 'text-white';
                              } else if (isPast) {
                                cellStyles = 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500';
                                label = 'Quá hạn';
                                SlotIcon = Ban;
                                iconStyles = 'text-slate-500';
                              } else if (isHolding) {
                                cellStyles = 'cursor-not-allowed border border-amber-200 bg-amber-50 text-amber-700';
                                label = 'Đang giữ';
                                SlotIcon = Lock;
                                iconStyles = 'text-amber-600';
                              } else if (isBooked) {
                                cellStyles = 'cursor-not-allowed border border-blue-200 bg-blue-50 text-blue-700';
                                label = 'Đã đặt';
                                SlotIcon = BadgeCheck;
                                iconStyles = 'text-blue-600';
                              }

                              return (
                                <td key={slot.id} className="border border-slate-200 bg-white p-1 text-center">
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => toggleSlot(slot)}
                                    title={`${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}`}
                                    className={`flex h-14 w-full flex-col items-center justify-center gap-1 rounded-md text-[10px] font-bold leading-none transition-all duration-150 ${cellStyles}`}
                                  >
                                    <SlotIcon size={13} strokeWidth={2.5} className={iconStyles} />
                                    <span>{label}</span>
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                  Không có khung giờ trống cho ngày này. Hãy chọn ngày khác.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── MAIN BODY ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-[minmax(0,1fr)_580px] gap-6 items-start">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* Title card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
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
                {pitch.description || 'Sân sạch sẽ, không gian thoáng đãng, lịch trống được cập nhật liên tục để bạn yên tâm chọn giờ phù hợp. Hệ thống ánh sáng đầy đủ, cỏ nhân tạo thế hệ 3 được bảo dưỡng định kỳ.'}
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
                  {routeInfo.steps.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowRouteSteps((value) => !value)}
                      className="rounded-lg border border-blue-100 bg-white px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                    >
                      {showRouteSteps ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                  )}
                </div>
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
                  <p className="mt-0.5 text-sm text-slate-400">{pitch.totalReviews || 0} lượt nhận xét</p>
                </div>
                <div className="flex flex-col items-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
                  <span className="text-2xl font-bold text-amber-500">{avgRating.toFixed(1)}</span>
                  <StarRow rating={avgRating} />
                </div>
              </div>

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
                      </div>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
                    <p className="text-sm text-slate-400">Chưa có đánh giá phù hợp</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: BOOKING CARD ── */}
          <div className="sticky top-[150px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-100/70">
              <div className="bg-blue-700 px-6 py-4 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">Lịch đặt sân</h3>
                    <p className="mt-1 text-xs font-medium text-blue-50">Chọn khung giờ trong lịch thời khóa biểu phía trên</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Từ</p>
                    <p className="text-lg font-black">{formatMoney(pitch.minPrice)}đ</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Ngày đang xem */}
                <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-bold capitalize text-slate-700">
                    <Calendar size={15} className="text-blue-600" />
                    {new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date(`${selectedDate}T00:00:00`))}
                  </span>
                  <span className="whitespace-nowrap text-xs font-semibold text-slate-400">{availableCount} khung giờ trống</span>
                </div>

                {/* Khung giờ đã chọn */}
                <div className="mb-6">
                  <span className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <Clock size={15} className="text-blue-600" />
                    Khung giờ đã chọn
                  </span>

                  {selectedSlots.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[...selectedSlots]
                        .sort((a, b) => parseSlotMinutes(a.startTime) - parseSlotMinutes(b.startTime))
                        .map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => toggleSlot(slot)}
                            className="group inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                          >
                            {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                            <X size={12} className="opacity-60 transition group-hover:opacity-100" />
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-center text-xs font-semibold text-slate-400">
                      Chọn khung giờ trống trong lịch thời khóa biểu phía trên để tiếp tục
                    </div>
                  )}
                </div>

                {/* Footer hành động */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 pt-1">
                      <span className="text-sm font-bold text-slate-500">Tổng cộng:</span>
                      <p className="mt-1 max-w-[230px] truncate text-xs font-medium text-slate-400">
                        {selectedSlots.length > 0 ? selectedSlotText : 'Chưa chọn khung giờ'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-2xl font-black text-blue-600">{formatMoney(selectedTotal)}đ</span>
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">{selectedSlots.length} khung giờ</p>
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={selectedSlots.length === 0 || isBooking}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  >
                    {isBooking ? <Loader2 size={16} className="animate-spin" /> : <>Đặt sân ngay <ArrowRight size={16} /></>}
                  </button>
                </div>
                {/* Cam kết tin cậy */}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck size={13} className="shrink-0 text-emerald-500" />
                    Đảm bảo giữ sân tức thì sau khi thanh toán thành công
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Lock size={13} className="shrink-0 text-slate-400" />
                    Thanh toán bảo mật trực tuyến mã hóa SSL
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