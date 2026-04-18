import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { nearbyCourts, quickFilters } from '../data/courts'

function BookingDetailPage() {
  const { courtId } = useParams()
  const court = nearbyCourts.find((item) => item.id === Number(courtId))
  const [selectedSlots, setSelectedSlots] = useState([])

  const totalPrice = useMemo(() => {
    return selectedSlots.length * court.avgPriceNumber
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

  return (
    <section className="booking-page" aria-label="Chi tiết đặt lịch sân">
      <div className="booking-detail-card">
        <img src={court.image} alt={court.name} className="booking-detail-image" />
        <div className="booking-detail-content">
          <p className="booking-detail-type">{sportLabel}</p>
          <h1>{court.name}</h1>
          <p className="booking-detail-text">{`${court.subArea}, ${court.province} - Cách ${court.distanceKm} km`}</p>
          <p className="booking-detail-text">{`Giá trung bình: ${court.avgPrice}`}</p>
          <p className="booking-detail-text">{`Đánh giá: ${court.rating} ★`}</p>

          <h2>Chọn khung giờ</h2>
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
    </section>
  )
}

export default BookingDetailPage
