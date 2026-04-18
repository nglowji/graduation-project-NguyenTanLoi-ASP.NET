const trustItems = ['Sân A+', 'FitZone', 'Victory Club', 'NextPlay', 'Urban Arena']

function TrustBar() {
  return (
    <section className="trust-bar" aria-label="Đối tác tin dùng">
      <p>Được tin dùng bởi các hệ thống sân thể thao hiện đại</p>
      <div className="trust-logos">
        {trustItems.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  )
}

export default TrustBar
