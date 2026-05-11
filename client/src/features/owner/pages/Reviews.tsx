import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, MessageSquare, Calendar, 
  Search, X, Send, CheckCircle 
} from 'lucide-react';
import api from '../../../services/api';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/owner/reviews');
      setReviews(res.data || []);
    } catch {
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/owner/reviews/${selectedReview.id}/reply`, { content: replyText });
      setIsModalOpen(false);
      setReplyText('');
      fetchReviews();
    } catch {
      alert('Không thể gửi phản hồi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    average: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0',
    total: reviews.length
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Đánh giá khách hàng</h1>
          <p className="text-white/40 text-sm mt-1">Lắng nghe ý kiến từ người chơi để cải thiện chất lượng dịch vụ</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl flex items-center gap-4">
            <Star className="text-blue-500 fill-current" size={20} />
            <div>
              <p className="text-xl font-black text-white leading-none">{stats.average}</p>
              <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest mt-1">Trung bình ({stats.total} lượt)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1c26] border border-white/5 rounded-[2.5rem] p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm đánh giá..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Đang tải đánh giá...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-32 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
              <MessageSquare size={48} className="mx-auto mb-4 text-white/5" />
              <p className="text-white/20 font-black uppercase tracking-widest text-sm">Chưa có đánh giá nào từ khách hàng</p>
            </div>
          ) : (
            reviews.map((r, index) => (
              <motion.div 
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-8 bg-[#1e202b] border border-white/5 rounded-[2rem] hover:border-blue-500/20 transition-all group"
              >
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center text-blue-500 font-black text-lg shadow-lg shrink-0">
                    {r.userName?.[0] || 'U'}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <h4 className="font-black text-white">{r.userName}</h4>
                        <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest mt-0.5">Sân: {r.pitchName}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < r.rating ? 'text-amber-500 fill-current' : 'text-white/10'} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={12} /> {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-white/60 text-sm leading-relaxed mb-6 italic">"{r.comment}"</p>
                    
                    {r.reply && (
                      <div className="mb-6 p-5 bg-white/5 rounded-2xl border-l-4 border-blue-600">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <CheckCircle size={12} /> Đã phản hồi
                        </p>
                        <p className="text-xs text-white/40 leading-relaxed">{r.reply}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setSelectedReview(r); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <MessageSquare size={14} /> {r.reply ? 'Sửa phản hồi' : 'Phản hồi'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#1a1c26] border border-white/10 rounded-[2.5rem] shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white tracking-tight">Phản hồi đánh giá</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Đánh giá của {selectedReview?.userName}</p>
                <p className="text-xs text-white/60 italic leading-relaxed">"{selectedReview?.comment}"</p>
              </div>

              <form onSubmit={handleReply} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Nội dung phản hồi</label>
                  <textarea 
                    required
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                    placeholder="Cảm ơn bạn đã đóng góp ý kiến..."
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-white/5 text-white/40 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-white transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                    Gửi phản hồi
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
