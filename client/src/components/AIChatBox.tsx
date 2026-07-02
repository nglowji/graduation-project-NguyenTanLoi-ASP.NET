import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  CalendarCheck,
  ChevronRight,
  Clock3,
  Gavel,
  Loader2,
  MapPin,
  Maximize2,
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

const starterOptions = [
  { label: 'Gợi ý sân phù hợp', prompt: 'Gợi ý sân phù hợp', icon: MapPin, tone: 'text-emerald-600 bg-emerald-50' },
  { label: 'Cách đặt và cọc sân', prompt: 'Cách đặt và cọc sân', icon: CalendarCheck, tone: 'text-blue-600 bg-blue-50' },
  { label: 'Khởi động trước khi đá bóng', prompt: 'Khởi động trước khi đá bóng', icon: Clock3, tone: 'text-amber-600 bg-amber-50' },
  { label: 'Luật việt vị', prompt: 'Luật việt vị', icon: Gavel, tone: 'text-violet-600 bg-violet-50' },
] as const;

const starterQuestions = [
  'Sân bóng gần đây có trống không?',
  'Giá thuê sân bóng 7 người là bao nhiêu?',
  'Có sân cầu lông vào tối nay không?',
];

const moneyFormatter = new Intl.NumberFormat('vi-VN');

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const formatMoney = (value?: number | null) => (value ? `${moneyFormatter.format(value)}đ` : undefined);

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
  const authHint = isAuthenticated ? '' : '\n\nĐăng nhập sẽ giúp mình gợi ý theo dữ liệu sân và lịch sử đặt sân của bạn.';

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

  // Hide chatbox on auth and dashboard pages
  const shouldHideChatbox = useMemo(() => {
    const path = location.pathname.toLowerCase();
    return (
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/forgot-password') ||
      path.startsWith('/dashboard')
    );
  }, [location.pathname]);

  if (shouldHideChatbox) {
    return null;
  }
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<number | null>(null);
  const previewPositionRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ pointerId: -1, startX: 0, startY: 0, originX: 0, originY: 0, moved: false });

  const [position, setPosition] = useState(() => ({
    x: typeof window === 'undefined' ? 24 : Math.max(16, window.innerWidth - 80),
    y: typeof window === 'undefined' ? 24 : Math.max(88, window.innerHeight - 80),
  }));

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Chào bạn, mình có thể giúp tìm sân phù hợp, hướng dẫn đặt sân hoặc trả lời nhanh các câu hỏi thể thao.',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);
  const panelWidth = isExpanded ? 'w-[min(680px,calc(100vw-32px))]' : 'w-[min(440px,calc(100vw-32px))]';
  const messageHeight = isExpanded ? 'max-h-[560px] min-h-[300px]' : 'max-h-[430px] min-h-[300px]';
  const panelAlign = typeof window !== 'undefined' && position.x < window.innerWidth / 2 ? 'left-0' : 'right-0';
  const panelVertical = typeof window !== 'undefined' && position.y < window.innerHeight * 0.45 ? 'top-[72px]' : 'bottom-[72px]';

  const clampPosition = (x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y };

    return {
      x: Math.min(Math.max(12, x), window.innerWidth - 68),
      y: Math.min(Math.max(88, y), window.innerHeight - 68),
    };
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => setPosition((current) => clampPosition(current.x, current.y));
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleBubblePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
    previewPositionRef.current = position;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBubblePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) dragRef.current.moved = true;

    const nextPosition = clampPosition(dragRef.current.originX + deltaX, dragRef.current.originY + deltaY);
    previewPositionRef.current = nextPosition;

    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      if (!wrapperRef.current) return;
      const preview = previewPositionRef.current;
      wrapperRef.current.style.transform = `translate3d(${preview.x - position.x}px, ${preview.y - position.y}px, 0)`;
    });
  };

  const handleBubblePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current.pointerId = -1;

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (wrapperRef.current) wrapperRef.current.style.transform = '';
    setPosition(previewPositionRef.current);
  };

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
    <div ref={wrapperRef} className="fixed z-[120] font-sans" style={{ left: position.x, top: position.y }}>
      {isOpen && (
        <section
          className={`absolute ${panelVertical} ${panelAlign} ${panelWidth} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 transition-all duration-200`}
          aria-label="SmartSport AI chat"
        >
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Bot size={20} />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-slate-950">SmartSport AI</h2>
                <p className="truncate text-xs font-semibold text-slate-500">Tư vấn sân và hỗ trợ nhanh</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={isExpanded ? 'Thu nhỏ trợ lý AI' : 'Mở rộng trợ lý AI'}
              >
                {isExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng trợ lý AI"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className={`custom-scrollbar ${messageHeight} space-y-4 overflow-y-auto bg-slate-50 px-4 py-4`}>
            {messages.length === 1 ? (
              <AIWelcome onPrompt={(prompt) => sendMessage(undefined, prompt)} />
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={`flex max-w-[92%] gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {message.role === 'assistant' && (
                        <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                          <Sparkles size={15} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div
                          className={`space-y-2 rounded-xl px-4 py-3 text-sm font-semibold leading-6 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-200 bg-white text-slate-700 shadow-sm'
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
                                className="group block rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <span className="block truncate text-sm font-black text-slate-950">{item.pitchName}</span>
                                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                                      {item.reasons?.[0] || `Độ phù hợp ${Math.round(item.score)}%`}
                                    </span>
                                  </div>
                                  <ChevronRight
                                    size={18}
                                    className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700"
                                  />
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {formatMoney(item.estimatedPrice) && (
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                                      Từ {formatMoney(item.estimatedPrice)}
                                    </span>
                                  )}
                                  {item.distanceKm && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
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
              </>
            )}

            {isSending && (
              <div className="flex items-center gap-2 text-xs font-black text-blue-700">
                <Loader2 className="animate-spin text-blue-700" size={15} />
                Đang trả lời...
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Hỏi về sân, thanh toán hoặc luật thể thao..."
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        onPointerDown={handleBubblePointerDown}
        onPointerMove={handleBubblePointerMove}
        onPointerUp={handleBubblePointerUp}
        onPointerCancel={handleBubblePointerUp}
        onClick={() => {
          if (dragRef.current.moved) {
            dragRef.current.moved = false;
            return;
          }
          setIsOpen((value) => !value);
        }}
        className="group relative grid h-14 w-14 touch-none place-items-center rounded-2xl border border-slate-200 bg-white text-blue-600 shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-blue-50"
        aria-label={isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        title="Kéo để di chuyển"
      >
        <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-white bg-emerald-400" />
        {isOpen ? <X size={23} /> : isSending ? <Sparkles size={24} className="animate-pulse" /> : <Bot size={26} />}
      </button>
    </div>
  );
};

const AIWelcome = ({ onPrompt }: { onPrompt: (prompt: string) => void }) => (
  <div className="space-y-4">
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <Bot size={22} />
        </span>
        <div>
          <p className="text-lg font-black text-slate-950">Xin chào!</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Mình có thể giúp bạn tìm sân phù hợp, hướng dẫn đặt sân, thanh toán cọc hoặc trả lời nhanh câu hỏi thể thao.
          </p>
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">Hỏi nhanh</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {starterOptions.map(({ label, prompt, icon: Icon, tone }) => (
          <button
            key={label}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-3 text-left text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}>
              <Icon size={17} />
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>

    <div className="space-y-2">
      {starterQuestions.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onPrompt(question)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
        >
          <span>{question}</span>
          <ChevronRight size={18} />
        </button>
      ))}
    </div>
  </div>
);

export default AIChatBox;
