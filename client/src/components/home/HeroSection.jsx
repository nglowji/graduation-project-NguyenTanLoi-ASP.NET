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
              Bắt đầu miễn phí
            </button>
            <button type="button" className="btn btn-ghost">
              Xem bản demo
            </button>
          </div>
        </div>
        <div className="hero-panel" aria-label="Xem trước lịch đặt sân">
          <div className="panel-head">
            <p>Lịch đặt hôm nay</p>
            <span>12 sân hoạt động</span>
          </div>
          <div className="panel-list">
            <article className="panel-item">
              <div>
                <h3>Sân bóng đá A1</h3>
                <p>19:00 - 20:30</p>
              </div>
              <span className="panel-tag">Đã xác nhận</span>
            </article>
            <article className="panel-item">
              <div>
                <h3>Sân cầu lông B3</h3>
                <p>18:30 - 20:00</p>
              </div>
              <span className="panel-tag">Chờ thanh toán</span>
            </article>
            <article className="panel-item">
              <div>
                <h3>Sân pickleball C2</h3>
                <p>20:00 - 21:00</p>
              </div>
              <span className="panel-tag">Còn trống</span>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
