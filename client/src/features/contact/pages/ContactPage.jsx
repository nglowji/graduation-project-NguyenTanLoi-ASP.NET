import { Link } from 'react-router-dom'

const contactIcons = {
  hotline: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.8 3.5h3.1c.4 0 .7.3.8.7l.7 3.1c.1.3 0 .7-.2.9l-1.2 1.2a14.3 14.3 0 0 0 4.8 4.8l1.2-1.2c.2-.2.6-.3.9-.2l3.1.7c.4.1.7.4.7.8v3.1c0 .5-.4.9-.9.9A16.6 16.6 0 0 1 5.9 4.4c0-.5.4-.9.9-.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m5 7 7 5 7-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  office: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
}

function ContactPage() {
  return (
    <section className="contact-page" aria-label="Thông tin liên hệ SmartSport">
      <header className="contact-heading">
        <p className="contact-kicker">Liên hệ SmartSport</p>
        <h1>Cần hỗ trợ nhanh?</h1>
        <p>Gọi hotline hoặc để lại thông tin, chúng tôi phản hồi sớm.</p>
      </header>

      <div className="contact-layout">
        <section className="contact-info" aria-label="Kênh liên hệ">
          <h2>Thông tin liên hệ</h2>

          <div className="contact-info-list">
            <div className="contact-info-item">
              <span className="contact-info-title">
                <i className="contact-info-icon contact-info-icon-hotline">{contactIcons.hotline}</i>
                Hotline
              </span>
              <strong>1900 6868</strong>
              <small>08:00 - 22:00 mỗi ngày</small>
            </div>

            <div className="contact-info-item">
              <span className="contact-info-title">
                <i className="contact-info-icon contact-info-icon-email">{contactIcons.email}</i>
                Email
              </span>
              <strong>hotro@smartsport.vn</strong>
              <small>Phản hồi trong 24 giờ</small>
            </div>

            <div className="contact-info-item">
              <span className="contact-info-title">
                <i className="contact-info-icon contact-info-icon-office">{contactIcons.office}</i>
                Văn phòng
              </span>
              <strong>Vĩnh Long, Việt Nam</strong>
              <small>Làm việc theo lịch hẹn</small>
            </div>
          </div>

          <div className="contact-info-actions">
            <a href="tel:19006868" className="btn btn-primary">
              Gọi ngay
            </a>
            <Link to="/dang-ky-doi-tac" className="btn btn-ghost">
              Đăng ký đối tác
            </Link>
          </div>
        </section>

        <section className="contact-form-shell" aria-label="Gửi yêu cầu liên hệ">
          <div className="contact-form-head">
            <p className="contact-form-label">Gửi yêu cầu</p>
            <h2>Để lại thông tin, chúng tôi gọi lại.</h2>
          </div>

          <form className="contact-form" onSubmit={(event) => event.preventDefault()}>
            <label className="contact-field">
              <span>Họ và tên</span>
              <input type="text" placeholder="Nguyễn Văn A" required />
            </label>
            <label className="contact-field">
              <span>Số điện thoại</span>
              <input type="tel" placeholder="0901 234 567" required />
            </label>
            <label className="contact-field">
              <span>Email</span>
              <input type="email" placeholder="ban@email.com" required />
            </label>
            <label className="contact-field">
              <span>Chủ đề</span>
              <select defaultValue="booking">
                <option value="booking">Hỗ trợ đặt sân</option>
                <option value="payment">Thanh toán</option>
                <option value="partner">Đăng ký đối tác</option>
                <option value="other">Nội dung khác</option>
              </select>
            </label>
            <label className="contact-field contact-field-full">
              <span>Nội dung</span>
              <textarea rows="4" placeholder="Mô tả ngắn yêu cầu của bạn..." required />
            </label>
            <button type="submit" className="btn btn-primary contact-submit">
              Gửi yêu cầu
            </button>
          </form>
        </section>
      </div>
    </section>
  )
}

export default ContactPage
