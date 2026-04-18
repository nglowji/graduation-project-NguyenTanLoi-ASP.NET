function ApiStatusCard({ isLoading, isError, data, onRefresh }) {
  return (
    <section className="status-card">
      <h2>API Health Check</h2>
      <p className="status-description">
        Endpoint: <code>/api/health</code>
      </p>

      {isLoading && <p className="status-loading">Checking API...</p>}

      {!isLoading && isError && (
        <p className="status-error">
          Cannot connect to API. Verify server is running and VITE_API_BASE_URL is
          correct.
        </p>
      )}

      {!isLoading && !isError && data && (
        <div className="status-success">
          <p>
            <strong>Message:</strong> {data.message}
          </p>
          <p>
            <strong>Timestamp (UTC):</strong> {data.timestamp}
          </p>
        </div>
      )}

      <button type="button" className="refresh-button" onClick={onRefresh}>
        Refresh
      </button>
    </section>
  )
}

export default ApiStatusCard
