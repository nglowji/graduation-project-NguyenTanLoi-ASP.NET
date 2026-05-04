import React from 'react';
import { CreditCard, ShieldCheck, RefreshCcw, QrCode } from 'lucide-react';

const PaymentSection: React.FC = () => {
  return (
    <section className="py-28 bg-surface-light relative" id="payment">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-[-120px] right-[10%] w-[300px] h-[300px] rounded-full bg-secondary/10 blur-[110px]" />
      </div>
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Thanh toán & hoàn tiền</p>
            <h2 className="text-4xl md:text-5xl font-black mb-6">Minh bạch, an toàn, đổi trả rõ ràng</h2>
            <p className="text-lg text-slate-600 mb-6">
              Hỗ trợ VNPAY, QR, thẻ nội địa và ví điện tử. Đặt cọc linh hoạt, chính sách hoàn tiền được công bố rõ ràng ngay trên màn hình đặt sân.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-8">
              <span className="rounded-full bg-slate-100 px-3 py-1">Ký quỹ rõ ràng</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Hoàn tiền tự động</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Chống thanh toán trùng</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoCard
                icon={<CreditCard size={20} />}
                title="Nhiều kênh thanh toán"
                desc="VNPAY, thẻ ATM nội địa, Visa/Mastercard, QR nhanh."
              />
              <InfoCard
                icon={<ShieldCheck size={20} />}
                title="Bảo mật HMAC"
                desc="Xác thực giao dịch, tránh trùng lặp và gian lận."
              />
              <InfoCard
                icon={<RefreshCcw size={20} />}
                title="Hoàn tiền theo chính sách"
                desc="Hủy trước 24h hoàn 100%, trước 12h hoàn 50%."
              />
              <InfoCard
                icon={<QrCode size={20} />}
                title="QR check-in"
                desc="Nhận mã QR sau khi đặt, quét nhanh tại sân."
              />
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8">
              <div className="rounded-2xl bg-surface-light border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Thanh toán nhanh</p>
                    <h3 className="text-2xl font-bold">Đặt cọc an toàn</h3>
                  </div>
                  <span className="text-sm font-semibold text-secondary">VNPAY</span>
                </div>
                <div className="space-y-4">
                  <Row label="Giá sân" value="420.000đ" />
                  <Row label="Đặt cọc" value="30%" />
                  <Row label="Thời gian giữ chỗ" value="10 phút" />
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Tỷ lệ đặt cọc</span>
                    <span>30%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[30%] bg-secondary/70" />
                  </div>
                </div>
                <button className="btn-primary w-full mt-6">Thanh toán bằng VNPAY</button>
                <p className="text-xs text-slate-500 mt-4">
                  Hoàn tiền tự động nếu hủy đúng chính sách.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="rounded-2xl border border-slate-200 bg-surface-light p-5">
    <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center mb-4">
      {icon}
    </div>
    <h4 className="font-semibold mb-2">{title}</h4>
    <p className="text-slate-500 text-sm">{desc}</p>
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
    <span className="text-slate-500 text-sm">{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

export default PaymentSection;
