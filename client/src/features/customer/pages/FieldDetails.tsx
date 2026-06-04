import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Star, CheckCircle2, ShieldCheck,
  Loader2, Plus, Minus, Calendar, ArrowRight, ChevronLeft, ChevronRight, User, ArrowLeft, Map as MapIcon, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { pitchService, type PitchResponse, type ReviewResponse } from '../../../services/pitchService';
import { bookingService } from '../../../services/bookingService';
import { signalRService } from '../../../services/signalRService';
import api from '../../../services/api';
import { formatCompactAddress } from '../../../utils/address';

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
  
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
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
  const getServiceImageUrl = (service: any) =>
    service?.imageUrl || service?.ImageUrl || service?.image || service?.Image || '';
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
      fetchServices(pitchId);
      
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
      setPitch({ ...data, reviews });
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

  const fetchSlots = async (currentPitchId: string) => {
    try {
      const response = await api.get(`/pitches/${currentPitchId}/available-slots`, { params: { date: selectedDate } });
      setAvailableSlots(response.data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  const fetchServices = async (currentPitchId: string) => {
    try {
      const response = await api.get(`/additional-services/pitch/${currentPitchId}`);
      const items = Array.isArray(response) ? response : Array.isArray(response.data) ? response.data : [];
      const normalized = items.map((service: any) => ({
        ...service,
        id: service.id || service.Id,
        name: service.name || service.Name,
        price: service.price ?? service.Price ?? 0,
        stockQuantity: service.stockQuantity ?? service.StockQuantity ?? 0,
        imageUrl: service.imageUrl || service.ImageUrl || null,
      }));
      setAvailableServices(normalized);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handleUpdateService = (serviceId: string, delta: number) => {
    setSelectedServices(prev => {
      const current = prev[serviceId] || 0;
      const service = availableServices.find((item) => item.id === serviceId);
      const stock = Number(service?.stockQuantity ?? service?.StockQuantity ?? 0);
      const next = Math.max(0, Math.min(stock, current + delta));
      if (next === 0) {
        const rest = { ...prev };
        delete rest[serviceId];
        return rest;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  const calculateTotal = () => {
    const slot = availableSlots.find(s => s.id === selectedTime);
    const slotPrice = slot?.price || 0;
    const servicesPrice = availableServices.reduce((acc, svc) => {
      return acc + (svc.price * (selectedServices[svc.id] || 0));
    }, 0);
    return slotPrice + servicesPrice;
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
    let lockId: string | undefined;
    try {
      const servicesPayload = Object.entries(selectedServices).map(([id, qty]) => ({
        serviceId: id,
        quantity: qty
      }));

      const lock = await bookingService.lock(selectedTime, selectedDate);
      lockId = (lock as any).lockId || (lock as any).LockId;

      const booking = await bookingService.create({
        timeSlotId: selectedTime,
        bookingDate: selectedDate,
        selectedServices: servicesPayload.length > 0 ? servicesPayload : undefined
      });

      // Navigate to review page instead of direct payment
      navigate(`/booking-review/${booking.id}`);
    } catch (error: any) {
      console.error("Booking failed:", error);
      if (lockId) await bookingService.releaseLock(lockId).catch(() => undefined);
      alert(error.message || "Đặt sân thất bại. Vui lòng thử lại.");
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
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6">
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
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        });
      });
      const nextUserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
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
    } catch (error: any) {
      setRouteError(error?.message || 'Không thể lấy vị trí hiện tại.');
    } finally {
      setIsRouting(false);
    }
  };

  const openOpenStreetMapDirections = () => {
    if (!pitchLocation) return;

    if (userLocation) {
      const route = `${userLocation.lat},${userLocation.lng};${pitchLocation.lat},${pitchLocation.lng}`;
      window.open(
        `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(route)}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    window.open(
      `https://www.openstreetmap.org/?mlat=${pitchLocation.lat}&mlon=${pitchLocation.lng}#map=17/${pitchLocation.lat}/${pitchLocation.lng}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-24 font-sans text-slate-900">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6">
        {/* Header Section */}
        <div className="mb-6 rounded-2xl border border-blue-100 bg-cyan-50 p-5 sm:p-7">
          <button 
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors group"
          >
            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <ArrowLeft size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quay lại danh sách</span>
          </button>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">{pitch.typeDisplay}</span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">
                <Star size={10} className="fill-current" /> {Number(pitch.averageRating ?? 0).toFixed(1)}
              </div>
              <div className="px-3 py-1 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100">
                Từ {formatMoney(pitch.minPrice)}đ/giờ
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{pitch.name}</h1>
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
              <MapPin size={14} className="text-red-500 shrink-0" />
              <span>{fullAddress}</span>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* LEFT COLUMN */}
          <div className="min-w-0 space-y-6">
            {/* ULTRA COMPACT GALLERY */}
            <div className="space-y-3">
              <div className="group relative aspect-[16/8] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">Về sân này</div>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600">
                {pitch.description || 'Nơi những đam mê được đánh thức và những trận cầu rực lửa bắt đầu.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Bãi đỗ', 'Wifi', 'Giải khát', 'An ninh'].map((label) => (
                  <span key={label} className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* OpenStreetMap */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  <MapIcon size={12} className="text-blue-600" />
                  <span>Bản đồ & đường đi</span>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isRouting}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-50 px-3 text-[10px] font-black uppercase tracking-widest text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRouting ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                  Lấy vị trí của tôi
                </button>
              </div>
              <div className="mt-4 w-full overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-lg shadow-blue-950/10">
                <div className="relative">
                  <div ref={mapContainerRef} className="h-[380px] w-full bg-blue-50" />
                  <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700 shadow-lg">
                      <i className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-100" /> Sân thể thao
                    </span>
                    {userLocation && <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white/95 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-lg">
                      <i className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" /> Vị trí của bạn
                    </span>}
                  </div>
                  {pitchLocation && (
                    <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl bg-blue-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-950/20">
                      Điểm đến đã xác định
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-50 bg-white px-5 py-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-xs font-bold text-slate-600">{fullAddress}</p>
                    {pitch.mapLink && (
                      <p className="truncate text-[11px] font-semibold text-blue-600">
                        {extractSearchTextFromMapLink(pitch.mapLink) || pitch.mapLink}
                      </p>
                    )}
                    {routeInfo && (
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
                          {routeInfo.distanceKm.toFixed(1)} km
                        </span>
                        <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">
                          {Math.max(1, Math.round(routeInfo.durationMin))} phút
                        </span>
                        <span className="max-w-full truncate normal-case tracking-normal text-slate-500">
                          {routeInfo.userAddress}
                        </span>
                      </div>
                    )}
                    {routeError && <p className="text-xs font-bold text-red-500">{routeError}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={openOpenStreetMapDirections}
                    disabled={!pitchLocation}
                    className="rounded-xl bg-slate-950 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-950/10 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Mở OpenStreetMap
                  </button>
                </div>
              </div>
              {routeInfo && routeInfo.steps.length > 0 && (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chi tiết dẫn đường</h3>
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                      {routeInfo.steps.length} bước
                    </span>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {routeInfo.steps.slice(0, 12).map((step, index) => (
                      <div key={`${step.instruction}-${index}`} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-blue-600 shadow-sm">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-700">{step.instruction}</p>
                          <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                            {step.distanceM >= 1000 ? `${(step.distanceM / 1000).toFixed(1)} km` : `${Math.round(step.distanceM)} m`}
                            {' '}· {Math.max(1, Math.round(step.durationMin))} phút
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Services (Corrected Image Display - No Icon) */}
            {availableServices.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-black tracking-tight text-slate-900">Dịch vụ bổ trợ</h3>
                <p className="mt-1 text-xs font-bold text-slate-400">Chọn thêm dịch vụ cần dùng khi đến sân</p>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {availableServices.map(svc => {
                    const serviceImageUrl = getServiceImageUrl(svc);
                    const stock = Number(svc.stockQuantity ?? svc.StockQuantity ?? 0);
                    const selectedQuantity = selectedServices[svc.id] || 0;
                    const isOutOfStock = stock <= 0;
                    const cannotAddMore = isOutOfStock || selectedQuantity >= stock;
                    return (
                    <div key={svc.id} className={`p-3 bg-white rounded-2xl border flex items-center justify-between group transition-all ${isOutOfStock ? 'border-slate-100 opacity-60' : 'border-slate-100 hover:border-blue-500/20'}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200/50 bg-slate-50">
                          {serviceImageUrl ? (
                            <img src={serviceImageUrl} alt={svc.name || 'Dịch vụ'} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl">{svc.icon || '📦'}</div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-xs">{svc.name}</p>
                          <p className="text-[10px] font-bold text-blue-500">{formatMoney(svc.price)}đ</p>
                          <p className={`mt-1 text-[9px] font-black uppercase tracking-widest ${isOutOfStock ? 'text-red-500' : 'text-slate-400'}`}>
                            {isOutOfStock ? 'Hết hàng' : `Còn ${stock}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-1.5 py-1 rounded-lg">
                        <button disabled={selectedQuantity <= 0} onClick={() => handleUpdateService(svc.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white text-slate-400 hover:text-red-500 rounded-md transition-all disabled:cursor-not-allowed disabled:opacity-30"><Minus size={10} /></button>
                        <span className="w-3 text-center font-black text-[10px] text-slate-900">{selectedQuantity}</span>
                        <button disabled={cannotAddMore} onClick={() => handleUpdateService(svc.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white text-slate-400 hover:text-blue-500 rounded-md transition-all disabled:cursor-not-allowed disabled:opacity-30"><Plus size={10} /></button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Đánh giá</h3>
                <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black border border-amber-100">
                  <Star size={12} className="fill-current" /> {Number(pitch.averageRating ?? 0).toFixed(1)} / 5.0
                </div>
              </div>
              <div className="space-y-3">
                {pitch.reviews && pitch.reviews.length > 0 ? pitch.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-300 border border-slate-100"><User size={16} /></div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{rev.userName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} size={10} className={`${idx < rev.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600">{rev.comment || "Khách hàng hài lòng về dịch vụ."}</p>
                    {rev.ownerReply && (
                      <div className="ml-11 rounded-xl border border-blue-100 bg-white p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Phản hồi từ chủ sân</p>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{rev.ownerReply}</p>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="py-8 text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">
                    <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Chưa có đánh giá</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (Sticky) */}
          <aside className="w-full">
            <div className="sticky top-32 space-y-6">
              <div className="space-y-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-lg shadow-blue-950/5">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Giá thuê</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{formatMoney(pitch.minPrice)}đ</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ Giờ</span>
                    </div>
                  </div>
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center justify-between">Ngày thi đấu <Calendar size={12} className="text-blue-500" /></label>
                    <input type="date" min={getVietnamDateInputValue()} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between px-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Khung giờ trống
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">{timelineSlots.filter((slot) => slot.isAvailable).length} khung</span>
                    </label>
                    {timelineSlots.length > 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
                        <div className="grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto pr-1">
                          {timelineSlots.map((slot) => {
                            const isSelected = selectedTime === slot.id;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={!slot.isAvailable}
                                onClick={() => setSelectedTime(slot.id)}
                                className={`min-h-20 rounded-xl border px-3 py-2 text-left transition ${
                                  !slot.isAvailable
                                    ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300'
                                    : isSelected
                                      ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                      : 'border-white bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-sm font-black leading-tight">{slot.startTime.substring(0, 5)}</span>
                                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                    isSelected ? 'bg-white' : slot.isAvailable ? 'bg-emerald-400' : 'bg-slate-300'
                                  }`} />
                                </div>
                                <p className={`mt-0.5 text-[10px] font-black ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                  đến {slot.endTime.substring(0, 5)}
                                </p>
                                <p className={`mt-2 text-xs font-black ${isSelected ? 'text-white' : 'text-blue-600'}`}>
                                  {formatMoney(slot.price)}đ
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 py-5 text-center text-[9px] font-black uppercase text-slate-300">Hết giờ</div>
                    )}
                    {selectedSlot && (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                        <span>{selectedSlot.startTime.substring(0, 5)} - {selectedSlot.endTime.substring(0, 5)}</span>
                        <span>{formatMoney(selectedSlot.price)}đ</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tổng tiền</p>
                    <p className="text-2xl font-black text-blue-600 tracking-tight">{formatMoney(calculateTotal())}đ</p>
                  </div>
                  <button onClick={handleBooking} disabled={!selectedTime || isBooking} className="h-12 px-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">{isBooking ? <Loader2 className="animate-spin" size={16} /> : <>Đặt ngay <ArrowRight size={16} /></>}</button>
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

