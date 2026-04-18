import { Link } from 'react-router-dom'

const quickLinks = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Đặt sân', to: '/dat-san' },
  { label: 'Dịch vụ đối tác', to: '/dich-vu' },
  { label: 'Liên hệ', to: '/lien-he' },
  { label: 'Đăng ký đối tác', to: '/dang-ky-doi-tac' },
]

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <section className="footer-brand-col" aria-label="Giới thiệu SmartSport">
          <p className="footer-title">SmartSport</p>
          <p className="footer-description">
            Nền tảng đặt sân thể thao thông minh dành cho người chơi và chủ sân đối tác.
          </p>
          <p className="footer-hotline">Hotline hỗ trợ: 1900 6868</p>
        </section>

        <nav className="footer-col" aria-label="Liên kết nhanh">
          <p className="footer-heading">Liên kết nhanh</p>
          <div className="footer-links">
            {quickLinks.map((item) => (
              <Link key={item.label} to={item.to} className="footer-link">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <section className="footer-col" aria-label="Liên hệ">
          <p className="footer-heading">Liên hệ</p>
          <div className="footer-links">
            <a className="footer-link" href="mailto:hotro@smartsport.vn">
              hotro@smartsport.vn
            </a>
            <a className="footer-link" href="tel:19006868">
              1900 6868
            </a>
            <span className="footer-link muted">Vĩnh Long, Việt Nam</span>
          </div>
        </section>

        <section className="footer-col footer-cta-col" aria-label="Trở thành đối tác">
          <p className="footer-heading">Chủ sân - Đối tác</p>
          <p className="footer-description">Đưa sân của bạn lên hệ thống và nhận khách đặt sân ngay hôm nay.</p>
          <Link to="/dang-ky-doi-tac" className="btn btn-primary footer-cta-btn">
            Đăng ký đối tác
          </Link>
        </section>
      </div>

      <div className="footer-bottom">
        <p className="footer-meta">© 2026 SmartSport. Bảo lưu mọi quyền.</p>
        <p className="footer-meta">Điều khoản sử dụng • Chính sách bảo mật</p>
      </div>
    </footer>
  )
}

export default SiteFooter
