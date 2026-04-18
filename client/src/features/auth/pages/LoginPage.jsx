import { useState } from 'react'
import { Link } from 'react-router-dom'

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: true,
  })

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <div className="auth-panel auth-copy">
          <p className="auth-kicker">Đăng nhập nhanh</p>
          <h1>Chào mừng trở lại SmartSport</h1>
          <p>
            Đăng nhập để quản lý lịch đặt sân, theo dõi các khung giờ yêu thích và nhận ưu đãi theo khu vực.
          </p>
          <ul className="auth-benefits">
            <li>Lưu lịch sử đặt sân và hóa đơn theo ngày</li>
            <li>Nhận gợi ý sân phù hợp ngân sách của bạn</li>
            <li>Đồng bộ thông báo xác nhận qua email</li>
          </ul>
        </div>

        <div className="auth-panel auth-form-card">
          <div className="auth-title-wrap">
            <h2>Đăng nhập tài khoản</h2>
            <p>Tiếp tục hành trình đặt sân chỉ với vài bước.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="ban@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="auth-field">
              <span>Mật khẩu</span>
              <input
                type="password"
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </label>

            <div className="auth-row">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="text-link">
                Quên mật khẩu?
              </a>
            </div>

            <button type="submit" className="btn btn-primary auth-submit">
              Đăng nhập
            </button>
          </form>

          <p className="auth-switch">
            Chưa có tài khoản?{' '}
            <Link to="/dang-ky" className="text-link">
              Tạo tài khoản mới
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
