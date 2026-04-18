const navItems = [
  'Trang chủ',
  'Đặt sân',
  'Tính năng',
  'Bảng giá',
  'Liên hệ',
]

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-nav-wrap">
        <a className="brand" href="/" aria-label="Trang chủ SmartSport">
          SmartSport
        </a>
        <nav className="site-nav" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <a key={item} href="#" className="site-nav-link">
              {item}
            </a>
          ))}
        </nav>
        <button type="button" className="btn btn-primary">
          Dùng thử miễn phí
        </button>
      </div>
    </header>
  )
}

export default SiteHeader
