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
  Filter,
  CheckCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import api from '../../../services/api';
import { slugify } from '../../../utils/slug';

type OwnerReview = {
  id: string;
  userName: string;
  pitchId: string;
  pitchName: string;
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

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<OwnerReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredReviews = reviews.filter(r => 
    r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.pitchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    average: reviews.length > 0
      ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
    total: reviews.length,
    replied: reviews.filter(r => r.reply).length
  };

  const getPitchDetailUrl = (review: OwnerReview) =>
    `/san/${review.pitchId}-${slugify(review.pitchName || 'san')}`;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Public Feedback</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Đánh giá khách hàng</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Lắng nghe và tương tác với cộng đồng người chơi.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-4 rounded-3xl flex items-center gap-6 shadow-sm group hover:border-blue-600/20 transition-all">
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
          <div className="hidden lg:flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-4 rounded-3xl items-center gap-6 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCheck size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.replied}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Đã phản hồi</p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-3 shadow-sm flex flex-col md:flex-row items-center gap-4 group">
        <div className="relative flex-1 group/search">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên khách, nội dung hoặc sân..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none py-5 pl-16 pr-6 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 font-bold focus:ring-0"
          />
        </div>
        <div className="px-6 flex items-center gap-2 text-slate-400 border-l border-slate-100 dark:border-slate-700">
          <Filter size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Sắp xếp: Mới nhất</span>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8 animate-in fade-in duration-700">
            <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Retrieving feedback data...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-40 bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
            <MessageSquare size={64} className="mx-auto mb-6 text-slate-200 dark:text-slate-800" />
            <h3 className="text-xl font-black text-slate-400 dark:text-slate-600">Chưa có đánh giá</h3>
            <p className="text-slate-400 text-sm mt-2">Phản hồi từ khách hàng sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex items-start gap-6 lg:w-1/3">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-600/20 shrink-0">
                    {review.userName[0]?.toUpperCase() || <User size={24} />}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none">{review.userName}</h4>
                    <Link to={getPitchDetailUrl(review)} className="flex w-fit items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900/50">
                      <div className="w-1 h-1 rounded-full bg-blue-600" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{review.pitchName}</span>
                      <ExternalLink size={11} className="text-slate-400" />
                    </Link>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} size={14} 
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

                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="relative">
                      <span className="absolute -left-4 -top-2 text-4xl text-blue-600/10 font-serif">“</span>
                      <p className="text-slate-600 dark:text-slate-300 text-base font-medium leading-relaxed italic pl-2">
                        {review.comment}
                      </p>
                    </div>

                    {review.reply && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-3xl border-l-4 border-emerald-500 relative"
                      >
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <CheckCircle size={14} /> Phản hồi từ chủ sân
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{review.reply}</p>
                      </motion.div>
                    )}
                  </div>

                  <div className="pt-8 flex flex-wrap justify-end gap-3">
                    <Link
                      to={getPitchDetailUrl(review)}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      <ExternalLink size={16} />
                      Xem trực tiếp
                    </Link>
                    <button
                      onClick={() => openReplyModal(review)}
                      className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all group/btn"
                    >
                      <MessageSquare size={16} /> 
                      {review.reply ? 'Cập nhật phản hồi' : 'Gửi phản hồi ngay'}
                      <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
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
              className="relative w-full max-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800"
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
                <div className="p-8 bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 relative">
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
                      className="flex-1 py-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] py-6 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-4 active:scale-[0.98] transition-all group/save"
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
