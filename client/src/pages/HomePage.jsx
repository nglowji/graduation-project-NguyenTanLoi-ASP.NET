import ApiStatusCard from '../components/common/ApiStatusCard'
import { useApiHealth } from '../hooks/useApiHealth'

function HomePage() {
  const { data, isLoading, isError, refetch } = useApiHealth()

  return (
    <div className="home-grid">
      <ApiStatusCard
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRefresh={refetch}
      />
      <section className="status-card">
        <h2>Environment</h2>
        <p>
          <strong>Base URL:</strong> {import.meta.env.VITE_API_BASE_URL}
        </p>
        <p className="status-description">
          Update this value in your environment file when changing backend host.
        </p>
      </section>
    </div>
  )
}

export default HomePage
