import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '../utils/slug';
import { aiService, type ChatResponse } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: ChatResponse['recommendations'];
};

const quickPrompts = [
  'Gợi ý sân cầu lông dưới 150k tối nay',
  'Quy trình đặt sân và thanh toán cọc như thế nào?',
  'Tôi nên đặt sân trước bao lâu?',
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
    : '\n\nBạn đang chưa đăng nhập nên mình trả lời ở chế độ nhanh. Đăng nhập sẽ giúp mình lấy dữ liệu sân và gợi ý cá nhân hóa tốt hơn.';

  if (mathAnswer) {
    return `${mathAnswer}${authHint}`;
  }

  if (
    text.includes('day san bong da') ||
    text.includes('san bong da ma') ||
    text.includes('sai mon') ||
    text.includes('khong phai cau long')
  ) {
    return `Đúng rồi, mình ghi nhận đây là sân bóng đá. Nếu bạn đang ở trang sân này thì mình sẽ ưu tiên tư vấn theo bóng đá: loại sân, giá, khung giờ còn trống và bước đặt sân. Bạn muốn mình so sánh giá, chọn giờ đẹp, hay hướng dẫn đặt sân này?${authHint}`;
  }

  if (text.includes('coc') || text.includes('thanh toan') || text.includes('vnpay')) {
    return `Quy trình thường là: chọn sân và khung giờ, hệ thống giữ chỗ, bạn thanh toán cọc 10% qua VNPAY, sau đó nhận mã check-in. Phần còn lại thanh toán theo chính sách của chủ sân.${authHint}`;
  }

  if (text.includes('huy') || text.includes('hoan tien')) {
    return `Bạn nên hủy càng sớm càng tốt trong trang hồ sơ/đơn đặt sân. Điều kiện hoàn tiền phụ thuộc chính sách chủ sân và thời điểm hủy, nên hãy kiểm tra trạng thái đơn trước khi thao tác.${authHint}`;
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
    return `Mình có thể lọc theo môn, khu vực, ngân sách và khung giờ. Bạn thử hỏi cụ thể như: “gợi ý sân cầu lông dưới 150k gần Quận 1 lúc 19h”.${authHint}`;
  }

  if (text.includes('xin chao') || text === 'hi' || text.includes('hello')) {
    return `Chào bạn! Mình là SmartSport AI. Bạn có thể hỏi mình về tìm sân, đặt lịch, thanh toán, hủy sân hoặc nhờ so sánh các lựa chọn.${authHint}`;
  }

  if (text.includes('cam on') || text.includes('thank')) {
    return `Không có gì nhé. Bạn cứ hỏi tiếp, dù là chuyện đặt sân hay câu hỏi ngoài lề mình cũng sẽ cố gắng trả lời gọn và dễ hiểu.${authHint}`;
  }

  return `Mình trả lời nhanh nhé: mình hiểu bạn đang hỏi “${message}”. Nếu là câu hỏi kiến thức chung, bạn có thể hỏi trực tiếp như “1+1 bằng mấy”, “giải thích offside”, “nên khởi động thế nào trước khi đá bóng”. Nếu là câu hỏi về trang hiện tại, hãy nói rõ bạn muốn xem giá, giờ trống, vị trí hay cách đặt sân, mình sẽ trả lời theo đúng ngữ cảnh.${authHint}`;
};

const AIChatBox: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Chào bạn, mình là SmartSport AI. Hãy hỏi mình bất cứ điều gì về tìm sân, đặt lịch, thanh toán, hủy sân hoặc nhờ gợi ý sân theo vị trí, ngân sách và khung giờ.',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const appendAssistantMessage = (content: string, recommendations?: ChatResponse['recommendations']) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content,
        recommendations,
      },
    ]);
  };

  const sendMessage = async (event?: React.FormEvent, prompt?: string) => {
    event?.preventDefault();
    const text = (prompt ?? input).trim();
    if (!text || isSending) return;

    setInput('');
    setIsSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    if (!isAuthenticated) {
      window.setTimeout(() => {
        appendAssistantMessage(buildLocalAnswer(text, false));
        setIsSending(false);
      }, 250);
      return;
    }

    try {
      const result = await aiService.chat(text, sessionId);
      setSessionId(result.sessionId);
      appendAssistantMessage(
        isBackendFailureMessage(result.response) ? buildLocalAnswer(text, true) : result.response,
        result.recommendations,
      );
    } catch {
      appendAssistantMessage(buildLocalAnswer(text, true));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[120]">
      {isOpen && (
        <div className="mb-4 w-[min(400px,calc(100vw-32px))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#11131c]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">SmartSport AI</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {isAuthenticated ? 'Trợ lý sân thể thao' : 'Chế độ nhanh'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Đóng trợ lý AI"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="max-h-[430px] space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={`inline-block max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/80'
                  }`}
                >
                  {message.content}
                </div>
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.recommendations.slice(0, 4).map((item) => (
                      <Link
                        key={item.pitchId}
                        to={`/san/${item.pitchId}${item.pitchName ? `-${slugify(item.pitchName)}` : ''}`}
                        className="block rounded-2xl border border-primary/10 bg-primary/5 p-3 text-left text-xs font-bold text-slate-700 transition hover:border-primary/30 hover:bg-primary/10 dark:text-white/80"
                      >
                        <span className="block font-black text-primary">{item.pitchName}</span>
                        <span className="mt-1 block">
                          {item.reasons?.[0] || `Độ phù hợp ${Math.round(item.score)}%`}
                        </span>
                        {(item.estimatedPrice || item.distanceKm) && (
                          <span className="mt-2 block text-[10px] uppercase tracking-widest text-slate-400">
                            {[formatMoney(item.estimatedPrice), item.distanceKm ? `${item.distanceKm.toFixed(1)} km` : undefined]
                              .filter(Boolean)
                              .join(' • ')}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Loader2 className="animate-spin" size={14} />
                SmartSport AI đang suy nghĩ...
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 pt-3 dark:border-white/10">
            <div className="flex gap-2 overflow-x-auto pb-3">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(undefined, prompt)}
                  disabled={isSending}
                  className="shrink-0 rounded-full border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-500 transition hover:border-primary/40 hover:text-primary disabled:opacity-50 dark:border-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 p-4 pt-1">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ví dụ: sân cầu lông dưới 150k gần tôi..."
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white disabled:opacity-50"
              aria-label="Gửi tin nhắn"
            >
              {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-2xl shadow-primary/30 transition-transform hover:scale-105"
        aria-label="Mở trợ lý AI"
      >
        {isOpen ? <X size={24} /> : isSending ? <Sparkles size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default AIChatBox;
