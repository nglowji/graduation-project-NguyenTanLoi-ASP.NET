import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false)
    }, 900)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <>
      {isLoading ? (
        <div className="app-loader" role="status" aria-live="polite" aria-label="Đang tải trang">
          <div className="app-loader__content">
            <span className="app-loader__ring" aria-hidden="true" />
            <span className="app-loader__brand">SmartSport</span>
          </div>
        </div>
      ) : null}

      <div className={isLoading ? 'app-shell app-shell--hidden' : 'app-shell app-shell--ready'}>
        <RouterProvider router={router} />
      </div>
    </>
  )
}

export default App
