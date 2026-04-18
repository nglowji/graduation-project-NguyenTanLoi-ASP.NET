import { Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-kicker">Graduation Project</p>
        <h1>Client - ASP.NET API Integration</h1>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
