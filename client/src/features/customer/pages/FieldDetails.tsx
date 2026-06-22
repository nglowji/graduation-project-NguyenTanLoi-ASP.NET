import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Star, CheckCircle2, ShieldCheck,
  Loader2, Calendar, ArrowRight, ChevronLeft, ChevronRight, User, ArrowLeft, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { pitchService, type PitchResponse, type ReviewResponse } from '../../../services/pitchService';
import { signalRService } from '../../../services/signalRService';
import api from '../../../services/api';
import { formatCompactAddress } from '../../../utils/address';
import Pagination from '../../../components/Pagination';

declare global {
  interface Window {
    L?: any;
  }
}

type Coordinates = {
  lat: number;
  lng: number;
};

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
  } catch {
    return null;
  }

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

const getVietnamDateInputValue = () => {
  const vietnamDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return vietnamDate;
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadLeaflet = () => {
  if (window.L) return Promise.resolve(window.L);

  return new Promise<any>((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-css="true"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.dataset.leafletCss = 'true';
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-leaflet-js="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L));
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.dataset.leafletJs = 'true';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const reverseGeocode = async (location: Coordinates) => {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(location.lat));
  url.searchParams.set('lon', String(location.lng));
  url.searchParams.set('accept-language', 'vi');

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Không thể lấy địa chỉ hiện tại.');
  const data = await response.json();
  return data.display_name || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
};

const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  if (!address.trim()) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', address);
  url.searchParams.set('accept-language', 'vi');

  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;
  if (!first?.lat || !first?.lon) return null;

  return { lat: Number(first.lat), lng: Number(first.lon) };
};

const formatOsrmInstruction = (step: any) => {
  const maneuver = step?.maneuver || {};
  const type = String(maneuver.type || '');
  const modifier = String(maneuver.modifier || '');
  const road = step?.name ? ` vào ${step.name}` : '';

  if (type === 'depart') return `Bắt đầu${road}`;
  if (type === 'arrive') return 'Đến sân';
  if (type === 'roundabout') return `Vào vòng xoay${road}`;
  if (type === 'merge') return `Nhập làn${road}`;
  if (type === 'fork') return `${modifier.includes('left') ? 'Rẽ nhánh trái' : 'Rẽ nhánh phải'}${road}`;

  if (modifier.includes('left')) return `${modifier.includes('slight') ? 'Chếch trái' : 'Rẽ trái'}${road}`;
  if (modifier.includes('right')) return `${modifier.includes('slight') ? 'Chếch phải' : 'Rẽ phải'}${road}`;
  if (modifier.includes('straight')) return `Đi thẳng${road}`;
  if (modifier.includes('uturn')) return `Quay đầu${road}`;

  return road ? `Tiếp tục${road}` : 'Tiếp tục đi thẳng';
};

const mapOsrmSteps = (route: any): RouteStep[] =>
  (route?.legs || [])
    .flatMap((leg: any) => leg?.steps || [])
    .map((step: any) => ({
      instruction: formatOsrmInstruction(step),
      distanceM: Number(step.distance || 0),
      durationMin: Number(step.duration || 0) / 60,
    }))
    .filter((step: RouteStep) => step.instruction && step.distanceM >= 1);

const getBestBrowserPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
  const samples: GeolocationPosition[] = [];
  const watch = { id: undefined as number | undefined };
  const finish = () => {
    if (watch.id !== undefined) navigator.geolocation.clearWatch(watch.id);
    const best = samples.sort((a, b) => a.coords.accuracy - b.coords.accuracy)[0];
    if (best) resolve(best);
    else reject(new Error('Thiết bị chưa cung cấp được vị trí. Hãy bật quyền vị trí chính xác rồi thử lại.'));
  };

  const timer = window.setTimeout(finish, 8000);
  watch.id = navigator.geolocation.watchPosition(
    (position) => {
      samples.push(position);
      if (position.coords.accuracy <= 100) {
        window.clearTimeout(timer);
        finish();
      }
    },
    (error) => {
      window.clearTimeout(timer);
      if (watch.id !== undefined) navigator.geolocation.clearWatch(watch.id);
      reject(new Error(error.code === error.PERMISSION_DENIED
        ? 'Bạn chưa cấp quyền vị trí cho trình duyệt.'
        : 'Thiết bị chưa cung cấp được vị trí chính xác. Hãy bật dịch vụ vị trí rồi thử lại.'));
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
  );
});

const isInsideVietnam = ({ lat, lng }: Coordinates) =>
  lat >= 8.0 && lat <= 23.5 && lng >= 102.0 && lng <= 110.0;

const resolveMapLink = async (mapLink?: string | null): Promise<Coordinates | null> => {
  const text = String(mapLink || '').trim();
  if (!text || !/^https?:\/\//i.test(text)) return null;

  const response = await api.get('/pitches/resolve-map-link', { params: { url: text } });
  const data = response?.data || response;
  if (!data?.latitude || !data?.longitude) return null;

  return {
    lat: Number(data.latitude),
    lng: Number(data.longitude),
  };
};

const FieldDetails: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const guidMatch = (slug || '').match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
  const pitchId = id || guidMatch?.[0];
  const [pitch, setPitch] = useState<PitchResponse | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(getVietnamDateInputValue());
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewFilter, setReviewFilter] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const reviewPageSize = 5;
  
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
  const hasPreciseCoordinates = (latitude?: number, longitude?: number) => {
    if (!latitude || !longitude) return false;
    const isOldDefault = Math.abs(latitude - 10) < 0.0001 && Math.abs(longitude - 106) < 0.0001;
    const isHcmFallback = Math.abs(latitude - 10.762622) < 0.0001 && Math.abs(longitude - 106.660172) < 0.0001;
    return !isOldDefault && !isHcmFallback;
  };

  useEffect(() => {
    let isMounted = true;

    const resolvePitchLocation = async () => {
      if (!pitch?.address) {
        setPitchLocation(null);
        return;
      }

      const { latitude, longitude } = pitch.address;
      if (hasPreciseCoordinates(latitude, longitude)) {
        setPitchLocation({ lat: Number(latitude), lng: Number(longitude) });
        return;
      }

      const mapLinkLocation = extractCoordinatesFromMapLink(pitch.mapLink);
      if (mapLinkLocation) {
        setPitchLocation(mapLinkLocation);
        return;
      }

      const resolvedMapLinkLocation = await resolveMapLink(pitch.mapLink).catch(() => null);
      if (!isMounted) return;

      if (resolvedMapLinkLocation) {
        setPitchLocation(resolvedMapLinkLocation);
        setRouteError('');
        return;
      }

      const mapSearchText = extractSearchTextFromMapLink(pitch.mapLink);
      const resolved = await geocodeAddress(mapSearchText || fullAddress);
      if (!isMounted) return;

      if (resolved) {
        setPitchLocation(resolved);
        setRouteError('');
      } else {
        setPitchLocation(null);
        setRouteError('Chưa xác định được tọa độ sân từ địa chỉ map.');
      }
    };

    resolvePitchLocation().catch(() => {
      if (isMounted) setRouteError('Không thể định vị sân trên OpenStreetMap.');
    });

    return () => {
      isMounted = false;
    };
  }, [pitch, fullAddress]);

  useEffect(() => {
    let isCancelled = false;

    const renderMap = async () => {
      if (!mapContainerRef.current || !pitchLocation) return;
      const L = await loadLeaflet();
      if (isCancelled || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          scrollWheelZoom: false,
          zoomControl: false,
        }).setView(
          [pitchLocation.lat, pitchLocation.lng],
          17
        );
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);
        mapLayerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;
      const layers = mapLayerGroupRef.current;
      layers.clearLayers();

      const pitchIcon = L.divIcon({
        className: '',
        html: '<div style="display:grid;height:42px;width:42px;place-items:center;border:4px solid #fff;border-radius:50% 50% 50% 8px;background:#2563eb;color:#fff;box-shadow:0 8px 18px rgba(37,99,235,.35);transform:rotate(-45deg)"><span style="display:block;height:12px;width:12px;border-radius:50%;background:#67e8f9;transform:rotate(45deg)"></span></div>',
        iconSize: [42, 42],
        iconAnchor: [12, 38],
      });
      L.marker([pitchLocation.lat, pitchLocation.lng], { icon: pitchIcon })
        .addTo(layers)
        .bindPopup(pitch?.name || 'Sân');

      if (userLocation) {
        L.circleMarker([userLocation.lat, userLocation.lng], {
          radius: 8,
          color: '#ffffff',
          weight: 4,
          fillColor: '#10b981',
          fillOpacity: 1,
        })
          .addTo(layers)
          .bindPopup('Vị trí của bạn');
      }

      if (routeLine.length > 1) {
        const points = routeLine.map((point) => [point.lat, point.lng]);
        L.polyline(points, { color: '#0f172a', weight: 10, opacity: 0.2 }).addTo(layers);
        L.polyline(points, { color: '#2563eb', weight: 6, opacity: 0.96, lineCap: 'round', lineJoin: 'round' }).addTo(layers);
        L.polyline(points, { color: '#67e8f9', weight: 2, opacity: 0.95, dashArray: '10 12', lineCap: 'round' }).addTo(layers);
        map.fitBounds(L.latLngBounds(points).pad(0.18));
      } else if (userLocation) {
        map.fitBounds(L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [pitchLocation.lat, pitchLocation.lng],
        ]).pad(0.22));
      } else {
        map.setView([pitchLocation.lat, pitchLocation.lng], 17);
      }

      window.requestAnimationFrame(() => map.invalidateSize(true));
      window.setTimeout(() => map.invalidateSize(true), 150);
    };

    renderMap().catch(() => setRouteError('Không thể tải bản đồ OpenStreetMap.'));

    return () => {
      isCancelled = true;
    };
  }, [pitchLocation, userLocation, routeLine, pitch?.name]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapLayerGroupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (pitchId) {
      fetchPitchDetails(pitchId);
      fetchSlots(pitchId);
      
      const setupSignalR = async () => {
        try {
          await signalRService.startConnection();
          await signalRService.joinPitchGroup(pitchId);
          signalRService.onTimeSlotStatusChanged((timeSlotId, status, date) => {
            if (date === selectedDate) {
              setAvailableSlots(prev => prev.map(slot => 
                slot.id === timeSlotId ? { ...slot, isAvailable: status === 'Available' } : slot
              ));
            }
          });
          signalRService.onBookingCreated((_pitchId, timeSlotId, date) => {
            if (date === selectedDate) {
              setAvailableSlots(prev => prev.map(slot =>
                slot.id === timeSlotId ? { ...slot, isAvailable: false } : slot
              ));
            }
          });
        } catch (err) {
          console.error("SignalR connection error:", err);
        }
      };
      setupSignalR();
      return () => {
        signalRService.leavePitchGroup(pitchId);
        signalRService.off('TimeSlotStatusChanged');
        signalRService.off('BookingCreated');
      };
    }
  }, [pitchId, selectedDate]);

  const fetchPitchDetails = async (currentPitchId: string) => {
    setIsLoading(true);
    try {
      const data = await pitchService.getById(currentPitchId);
      const reviewResult = await pitchService.getReviews(currentPitchId).catch(() => null);
      const reviews = reviewResult?.items?.map(normalizeReview) ?? data.reviews ?? [];
      const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : 0;
      setPitch({ ...data, reviews, averageRating, totalReviews: reviewResult?.totalCount ?? reviews.length });
    } catch (error) {
      console.error("Error fetching pitch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeReview = (review: ReviewResponse): ReviewResponse => ({
    ...review,
    userName: review.userName || review.userFullName || 'Người dùng SmartSport',
  });
  const filteredReviews = (pitch?.reviews || []).filter((review) => reviewFilter === 0 || review.rating === reviewFilter);
  const pagedReviews = filteredReviews.slice((reviewPage - 1) * reviewPageSize, reviewPage * reviewPageSize);
  useEffect(() => setReviewPage(1), [reviewFilter, pitch?.id]);

  const fetchSlots = async (currentPitchId: string) => {
    try {
      const response = await api.get(`/pitches/${currentPitchId}/available-slots`, { params: { date: selectedDate } });
      setAvailableSlots(response.data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  const calculateTotal = () => {
    return Number(pitch?.minPrice || 0);
  };

  const selectedSlot = availableSlots.find((slot) => slot.id === selectedTime);
  useEffect(() => {
    if (selectedTime && selectedSlot && !selectedSlot.isAvailable) {
      setSelectedTime(null);
    }
  }, [selectedTime, selectedSlot]);

  const parseSlotMinutes = (value?: string) => {
    const [hour, minute] = String(value || '00:00').split(':').map(Number);
    return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
  };
  const timelineSlots = availableSlots
    .map((slot) => {
      const start = parseSlotMinutes(slot.startTime);
      const end = parseSlotMinutes(slot.endTime);
      return {
        ...slot,
        start,
        end,
        left: `${Math.max(0, Math.min(100, (start / 1440) * 100))}%`,
        width: `${Math.max(4, Math.min(100, ((Math.max(end, start + 30) - start) / 1440) * 100))}%`,
      };
    })
    .sort((a, b) => a.start - b.start);

  const handleBooking = async () => {
    if (!selectedTime) return;
    setIsBooking(true);
    try {
      const slot = availableSlots.find((item) => item.id === selectedTime);
      sessionStorage.setItem('bookingDraft', JSON.stringify({
        timeSlotId: selectedTime,
        pitchId: pitch?.id,
        bookingDate: selectedDate,
        preview: {
          pitchName: pitch?.name,
          pitchType: pitch?.type,
          pitchAddress: pitch?.address,
          pitchImage: pitchImages[activeImageIndex]?.imageUrl,
          startTime: slot?.startTime,
          endTime: slot?.endTime,
          fieldPrice: Number(pitch?.minPrice || 0),
          totalPrice: calculateTotal(),
        },
      }));
      navigate('/booking-review/new');
    } catch (error: any) {
      console.error("Booking failed:", error);
      alert(error.message || "Không thể mở trang xác nhận. Vui lòng thử lại.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={36} />
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="min-h-screen bg-slate-50 pb-16 pt-28 font-sans text-slate-900">
        <div className="mx-auto max-w-370 px-4 sm:px-6">
          <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-600">Không tìm thấy sân phù hợp.</p>
            <button
              onClick={() => navigate('/explore')}
              className="mt-4 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
            >
              Quay lại khám phá
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pitchImages = pitch.images && pitch.images.length > 0 
    ? pitch.images.map((image, index) => ({ ...image, displayOrder: image.displayOrder ?? index }))
    : [{ imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1600" }];
  const venueType = (pitch as any).isIndoor === true ? 'Trong nhà' : (pitch as any).isIndoor === false ? 'Ngoài trời' : null;

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setRouteError('Trình duyệt không hỗ trợ lấy vị trí hiện tại.');
      return;
    }

    if (!pitchLocation) {
      setRouteError('Chưa xác định được vị trí sân để tính đường đi.');
      return;
    }

    setIsRouting(true);
    setRouteError('');
    setUserLocation(null);
    setRouteLine([]);
    setRouteInfo(null);
    try {
      const position = await getBestBrowserPosition();
      let nextUserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      if (!isInsideVietnam(nextUserLocation)) {
        const originAddress = window.prompt(
          'Thiết bị đang trả về vị trí ngoài Việt Nam. Nhập địa chỉ xuất phát để chỉ đường chính xác:',
          '',
        )?.trim();
        if (!originAddress) {
          throw new Error('Không thể dùng vị trí thiết bị. Hãy nhập địa chỉ xuất phát để chỉ đường.');
        }
        const resolvedOrigin = await geocodeAddress(originAddress);
        if (!resolvedOrigin) {
          throw new Error('Không tìm thấy địa chỉ xuất phát. Hãy nhập địa chỉ chi tiết hơn.');
        }
        nextUserLocation = resolvedOrigin;
      }

      setUserLocation(nextUserLocation);

      const [address, routeResponse] = await Promise.all([
        reverseGeocode(nextUserLocation).catch(() => `${nextUserLocation.lat.toFixed(6)}, ${nextUserLocation.lng.toFixed(6)}`),
        fetch(
          `https://router.project-osrm.org/route/v1/driving/${nextUserLocation.lng},${nextUserLocation.lat};${pitchLocation.lng},${pitchLocation.lat}?overview=full&geometries=geojson&steps=true&annotations=true`
        ),
      ]);

      if (!routeResponse.ok) throw new Error('Không thể tính đường đi.');
      const routeData = await routeResponse.json();
      const route = routeData?.routes?.[0];
      if (!route) throw new Error('Không tìm thấy tuyến đường phù hợp.');

      const geometry = route.geometry?.coordinates || [];
      setRouteLine(geometry.map(([lng, lat]: [number, number]) => ({ lat, lng })));
      setRouteInfo({
        distanceKm: Number(route.distance || 0) / 1000,
        durationMin: Number(route.duration || 0) / 60,
        userAddress: address,
        steps: mapOsrmSteps(route),
      });
      if (position.coords.accuracy > 1000 && isInsideVietnam({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })) {
        setRouteError(`Đã vẽ đường đi. Vị trí thiết bị hiện có sai số khoảng ${Math.round(position.coords.accuracy / 1000)} km.`);
      }
    } catch (error: any) {
      setRouteError(error?.message || 'Không thể lấy vị trí hiện tại.');
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-16 pt-24 font-sans text-slate-900">
      <div className="mx-auto max-w-370 px-4 sm:px-6">
        <section className="relative mb-6 min-h-105 overflow-hidden rounded-2xl bg-slate-900 sm:min-h-125">
          <img src={pitchImages[activeImageIndex].imageUrl} alt={pitch.name} className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/10" />
          <div className="relative flex min-h-105 flex-col justify-between p-5 text-white sm:min-h-125 sm:p-8">
            <div>
              <button onClick={() => navigate('/explore')} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-900 transition hover:bg-slate-100"><ArrowLeft size={16} /> Quay lại danh sách sân</button>
              <div className="mt-10 max-w-2xl"><span className="inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">{pitch.typeDisplay}</span><h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">{pitch.name}</h1><p className="mt-3 flex items-center gap-2 text-sm font-bold text-white"><Star size={16} className="fill-amber-400 text-amber-400" />{Number(pitch.averageRating ?? 0).toFixed(1)} ({pitch.totalReviews || 0} đánh giá)</p><p className="mt-3 flex max-w-xl items-start gap-2 text-sm font-semibold leading-6 text-slate-100"><MapPin size={16} className="mt-0.5 shrink-0 text-blue-200" />{fullAddress}</p><div className="mt-4 flex flex-wrap gap-2">{venueType && <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">{venueType}</span>}<span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">Sân sạch, an toàn</span><span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">Từ {formatMoney(pitch.minPrice)}đ/giờ</span></div></div>
            </div>
            {pitchImages.length > 1 && <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{pitchImages.slice(0, 5).map((img, idx) => <button key={idx} type="button" onClick={() => setActiveImageIndex(idx)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${activeImageIndex === idx ? 'border-white' : 'border-white/40 opacity-80 hover:opacity-100'}`}><img src={img.imageUrl} className="h-full w-full object-cover" alt={`Ảnh sân ${idx + 1}`} /></button>)}</div>}
          </div>
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          {/* LEFT COLUMN */}
          <div className="min-w-0 space-y-6">
            {/* ULTRA COMPACT GALLERY */}
            <div className="hidden">
              <div className="group relative aspect-16/7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={pitchImages[activeImageIndex].imageUrl} 
                    className="w-full h-full object-cover" 
                    alt="Pitch" 
                  />
                </AnimatePresence>
                
                {pitchImages.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : pitchImages.length - 1))} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md text-slate-900 hover:bg-blue-600 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                    <button onClick={() => setActiveImageIndex(prev => (prev < pitchImages.length - 1 ? prev + 1 : 0))} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md text-slate-900 hover:bg-blue-600 hover:text-white transition-all"><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>

              {pitchImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {pitchImages.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`relative w-12 h-12 rounded-md overflow-hidden shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-blue-600' : 'border-transparent opacity-50'}`}>
                      <img src={img.imageUrl} className="w-full h-full object-cover" alt={`T${idx}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Overview */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Giới thiệu sân</h2>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600">{pitch.description || 'Sân sạch, không gian thoáng và lịch trống được cập nhật để bạn yên tâm chọn giờ phù hợp.'}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[['Bãi đỗ', 'Rộng rãi'], ['Wifi', 'Miễn phí'], ['An ninh', 'Đảm bảo'], ['Giải khát', 'Có phục vụ']].map(([label, note]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><CheckCircle2 size={18} className="text-blue-600" /><p className="mt-3 text-xs font-black text-slate-900">{label}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{note}</p></div>)}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Tiện ích khác</h2>
              <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600 sm:grid-cols-2">{['Khu vực chờ', 'Cho thuê dụng cụ', 'Tủ đồ cá nhân', 'Trang thiết bị hỗ trợ'].map((label) => <span key={label} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600" />{label}</span>)}</div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-black text-slate-950">Vị trí sân</h2><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{fullAddress}</p></div><button type="button" onClick={handleUseCurrentLocation} disabled={!pitchLocation || isRouting} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-blue-700 px-3 text-xs font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200">{isRouting ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}Chỉ đường</button></div>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"><div ref={mapContainerRef} className="h-80 w-full" /></div>
              {routeInfo && <p className="mt-3 text-xs font-semibold text-slate-500">Tuyến đường khoảng {routeInfo.distanceKm.toFixed(1)} km, {Math.max(1, Math.round(routeInfo.durationMin))} phút.</p>}
              {routeError && <p className="mt-3 text-xs font-semibold text-slate-500">{routeError}</p>}
            </section>

            {/* Reviews */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-blue-600">Đánh giá khách hàng</p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">Trải nghiệm tại sân</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{pitch.totalReviews || 0} lượt nhận xét từ khách đã đặt sân.</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Điểm trung bình</p>
                  <p className="mt-1 flex items-center justify-end gap-1 text-2xl font-black text-amber-600"><Star size={19} className="fill-current" />{Number(pitch.averageRating ?? 0).toFixed(1)}<span className="text-sm text-amber-700">/5</span></p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 border-y border-slate-100 py-5 md:grid-cols-[150px_minmax(0,1fr)] md:items-center">
                <div className="text-center md:text-left">
                  <p className="text-4xl font-black text-amber-500">{Number(pitch.averageRating ?? 0).toFixed(1)}</p>
                  <div className="mt-2 flex justify-center gap-0.5 md:justify-start">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={15} className={index < Math.round(Number(pitch.averageRating ?? 0)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}</div>
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = (pitch.reviews || []).filter((review) => Number(review.rating) === rating).length;
                    const total = Math.max(Number(pitch.totalReviews || pitch.reviews?.length || 0), 1);
                    return <button key={rating} type="button" onClick={() => setReviewFilter(rating)} className="grid w-full grid-cols-[48px_minmax(0,1fr)_32px] items-center gap-3 text-left">
                      <span className="text-xs font-black text-slate-600">{rating} sao</span>
                      <span className="h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${count / total * 100}%` }} /></span>
                      <span className="text-right text-xs font-bold text-slate-400">{count}</span>
                    </button>;
                  })}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[0, 5, 4, 3, 2, 1].map((rating) => <button key={rating} type="button" onClick={() => setReviewFilter(rating)} className={`rounded-full px-4 py-2 text-xs font-black transition ${reviewFilter === rating ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'}`}>{rating === 0 ? `Tất cả (${pitch.totalReviews || 0})` : `${rating} sao`}</button>)}
              </div>

              <div className="mt-5 space-y-4">
                {pagedReviews.length > 0 ? pagedReviews.map((rev) => (
                  <article key={rev.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-600">{rev.userName?.charAt(0)?.toUpperCase() || <User size={16} />}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div><p className="text-sm font-black text-slate-950">{rev.userName}</p><p className="mt-1 text-xs font-semibold text-slate-400">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</p></div>
                          <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={15} className={index < Number(rev.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}</div>
                        </div>
                        <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{rev.comment || 'Khách hàng hài lòng về dịch vụ.'}</p>
                        {rev.ownerReply && <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Phản hồi từ chủ sân</p><p className="mt-1 text-sm font-medium leading-6 text-slate-600">{rev.ownerReply}</p></div>}
                      </div>
                    </div>
                  </article>
                )) : <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center"><p className="text-sm font-bold text-slate-500">Chưa có đánh giá phù hợp</p></div>}
              </div>
              {filteredReviews.length > reviewPageSize && <Pagination page={reviewPage} totalItems={filteredReviews.length} pageSize={reviewPageSize} onPageChange={setReviewPage} label="đánh giá" />}
            </section>
          </div>
          {/* RIGHT COLUMN (Sticky) */}
          <aside className="w-full">
            <div className="sticky top-28 space-y-5">
              <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Giá thuê</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{formatMoney(pitch.minPrice)}đ</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ Giờ</span>
                    </div>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={18} /></span>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Chọn ngày <Calendar size={14} className="text-blue-600" /></label>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index); const value = toDateInputValue(date); const selected = selectedDate === value; return <button key={value} type="button" onClick={() => setSelectedDate(value)} className={`rounded-xl px-2 py-2 text-center transition ${selected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-blue-50'}`}><span className={`block text-[9px] font-black uppercase ${selected ? 'text-blue-100' : 'text-slate-400'}`}>{new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date)}</span><span className="mt-1 block text-base font-black">{date.getDate()}</span><span className={`mt-0.5 block text-[9px] font-bold ${selected ? 'text-blue-100' : 'text-slate-400'}`}>Thg {date.getMonth() + 1}</span></button>; })}</div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Khung giờ trống
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">{timelineSlots.filter((slot) => slot.isAvailable).length} khung</span>
                    </label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-slate-500"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-500" />Còn trống</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-300" />Đã đặt</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-700" />Đang chọn</span></div>
                    {timelineSlots.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto pr-1">
                          {timelineSlots.map((slot) => {
                            const isSelected = selectedTime === slot.id;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={!slot.isAvailable}
                                onClick={() => setSelectedTime(slot.id)}
                                className={`min-h-18 rounded-xl border px-3 py-2.5 text-left transition ${
                                  !slot.isAvailable
                                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'
                                    : isSelected
                                      ? 'border-blue-700 bg-blue-700 text-white shadow-sm'
                                      : 'border-white bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-sm font-black leading-tight">{slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}</span>
                                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                    isSelected ? 'bg-white' : slot.isAvailable ? 'bg-blue-500' : 'bg-slate-300'
                                  }`} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 py-5 text-center text-[9px] font-black uppercase text-slate-300">Hết giờ</div>
                    )}
                    {selectedSlot && (
                      <div className="rounded-xl bg-blue-50 px-3 py-3 text-xs font-bold text-blue-700">
                        Bạn đã chọn {selectedSlot.startTime.substring(0, 5)} - {selectedSlot.endTime.substring(0, 5)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng tiền</p>
                    <p className="text-2xl font-black tracking-tight text-blue-700">{formatMoney(calculateTotal())}đ</p>
                  </div>
                  <button onClick={handleBooking} disabled={!selectedTime || isBooking} className="inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{isBooking ? <Loader2 className="animate-spin" size={16} /> : <>Tiếp tục đặt sân <ArrowRight size={16} /></>}</button>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-blue-50/50 rounded-2xl border border-blue-100/50"><ShieldCheck className="text-blue-500" size={18} /><p className="text-[9px] font-bold text-blue-600/70 uppercase tracking-widest">Bảo mật & Hoàn tiền nhanh</p></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default FieldDetails;
