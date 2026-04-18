import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { nearbyCourts, quickFilters } from '@/data/courts'

const sportVideoEmbeds = {
  football: 'https://www.youtube.com/embed/qv7vP0Hf8xQ',
  badminton: 'https://www.youtube.com/embed/F4l3s8Qf2n8',
  tennis: 'https://www.youtube.com/embed/5v8lA6K6s6Q',
  pickleball: 'https://www.youtube.com/embed/7xjH4fS4Rr4',
}

const courtFeatures = [
  { icon: '🏟️', label: 'Sân tiêu chuẩn', desc: 'Đạt tiêu chuẩn thi đấu' },
  { icon: '💡', label: 'Sáng đủ', desc: 'Hệ thống chiếu sáng hiện đại' },
  { icon: '🚿', label: 'Nhà vệ sinh', desc: 'Sạch sẽ, đầy đủ tiện nghi' },
  { icon: '🅿️', label: 'Bãi đỗ', desc: 'Miễn phí cho khách hàng' },
]

const facilityList = [
  { id: 1, name: 'Sân 1' },
  { id: 2, name: 'Sân 2' },
  { id: 3, name: 'Sân 3' },
  { id: 4, name: 'Sân 4' },
  { id: 5, name: 'Sân 5' },
  { id: 6, name: 'Sân 6' },
]

function BookingDetailPage() {
  const [searchParams] = useSearchParams()
  const courtId = searchParams.get('id')
  const court = nearbyCourts.find((item) => item.id === Number(courtId))
  const [selectedSlots, setSelectedSlots] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedFacility, setSelectedFacility] = useState(1)
  const [selectedMedia, setSelectedMedia] = useState('image')

  const totalPrice = useMemo(() => {
    return selectedSlots.length * (court?.avgPriceNumber ?? 0)
  }, [court?.avgPriceNumber, selectedSlots.length])

  const formatPrice = (value) => {
    return `${value.toLocaleString('vi-VN')}đ`
  }

  const toggleSlot = (hour) => {
    setSelectedSlots((current) =>
      current.includes(hour)
        ? current.filter((item) => item !== hour)
        : [...current, hour],
    )
  }

  if (!court) {
    return (
      <section className="booking-page" aria-label="Chi tiết sân">
        <div className="booking-detail-card">
          <h1>Không tìm thấy sân</h1>
          <p>Sân bạn chọn không tồn tại hoặc đã bị gỡ khỏi hệ thống.</p>
          <Link to="/dat-san" className="btn btn-primary small">
            Quay lại danh sách sân
          </Link>
        </div>
      </section>
    )
  }

  const sportLabel =
    quickFilters.find((filter) => filter.key === court.sportType)?.label ||
    'Thể thao'
  const mapQuery = encodeURIComponent(`${court.name}, ${court.subArea}, ${court.province}`)
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`
  const mapOpenUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`
  const videoEmbedUrl = sportVideoEmbeds[court.sportType] || sportVideoEmbeds.badminton

  return (
    <section className="booking-detail-page" aria-label="Chi tiết đặt lịch sân">
      <div className="booking-detail-layout">
        <div className="booking-detail-main">
          <div className="booking-detail-breadcrumb-simple">
            <Link to="/dat-san">Danh sách sân</Link>
            <span>/</span>
            <span>{court.name}</span>
          </div>

          <div className="booking-detail-info-card">
              <div className="booking-detail-header">
                <div>
                  <span className="booking-detail-sport-badge">{sportLabel}</span>
                  <h1>{court.name}</h1>
                  <p className="booking-detail-address">{court.subArea}, {court.province}</p>
                </div>
                <div className="booking-detail-rating">
                  <span className="booking-detail-rating-number">{court.rating}</span>
                  <span className="booking-detail-rating-star">★</span>
                </div>
              </div>

              <div className="booking-detail-meta">
                <div className="booking-detail-meta-item">
                  <span className="booking-detail-meta-icon">📍</span>
                  <div>
                    <p className="booking-detail-meta-label">Khoảng cách</p>
                    <p className="booking-detail-meta-value">Cách {court.distanceKm} km</p>
                  </div>
                </div>
                <div className="booking-detail-meta-item">
                  <span className="booking-detail-meta-icon">💰</span>
                  <div>
                    <p className="booking-detail-meta-label">Giá trung bình</p>
                    <p className="booking-detail-meta-value">{court.avgPrice}</p>
                  </div>
                </div>
                <div className="booking-detail-meta-item">
                  <span className="booking-detail-meta-icon">⏰</span>
                  <div>
                    <p className="booking-detail-meta-label">Giờ mở cửa</p>
                    <p className="booking-detail-meta-value">{court.availableHours[0]} - {court.availableHours[court.availableHours.length - 1]}</p>
                  </div>
                </div>
              </div>

              <div className="booking-detail-media">
                <div className="booking-detail-media-head">
                  <h3>Hình ảnh, video và vị trí sân</h3>
                  <a
                    href={mapOpenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="booking-map-link"
                  >
                    Mở trên Google Maps
                  </a>
                </div>

                <div className="booking-media-tabs" role="tablist" aria-label="Nội dung media">
                  <button
                    type="button"
                    role="tab"
                    className={selectedMedia === 'image' ? 'booking-media-tab active' : 'booking-media-tab'}
                    onClick={() => setSelectedMedia('image')}
                  >
                    Ảnh sân
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={selectedMedia === 'video' ? 'booking-media-tab active' : 'booking-media-tab'}
                    onClick={() => setSelectedMedia('video')}
                  >
                    Video
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={selectedMedia === 'map' ? 'booking-media-tab active' : 'booking-media-tab'}
                    onClick={() => setSelectedMedia('map')}
                  >
                    Bản đồ
                  </button>
                </div>

                <div className="booking-media-panel">
                  {selectedMedia === 'image' && (
                    <img
                      src={court.image}
                      alt={`Hình ảnh ${court.name}`}
                      className="booking-media-frame"
                    />
                  )}

                  {selectedMedia === 'video' && (
                    <iframe
                      title={`Video ${court.name}`}
                      src={videoEmbedUrl}
                      className="booking-media-frame"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}

                  {selectedMedia === 'map' && (
                    <iframe
                      title={`Bản đồ ${court.name}`}
                      src={mapEmbedUrl}
                      className="booking-media-frame"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  )}
                </div>
              </div>

              <div className="booking-detail-features">
                <h3>Tiện ích</h3>
                <div className="booking-features-grid">
                  {courtFeatures.map((feature) => (
                    <div key={feature.label} className="booking-feature-item">
                      <span className="booking-feature-icon">{feature.icon}</span>
                      <div>
                        <p className="booking-feature-label">{feature.label}</p>
                        <p className="booking-feature-desc">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

        <div className="booking-detail-sidebar">
          <div className="booking-facilities-panel">
            <h3>Danh sách sân</h3>
            <div className="booking-facilities-list">
              {facilityList.map((facility) => (
                <button
                  key={facility.id}
                  type="button"
                  className={selectedFacility === facility.id ? 'facility-btn active' : 'facility-btn'}
                  onClick={() => setSelectedFacility(facility.id)}
                >
                  <span className="facility-number">{facility.id}</span>
                  <span className="facility-name">{facility.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="booking-detail-booking-card">
              <h2>Đặt lịch</h2>
              
              <label className="booking-form-label">
                <span>Ngày đặt</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="booking-date-input"
                />
              </label>

              <label className="booking-form-label">
                <span>Chọn sân: {selectedFacility}</span>
              </label>

              <label className="booking-form-label">
                <span>Khung giờ</span>
                <p className="booking-booking-subtitle">Có sẵn hôm nay</p>
              </label>

              <div className="booking-slots">
                {court.availableHours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    className={
                      selectedSlots.includes(hour) ? 'slot-chip active' : 'slot-chip'
                    }
                    onClick={() => toggleSlot(hour)}
                  >
                    {hour}
                  </button>
                ))}
              </div>

              <div className="booking-total">
                <p>{`Đã chọn ${selectedSlots.length} khung giờ`}</p>
                <strong>{`Tổng tiền tạm tính: ${formatPrice(totalPrice)}`}</strong>
              </div>

              <div className="booking-detail-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={selectedSlots.length === 0}
                >
                  Xác nhận đặt lịch
                </button>
                <Link to="/dat-san" className="btn btn-ghost">
                  Quay lại
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BookingDetailPage
