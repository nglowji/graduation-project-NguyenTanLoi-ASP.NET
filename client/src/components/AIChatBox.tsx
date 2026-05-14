import React, { useMemo, useState } from 'react';
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiService, type ChatResponse } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: ChatResponse['recommendations'];
};

const AIChatBox: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Chào bạn, mình có thể gợi ý sân theo vị trí, ngân sách hoặc khung giờ bạn muốn chơi.',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const sendMessage = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    setInput('');
    setIsSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    if (!isAuthenticated) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Bạn cần đăng nhập để dùng trợ lý AI và nhận gợi ý cá nhân hóa.' },
      ]);
      setIsSending(false);
      return;
    }

    try {
      const result = await aiService.chat(text, sessionId);
      setSessionId(result.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.response,
          recommendations: result.recommendations,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: error.message || 'AI đang bận một chút, bạn thử lại sau nhé.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[120]">
      {isOpen && (
        <div className="mb-4 w-[min(380px,calc(100vw-40px))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#11131c]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">SmartSport AI</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tư vấn sân nhanh</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block max-w-[88%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/80'
                }`}>
                  {message.content}
                </div>
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.recommendations.slice(0, 3).map((item) => (
                      <Link
                        key={item.pitchId}
                        to={`/field/${item.pitchId}`}
                        className="block rounded-2xl border border-primary/10 bg-primary/5 p-3 text-left text-xs font-bold text-slate-700 hover:border-primary/30 dark:text-white/80"
                      >
                        <span className="block font-black text-primary">{item.pitchName}</span>
                        <span>{item.reasons?.[0] || `Điểm phù hợp ${Math.round(item.score)}%`}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-100 p-4 dark:border-white/10">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ví dụ: sân cầu lông dưới 150k..."
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white disabled:opacity-50"
            >
              {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-2xl shadow-primary/30 transition-transform hover:scale-105"
        aria-label="Open AI chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default AIChatBox;
