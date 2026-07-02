# OWNER DASHBOARD REDESIGN PLAN

## 🎯 Overview
Redesign toàn bộ giao diện owner dashboard với design system nhất quán, nhiều insights, gợi ý thông minh và notes giúp người dùng.

## 🎨 Design System

### Color Palette (Pastel Theme)
- **Primary**: Blue-600 (#2563eb)
- **Success**: Emerald-50/600/700
- **Warning**: Amber-50/600/700  
- **Danger**: Red-50/600/700
- **Info**: Blue-50/600/700
- **Neutral**: Slate-50/100/200/600/900

### Typography
- **Header**: 3xl bold (eyebrow: xs uppercase tracking-wider blue-600)
- **Card Title**: lg font-bold
- **Body**: sm font-semibold
- **Metrics**: 5xl font-bold (stats), 2xl font-bold (insights)

### Components Pattern
1. **Page Header**
   - Eyebrow text (UPPERCASE TRACKING WIDER)
   - Main title (3xl bold)
   - Description (sm text-slate-600)
   - Primary action button

2. **Stats Cards** (4-5 cards, working memory compliant)
   - Rounded-2xl, border-2, pastel backgrounds
   - Icon + label + large number (5xl)
   - Clickable for filtering
   - Hover effects (shadow-lg)

3. **Smart Suggestions** (Always present when có data)
   - Section riêng với gradient subtle
   - Icon + Title + Description + Metric (if applicable)
   - Action button
   - 2-3 columns responsive

4. **Filters** (Pill style)
   - Rounded-full pills cho quick filters
   - Expanded filters section
   - Search bar rounded-full
   - Clear filters button

5. **Data Tables/Cards**
   - Clean borders (border-2)
   - Row hover effects
   - Expandable details
   - Action buttons grouped

## 📋 Pages to Redesign

### 1. ✅ Bookings (DONE)
- Stats: 4 cards
- Smart suggestions with metrics
- Pill filter tabs
- Expandable booking cards
- Service incidents clearly marked

### 2. 🔄 Revenue (Current - need enhancement)
**Add:**
- More insights cards
- Smart suggestions section:
  - Revenue trend analysis
  - Peak hours recommendation
  - Low-performing pitches alert
  - Seasonal insights
- Notes on each section
- Better comparison visualizations

### 3. 🔄 MyPitches (Current - need consistency)
**Enhance:**
- Match Bookings design
- Better stats cards
- More actionable suggestions
- Add pitch performance insights
- Occupancy rate predictions

### 4. 🔄 Services (Current - need consistency)
**Enhance:**
- Match design system
- Stock alerts more prominent
- Combo suggestions
- Sales insights
- Restock recommendations

### 5. ❌ Dashboard/Overview (MISSING - CREATE NEW)
**Create comprehensive dashboard:**
- Today's summary (bookings, revenue, alerts)
- Quick actions
- Performance overview
- Alerts & notifications
- Recent activity feed
- Key metrics at a glance

### 6. ❌ Staff Management (NEEDS CREATE)
**New page for managing employees:**
- Staff list with roles
- Schedule management
- Performance tracking
- Salary/payment tracking
- Attendance monitoring
-Permissions management

### 7. 🔧 Sidebar & Topbar
**Enhance:**
- Better icons
- Notifications badge
- Quick stats in sidebar
- User profile dropdown
- Search global

## 🎯 Smart Suggestions Framework

### Revenue Page
1. **Peak Hours Analysis**: "Khung 18h-20h chiếm 45% doanh thu. Tăng giá 10% để tối ưu"
2. **Underperforming Pitches**: "Sân 5 số 3 chỉ đạt 30% công suất. Xem xét điều chỉnh giá"
3. **Seasonal Trends**: "Doanh thu thường tăng 25% vào cuối tuần. Chuẩn bị nhân lực"
4. **Service Upsell**: "60% khách chưa mua dịch vụ. Chào combo tăng 20% giá trị đơn"

### MyPitches Page
1. **Empty Time Slots**: "X sân chưa có khung giờ"
2. **Low Pricing Alert**: "X sân giá dưới mức thị trường"
3. **Indoor Conversion**: "Sân indoor có giá cao hơn 30%"
4. **Diversification**: "Thêm loại sân khác để thu hút đa dạng khách"

### Services Page
1. **Out of Stock Alert**: "X món hết hàng vẫn bán"
2. **Low Stock Warning**: "X món sắp hết"
3. **Pricing Strategy**: "Món giá thấp <20k có lợi nhuận thấp"
4. **Combo Creation**: "Gộp combo giảm 10% tăng giá trị đơn"
5. **Image Missing**: "Dịch vụ có ảnh tăng 40% conversion"

### Dashboard Page
1. **Today's Alerts**: "5 đơn cần xử lý trong 2h tới"
2. **Revenue Milestone**: "Còn 2M để đạt target tháng"
3. **Staff Shortage**: "Cuối tuần cần thêm 2 nhân viên"
4. **Equipment Check**: "3 sân cần bảo trì định kỳ"

## 📊 Data to Display

### Metrics Everywhere
- Show numbers prominently (5xl font)
- Always include comparisons (vs yesterday, last week, etc)
- Use icons for visual hierarchy
- Color-code by performance (green up, red down)

### Charts & Visualizations
- Keep simple bar/line charts
- Add comparison layers
- Gradient fills for area charts
- Interactive tooltips
- Export functionality

## 💡 Notes & Helpers

### Contextual Notes Pattern
```tsx
<div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
  <div className="flex items-start gap-3">
    <Lightbulb className="mt-0.5 text-blue-600" size={18} />
    <div>
      <p className="text-sm font-bold text-blue-900">💡 Gợi ý</p>
      <p className="mt-1 text-sm text-blue-700">
        Contextual help text here...
      </p>
    </div>
  </div>
</div>
```

### Empty States
```tsx
<div className="text-center py-12">
  <Icon className="mx-auto mb-4 text-slate-300" size={56} />
  <h3 className="text-xl font-bold text-slate-800">No data title</h3>
  <p className="mt-2 text-sm text-slate-600">Helpful message</p>
  <button className="mt-4 ...">Call to action</button>
</div>
```

## 🚀 Implementation Priority

### Phase 1 (High Priority)
1. ✅ Bookings page redesign (DONE)
2. 📝 Create Dashboard/Overview page
3. 📝 Enhance Revenue page with insights
4. 📝 Update Sidebar & Topbar

### Phase 2 (Medium Priority)
5. 📝 Enhance MyPitches consistency
6. 📝 Enhance Services consistency
7. 📝 Create Staff Management page

### Phase 3 (Nice to Have)
8. Add export functions
9. Add print views
10. Add mobile optimizations
11. Add keyboard shortcuts

## 🎨 Component Library Needed

### Create Reusable Components
1. `StatCard` - for metrics
2. `SuggestionCard` - for smart tips
3. `FilterPills` - for quick filters
4. `ExpandableRow` - for tables
5. `EmptyState` - for no data
6. `LoadingState` - for async data
7. `PageHeader` - consistent headers
8. `ActionButton` - primary actions
9. `NoteBox` - contextual notes
10. `MetricComparison` - with arrows & percentages

## 📝 Notes for Developers

### Do's
- ✅ Use Tailwind classes only (no CSS)
- ✅ Keep stats to 4-5 cards (working memory)
- ✅ Always show insights/suggestions when data exists
- ✅ Use pastel colors for cards
- ✅ Add hover effects (shadow-lg)
- ✅ Use rounded-2xl for major containers
- ✅ Use rounded-xl for cards
- ✅ Use rounded-full for pills/badges
- ✅ Icons should be 18-20px in suggestions
- ✅ Metrics should be 5xl font-bold
- ✅ Include contextual notes/helpers

### Don'ts
- ❌ No custom CSS files
- ❌ No over 5 stats cards
- ❌ No missing insights sections
- ❌ No flat designs without depth
- ❌ No arbitrary color values
- ❌ No missing empty states
- ❌ No missing loading states
- ❌ No unclear CTAs

## 🔄 Next Steps

1. Review and approve this plan
2. Start with Dashboard page creation
3. Enhance Revenue page
4. Update Sidebar & Topbar
5. Create Staff Management page
6. Final consistency pass
7. Testing & feedback
8. Launch 🚀
