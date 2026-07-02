import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ExternalLink,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Star,
  X,
  Filter,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';
import { slugify } from '../../../utils/slug';

type OwnerReview = {
  id: string;
  userName: string;
  pitchId: string;
  pitchName: string;
  pitchType?: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string | null;
};

// Component hiển thị chính xác số sao kể cả số thập phân (Ví dụ: 4.3 sao)
const FractionalStars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: 5 }).map((_, i) => {
        const fillValue = Math.max(0, Math.min(1, rating - i));
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            {/* Ngôi sao màu xám làm nền */}
            <Star size={size} className="text-slate-200 fill-slate-200 absolute top-0 left-0" />
            {/* Ngôi sao màu vàng đè lên dựa theo tỷ lệ fillValue */}
            {fillValue > 0 && (
              <div
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: `${fillValue * 100}%`, height: '100%' }}
              >
                <Star size={size} className="text-amber-400 fill-amber-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const isOwnerReview = (value: unknown): value is OwnerReview => {
  if (!value || typeof value !== 'object') return false;
  const review = value as Record<string, unknown>;
  return (
    typeof review.id === 'string' &&
    typeof review.userName === 'string' &&
    typeof review.pitchId === 'string' &&
    typeof review.pitchName === 'string' &&
    typeof review.rating === 'number' &&
    typeof review.comment === 'string' &&
    typeof review.createdAt === 'string'
  );
};

const pitchTypeLabel = (type?: string) =>
  ({
    '1': 'Bóng đá 5 người',
    Football5: 'Bóng đá 5 người',
    '2': 'Bóng đá 7 người',
    Football7: 'Bóng đá 7 người',
    '3': 'Bóng đá 11 người',
    Football11: 'Bóng đá 11 người',
    '4': 'Tennis',
    Tennis: 'Tennis',
    '5': 'Cầu lông',
    Badminton: 'Cầu lông',
    '6': 'Pickleball',
    Pickleball: 'Pickleball',
    '7': 'Bóng rổ',
    Basketball: 'Bóng rổ',
    '8': 'Bóng chuyền',
    Volleyball: 'Bóng chuyền',
    '9': 'Bóng bàn',
    TableTennis: 'Bóng bàn',
  } as Record<string, string>)[String(type || '')] || 'Chưa phân loại';

const ratingText = (rating: number) => {
  if (rating >= 4.5) return 'Xuất sắc';
  if (rating >= 3.5) return 'Tốt';
  if (rating >= 2.5) return 'Trung bình';
  if (rating >= 1.5) return 'Kém';
  return 'Rất kém';
};

const initials = (name?: string) =>
  String(name || 'KH')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'KH';

const formatDate = (value?: string) => {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
};

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<OwnerReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pitchFilter, setPitchFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [replyFilter, setReplyFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/owner/reviews') as unknown;
      setReviews(Array.isArray(res) ? res.filter(isOwnerReview) : []);
    } catch {
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const openReplyModal = (review: OwnerReview) => {
    setSelectedReview(review);
    setReplyText(review.reply || '');
    setIsModalOpen(true);
  };

  const closeReplyModal = () => {
    setIsModalOpen(false);
    setSelectedReview(null);
    setReplyText('');
  };

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replyText.trim() || !selectedReview) return;

    setIsSubmitting(true);
    try {
      await api.post(`/owner/reviews/${selectedReview.id}/reply`, { content: replyText });
      closeReplyModal();
      fetchReviews();
    } catch {
      alert('Không thể gửi phản hồi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniquePitches = useMemo(
    () =>
      Array.from(
        reviews
          .reduce((map, review) => {
            if (!map.has(review.pitchId)) {
              map.set(review.pitchId, {
                id: review.pitchId,
                name: review.pitchName,
                type: review.pitchType,
              });
            }
            return map;
          }, new Map<string, { id: string; name: string; type?: string }>())
          .values()
      ),
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return reviews
      .filter((review) => {
        const reviewDate = new Date(review.createdAt);
        const matchesDateStart = !dateStart || reviewDate >= new Date(dateStart);
        const matchesDateEnd = !dateEnd || reviewDate <= new Date(`${dateEnd}T23:59:59`);

        return (
          (!keyword ||
            review.userName.toLowerCase().includes(keyword) ||
            review.comment.toLowerCase().includes(keyword) ||
            review.pitchName.toLowerCase().includes(keyword)) &&
          (pitchFilter === 'all' || review.pitchId === pitchFilter) &&
          (ratingFilter === 'all' || review.rating === Number(ratingFilter)) &&
          (replyFilter === 'all' ||
            (replyFilter === 'replied' ? Boolean(review.reply) : !review.reply)) &&
          matchesDateStart &&
          matchesDateEnd
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviews, searchTerm, pitchFilter, ratingFilter, replyFilter, dateStart, dateEnd]);

  const pagedReviews = filteredReviews.slice((page - 1) * pageSize, page * pageSize);
  const pendingReviews = reviews
    .filter((review) => !review.reply)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const fiveStarCount = reviews.filter((review) => review.rating === 5).length;
  const lowRatingCount = reviews.filter((review) => review.rating <= 2).length;
  const repliedCount = reviews.filter((review) => review.reply).length;
  const responseRate = reviews.length ? Math.round((repliedCount / reviews.length) * 100) : 0;

  const ratingDistribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => {
        const count = reviews.filter((review) => review.rating === rating).length;
        return {
          rating,
          count,
          percentage: reviews.length ? (count / reviews.length) * 100 : 0,
        };
      }),
    [reviews]
  );

  const hasActiveFilters = Boolean(
    searchTerm ||
      pitchFilter !== 'all' ||
      ratingFilter !== 'all' ||
      replyFilter !== 'all' ||
      dateStart ||
      dateEnd
  );

  const activeFilterCount = [
    searchTerm,
    pitchFilter !== 'all',
    ratingFilter !== 'all',
    replyFilter !== 'all',
    dateStart,
    dateEnd,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setPitchFilter('all');
    setRatingFilter('all');
    setReplyFilter('all');
    setDateStart('');
    setDateEnd('');
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pitchFilter, ratingFilter, replyFilter, dateStart, dateEnd]);

  useEffect(() => {
    const maxPage = Math.max(Math.ceil(filteredReviews.length / pageSize), 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredReviews.length, page]);

  const getPitchDetailUrl = (review: OwnerReview) =>
    `/san/${review.pitchId}-${slugify(review.pitchName || 'san')}`;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-16 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            HỆ THỐNG QUẢN LÝ
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Phản hồi khách hàng
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi điểm đánh giá, nội dung phản hồi và chất lượng phục vụ từng cơ sở sân.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchReviews}
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition shadow-sm hover:bg-slate-50 active:scale-95"
          >
            <RefreshCw size={15} className={`${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition shadow-sm active:scale-95 ${
              showFilters || hasActiveFilters
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter size={15} />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 text-xs group-hover:bg-white/20">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Tìm kiếm</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tên khách, nội dung, sân..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Cơ sở sân</label>
                <select
                  value={pitchFilter}
                  onChange={(e) => setPitchFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="all">Tất cả sân</option>
                  {uniquePitches.map((pitch) => (
                    <option key={pitch.id} value={pitch.id}>{pitch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mức đánh giá</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="all">Tất cả sao</option>
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>{value} sao</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Trạng thái phản hồi</label>
                <select
                  value={replyFilter}
                  onChange={(e) => setReplyFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chưa phản hồi</option>
                  <option value="replied">Đã phản hồi</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Khoảng thời gian tạo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                  <span className="text-slate-400 text-xs">đến</span>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-end lg:col-start-4">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-10 w-full rounded-lg bg-red-50 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    Xóa các bộ lọc
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Tổng đánh giá',
            value: reviews.length,
            sub: `${fiveStarCount} lượt đánh giá tuyệt đối`,
            icon: MessageSquare,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'Điểm trung bình',
            value: averageRating.toFixed(1),
            sub: `${reviews.length} khách hàng đánh giá`,
            icon: Star,
            color: 'text-amber-600 bg-amber-50',
            isRating: true,
          },
          {
            label: 'Chờ phản hồi',
            value: pendingReviews.length,
            sub: lowRatingCount > 0 ? `${lowRatingCount} đánh giá thấp cần chú ý` : 'Mọi thứ đều ổn định',
            icon: AlertCircle,
            color: pendingReviews.length > 0 ? 'text-orange-600 bg-orange-50' : 'text-slate-500 bg-slate-50',
          },
          {
            label: 'Tỷ lệ phản hồi',
            value: `${responseRate}%`,
            sub: `${repliedCount}/${reviews.length} tin đã duyệt trả lời`,
            icon: CheckCircle,
            color: 'text-emerald-600 bg-emerald-50',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-xl p-2.5 ${item.color}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs font-medium text-slate-400">{item.sub}</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                {item.isRating && <FractionalStars rating={averageRating} size={14} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary + Pending Alert */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Cơ cấu điểm đánh giá</h2>
              <p className="text-xs text-slate-500">Phân bổ lượng sao từ người dùng</p>
            </div>
            <BarChart3 size={18} className="text-slate-400" />
          </div>

          <div className="space-y-2.5">
            {ratingDistribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-xs font-medium text-slate-600">{item.rating} sao</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full bg-amber-400"
                  />
                </div>
                <span className="w-10 text-right text-xs font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-xl border p-5 shadow-sm flex flex-col justify-between ${
          pendingReviews.length > 0
            ? 'border-orange-100 bg-orange-50/50'
            : 'border-emerald-100 bg-emerald-50/50'
        }`}>
          <div className="flex items-start gap-3">
            {pendingReviews.length > 0 ? (
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-orange-600" />
            ) : (
              <CheckCircle size={20} className="mt-0.5 shrink-0 text-emerald-600" />
            )}
            <div className="flex-1">
              <p className={`font-semibold text-sm ${pendingReviews.length > 0 ? 'text-orange-900' : 'text-emerald-900'}`}>
                {pendingReviews.length > 0
                  ? `Có ${pendingReviews.length} đánh giá đang đợi phản hồi từ bạn`
                  : 'Giao diện sạch sẽ! Tất cả phản hồi đã được xử lý'}
              </p>
              <p className={`mt-1 text-xs leading-relaxed ${pendingReviews.length > 0 ? 'text-orange-700' : 'text-emerald-700'}`}>
                {pendingReviews.length > 0
                  ? 'Việc phản hồi nhanh chóng giúp tăng mức độ hài lòng và tạo độ uy tín cao cho cơ sở thể thao của bạn trên hệ thống.'
                  : 'Duy trì hiệu suất tương tác tốt giúp giữ chân khách hàng quen thuộc và thu hút thêm hội nhóm mới đăng ký sân.'}
              </p>
            </div>
          </div>
          {pendingReviews.length > 0 && (
            <button
              type="button"
              onClick={() => setReplyFilter('pending')}
              className="mt-4 self-start rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-700 active:scale-95"
            >
              Xem danh sách chờ phản hồi
            </button>
          )}
        </div>
      </div>

      {/* Đánh giá theo từng sân */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Chi tiết theo từng cơ sở</h2>
            <p className="text-xs text-slate-500">Thống kê điểm trung bình và số lượng phản hồi tồn đọng</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {uniquePitches.length} sân hoạt động
          </span>
        </div>

        {uniquePitches.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uniquePitches.map((pitch) => {
              const pitchReviews = reviews.filter(r => r.pitchId === pitch.id);
              const avgRating = pitchReviews.length
                ? pitchReviews.reduce((sum, r) => sum + r.rating, 0) / pitchReviews.length
                : 0;
              const pendingCount = pitchReviews.filter(r => !r.reply).length;

              return (
                <div
                  key={pitch.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">{pitchTypeLabel(pitch.type)}</p>
                      <p className="mt-0.5 truncate font-semibold text-sm text-slate-900">{pitch.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPitchFilter(pitch.id)}
                      className="rounded-lg bg-white border border-slate-200 p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                      title="Lọc đánh giá của sân này"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>

                  <div className="mb-3 flex items-center gap-3 bg-white border border-slate-100 rounded-lg p-2">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-bold tracking-tight text-slate-900">{avgRating.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400">/5</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {/* Áp dụng component FractionalStars tô màu sao chính xác */}
                      <FractionalStars rating={avgRating} size={13} />
                      <p className="text-[10px] font-medium text-slate-400">{ratingText(avgRating)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-medium">{pitchReviews.length} đánh giá</span>
                    {pendingCount > 0 ? (
                      <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-600">
                        {pendingCount} tin chờ
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle size={12} /> Hoàn tất
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
            <p className="text-sm text-slate-400">Chưa ghi nhận dữ liệu đánh giá nào cho các sân</p>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Danh sách phản hồi thực tế</h2>
              <p className="text-xs text-slate-500">
                Tổng số {reviews.length} mục · Tìm thấy {filteredReviews.length} kết quả phù hợp
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Xóa bộ lọc đang chọn
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-xs font-medium text-slate-500">Đang đồng bộ dữ liệu đánh giá...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 text-center p-6">
            <div className="rounded-full bg-slate-50 p-4 text-slate-400">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Không tìm thấy kết quả phù hợp</h3>
            <p className="text-xs text-slate-400 max-w-xs">Hãy điều chỉnh lại từ khóa hoặc các cấu hình bộ lọc ở phía trên</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pagedReviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 transition hover:bg-slate-50/60"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-blue-100 text-xs font-bold text-blue-700 border border-blue-200/50">
                    {initials(review.userName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{review.userName}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                          <Link
                            to={getPitchDetailUrl(review)}
                            className="flex items-center gap-0.5 font-medium text-slate-600 hover:text-blue-600 transition"
                          >
                            {review.pitchName}
                            <ExternalLink size={11} />
                          </Link>
                          <span>•</span>
                          <span>{pitchTypeLabel(review.pitchType)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-row items-center gap-2 self-start sm:flex-col sm:items-end sm:gap-0.5">
                        {/* Hiển thị số sao thực tế bằng FractionalStars */}
                        <FractionalStars rating={review.rating} size={14} />
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{ratingText(review.rating)}</span>
                      </div>
                    </div>

                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600 bg-white border border-slate-100/80 rounded-lg p-3 shadow-inner">
                      {review.comment}
                    </p>

                    {review.reply ? (
                      <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
                        <div className="flex items-center justify-between border-b border-emerald-100/50 pb-1.5 mb-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle size={13} />
                            Phản hồi từ quản trị viên
                          </div>
                          <button
                            type="button"
                            onClick={() => openReplyModal(review)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition"
                          >
                            Chỉnh sửa
                          </button>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">{review.reply}</p>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50/30 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-medium text-orange-700">Mục đánh giá này chưa có câu trả lời chính thức.</p>
                        <button
                          type="button"
                          onClick={() => openReplyModal(review)}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                        >
                          <MessageSquare size={13} />
                          Viết phản hồi
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="p-4 bg-slate-50/30 border-t border-slate-100">
              <Pagination
                page={page}
                totalItems={filteredReviews.length}
                pageSize={pageSize}
                onPageChange={setPage}
                label="đánh giá"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeReplyModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative w-full max-w-xl rounded-xl border border-slate-100 bg-white shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Phản hồi ý kiến</h3>
                  <p className="text-xs text-slate-500">Nội dung phản hồi sẽ được công khai tại trang chi tiết sân</p>
                </div>
                <button
                  type="button"
                  onClick={closeReplyModal}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleReply} className="p-5 space-y-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-semibold text-slate-700">Khách hàng: {selectedReview?.userName}</p>
                    {selectedReview && <FractionalStars rating={selectedReview.rating} size={12} />}
                  </div>
                  <p className="text-slate-500 italic leading-relaxed">"{selectedReview?.comment}"</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Nội dung soạn thảo
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400"
                    placeholder="Gửi lời cảm ơn chân thành và giải pháp khắc phục nếu có sự cố xảy ra..."
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeReplyModal}
                    className="flex-1 h-9 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !replyText.trim()}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Đang truyền tải...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Gửi phản hồi công khai
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reviews;