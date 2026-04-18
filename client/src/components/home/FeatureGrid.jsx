const features = [
  {
    title: 'Lịch trống đồng bộ tức thì',
    description: 'Dữ liệu đặt sân cập nhật theo thời gian thực, tránh xung đột lịch.',
  },
  {
    title: 'Quản lý giá theo khung giờ',
    description: 'Thiết lập bảng giá động theo giờ cao điểm và ngày trong tuần.',
  },
  {
    title: 'Thanh toán và nhắc lịch tự động',
    description: 'Xác nhận nhanh, gửi thông báo và xuất biên nhận ngay sau đặt sân.',
  },
]

function FeatureGrid() {
  return (
    <section className="feature-grid" aria-label="Tính năng nổi bật">
      {features.map((feature) => (
        <article key={feature.title} className="feature-card">
          <h2>{feature.title}</h2>
          <p>{feature.description}</p>
          <a href="#" className="text-link">
            Tìm hiểu thêm
          </a>
        </article>
      ))}
    </section>
  )
}

export default FeatureGrid
