import React, { useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQSection: React.FC = () => {
  const faqs = [
    {
      question: 'Làm thế nào để đặt sân qua SmartSport?',
      answer: 'Rất đơn giản! Bạn chỉ cần tìm kiếm sân theo tên hoặc địa điểm, chọn khung giờ trống phù hợp và thanh toán cọc trực tuyến. Hệ thống sẽ tự động gửi email và mã xác nhận cho bạn.'
    },
    {
      question: 'Chính sách hoàn tiền khi hủy sân như thế nào?',
      answer: 'Nếu bạn hủy trước 24 giờ so với giờ đá, chúng tôi sẽ hoàn lại 100% tiền cọc. Hủy trước 12 giờ hoàn 50%. Không hoàn cọc nếu hủy sát giờ (dưới 12 tiếng).'
    },
    {
      question: 'SmartSport hỗ trợ các hình thức thanh toán nào?',
      answer: 'Hiện tại chúng tôi hỗ trợ thanh toán an toàn qua cổng VNPAY, bao gồm quét mã QR, thẻ ATM nội địa, thẻ tín dụng Visa/Mastercard và các ví điện tử liên kết.'
    },
    {
      question: 'Tôi là chủ sân, làm sao để hợp tác với SmartSport?',
      answer: 'Bạn chỉ cần nhấn vào nút "Đăng ký làm chủ sân" ở phần Chân trang hoặc khu vực Đăng ký trên trang chủ. Sau khi cung cấp thông tin, đội ngũ của chúng tôi sẽ liên hệ xác minh trong vòng 24h.'
    }
  ];

  return (
    <section className="py-24 bg-surface-light border-b border-slate-200" id="faq">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4">Câu hỏi thường gặp</h2>
          <p className="text-slate-500">Tổng hợp thông tin cần biết để đặt sân nhanh và đúng chính sách.</p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQItem: React.FC<{ question: string, answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();

  return (
    <div className="bg-surface-light border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-colors hover:border-slate-300">
      <button 
        id={`faq-button-${id}`}
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${id}`}
        className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-lg text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light"
        onClick={() => setIsOpen(!isOpen)}
      >
        {question}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown size={20} className="text-primary" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`faq-panel-${id}`}
            role="region"
            aria-labelledby={`faq-button-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-5 text-slate-600"
          >
            <div className="pt-4 border-t border-slate-100">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FAQSection;
