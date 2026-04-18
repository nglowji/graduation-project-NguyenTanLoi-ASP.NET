import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import partnerDashboardMockup from '../../assets/partner-dashboard-mockup.svg'

const benefits = [
  {
    icon: 'map',
    title: 'Hiển thị trên hệ thống SmartSport',
    description: 'Hiện đúng khu vực khách đang tìm.',
  },
  {
    icon: 'users',
    title: 'Tăng lượng khách địa phương',
    description: 'Tăng booking từ người chơi gần sân.',
  },
  {
    icon: 'chart',
    title: 'Quản lý booking gọn gàng',
    description: 'Theo dõi lịch trống và doanh thu trong 1 màn hình.',
  },
]

const onboardingSteps = [
  {
    number: '01',
    title: 'Đăng ký thông tin sân',
    description: 'Điền tên sân, địa chỉ, thông tin liên hệ và loại sân đang vận hành.',
  },
  {
    number: '02',
    title: 'Xác nhận điều khoản hợp tác',
    description: 'Đồng ý mức hoa hồng 10% cho nền tảng khi sân được hiển thị và phát sinh booking hợp lệ.',
  },
  {
    number: '03',
    title: 'Bắt đầu nhận khách',
    description: 'Sau khi hoàn tất hồ sơ, sân của bạn có thể xuất hiện trên hệ thống để khách đặt trực tiếp.',
  },
]

const partnerVisuals = [
  {
    title: 'Sân cỏ 7',
    note: 'Khung giờ 18:00 - 20:00 đang có nhu cầu cao',
    tone: 'emerald',
  },
  {
    title: 'Sân trong nhà',
    note: 'Tỷ lệ lấp đầy cao vào cuối tuần',
    tone: 'amber',
  },
  {
    title: 'Sân đối kháng',
    note: 'Nhóm khách trẻ đặt nhanh qua mobile',
    tone: 'violet',
  },
]

const partnerPrinciples = [
  'Form ngắn gọn, gửi hồ sơ nhanh',
  'Hoa hồng 10% minh bạch theo booking hợp lệ',
  'Hiển thị theo tỉnh và quận/huyện',
  'Theo dõi booking trực quan trên dashboard',
]

const icons = {
  map: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20V6.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 4v13.5M15 6.5V20" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 19c0-2.8 2.5-4.5 5.5-4.5S14.5 16.2 14.5 19M14.5 18.5c.4-1.8 1.9-3 4-3 1.7 0 3 .8 3 2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19h16M7 16v-3m5 3V8m5 8v-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m6.5 10.5 4 2.5 3.5-5 4 2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

function ServicesPage() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const root = sectionRef.current
    if (!root) {
      return undefined
    }

    const targets = root.querySelectorAll('.reveal-on-scroll')
    if (targets.length === 0) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -40px 0px',
      },
    )

    targets.forEach((target) => observer.observe(target))

    return () => observer.disconnect()
  }, [])

  return (
    <section className="services-page" ref={sectionRef}>
      <div className="services-hero partner-hero">
        <div className="services-copy partner-copy">
          <p className="services-kicker">Dành cho chủ sân - đối tác</p>
          <h1>Đưa sân của bạn lên SmartSport và bắt đầu nhận booking.</h1>
          <p className="services-lead">
            Landing onboarding cho chủ sân: dễ đăng ký, dễ hiển thị, dễ nhận khách.
          </p>

          <div className="services-actions">
            <Link to="/dang-ky-doi-tac" className="btn btn-primary">
              Đăng ký trở thành đối tác
            </Link>
            <a href="#quyen-loi" className="btn btn-ghost">
              Xem quyền lợi chủ sân
            </a>
          </div>

          <div className="partner-quick-benefits" id="quyen-loi">
            {benefits.map((benefit, index) => (
              <article
                key={benefit.title}
                className="reveal-on-scroll"
                style={{ '--reveal-delay': `${index * 70}ms` }}
              >
                <span className={`benefit-icon benefit-${benefit.icon}`}>{icons[benefit.icon]}</span>
                <h3>{benefit.title}</h3>
              </article>
            ))}
          </div>
        </div>

        <aside className="partner-highlight-card partner-dashboard-card" aria-label="Mô phỏng dashboard chủ sân">
          <div className="partner-dashboard-top">
            <div>
              <p className="services-overview-label">Dashboard chủ sân</p>
              <h2>Nhìn rõ booking, công suất và doanh thu.</h2>
            </div>
            <span>Live</span>
          </div>

          <div className="partner-dashboard-visual">
            <img src={partnerDashboardMockup} alt="Mockup dashboard quản lý sân đối tác" loading="eager" />
          </div>

          <div className="partner-visual-grid">
            {partnerVisuals.map((visual) => (
              <article key={visual.title} className={`partner-visual-card ${visual.tone}`}>
                <strong>{visual.title}</strong>
                <p>{visual.note}</p>
              </article>
            ))}
          </div>

          <div className="partner-dashboard-grid">
            <article className="partner-stat-card">
              <span>Lượt đặt hôm nay</span>
              <strong>28</strong>
              <small>+12% so với hôm qua</small>
            </article>
            <article className="partner-stat-card">
              <span>Khung giờ kín</span>
              <strong>18:00 - 21:00</strong>
              <small>3 slot đang được lấp đầy</small>
            </article>
            <article className="partner-stat-card">
              <span>Doanh thu ước tính</span>
              <strong>12,4 triệu</strong>
              <small>Theo booking đã xác nhận</small>
            </article>
          </div>

          <div className="partner-dashboard-timeline">
            <div>
              <span>19:00</span>
              <strong>Sân 1 - Đội A</strong>
              <small>
                <i className="status-dot confirmed" />
                Đã xác nhận
              </small>
            </div>
            <div>
              <span>20:00</span>
              <strong>Sân 2 - Đội B</strong>
              <small>
                <i className="status-dot pending" />
                Đang chờ thanh toán
              </small>
            </div>
            <div>
              <span>21:00</span>
              <strong>Sân 1 - Đội C</strong>
              <small>
                <i className="status-dot open" />
                Còn trống
              </small>
            </div>
          </div>

          <div className="partner-commission">
            <span>10%</span>
            <div>
              <strong>Hoa hồng cho nền tảng</strong>
              <p>
                Sân xuất hiện trên hệ thống khi đồng ý điều khoản hợp tác với mức hoa hồng 10% cho mỗi booking hợp lệ.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="services-section services-process">
        <div className="section-header">
          <div>
            <h2>Quy trình đăng ký đối tác</h2>
          </div>
          <Link to="/dang-ky-doi-tac" className="text-link">
            Mở form đăng ký
          </Link>
        </div>

        <div className="services-step-grid">
          {onboardingSteps.map((step) => (
            <article key={step.number} className="service-step-card">
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="services-section services-banner partner-banner">
        <div>
          <p className="services-banner-label">Điều khoản hợp tác</p>
          <h2>Minh bạch mức hoa hồng 10% để sân được hiển thị trên hệ thống.</h2>
        </div>

        <ul>
          {partnerPrinciples.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export default ServicesPage
