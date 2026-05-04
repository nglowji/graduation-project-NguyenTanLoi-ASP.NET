import React from 'react';

const PaymentPartnersSection: React.FC = () => {
  return (
    <section className="py-12 bg-surface-light border-y border-slate-200">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Thanh toán tin cậy</p>
            <h3 className="text-2xl font-bold">Đối tác hỗ trợ giao dịch nhanh và an toàn</h3>
          </div>
          <div className="flex flex-wrap items-center gap-8 md:gap-10 opacity-70">
            <div className="flex items-center gap-2 font-semibold text-lg"><span className="text-blue-600 text-2xl font-black">VN</span>PAY</div>
            <div className="flex items-center gap-2 font-semibold text-lg text-pink-500">MoMo</div>
            <div className="flex items-center gap-2 font-semibold text-lg text-blue-900">VISA</div>
            <div className="flex items-center gap-2 font-semibold text-lg text-orange-600">Mastercard</div>
            <div className="flex items-center gap-2 font-semibold text-lg text-green-500">ZaloPay</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentPartnersSection;
