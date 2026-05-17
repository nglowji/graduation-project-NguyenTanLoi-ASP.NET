import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  ChevronRight,
  Loader2,
  MapPin,
  Maximize2,
  MessageCircle,
  Minimize2,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { slugify } from '../utils/slug';
import { aiService, type ChatResponse } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: ChatResponse['recommendations'];
};

const quickPrompts = [
  'Gợi ý sân tối nay',
  'Cách đặt và cọc sân',
  'Khởi động trước khi đá bóng',
  'Luật việt vị',
];

const moneyFormatter = new Intl.NumberFormat('vi-VN');

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const formatMoney = (value?: number | null) =>
  value ? `${moneyFormatter.format(value)}đ` : undefined;

const answerSimpleMath = (message: string) => {
  const normalizedExpression = message
    .replace(/,/g, '.')
    .replace(/[＝]/g, '=')
    .match(/(-?\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*(-?\d+(?:\.\d+)?)/);

  if (!normalizedExpression) return undefined;

  const left = Number(normalizedExpression[1]);
  const operator = normalizedExpression[2];
  const right = Number(normalizedExpression[3]);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return undefined;

  const result =
    operator === '+'
      ? left + right
      : operator === '-'
        ? left - right
        : operator === '*' || operator === 'x' || operator === '×'
          ? left * right
          : right === 0
            ? undefined
            : left / right;

  return result === undefined ? 'Không thể chia cho 0 nhé.' : `${left} ${operator} ${right} = ${result}.`;
};

const isBackendFailureMessage = (value?: string) => {
  if (!value) return true;

  const text = normalize(value);
  return (
    text.includes('xin loi') &&
    (text.includes('loi xay ra') ||
      text.includes('vui long thu lai') ||
      text.includes('khong the tra loi') ||
      text.includes('dang ban'))
  );
};

const buildLocalAnswer = (message: string, isAuthenticated: boolean) => {
  const text = normalize(message);
  const mathAnswer = answerSimpleMath(message);
  const authHint = isAuthenticated
    ? ''
    : '\n\nĐăng nhập sẽ giúp mình gợi ý theo dữ liệu sân và lịch sử đặt sân của bạn.';

  if (mathAnswer) return `${mathAnswer}${authHint}`;

  if (text.includes('offside') || text.includes('viet vi')) {
    return `Luật việt vị: cầu thủ tấn công đứng gần khung thành đối phương hơn bóng và hậu vệ áp chót tại thời điểm đồng đội chuyền bóng, rồi tham gia vào pha bóng. Không tính việt vị khi nhận bóng từ phạt góc, ném biên hoặc phát bóng lên.${authHint}`;
  }

  if (text.includes('khoi dong') || text.includes('warm up')) {
    return `Khởi động 8-12 phút là ổn: xoay khớp, chạy nhẹ, ép động, rồi tăng tốc ngắn vài lần. Cơ thể nóng lên vừa đủ sẽ giảm chấn thương và vào trận tốt hơn.${authHint}`;
  }

  if (text.includes('coc') || text.includes('thanh toan') || text.includes('vnpay')) {
    return `Bạn chọn sân và khung giờ, hệ thống giữ chỗ, thanh toán cọc 10% qua VNPAY rồi nhận mã check-in. Phần còn lại thanh toán theo chính sách của chủ sân.${authHint}`;
  }

  if (text.includes('huy') || text.includes('hoan tien')) {
    return `Bạn nên mở đơn đặt sân trong hồ sơ để kiểm tra trạng thái. Điều kiện hủy hoặc hoàn tiền phụ thuộc chính sách chủ sân và thời điểm hủy.${authHint}`;
  }

  if (
    text.includes('goi y') ||
    text.includes('tim san') ||
    text.includes('san nao') ||
    text.includes('bong da') ||
    text.includes('cau long') ||
    text.includes('tennis') ||
    text.includes('pickleball')
  ) {
    return `Bạn cho mình môn, khu vực, ngân sách và giờ muốn chơi. Ví dụ: "sân cầu lông dưới 150k lúc 19h" để mình lọc chính xác hơn.${authHint}`;
  }

  if (text.includes('xin chao') || text === 'hi' || text.includes('hello')) {
    return `Chào bạn, mình có thể giúp tìm sân, so sánh giá, hướng dẫn đặt cọc, hủy lịch hoặc trả lời nhanh các câu hỏi thể thao.${authHint}`;
  }

  return `Mình hiểu câu hỏi của bạn là: "${message}". Bạn có thể hỏi về sân, lịch đặt, thanh toán hoặc các câu hỏi thể thao thông thường.${authHint}`;
};

const renderMessageText = (content: string) =>
  content
    .split('\n')
    .filter(Boolean)
    .map((paragraph, index) => {
      const text = paragraph.trim();
      const isListItem = text.startsWith('- ');
      return <p key={`${text}-${index}`}>{isListItem ? text.slice(2) : text}</p>;
    });

const AIChatBox: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Chào bạn, mình có thể giúp tìm sân phù hợp, hướng dẫn đặt sân hoặc trả lời nhanh các câu hỏi thể thao.',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);
  const panelWidth = isExpanded ? 'w-[min(720px,calc(100vw-32px))]' : 'w-[min(420px,calc(100vw-32px))]';
  const messageHeight = isExpanded ? 'max-h-[560px] min-h-[260px]' : 'max-h-[360px] min-h-[180px]';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  const appendAssistantMessage = (content: string, recommendations?: ChatResponse['recommendations']) => {
    setMessages((prev) => [...prev, { role: 'assistant', content, recommendations }]);
  };

  const sendMessage = async (event?: React.FormEvent, prompt?: string) => {
    event?.preventDefault();
    const rawText = (prompt ?? input).trim();
    if (!rawText || isSending) return;

    const text = `${rawText}\n\n[Ngữ cảnh trang hiện tại: ${location.pathname}]`;

    setInput('');
    setIsSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: rawText }]);

    if (!isAuthenticated) {
      window.setTimeout(() => {
        appendAssistantMessage(buildLocalAnswer(rawText, false));
        setIsSending(false);
      }, 220);
      return;
    }

    try {
      const result = await aiService.chat(text, sessionId);
      setSessionId(result.sessionId);
      appendAssistantMessage(
        isBackendFailureMessage(result.response) ? buildLocalAnswer(rawText, true) : result.response,
        result.recommendations,
      );
    } catch {
      appendAssistantMessage(buildLocalAnswer(rawText, true));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[120] font-sans">
      {isOpen && (
        <section
          className={`mb-4 ${panelWidth} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 transition-all duration-200 dark:border-white/10 dark:bg-slate-950`}
          aria-label="SmartSport AI chat"
        >
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white">
                <Bot size={20} />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-slate-950 dark:text-white">SmartSport AI</h2>
                <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Tư vấn sân và hỗ trợ nhanh
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={isExpanded ? 'Thu nhỏ trợ lý AI' : 'Mở rộng trợ lý AI'}
              >
                {isExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Đóng trợ lý AI"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className={`custom-scrollbar ${messageHeight} space-y-4 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-900/70`}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`flex max-w-[92%] gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                      <Sparkles size={15} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div
                      className={`space-y-2 rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${
                        message.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-950 dark:text-slate-100'
                      }`}
                    >
                      {renderMessageText(message.content)}
                    </div>

                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-3 grid gap-2">
                        {message.recommendations.slice(0, isExpanded ? 5 : 3).map((item) => (
                          <Link
                            key={item.pitchId}
                            to={`/san/${item.pitchId}${item.pitchName ? `-${slugify(item.pitchName)}` : ''}`}
                            onClick={() => setIsOpen(false)}
                            className="group block rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:shadow-sm dark:border-white/10 dark:bg-slate-950"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="block truncate text-sm font-black text-slate-950 dark:text-white">{item.pitchName}</span>
                                <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                                  {item.reasons?.[0] || `Độ phù hợp ${Math.round(item.score)}%`}
                                </span>
                              </div>
                              <ChevronRight size={18} className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {formatMoney(item.estimatedPrice) && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:bg-white/10 dark:text-slate-200">
                                  Từ {formatMoney(item.estimatedPrice)}
                                </span>
                              )}
                              {item.distanceKm && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:bg-white/10 dark:text-slate-200">
                                  <MapPin size={11} />
                                  {item.distanceKm.toFixed(1)} km
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400">
                <Loader2 className="animate-spin text-indigo-600" size={15} />
                Đang trả lời...
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(undefined, prompt)}
                  disabled={isSending}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Hỏi về sân, thanh toán hoặc luật thể thao..."
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Gửi tin nhắn"
              >
                {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="grid h-[56px] w-[56px] place-items-center rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-700"
        aria-label={isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
      >
        {isOpen ? <X size={23} /> : isSending ? <Sparkles size={23} /> : <MessageCircle size={23} />}
      </button>
    </div>
  );
};

export default AIChatBox;
