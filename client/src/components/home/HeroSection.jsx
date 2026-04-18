function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-shell">
        <div className="hero-copy">
          <p className="hero-badge">SMART BOOKING PLATFORM</p>
          <h1>Đặt sân thể thao chuyên nghiệp trong một trải nghiệm tối giản.</h1>
          <p className="hero-subtitle">
            Quản lý lịch sân theo thời gian thực, xác nhận thanh toán nhanh và
            tối ưu vận hành cho từng khung giờ cao điểm.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary">
              Đặt sân ngay
            </button>
          </div>
        </div>
        <div className="hero-photo-card" aria-label="Hình ảnh bóng đá thật">
          <div className="hero-photo-wrap">
            <img
              className="hero-photo"
              src="https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Cầu thủ đang tranh bóng trên sân cỏ"
              loading="eager"
            />
          </div>
          <div className="hero-photo-meta">
            <p>Sân 11 người - Cỏ tự nhiên</p>
            <span>Khung giờ hot: 19:00 - 21:00</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
