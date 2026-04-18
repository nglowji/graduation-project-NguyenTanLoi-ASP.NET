import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

const partnerFilterOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Sân', value: 'court' },
  { label: 'Nhà tài trợ', value: 'sponsor' },
  { label: 'Chiến lược', value: 'strategic' },
]

const partnerLogos = {
  fitzone: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="currentColor" fillOpacity="0.1" rx="12" />
      <path d="M32 20L38 35H26L32 20Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="26" cy="43" r="3" fill="currentColor" />
      <circle cx="38" cy="43" r="3" fill="currentColor" />
    </svg>
  ),
  court: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="12" width="32" height="40" stroke="currentColor" strokeWidth="2" rx="4" />
      <line x1="32" y1="12" x2="32" y2="52" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="32" cy="20" r="2" fill="currentColor" />
      <circle cx="32" cy="44" r="2" fill="currentColor" />
      <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  ),
  victory: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 44L24 28L32 18L40 28L44 44" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="20" y1="44" x2="44" y2="44" stroke="currentColor" strokeWidth="2" />
      <path d="M28 44V50M36 44V50" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  urban: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="20" width="12" height="24" stroke="currentColor" strokeWidth="2" rx="2" />
      <rect x="38" y="16" width="12" height="28" stroke="currentColor" strokeWidth="2" rx="2" />
      <circle cx="20" cy="26" r="1.5" fill="currentColor" />
      <circle cx="20" cy="32" r="1.5" fill="currentColor" />
      <circle cx="20" cy="38" r="1.5" fill="currentColor" />
      <circle cx="44" cy="22" r="1.5" fill="currentColor" />
      <circle cx="44" cy="28" r="1.5" fill="currentColor" />
      <circle cx="44" cy="34" r="1.5" fill="currentColor" />
      <circle cx="44" cy="40" r="1.5" fill="currentColor" />
    </svg>
  ),
  activepro: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 18C26.5 18 22 22.5 22 28C22 33 25.5 37 30 38V46H34V38C38.5 37 42 33 42 28C42 22.5 37.5 18 32 18Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="28" cy="27" r="2" fill="currentColor" />
      <circle cx="36" cy="27" r="2" fill="currentColor" />
    </svg>
  ),
  nextplay: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,20 44,32 44,44 20,44 20,32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M28 32L32 38L36 32" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  greenline: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 40C22 32 26 28 32 24C38 28 42 32 46 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="24" r="3" fill="currentColor" />
      <path d="M20 46H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  hub: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="32" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="32" y1="20" x2="32" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <line x1="32" y1="52" x2="32" y2="44" stroke="currentColor" strokeWidth="1.5" />
      <line x1="44" y1="32" x2="52" y2="32" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="32" x2="20" y2="32" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
}

const partnerDirectory = [
  {
    name: 'FitZone',
    category: 'sponsor',
    role: 'Nhà tài trợ chính',
    logo: partnerLogos.fitzone,
    accent: 'emerald',
    note: 'Đồng hành cùng các giải phong trào và gói ưu đãi hội viên.',
    city: 'TP. Hồ Chí Minh',
  },
  {
    name: 'Sân A+',
    category: 'court',
    role: 'Đối tác sân',
    logo: partnerLogos.court,
    accent: 'blue',
    note: 'Mạng lưới sân bóng đá, cầu lông và pickleball khu vực phía Nam.',
    city: 'Vĩnh Long',
  },
  {
    name: 'Victory Club',
    category: 'strategic',
    role: 'Đối tác chiến lược',
    logo: partnerLogos.victory,
    accent: 'amber',
    note: 'Phát triển cộng đồng người chơi và lịch thi đấu nội bộ.',
    city: 'Hà Nội',
  },
  {
    name: 'Urban Arena',
    category: 'court',
    role: 'Đối tác sân',
    logo: partnerLogos.urban,
    accent: 'violet',
    note: 'Không gian sân hiện đại, hỗ trợ booking nhanh theo khung giờ.',
    city: 'Đà Nẵng',
  },
  {
    name: 'ActivePro',
    category: 'sponsor',
    role: 'Nhà tài trợ',
    logo: partnerLogos.activepro,
    accent: 'slate',
    note: 'Tài trợ áo đấu, banner giải và các hoạt động thương hiệu.',
    city: 'Cần Thơ',
  },
  {
    name: 'NextPlay',
    category: 'strategic',
    role: 'Đối tác chiến lược',
    logo: partnerLogos.nextplay,
    accent: 'sky',
    note: 'Hỗ trợ chiến dịch tăng trưởng người chơi và booking lặp lại.',
    city: 'TP. Hồ Chí Minh',
  },
  {
    name: 'GreenLine',
    category: 'sponsor',
    role: 'Nhà tài trợ',
    logo: partnerLogos.greenline,
    accent: 'green',
    note: 'Đồng hành trong các sự kiện cộng đồng và giải đấu học sinh.',
    city: 'Bình Dương',
  },
  {
    name: 'Urban Sport Hub',
    category: 'court',
    role: 'Đối tác sân',
    logo: partnerLogos.hub,
    accent: 'rose',
    note: 'Chuỗi sân đa môn với lịch trống cập nhật theo thời gian thực.',
    city: 'Hải Phòng',
  },
]

const ownerRows = [
  {
    id: 1,
    court: 'Sân Bóng Minh Khang',
    owner: 'Nguyễn Văn Hải',
    area: 'TP Vĩnh Long, Vĩnh Long',
    type: 'Bóng đá',
    distance: 'Cách 2 km',
    price: '180.000đ/giờ',
    rating: 4.8,
    image: 'linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%)',
    status: 'Đang hoạt động',
    statusColor: 'active',
  },
  {
    id: 2,
    court: 'CLB Cầu Lông Cửu Long',
    owner: 'Trần Minh Khoa',
    area: 'Long Hồ, Vĩnh Long',
    type: 'Cầu lông',
    distance: 'Cách 3.2 km',
    price: '120.000đ/giờ',
    rating: 4.6,
    image: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    status: 'Đang hoạt động',
    statusColor: 'active',
  },
  {
    id: 3,
    court: 'Tennis Riverside Vĩnh Long',
    owner: 'Lê Thảo Vy',
    area: 'Bình Minh, Vĩnh Long',
    type: 'Tennis',
    distance: 'Cách 4 km',
    price: '220.000đ/giờ',
    rating: 4.7,
    image: 'linear-gradient(135deg, #15803d 0%, #4ade80 100%)',
    status: 'Đang duyệt',
    statusColor: 'pending',
  },
  {
    id: 4,
    court: 'Pickleball Hub Vĩnh Long',
    owner: 'Phạm Quốc Bảo',
    area: 'TP Vĩnh Long, Vĩnh Long',
    type: 'Pickleball',
    distance: 'Cách 1.8 km',
    price: '150.000đ/giờ',
    rating: 4.9,
    image: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
    status: 'Cần bổ sung hồ sơ',
    statusColor: 'warning',
  },
]

const sponsorBenefits = [
  'Hiển thị logo trên toàn hệ thống',
  'Xuất hiện trong chiến dịch và giải đấu',
  'Tăng nhận diện với người chơi địa phương',
]

function PartnerPage() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPartners = useMemo(() => {
    return partnerDirectory.filter((partner) => {
      const matchFilter = selectedFilter === 'all' || partner.category === selectedFilter
      const matchSearch =
        partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.city.toLowerCase().includes(searchQuery.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [selectedFilter, searchQuery])

  return (
    <section className="partner-page" aria-label="Danh sách đối tác SmartSport">
      <header className="partner-page-hero">
        <p className="partner-page-kicker">Đối tác SmartSport</p>
        <h1>Danh sách đối tác, nhà tài trợ và hệ thống sân</h1>
        <p>
          Directory gọn, dễ quét, có logo, có phân loại và có bảng chủ sân để xem nhanh các đơn vị đang đồng hành.
        </p>
        <div className="partner-page-actions">
          <Link to="/dang-ky-doi-tac" className="btn btn-primary">
            Trở thành đối tác
          </Link>
          <Link to="/lien-he" className="btn btn-ghost">
            Liên hệ hợp tác
          </Link>
        </div>
      </header>

      <div className="partner-search-section">
        <input
          type="text"
          className="partner-search-box"
          placeholder="Tìm đối tác, sân, hoặc khu vực..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Tìm kiếm đối tác"
        />
      </div>

      <div className="partner-filter-bar" role="tablist" aria-label="Lọc đối tác">
        {partnerFilterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={selectedFilter === option.value ? 'partner-filter-chip active' : 'partner-filter-chip'}
            onClick={() => setSelectedFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className="partner-logo-grid" aria-label="Thẻ thương hiệu">
        {filteredPartners.map((partner) => (
          <article key={partner.name} className={`partner-logo-card partner-logo-card-${partner.accent}`}>
            <div className="partner-logo-mark" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
                {partner.logo.props.children}
              </svg>
            </div>
            <div className="partner-logo-copy">
              <span className="partner-badge">{partner.role}</span>
              <h2>{partner.name}</h2>
              <p>{partner.note}</p>
              <small>{partner.city}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="partner-groups">
        <article className="partner-group-card">
          <p className="partner-group-label">Đối tác sân</p>
          <h2>Các hệ thống sân đang vận hành cùng SmartSport</h2>
          <div className="partner-chip-list">
            {partnerDirectory.filter((item) => item.category === 'court').map((item) => (
              <span key={item.name} className="partner-chip">
                {item.name}
              </span>
            ))}
          </div>
        </article>

        <article className="partner-group-card">
          <p className="partner-group-label">Nhà tài trợ</p>
          <h2>Thương hiệu đồng hành trong các giải đấu và chiến dịch</h2>
          <div className="partner-chip-list">
            {partnerDirectory.filter((item) => item.category === 'sponsor').map((item) => (
              <span key={item.name} className="partner-chip">
                {item.name}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="partner-sponsor-band">
        <div>
          <p className="partner-group-label">Quyền lợi nhà tài trợ</p>
          <h2>Được hiển thị rõ trong các giải đấu và chiến dịch cộng đồng.</h2>
        </div>
        <ul>
          {sponsorBenefits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="partner-owner-table-card" aria-label="Danh sách sân">
        <div className="partner-owner-table-head">
          <div>
            <p className="partner-group-label">Danh sách sân hiện có</p>
            <h2>Hiển thị các sân đang có dữ liệu trong hệ thống theo bộ lộc bạn đã chọn.</h2>
          </div>
          <span>{ownerRows.length} sân</span>
        </div>

        <div className="partner-courts-grid">
          {ownerRows.map((row) => (
            <article key={row.id} className="partner-court-card">
              <div className="partner-court-image" style={{ background: row.image }}>
                <span className={`partner-court-type-badge`}>{row.type}</span>
              </div>
              <div className="partner-court-content">
                <h3>{row.court}</h3>
                <p className="partner-court-location">
                  {row.area} · {row.distance}
                </p>
                <div className="partner-court-footer">
                  <div className="partner-court-info">
                    <span className="partner-court-price">{row.price}</span>
                    <span className="partner-court-rating">
                      ★ {row.rating}
                    </span>
                  </div>
                  <button type="button" className="partner-court-btn" title="Xem chi tiết sân">
                    Xem sân
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default PartnerPage
