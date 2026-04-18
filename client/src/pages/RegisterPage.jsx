import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import vietnamLocations from '../data/vietnam-locations.json'

function RegisterPage() {
  const provinceOptions = useMemo(() => vietnamLocations, [])

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    addressDetail: '',
    password: '',
    confirmPassword: '',
    agree: false,
  })

  const selectedProvince = useMemo(
    () => provinceOptions.find((province) => province.name === formData.province),
    [formData.province, provinceOptions],
  )

  const districtOptions = selectedProvince?.districts || []

  const passwordsMatched = useMemo(
    () =>
      formData.password.length === 0 ||
      formData.confirmPassword.length === 0 ||
      formData.password === formData.confirmPassword,
    [formData.confirmPassword, formData.password],
  )

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target

    if (name === 'province') {
      setFormData((prev) => ({
        ...prev,
        province: value,
        district: '',
      }))

      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!passwordsMatched) {
      return
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <div className="auth-panel auth-copy">
          <p className="auth-kicker">Bắt đầu trong 1 phút</p>
          <h1>Tạo tài khoản SmartSport</h1>
          <p>
            Kết nối với hệ sinh thái đặt sân hiện đại: tìm sân nhanh, theo dõi chi phí và quản lý lịch của đội bóng.
          </p>
          <ul className="auth-benefits">
            <li>Mở khóa ưu đãi theo khu vực và khung giờ thấp điểm</li>
            <li>Lưu sân yêu thích và nhận thông báo khi có sân trống</li>
            <li>Quản lý nhiều thành viên trong cùng tài khoản đội</li>
          </ul>
        </div>

        <div className="auth-panel auth-form-card">
          <div className="auth-title-wrap">
            <h2>Đăng ký tài khoản mới</h2>
            <p>Điền thông tin cơ bản để bắt đầu đặt sân ngay hôm nay.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-grid-2">
              <label className="auth-field">
                <span>Họ và tên</span>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="auth-field">
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="09xxxxxxxx"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

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

            <div className="auth-grid-2">
              <label className="auth-field">
                <span>Tỉnh / Thành phố</span>
                <select name="province" value={formData.province} onChange={handleChange} required>
                  <option value="">Chọn tỉnh / thành phố</option>
                  {provinceOptions.map((province) => (
                    <option key={province.code} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="auth-field">
                <span>Quận / Huyện</span>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  disabled={!formData.province}
                >
                  <option value="">Chọn quận / huyện</option>
                  {districtOptions.map((district) => (
                    <option key={district.code} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="auth-field">
              <span>Địa chỉ cụ thể</span>
              <input
                type="text"
                name="addressDetail"
                placeholder="Số nhà, tên đường, phường/xã..."
                value={formData.addressDetail}
                onChange={handleChange}
                required
              />
            </label>

            <div className="auth-grid-2">
              <label className="auth-field">
                <span>Mật khẩu</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="auth-field">
                <span>Xác nhận mật khẩu</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {!passwordsMatched && (
              <p className="auth-error">Mật khẩu xác nhận chưa khớp, vui lòng kiểm tra lại.</p>
            )}

            <label className="auth-checkbox">
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                required
              />
              <span>
                Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của SmartSport.
              </span>
            </label>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={!passwordsMatched || !formData.agree}
            >
              Tạo tài khoản
            </button>
          </form>

          <p className="auth-switch">
            Đã có tài khoản?{' '}
            <Link to="/dang-nhap" className="text-link">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
