import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  MessageSquare,
  Search,
  Send,
  Star,
  X,
  User,
  CheckCheck,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink
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
  if (!value || typeof value !== 'object') {
    return false;
  }

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
const pitchTypeLabel = (type?: string) => ({ '1': 'Bóng đá 5 người', Football5: 'Bóng đá 5 người', '2': 'Bóng đá 7 người', Football7: 'Bóng đá 7 người', '3': 'Bóng đá 11 người', Football11: 'Bóng đá 11 người', '4': 'Tennis', Tennis: 'Tennis', '5': 'Cầu lông', Badminton: 'Cầu lông', '6': 'Pickleball', Pickleball: 'Pickleball', '7': 'Bóng rổ', Basketball: 'Bóng rổ', '8': 'Bóng chuyền', Volleyball: 'Bóng chuyền', '9': 'Bóng bàn', TableTennis: 'Bóng bàn' }[String(type || '')] || 'Chưa phân loại');

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
  const [page, setPage] = useState(1);
  const [showAllPending, setShowAllPending] = useState(false);
  const [pendingPage, setPendingPage] = useState(1);
  const pendingPageSize = 6;
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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const pitchStats = Array.from(reviews.reduce((map, review) => {
    const current = map.get(review.pitchId) || { id: review.pitchId, name: review.pitchName, type: review.pitchType, total: 0, score: 0, pending: 0 };
    current.total += 1; current.score += review.rating; if (!review.reply) current.pending += 1; map.set(review.pitchId, current); return map;
  }, new Map<string, { id: string; name: string; type?: string; total: number; score: number; pending: number }>()).values());
  const pitchOptions = pitchStats.map(pitch => [pitch.id, `${pitch.name} - ${pitchTypeLabel(pitch.type)}`] as const);
  const filteredReviews = reviews.filter(r =>
    (r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.pitchName.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (pitchFilter === 'all' || r.pitchId === pitchFilter) &&
    (ratingFilter === 'all' || r.rating === Number(ratingFilter)) &&
    (replyFilter === 'all' || (replyFilter === 'replied' ? Boolean(r.reply) : !r.reply))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const pagedReviews = filteredReviews.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [searchTerm, pitchFilter, ratingFilter, replyFilter]);
  useEffect(() => {
    const maxPage = Math.max(Math.ceil(filteredReviews.length / pageSize), 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredReviews.length, page]);

  const stats = {
    average: reviews.length > 0
      ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
    total: reviews.length,
    replied: reviews.filter(r => r.reply).length
  };
  const pendingReviews = reviews.filter(review => !review.reply).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const pendingPageCount = Math.max(Math.ceil(pendingReviews.length / pendingPageSize), 1);
  const pendingPageItems = pendingReviews.slice((pendingPage - 1) * pendingPageSize, pendingPage * pendingPageSize);

  const getPitchDetailUrl = (review: OwnerReview) =>
    `/san/${review.pitchId}-${slugify(review.pitchName || 'san')}`;

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {pendingReviews.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-sm">
          <button type="button" onClick={() => setShowAllPending(value => !value)} className="flex w-full items-center justify-between gap-4 bg-amber-50 px-5 py-4 text-left transition hover:bg-amber-100">
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-400 text-amber-950"><AlertTriangle size={22} /></span>
              <div><p className="text-xs font-black uppercase tracking-widest text-amber-800">Cần xử lý ngay</p><h2 className="mt-1 text-lg font-black text-slate-950">{pendingReviews.length} đánh giá đang chờ phản hồi</h2></div>
            </div>
            <span className="flex items-center gap-2 text-sm font-black text-slate-800">Xem thông báo <ChevronDown size={18} className={`transition ${showAllPending ? 'rotate-180' : ''}`} /></span>
          </button>
          {showAllPending && <div className="bg-slate-50/70 p-3"><div className="grid gap-3 lg:grid-cols-2">{pendingPageItems.map(review => <button key={review.id} type="button" onClick={() => openReplyModal(review)} className="rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-3"><strong className="truncate text-sm text-slate-950">{review.userName}</strong><span className="flex gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} className={index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}</span></div><p className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-700">{pitchTypeLabel(review.pitchType)}</p><p className="mt-3 line-clamp-2 text-sm font-bold text-slate-700">{review.comment}</p><span className="mt-3 inline-flex items-center gap-2 text-xs font-black text-blue-700"><MessageSquare size={14} />Trả lời ngay</span></button>)}</div><div className="mt-3 flex items-center justify-end gap-2"><button type="button" disabled={pendingPage === 1} onClick={() => setPendingPage(value => value - 1)} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm disabled:opacity-40">Trước</button><span className="text-xs font-black text-slate-500">{pendingPage}/{pendingPageCount}</span><button type="button" disabled={pendingPage === pendingPageCount} onClick={() => setPendingPage(value => value + 1)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Sau</button></div></div>}
        </section>
      )}

      <header className="overflow-hidden rounded-2xl bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/70">
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Public Feedback</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Đánh giá khách hàng</h1>
          <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600">Ưu tiên phản hồi sớm và theo dõi trải nghiệm riêng từng loại sân.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Star className="fill-current" size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.average}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-300" /> {stats.total} lượt đánh giá
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-slate-950 lg:flex">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCheck size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.replied}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Đã phản hồi</p>
            </div>
          </div>
        </div></div>
      </header>

      <section className="rounded-2xl bg-slate-100/70 p-3">
        <div className="flex flex-wrap items-end justify-between gap-3 px-3 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">Chất lượng từng sân</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Điểm đánh giá theo từng sân</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">Chọn một sân để xem riêng phản hồi của sân đó.</p>
          </div>
          <span className="text-sm font-bold text-slate-500">{pitchStats.length} sân có đánh giá</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...pitchStats].sort((a, b) => pitchTypeLabel(a.type).localeCompare(pitchTypeLabel(b.type), 'vi')).map(pitch => {
            const average = pitch.score / pitch.total;
            return (
              <motion.button whileHover={{ y: -3 }} type="button" key={pitch.id} onClick={() => setPitchFilter(pitch.id)} className="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200/60 transition hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-blue-700">{pitchTypeLabel(pitch.type)}</p>
                    <p className="mt-1 truncate text-base font-black text-slate-950">{pitch.name}</p>
                  </div>
                  <span className="text-3xl font-black text-amber-500">{average.toFixed(1)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={22} strokeWidth={2.2} className={index < Math.round(average) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'} />)}</div>
                  <span className="text-sm font-black text-slate-700">{pitch.total} lượt · <span className={pitch.pending ? 'text-amber-700' : 'text-emerald-700'}>{pitch.pending} chờ trả lời</span></span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_repeat(3,minmax(150px,220px))]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" placeholder="Tìm khách hàng, nội dung đánh giá..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500" />
          </label>
          <select value={pitchFilter} onChange={(event) => setPitchFilter(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800"><option value="all">Tất cả sân</option>{pitchOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
          <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800"><option value="all">Tất cả mức sao</option>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} sao</option>)}</select>
          <select value={replyFilter} onChange={(event) => setReplyFilter(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800"><option value="all">Tất cả phản hồi</option><option value="replied">Đã phản hồi</option><option value="pending">Chưa phản hồi</option></select>
        </div>
      </section>

      <div className="space-y-3 rounded-2xl bg-slate-100/70 p-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8 animate-in fade-in duration-700">
            <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Retrieving feedback data...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-40 text-center dark:border-slate-700 dark:bg-slate-900/30">
            <MessageSquare size={64} className="mx-auto mb-6 text-slate-200 dark:text-slate-800" />
            <h3 className="text-xl font-black text-slate-400 dark:text-slate-600">Chưa có đánh giá</h3>
            <p className="text-slate-400 text-sm mt-2">Phản hồi từ khách hàng sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <>
          <div className="hidden grid-cols-[minmax(190px,0.8fr)_minmax(260px,1.4fr)_minmax(230px,1fr)] gap-5 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-500 lg:grid">
            <span>Khách hàng & sân</span>
            <span>Nội dung đánh giá</span>
            <span className="text-right">Phản hồi & thao tác</span>
          </div>
          {pagedReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(190px,0.8fr)_minmax(260px,1.4fr)_minmax(230px,1fr)] lg:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">
                    {review.userName[0]?.toUpperCase() || <User size={24} />}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black leading-none text-slate-950">{review.userName}</h4>
                    <Link to={getPitchDetailUrl(review)} className="flex w-fit items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900/50">
                      <div className="w-1 h-1 rounded-full bg-blue-600" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pitchTypeLabel(review.pitchType)}</span>
                      <ExternalLink size={11} className="text-slate-400" />
                    </Link>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} size={20} 
                            className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'} 
                          />
                        ))}
                      </div>
                      <span className="text-xs font-black text-slate-300">/</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={12} /> {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute -left-4 -top-2 text-4xl text-blue-600/10 font-serif">“</span>
                      <p className="pl-2 text-xl font-black leading-7 text-slate-950">
                        {review.comment}
                      </p>
                    </div>

                    {review.reply && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative border-l-4 border-emerald-500 bg-emerald-50 p-3"
                      >
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <CheckCircle size={14} /> Phản hồi từ chủ sân
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{review.reply}</p>
                      </motion.div>
                    )}
                  </div>

                </div>
                <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      to={getPitchDetailUrl(review)}
                      className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <ExternalLink size={16} />
                      Xem trực tiếp
                    </Link>
                    <button
                      onClick={() => openReplyModal(review)}
                      className="group/btn flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white transition hover:bg-blue-700"
                    >
                      <MessageSquare size={16} /> 
                      {review.reply ? 'Cập nhật phản hồi' : 'Gửi phản hồi ngay'}
                      <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
              </div>
            </motion.div>
          ))}
          <Pagination page={page} totalItems={filteredReviews.length} pageSize={pageSize} onPageChange={setPage} label="đánh giá" />
          </>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeReplyModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-600/30">
                    <MessageSquare size={28} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Phản hồi khách</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-3">Engagement & CRM</p>
                  </div>
                </div>
                <button 
                  onClick={closeReplyModal} 
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-100 dark:border-slate-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 space-y-10">
                <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-950/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Nội dung đánh giá của {selectedReview?.userName}</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed">"{selectedReview?.comment}"</p>
                </div>

                <form onSubmit={handleReply} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung phản hồi của bạn</label>
                    <textarea
                      required
                      rows={5}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-3xl py-6 px-8 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-600 transition-all resize-none shadow-inner"
                      placeholder="VD: Cảm ơn bạn đã đóng góp ý kiến, chúng tôi sẽ cải thiện chất lượng sân ngay..."
                    />
                  </div>

                  <div className="flex gap-5">
                    <button
                      type="button"
                      onClick={closeReplyModal}
                      className="flex-1 rounded-xl border border-slate-200 bg-white py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-sm transition-all hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex flex-[2] items-center justify-center gap-4 rounded-xl bg-blue-600 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={20} className="group-hover/save:translate-x-1 group-hover/save:-translate-y-1 transition-transform" />
                      )}
                      <span>Gửi phản hồi công khai</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reviews;
