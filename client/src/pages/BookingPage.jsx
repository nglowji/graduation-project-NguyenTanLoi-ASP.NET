import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { nearbyCourts, quickFilters } from '../data/courts'
import vietnamLocations from '../data/vietnam-locations.json'

const priceOptions = [
  { label: 'Mọi mức giá', value: 'all' },
  { label: 'Dưới 150.000đ/giờ', value: '150000' },
  { label: 'Dưới 200.000đ/giờ', value: '200000' },
  { label: 'Dưới 250.000đ/giờ', value: '250000' },
]

const hourOptions = ['Tất cả khung giờ', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
const PAGE_SIZE = 8

const normalizeLocationName = (value) => {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/^Tinh\s+|^Thanh pho\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function BookingPage() {
  const [selectedSport, setSelectedSport] = useState('all')
  const [selectedProvince, setSelectedProvince] = useState('all')
  const [selectedSubArea, setSelectedSubArea] = useState('all')
  const [nearMeOnly, setNearMeOnly] = useState(false)
  const [nameQuery, setNameQuery] = useState('')
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [selectedHour, setSelectedHour] = useState('Tất cả khung giờ')
  const [currentPage, setCurrentPage] = useState(1)

  const provinces = useMemo(() => {
    const names = vietnamLocations.map((item) => item.name)
    return ['all', ...names]
  }, [])

  const subAreas = useMemo(() => {
    const selectedProvinceNormalized = normalizeLocationName(selectedProvince)

    const selectedProvinceData = vietnamLocations.find(
      (item) => normalizeLocationName(item.name) === selectedProvinceNormalized,
    )

    if (selectedProvince !== 'all' && selectedProvinceData?.districts?.length) {
      return ['all', ...selectedProvinceData.districts.map((district) => district.name)]
    }

    const scopedCourts = nearbyCourts.filter(
      (court) =>
        selectedProvince === 'all' ||
        normalizeLocationName(court.province) === selectedProvinceNormalized,
    )

    if (selectedProvince !== 'all' && scopedCourts.length === 0) {
      return ['all']
    }

    return ['all', ...new Set(scopedCourts.map((court) => court.subArea))]
  }, [selectedProvince])

  useEffect(() => {
    setSelectedSubArea('all')
  }, [selectedProvince])

  const filteredCourts = useMemo(() => {
    return nearbyCourts.filter((court) => {
      const bySport = selectedSport === 'all' || court.sportType === selectedSport
      const byProvince =
        selectedProvince === 'all' ||
        normalizeLocationName(court.province) === normalizeLocationName(selectedProvince)
      const bySubArea = selectedSubArea === 'all' || court.subArea === selectedSubArea
      const byName = court.name.toLowerCase().includes(nameQuery.trim().toLowerCase())
      const byPrice = selectedPrice === 'all' || court.avgPriceNumber <= Number(selectedPrice)
      const byHour =
        selectedHour === 'Tất cả khung giờ' || court.availableHours.includes(selectedHour)
      const byNearMe = !nearMeOnly || court.distanceKm <= 3

      return bySport && byProvince && bySubArea && byName && byPrice && byHour && byNearMe
    })
  }, [
    nameQuery,
    nearMeOnly,
    selectedHour,
    selectedPrice,
    selectedProvince,
    selectedSport,
    selectedSubArea,
  ])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    nameQuery,
    nearMeOnly,
    selectedHour,
    selectedPrice,
    selectedProvince,
    selectedSport,
    selectedSubArea,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredCourts.length / PAGE_SIZE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedCourts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredCourts.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredCourts])

  return (
    <section className="booking-page" aria-label="Trang đặt sân">
      <div className="booking-section">
        <div className="booking-header">
          <h1>Đặt sân</h1>
          <p>
            Ưu tiên khu vực Vĩnh Long mở rộng: chọn nhanh môn thể thao bạn muốn
            và tìm sân gần nhất, phù hợp thời gian của bạn.
          </p>
        </div>

        <div className="quick-filters" aria-label="Khung lọc nhanh">
          {quickFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={
                selectedSport === filter.key ? 'filter-chip active' : 'filter-chip'
              }
              onClick={() => setSelectedSport(filter.key)}
            >
              <span className="filter-icon" aria-hidden="true">
                {filter.icon}
              </span>
              <span>{filter.label}</span>
            </button>
          ))}
          <button
            type="button"
            className={selectedSport === 'all' ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setSelectedSport('all')}
          >
            <span className="filter-icon" aria-hidden="true">
              ✨
            </span>
            <span>Tất cả loại</span>
          </button>
        </div>

        <div className="filter-panel" aria-label="Bộ lọc nâng cao">
          <label className="filter-field">
            <span>Tỉnh</span>
            <select
              value={selectedProvince}
              onChange={(event) => setSelectedProvince(event.target.value)}
            >
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province === 'all' ? 'Tất cả tỉnh' : province}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Khu vực trong tỉnh</span>
            <select
              value={selectedSubArea}
              onChange={(event) => setSelectedSubArea(event.target.value)}
            >
              {subAreas.map((subArea) => (
                <option key={subArea} value={subArea}>
                  {subArea === 'all' ? 'Tất cả khu vực' : subArea}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Tên sân</span>
            <input
              type="text"
              placeholder="Nhập tên sân..."
              value={nameQuery}
              onChange={(event) => setNameQuery(event.target.value)}
            />
          </label>

          <label className="filter-field">
            <span>Giá</span>
            <select
              value={selectedPrice}
              onChange={(event) => setSelectedPrice(event.target.value)}
            >
              {priceOptions.map((price) => (
                <option key={price.value} value={price.value}>
                  {price.label}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Giờ</span>
            <select
              value={selectedHour}
              onChange={(event) => setSelectedHour(event.target.value)}
            >
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Loại</span>
            <select
              value={selectedSport}
              onChange={(event) => setSelectedSport(event.target.value)}
            >
              <option value="all">Tất cả loại sân</option>
              {quickFilters.map((filter) => (
                <option key={filter.key} value={filter.key}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={nearMeOnly}
              onChange={(event) => setNearMeOnly(event.target.checked)}
            />
            <span>Gần tôi (≤ 3 km)</span>
          </label>
        </div>
      </div>

      <div className="booking-section">
        <div className="booking-header">
          <h2>Danh sách sân hiện có</h2>
          <p>
            Hiển thị các sân đang có dữ liệu trong hệ thống theo bộ lọc bạn đã
            chọn.
          </p>
        </div>

        <div className="court-carousel" aria-label="Danh sách sân gần bạn">
          {paginatedCourts.map((court) => (
            <article key={court.id} className="court-card">
              <img src={court.image} alt={court.name} className="court-image" />
              <div className="court-content">
                <h3>{court.name}</h3>
                <p>{`${court.subArea}, ${court.province} - Cách ${court.distanceKm} km`}</p>
                <div className="court-meta">
                  <span>Giá TB: {court.avgPrice}</span>
                  <span>{court.rating} ★</span>
                </div>
                <Link to={`/dat-san/${court.id}`} className="btn btn-primary small court-cta">
                  Đặt sân
                </Link>
              </div>
            </article>
          ))}
          {filteredCourts.length === 0 && (
            <article className="court-empty">
              <h3>Không tìm thấy sân phù hợp</h3>
              <p>Thử điều chỉnh bộ lọc để xem thêm kết quả.</p>
            </article>
          )}
        </div>
        {filteredCourts.length > 0 && totalPages > 1 && (
          <div className="pagination" aria-label="Phân trang danh sách sân">
            <button
              type="button"
              className="page-btn"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>

            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    className={
                      page === currentPage ? 'page-number active' : 'page-number'
                    }
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              className="page-btn"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default BookingPage
