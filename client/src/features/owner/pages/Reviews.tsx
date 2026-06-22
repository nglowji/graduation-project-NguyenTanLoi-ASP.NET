import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  CheckCheck,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Star,
  User,
  X,
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
  const [showPending, setShowPending] = useState(true);
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

  const pitchStats = useMemo(() => Array.from(reviews.reduce((map, review) => {
    const current = map.get(review.pitchId) || {
      id: review.pitchId,
      name: review.pitchName,
      type: review.pitchType,
      total: 0,
      score: 0,
      pending: 0,
    };
    current.total += 1;
    current.score += review.rating;
    if (!review.reply) current.pending += 1;
    map.set(review.pitchId, current);
    return map;
  }, new Map<string, { id: string; name: string; type?: string; total: number; score: number; pending: number }>()).values()), [reviews]);

  const filteredReviews = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return reviews.filter((review) =>
      (!keyword ||
        review.userName.toLowerCase().includes(keyword) ||
        review.comment.toLowerCase().includes(keyword) ||
        review.pitchName.toLowerCase().includes(keyword)) &&
      (pitchFilter === 'all' || review.pitchId === pitchFilter) &&
      (ratingFilter === 'all' || review.rating === Number(ratingFilter)) &&
      (replyFilter === 'all' || (replyFilter === 'replied' ? Boolean(review.reply) : !review.reply))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviews, searchTerm, pitchFilter, ratingFilter, replyFilter]);

  const pagedReviews = filteredReviews.slice((page - 1) * pageSize, page * pageSize);
  const pendingReviews = reviews.filter((review) => !review.reply).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const averageRating = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const repliedCount = reviews.filter((review) => review.reply).length;
  const responseRate = reviews.length ? Math.round((repliedCount / reviews.length) * 100) : 0;

  useEffect(() => { setPage(1); }, [searchTerm, pitchFilter, ratingFilter, replyFilter]);
  useEffect(() => {
    const maxPage = Math.max(Math.ceil(filteredReviews.length / pageSize), 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredReviews.length, page]);

  const getPitchDetailUrl = (review: OwnerReview) =>
    `/san/${review.pitchId}-${slugify(review.pitchName || 'san')}`;

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 pb-16">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Phản hồi khách hàng</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Đánh giá</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Theo dõi chất lượng từng sân và phản hồi khách hàng kịp thời.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyFilter('pending')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
          >
            <MessageSquare size={17} />
            Xem đánh giá chờ trả lời
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button type="button" onClick={() => setRatingFilter('all')} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-amber-200 hover:bg-amber-50">
            <Star className="text-amber-500" size={20} />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Điểm trung bình</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{averageRating}/5</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">Bấm để xem mọi mức sao.</p>
          </button>
          <button type="button" onClick={() => setReplyFilter('all')} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50">
            <MessageSquare className="text-blue-600" size={20} />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng đánh giá</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{reviews.length}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">Bấm để xem toàn bộ phản hồi.</p>
          </button>
          <button type="button" onClick={() => setReplyFilter('pending')} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-amber-200 hover:bg-amber-50">
            <AlertTriangle className="text-amber-600" size={20} />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Chờ phản hồi</p>
            <p className="mt-1 text-2xl font-black text-amber-600">{pendingReviews.length}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">Ưu tiên trả lời để giữ trải nghiệm khách.</p>
          </button>
          <button type="button" onClick={() => setReplyFilter('replied')} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50">
            <CheckCheck className="text-emerald-600" size={20} />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tỷ lệ phản hồi</p>
            <p className="mt-1 text-2xl font-black text-emerald-600">{responseRate}%</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">Bấm để xem đánh giá đã phản hồi.</p>
          </button>
        </div>
      </section>

      {pendingReviews.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowPending((value) => !value)}
            className="flex w-full items-center justify-between gap-4 bg-amber-50 px-5 py-4 text-left transition hover:bg-amber-100"
          >
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-800">Cần xử lý</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{pendingReviews.length} đánh giá đang chờ phản hồi</h2>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm font-black text-slate-800">
              {showPending ? 'Thu gọn' : 'Mở danh sách'}
              <ChevronDown size={18} className={`transition ${showPending ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {showPending && (
            <div className="grid gap-3 bg-slate-50/70 p-3 lg:grid-cols-3">
              {pendingReviews.slice(0, 6).map((review) => (
                <button key={review.id} type="button" onClick={() => openReplyModal(review)} className="rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:border-blue-200 hover:bg-blue-50">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="truncate text-sm text-slate-950">{review.userName}</strong>
                    <span className="flex gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} className={index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}</span>
                  </div>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-700">{pitchTypeLabel(review.pitchType)}</p>
                  <p className="mt-3 line-clamp-2 text-sm font-bold text-slate-600">{review.comment}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600"><Star size={13} className="fill-amber-400 text-amber-400" />Chất lượng từng sân</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Khách hàng đánh giá sân của bạn</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Chọn loại sân để xem đánh giá và phản hồi cần xử lý.</p>
          </div>
          <button type="button" onClick={() => setPitchFilter('all')} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black transition ${pitchFilter === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}>
            Tất cả {pitchStats.length} sân
          </button>
        </div>

        {pitchStats.length > 0 && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setPitchFilter('all')} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-black transition ${pitchFilter === 'all' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`}>
              <span className="grid h-5 w-5 place-items-center rounded-md bg-white text-amber-500"><Star size={12} className="fill-current" /></span>Tất cả <span className="text-slate-400">{pitchStats.length}</span>
            </button>
            {pitchStats.map((pitch) => <button key={pitch.id} type="button" onClick={() => setPitchFilter(pitch.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-black transition ${pitchFilter === pitch.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`}>
              <span className="grid h-5 w-5 place-items-center rounded-md bg-slate-100 text-amber-500"><Star size={11} className="fill-current" /></span>{pitchTypeLabel(pitch.type)} <span className="text-slate-400">{pitch.total}</span>
            </button>)}
          </div>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pitchStats.length ? [...pitchStats].sort((a, b) => (b.score / b.total) - (a.score / a.total)).slice(0, 7).map((pitch) => {
            const average = pitch.score / pitch.total;
            const selected = pitchFilter === pitch.id;
            return (
              <button key={pitch.id} type="button" onClick={() => setPitchFilter(pitch.id)} className={`min-h-[174px] rounded-2xl border p-4 text-left transition ${selected ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-base font-black text-slate-950"><span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-amber-500"><Star size={15} className="fill-current" /></span>{pitchTypeLabel(pitch.type)}</span>
                  <span className="text-right"><b className="block text-4xl font-black leading-none text-slate-950">{average.toFixed(1)}</b><span className="mt-2 flex gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={13} className={index < Math.round(average) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}</span></span>
                </div>
                <p className="mt-5 text-sm font-bold text-slate-500"><b className="mr-1 text-xl text-slate-900">{pitch.total}</b>lượt đánh giá</p>
                <span className={`mt-4 flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-black ${pitch.pending ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}><span className="inline-flex items-center gap-2"><MessageSquare size={15} />{pitch.pending ? `${pitch.pending} cần phản hồi` : 'Đã phản hồi đủ'}</span><span>&gt;</span></span>
              </button>
            );
          }) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-400 md:col-span-2 xl:col-span-4">Chưa có dữ liệu đánh giá theo sân.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">Bộ lọc đánh giá</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{filteredReviews.length} đánh giá phù hợp</h2>
          </div>
          {(searchTerm || pitchFilter !== 'all' || ratingFilter !== 'all' || replyFilter !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setPitchFilter('all'); setRatingFilter('all'); setReplyFilter('all'); }}
              className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-600 hover:text-white"
            >
              Xóa lọc
            </button>
          )}
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_repeat(3,minmax(130px,180px))]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" placeholder="Tìm khách hàng, sân, nội dung..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 placeholder:text-slate-500 outline-none focus:border-blue-300 focus:bg-white" />
          </label>
          <select value={pitchFilter} onChange={(event) => setPitchFilter(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300">
            <option value="all">Tất cả sân</option>
            {pitchStats.map((pitch) => <option key={pitch.id} value={pitch.id}>{pitch.name}</option>)}
          </select>
          <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300">
            <option value="all">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} sao</option>)}
          </select>
          <select value={replyFilter} onChange={(event) => setReplyFilter(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-300">
            <option value="all">Tất cả phản hồi</option>
            <option value="pending">Chưa phản hồi</option>
            <option value="replied">Đã phản hồi</option>
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={38} />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Đang tải đánh giá</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <MessageSquare size={54} className="mb-4 text-slate-200" />
            <h3 className="text-lg font-black text-slate-800">Chưa có đánh giá phù hợp</h3>
            <p className="mt-2 text-sm font-semibold text-slate-400">Thử đổi bộ lọc hoặc chờ phản hồi mới từ khách hàng.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden grid-cols-[minmax(220px,.9fr)_minmax(280px,1.3fr)_minmax(220px,1fr)_150px] gap-4 rounded-xl bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 lg:grid">
              <span>Khách hàng & sân</span>
              <span>Nội dung đánh giá</span>
              <span>Phản hồi</span>
              <span className="text-right">Thao tác</span>
            </div>
            {pagedReviews.map((review) => (
              <motion.article key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                <div className="grid gap-4 lg:grid-cols-[minmax(220px,.9fr)_minmax(280px,1.3fr)_minmax(220px,1fr)_150px] lg:items-center">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
                      {review.userName[0]?.toUpperCase() || <User size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{review.userName}</p>
                      <Link to={getPitchDetailUrl(review)} className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-[10px] font-black uppercase tracking-widest text-blue-700">
                        {pitchTypeLabel(review.pitchType)}
                        <ExternalLink size={11} />
                      </Link>
                      <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <Calendar size={12} />
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}</div>
                    <p className="line-clamp-3 text-sm font-bold leading-6 text-slate-700">{review.comment}</p>
                  </div>

                  <div>
                    {review.reply ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700"><CheckCircle size={13} />Đã phản hồi</p>
                        <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{review.reply}</p>
                      </div>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700 ring-1 ring-amber-100">Chưa phản hồi</span>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Link to={getPitchDetailUrl(review)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700" title="Xem công khai">
                      <ExternalLink size={16} />
                    </Link>
                    <button onClick={() => openReplyModal(review)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-3 text-xs font-black text-white transition hover:bg-blue-800">
                      <MessageSquare size={15} />
                      {review.reply ? 'Sửa' : 'Trả lời'}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
            <Pagination page={page} totalItems={filteredReviews.length} pageSize={pageSize} onPageChange={setPage} label="đánh giá" />
          </div>
        )}
      </section>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeReplyModal} className="absolute inset-0 bg-slate-950/50" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Phản hồi khách hàng</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Phản hồi sẽ hiển thị công khai trên trang sân.</p>
                </div>
                <button onClick={closeReplyModal} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:text-slate-900">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleReply} className="space-y-5 p-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đánh giá của {selectedReview?.userName}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selectedReview?.comment}</p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung phản hồi</span>
                  <textarea
                    required
                    rows={5}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5"
                    placeholder="Cảm ơn bạn đã góp ý. Chúng tôi sẽ kiểm tra và cải thiện trải nghiệm trong lần tới..."
                  />
                </label>

                <div className="flex gap-3 border-t border-slate-100 pt-5">
                  <button type="button" onClick={closeReplyModal} className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-widest text-slate-500 transition hover:bg-slate-50">
                    Hủy
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-700 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-800 disabled:opacity-60">
                    {isSubmitting ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
                    Gửi phản hồi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Reviews;
