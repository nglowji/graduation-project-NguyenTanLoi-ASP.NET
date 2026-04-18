import heroPreview from '../../assets/hero.png'

function ProductPreview() {
  return (
    <section className="product-preview" aria-label="Màn hình sản phẩm">
      <div className="section-header centered">
        <h2>Giao diện điều phối lịch sân tập trung</h2>
        <p>
          Một màn hình duy nhất để theo dõi lượt đặt, xác nhận trạng thái sân và
          quản lý thanh toán.
        </p>
      </div>
      <div className="product-card">
        <img
          src={heroPreview}
          alt="Giao diện quản lý đặt sân thể thao"
          className="product-image"
        />
      </div>
    </section>
  )
}

export default ProductPreview
