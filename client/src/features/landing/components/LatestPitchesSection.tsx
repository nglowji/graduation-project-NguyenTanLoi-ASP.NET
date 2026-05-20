import React, { useEffect, useState } from 'react';
import { ArrowRight, MapPin, Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pitchService, type PitchResponse } from '../../../services/pitchService';

const fallbackImage = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop';

const formatMoney = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

const LatestPitchesSection: React.FC = () => {
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<PitchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchLatest = async () => {
      setIsLoading(true);
      try {
        const result = await pitchService.search({ pageNumber: 1, pageSize: 6, sortBy: 'newest' });
        if (mounted) setPitches(Array.isArray(result?.items) ? result.items : []);
      } catch {
        if (mounted) setPitches([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchLatest();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="bg-white py-18 sm:py-24">
      <div className="container mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.28em] text-primary">Sân mới nhất</span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Vừa được cập nhật trên SmartSport</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500 sm:text-base">
              Xem nhanh các sân đang hoạt động, giá khởi điểm, khu vực và đánh giá trước khi vào trang tìm kiếm đầy đủ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-primary/30 hover:bg-slate-50"
          >
            Xem tất cả
            <ArrowRight size={17} />
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[16/10] animate-pulse bg-slate-100" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : pitches.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pitches.map((pitch) => {
              const image = pitch.images?.find((item) => item.isPrimary)?.imageUrl || pitch.images?.[0]?.imageUrl || fallbackImage;
              return (
                <button
                  key={pitch.id}
                  type="button"
                  onClick={() => navigate(`/field/${pitch.id}`)}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img src={image} alt={pitch.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                      {pitch.typeDisplay || 'Sân thể thao'}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="line-clamp-2 text-base font-black leading-6 text-slate-950">{pitch.name}</h3>
                      <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-600">
                        <Star size={13} fill="currentColor" />
                        {Number(pitch.averageRating || 0).toFixed(1)}
                      </div>
                    </div>
                    <p className="mt-3 flex items-center gap-2 truncate text-sm font-semibold text-slate-500">
                      <MapPin size={15} className="shrink-0 text-primary" />
                      {pitch.address?.district || pitch.address?.city || pitch.address?.fullAddress || 'Chưa cập nhật địa chỉ'}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-primary">{formatMoney(pitch.minPrice)}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-slate-400">
                        Chi tiết
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <Search className="mx-auto mb-4 text-slate-300" size={44} />
            <h3 className="text-xl font-black text-slate-950">Chưa có sân mới để hiển thị</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">Khi chủ sân được duyệt và cập nhật sân, danh sách mới nhất sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestPitchesSection;
