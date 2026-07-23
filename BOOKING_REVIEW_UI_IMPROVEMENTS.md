# Cập nhật UI trang xác nhận và thanh toán (BookingReview.tsx)

## Tổng quan
Đã cập nhật trang BookingReview để hiển thị đầy đủ và rõ ràng thông tin khi người dùng đặt nhiều khung giờ cùng lúc.

## Các thay đổi chính

### 1. Cập nhật logic `details` object
**File:** `client/src/features/customer/pages/BookingReview.tsx`

**Thêm fields mới:**
```typescript
const details = useMemo(() => {
  // ... existing code
  
  // Multi-slot support
  const selectedSlots = preview?.selectedSlots || [];
  const isMultiSlot = selectedSlots.length > 1;
  
  return {
    // ... existing fields
    isMultiSlot,           // NEW: Có phải đặt nhiều slots không
    selectedSlots,         // NEW: Danh sách các slots đã chọn
    slotCount: isMultiSlot ? selectedSlots.length : 1, // NEW: Số lượng slots
  };
}, [/* dependencies */]);
```

### 2. Header Summary Cards
**Thay đổi:** Hiển thị số lượng khung giờ

**Trước:**
```
Khung giờ
08:00 - 09:00
```

**Sau (khi đặt nhiều slots):**
```
3 Khung giờ
08:00 - 11:00
```

### 3. Chi tiết khung giờ (Expanded)
**Thêm mới:** Panel hiển thị tất cả các khung giờ đã chọn

```tsx
{details.isMultiSlot && details.selectedSlots.length > 0 && (
  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
    <div className="mb-3 flex items-center gap-2">
      <Clock size={16} className="text-blue-600" />
      <span className="text-sm font-bold text-blue-900">
        Chi tiết {details.slotCount} khung giờ đã chọn:
      </span>
    </div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {details.selectedSlots.map((slot, index) => (
        <div key={slot.id} className="...">
          <span>{shortTime(slot.startTime)} - {shortTime(slot.endTime)}</span>
          <span>{formatMoney(slot.price)}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

**Hiển thị:**
- Grid layout responsive (1-3 columns)
- Mỗi slot hiển thị: thời gian + giá
- Background màu xanh nhạt để nổi bật

### 4. Thông tin sân (Pitch Card)
**Thay đổi:** Text động dựa trên số lượng slots

**Trước:**
```
⭐ Sân đã chọn theo khung giờ của bạn
⏰ 08:00 - 09:00 (1 giờ)
```

**Sau (multi-slot):**
```
⭐ 3 khung giờ liên tiếp
⏰ 08:00 - 11:00 (3 giờ)
```

### 5. Payment Summary Sidebar
**Cập nhật:** Hiển thị rõ hơn về số lượng giờ

```tsx
<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
  <p className="text-sm font-black">{details.pitchName}</p>
  <p className="text-xs font-semibold text-slate-500">
    {details.isMultiSlot 
      ? `${details.slotCount} khung giờ · ${formatDate(booking.bookingDate)}`
      : `${shortTime(details.startTime)} - ${shortTime(details.endTime)} · ...`
    }
  </p>
  {details.isMultiSlot && (
    <p className="mt-1 text-xs font-bold text-blue-600">
      {shortTime(details.startTime)} - {shortTime(details.endTime)}
    </p>
  )}
</div>
```

**Chi tiết giá:**
```tsx
<div>
  <span>
    {details.isMultiSlot 
      ? `Tiền thuê sân (${details.slotCount} giờ)` 
      : 'Tiền thuê sân'
    }
  </span>
  <strong>{formatMoney(details.fieldPrice)}</strong>
</div>

{/* Breakdown từng khung giờ */}
{details.isMultiSlot && details.selectedSlots.length > 0 && (
  <div className="rounded-lg bg-slate-50 p-2">
    {details.selectedSlots.slice(0, 3).map((slot, index) => (
      <div key={slot.id} className="...">
        <span>{shortTime(slot.startTime)} - {shortTime(slot.endTime)}</span>
        <span>{formatMoney(slot.price)}</span>
      </div>
    ))}
    {details.selectedSlots.length > 3 && (
      <div className="text-center text-xs font-bold text-blue-600">
        +{details.selectedSlots.length - 3} khung giờ khác
      </div>
    )}
  </div>
)}
```

**Features:**
- Hiển thị tối đa 3 slots đầu tiên
- Nếu >3 slots, hiển thị "+X khung giờ khác"
- Scroll nếu cần (max-height)

### 6. QR Code Payment Modal
**Thêm badge:** Highlight multi-slot booking

```tsx
<div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
  <p className="text-[10px] font-black uppercase">Chi tiết đơn đặt sân</p>
  <h4 className="mt-2 text-xl font-black">{details.pitchName}</h4>
  <p className="mt-2 flex items-start gap-2">
    <MapPin size={16} />
    {details.pitchAddress}
  </p>
  {details.isMultiSlot && (
    <div className="mt-3 rounded-lg bg-white p-3">
      <p className="text-xs font-bold text-blue-700">
        ⚡ Đặt {details.slotCount} khung giờ liên tiếp
      </p>
    </div>
  )}
</div>
```

**Cập nhật info cards:**
```tsx
<div className="rounded-xl border border-slate-200 p-3">
  <p className="text-[10px] font-black uppercase text-slate-400">
    {details.isMultiSlot ? `${details.slotCount} Khung giờ` : 'Khung giờ'}
  </p>
  <p className="mt-1 text-sm font-black">
    {shortTime(details.startTime)} - {shortTime(details.endTime)}
  </p>
</div>
```

**Thêm chi tiết breakdown trong modal:**
```tsx
{details.isMultiSlot && details.selectedSlots.length > 0 && (
  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
    <p className="text-[10px] font-black uppercase text-blue-700 mb-2">
      Chi tiết {details.slotCount} khung giờ đã đặt
    </p>
    <div className="grid gap-1.5 max-h-48 overflow-y-auto">
      {details.selectedSlots.map((slot, index) => (
        <div key={slot.id} className="flex justify-between bg-white px-3 py-2 rounded-lg">
          <span>Giờ {index + 1}: {shortTime(slot.startTime)} - {shortTime(slot.endTime)}</span>
          <strong className="text-blue-700">{formatMoney(slot.price)}</strong>
        </div>
      ))}
    </div>
  </div>
)}
```

**Features:**
- Scrollable nếu quá nhiều slots (max-height: 192px ~ 12rem)
- Đánh số thứ tự: "Giờ 1", "Giờ 2", ...
- Màu sắc: blue-700 cho số tiền để nổi bật

**Payment summary trong modal:**
```tsx
<div className="flex justify-between">
  <span>
    {details.isMultiSlot 
      ? `Tiền thuê sân (${details.slotCount} giờ)` 
      : 'Tiền thuê sân'
    }
  </span>
  <strong>{formatMoney(details.fieldPrice)}</strong>
</div>
```

## UI/UX Improvements

### Visual Hierarchy
1. **Badge nổi bật** cho multi-slot (màu xanh, icon ⚡)
2. **Cards có background** khác biệt (blue-50 cho multi-slot info)
3. **Font weight** rõ ràng hơn (bold cho labels, black cho values)

### Responsive Design
- Grid 2-3 columns tùy screen size
- Stack vertically trên mobile
- Scrollable lists khi cần thiết

### Information Density
- **Summary view**: Tổng số giờ + khoảng thời gian
- **Expanded view**: Chi tiết từng khung giờ
- **Collapsed trong sidebar**: Chỉ show 3 slots đầu + counter

### Color Coding
- **Blue-50/Blue-600/Blue-700**: Multi-slot info
- **Emerald**: Payment/Deposit amounts
- **Amber**: Hold timer/warnings
- **Slate**: General text hierarchy

## Testing Checklist

### Single Slot (Backward Compatibility)
- [ ] Hiển thị đúng "Khung giờ" (không có số)
- [ ] Hiển thị "Tiền thuê sân" (không có số giờ)
- [ ] Không hiển thị chi tiết breakdown
- [ ] Không hiển thị badge multi-slot

### Multi-Slot (2-5 slots)
- [ ] Header hiển thị "{N} Khung giờ"
- [ ] Panel chi tiết show tất cả slots
- [ ] Grid responsive (1-3 columns)
- [ ] Sidebar show 3 slots đầu
- [ ] Modal QR hiển thị breakdown

### Multi-Slot (6-10 slots)
- [ ] Scrollable list hoạt động
- [ ] Counter "+X khung giờ khác" hiển thị
- [ ] Modal scroll smooth
- [ ] Performance tốt (không lag)

### Edge Cases
- [ ] Slots có giá khác nhau → tổng đúng
- [ ] Slots không liên tiếp → vẫn hiển thị OK
- [ ] Tất cả slots cùng giá → hiển thị gọn
- [ ] Mobile viewport → stack correctly

## Performance Notes

### Optimization
- `useMemo` cho `details` object (tránh re-compute)
- `slice(0, 3)` để giới hạn render
- Conditional rendering (chỉ render khi `isMultiSlot`)
- CSS `max-h-48` + `overflow-y-auto` thay vì render all

### Bundle Size
- Không thêm dependencies mới
- Chỉ JSX conditional logic
- Tận dụng CSS utility classes có sẵn

## Future Enhancements

1. **Collapse/Expand toggle** cho chi tiết slots
2. **Visual timeline** (bars/chart) cho khung giờ
3. **Price comparison** (so sánh với giá thường)
4. **Group discount indicator** nếu có giảm giá
5. **Edit slots** trước khi thanh toán
6. **Save favorite combinations** cho lần sau

## Screenshots Locations

Các màn hình cần chụp để document:
1. Header summary với 3 khung giờ
2. Chi tiết panel expanded
3. Pitch card thông tin
4. Sidebar payment summary
5. Modal QR với breakdown
6. Mobile responsive view
