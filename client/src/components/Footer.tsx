import React from 'react';
import { Link } from 'react-router-dom';
import logoMark from '../assets/logo-smartsport.svg';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-light border-t border-slate-200 pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <img
                src={logoMark}
                alt="SmartSport"
                className="w-11 h-11 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">SmartSport</span>
            </Link>
            <p className="text-slate-500 mb-6">
              Nền tảng tìm kiếm và đặt sân thể thao số 1 Việt Nam. Nhanh chóng, tiện lợi và minh bạch.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg text-slate-900">Khám phá</h4>
            <ul className="space-y-4">
              <li><Link to="/explore" className="text-slate-500 hover:text-primary transition-colors">Tìm sân bóng đá</Link></li>
              <li><Link to="/explore" className="text-slate-500 hover:text-primary transition-colors">Tìm sân cầu lông</Link></li>
              <li><Link to="/explore" className="text-slate-500 hover:text-primary transition-colors">Tìm sân tennis</Link></li>
              <li><Link to="/explore" className="text-slate-500 hover:text-primary transition-colors">Tìm sân bóng rổ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg text-slate-900">Chủ sân</h4>
            <ul className="space-y-4">
              <li><Link to="/register" className="text-slate-500 hover:text-primary transition-colors">Đăng ký làm chủ sân</Link></li>
              <li><Link to="/login" className="text-slate-500 hover:text-primary transition-colors">Đăng nhập hệ thống</Link></li>
              <li><Link to="/dashboard" className="text-slate-500 hover:text-primary transition-colors">Quản lý doanh thu</Link></li>
              <li><a href="#" className="text-slate-500 hover:text-primary transition-colors">Hỗ trợ kỹ thuật</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg text-slate-900">Liên hệ</h4>
            <ul className="space-y-4">
              <li className="text-slate-500">Email: support@smartsport.vn</li>
              <li className="text-slate-500">Hotline: 1900 6868</li>
              <li className="text-slate-500">Địa chỉ: KĐT ĐHQG, TP. Thủ Đức</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © 2026 SmartSport. Đồ án tốt nghiệp Nguyễn Tấn Lợi.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
