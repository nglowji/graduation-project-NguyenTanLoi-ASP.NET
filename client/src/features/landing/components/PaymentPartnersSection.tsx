import React from 'react';

const partners = [
  { name: 'VNPAY', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png' },
  { name: 'MoMo', logo: 'https://developers.momo.vn/v3/assets/images/square-8c08a00f550e40a2efafea4a005b1232.png' },
  { name: 'ZaloPay', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ZaloPay-Square.png' },
  { name: 'Visa', logo: 'https://cdnjs.cloudflare.com/ajax/libs/paymentfont/1.1.2/svg/visa.svg' },
  { name: 'Mastercard', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' },
  { name: 'JCB', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/40/JCB_logo.svg' },
  { name: 'Napas', logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-Napas.png' },
];

const PaymentPartnersSection: React.FC = () => {
  return (
    <section className="py-12 bg-white border-b border-slate-100 overflow-hidden">
      <div className="container mx-auto px-6 mb-8 text-center">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Hỗ trợ đa dạng phương thức thanh toán an toàn
        </p>
      </div>

      {/* Marquee Wrapper */}
      <div className="flex w-full overflow-hidden relative group">
        
        {/* Đã gỡ bỏ Left/Right Fade Gradient theo yêu cầu */}

        {/* Băng chuyền 1 (Trượt sang trái) */}
        <div className="flex shrink-0 animate-marquee items-center gap-24 px-12">
          {partners.map((partner, index) => (
            <img 
              key={`p1-${index}`}
              src={partner.logo} 
              alt={partner.name} 
              className="h-8 md:h-10 object-contain hover:scale-110 transition-transform duration-300 cursor-pointer"
            />
          ))}
        </div>

        {/* Băng chuyền 2 (Clone của cái số 1 để nối đuôi liên tục vô tận) */}
        <div className="flex shrink-0 animate-marquee items-center gap-24 px-12" aria-hidden="true">
          {partners.map((partner, index) => (
            <img 
              key={`p2-${index}`}
              src={partner.logo} 
              alt={partner.name} 
              className="h-8 md:h-10 object-contain hover:scale-110 transition-transform duration-300 cursor-pointer"
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default PaymentPartnersSection;
