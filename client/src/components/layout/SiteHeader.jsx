import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Đặt sân', to: '/dat-san' },
  { label: 'Dịch vụ', to: '/dich-vu' },
  { label: 'Liên hệ', to: '/lien-he' },
  { label: 'Đối tác', href: '#' },
]

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-nav-wrap">
        <Link className="brand" to="/" aria-label="Trang chủ SmartSport">
          SmartSport
        </Link>
        <nav className="site-nav" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            item.to ? (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive ? 'site-nav-link active' : 'site-nav-link'
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <a key={item.label} href={item.href} className="site-nav-link">
                {item.label}
              </a>
            )
          ))}
        </nav>
        <NavLink
          to="/dang-nhap"
          className={({ isActive }) =>
            isActive ? 'btn btn-ghost site-auth-link active' : 'btn btn-ghost site-auth-link'
          }
        >
          Đăng nhập
        </NavLink>
      </div>
    </header>
  )
}

export default SiteHeader
