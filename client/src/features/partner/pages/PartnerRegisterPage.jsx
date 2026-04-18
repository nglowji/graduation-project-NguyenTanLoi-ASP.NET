import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import vietnamLocations from '@/data/vietnam-locations.json'

const courtTypeOptions = ['Sân bóng đá', 'Sân cầu lông', 'Sân bóng rổ', 'Sân pickleball', 'Loại khác']

const partnerBenefitItems = [
  {
    key: 'form',
    text: 'Điền một lần, dùng cho cả hồ sơ sân và liên hệ quản lý',
  },
  {
    key: 'map',
    text: 'Chọn đúng tỉnh / quận để khách tìm sân chính xác hơn',
  },
  {
    key: 'percent',
    text: 'Đồng ý điều khoản hoa hồng 10% cho mỗi booking hợp lệ',
  },
]

const partnerIcons = {
  form: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h9l3 3v13H6z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M15 4v3h3M9 11h6M9 15h6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20V6.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 4v13.5M15 6.5V20" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  percent: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 17 10-10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="16" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
}

function PartnerRegisterPage() {
  const provinceOptions = useMemo(() => vietnamLocations, [])

  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    email: '',
    courtName: '',
    province: '',
    district: '',
    addressDetail: '',
    courtType: courtTypeOptions[0],
    agreeCommission: false,
    agreeContact: true,
  })

  const selectedProvince = useMemo(
    () => provinceOptions.find((province) => province.name === formData.province),
    [formData.province, provinceOptions],
  )

  const districtOptions = selectedProvince?.districts || []

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
  }

  return (
    <section className="auth-page partner-register-page">
      <div className="auth-shell partner-register-shell">
        <div className="auth-panel auth-copy partner-register-copy">
          <p className="auth-kicker">Đăng ký đối tác sân</p>
          <h1>Mở hồ sơ sân của bạn trên SmartSport</h1>
          <p>
            Hoàn tất form này để bộ phận vận hành có thể xem xét thông tin sân, xác nhận khu vực kinh doanh và kích
            hoạt quy trình hiển thị trên hệ thống.
          </p>
          <ul className="auth-benefits">
            {partnerBenefitItems.map((item) => (
              <li key={item.key} className="partner-benefit-item">
                <span className={`partner-benefit-icon partner-benefit-icon-${item.key}`}>{partnerIcons[item.key]}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-panel auth-form-card partner-register-card">
          <div className="auth-title-wrap">
            <h2>Form đăng ký đối tác</h2>
            <p>Thông tin càng rõ, hồ sơ sân càng dễ được duyệt và hiển thị.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-grid-2">
              <label className="auth-field">
                <span>Người đại diện</span>
                <input
                  type="text"
                  name="ownerName"
                  placeholder="Nguyễn Văn A"
                  value={formData.ownerName}
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
              <span>Email liên hệ</span>
              <input
                type="email"
                name="email"
                placeholder="san@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="auth-field">
              <span>Tên sân</span>
              <input
                type="text"
                name="courtName"
                placeholder="Sân bóng đá Vĩnh Long"
                value={formData.courtName}
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

            <label className="auth-field">
              <span>Loại sân</span>
              <select name="courtType" value={formData.courtType} onChange={handleChange}>
                {courtTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <div className="partner-terms-card">
              <div className="partner-terms-header">
                <span className="partner-terms-icon" aria-hidden="true">{partnerIcons.percent}</span>
                <strong>Điều khoản hoa hồng 10%</strong>
              </div>
              <p>
                Tôi hiểu rằng khi sân được hiển thị trên hệ thống và phát sinh booking hợp lệ, nền tảng sẽ áp dụng mức
                hoa hồng 10% theo điều khoản hợp tác.
              </p>
            </div>

            <label className="auth-checkbox">
              <input
                type="checkbox"
                name="agreeCommission"
                checked={formData.agreeCommission}
                onChange={handleChange}
                required
              />
              <span>Tôi đồng ý với mức hoa hồng 10% và điều khoản hợp tác của SmartSport.</span>
            </label>

            <label className="auth-checkbox">
              <input
                type="checkbox"
                name="agreeContact"
                checked={formData.agreeContact}
                onChange={handleChange}
              />
              <span>Cho phép SmartSport liên hệ để xác minh và hỗ trợ duyệt hồ sơ.</span>
            </label>

            <button type="submit" className="btn btn-primary auth-submit">
              Gửi hồ sơ đối tác
            </button>
          </form>

          <p className="auth-switch">
            Quay lại <Link to="/dich-vu" className="text-link">trang Dịch vụ</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default PartnerRegisterPage
