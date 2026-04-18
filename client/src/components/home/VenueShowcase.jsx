const venues = [
  {
    name: 'Smart Arena Quan 7',
    type: 'Bóng đá 7 người',
    slot: 'Còn trống: 19:00 - 20:30',
  },
  {
    name: 'Blue Court Thu Duc',
    type: 'Cầu lông 6 sân',
    slot: 'Còn trống: 18:30 - 21:00',
  },
  {
    name: 'Urban Sport Hub',
    type: 'Pickleball 4 sân',
    slot: 'Còn trống: 17:00 - 19:00',
  },
]

function VenueShowcase() {
  return (
    <section className="venue-section" aria-label="Sân nổi bật">
      <div className="section-header">
        <h2>Sân nổi bật hôm nay</h2>
        <a href="#" className="text-link">
          Xem tất cả danh sách
        </a>
      </div>
      <div className="venue-grid">
        {venues.map((venue) => (
          <article key={venue.name} className="venue-card">
            <p className="venue-type">{venue.type}</p>
            <h3>{venue.name}</h3>
            <p>{venue.slot}</p>
            <button type="button" className="btn btn-primary small">
              Đặt nhanh
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default VenueShowcase
