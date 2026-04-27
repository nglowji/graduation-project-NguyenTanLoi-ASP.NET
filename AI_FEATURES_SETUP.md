# 🤖 AI Features Setup Guide

## Tổng quan

Dự án đã được tích hợp 2 tính năng AI mạnh mẽ:

1. **Gemini AI Chat** - Trợ lý AI thông minh gợi ý sân dựa trên thói quen người dùng
2. **Google Maps Integration** - Chỉ đường, tính khoảng cách, tìm sân gần

---

## 📋 Prerequisites

### 1. Google Gemini AI API Key

**Bước 1:** Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)

**Bước 2:** Đăng nhập với Google Account

**Bước 3:** Click "Create API Key"

**Bước 4:** Copy API key

**Bước 5:** Thêm vào User Secrets:
```bash
cd server/Api
dotnet user-secrets set "GeminiAI:ApiKey" "YOUR_GEMINI_API_KEY"
```

### 2. Google Maps API Key

**Bước 1:** Truy cập [Google Cloud Console](https://console.cloud.google.com/)

**Bước 2:** Tạo project mới hoặc chọn project hiện có

**Bước 3:** Enable các APIs sau:
- Maps JavaScript API
- Directions API
- Distance Matrix API
- Geocoding API
- Places API

**Bước 4:** Tạo API Key:
- Navigation menu → APIs & Services → Credentials
- Click "Create Credentials" → "API Key"
- Copy API key

**Bước 5:** (Optional) Restrict API key:
- Click vào API key vừa tạo
- Application restrictions: HTTP referrers hoặc IP addresses
- API restrictions: Chọn các APIs đã enable ở trên

**Bước 6:** Thêm vào User Secrets:
```bash
dotnet user-secrets set "GoogleMaps:ApiKey" "YOUR_GOOGLE_MAPS_API_KEY"
```

---

## 🗄️ Database Migration

Cần tạo migration cho 2 entities mới:

```bash
cd server/Infrastructure
dotnet ef migrations add AddAIFeatures --startup-project ../Api
dotnet ef database update --startup-project ../Api
```

---

## 🏗️ Architecture Overview

### Domain Layer
```
Domain/
├── Entities/
│   ├── UserPreference.cs      # Lưu preferences người dùng
│   └── ChatConversation.cs    # Lưu lịch sử chat
```

### Application Layer
```
Application/
├── Common/Interfaces/
│   ├── IGeminiAIService.cs           # Interface cho Gemini AI
│   ├── IMapService.cs                # Interface cho Google Maps
│   ├── IUserPreferenceRepository.cs
│   └── IChatConversationRepository.cs
├── Features/AI/
│   ├── Commands/
│   │   └── ChatWithAI/
│   │       └── ChatWithAICommand.cs  # Chat với AI
│   └── Queries/
│       ├── GetPitchRecommendations/
│       │   └── GetPitchRecommendationsQuery.cs
│       └── GetDirections/
│           └── GetDirectionsQuery.cs
```

### Infrastructure Layer
```
Infrastructure/
├── Services/
│   ├── GeminiAIService.cs      # Implementation Gemini AI
│   └── GoogleMapsService.cs    # Implementation Google Maps
└── Repositories/
    ├── UserPreferenceRepository.cs
    └── ChatConversationRepository.cs
```

### API Layer
```
Api/
└── Controllers/
    └── AIController.cs         # AI endpoints
```

---

## 🚀 API Endpoints

### 1. Chat với AI

**POST** `/api/v1/ai/chat`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Tôi muốn tìm sân bóng đá gần nhà",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "sessionId": "abc-123-def",
  "response": "Tôi đã tìm được 3 sân bóng đá gần bạn. Sân Bóng Trung Tâm Q1 có vẻ phù hợp nhất vì gần nhà và giá hợp lý.",
  "recommendations": [
    {
      "pitchId": "guid",
      "pitchName": "Sân Bóng Trung Tâm Q1",
      "score": 95,
      "reasons": ["Gần nhà", "Giá hợp lý", "Đánh giá cao"],
      "estimatedPrice": 200000,
      "distanceKm": 2.5
    }
  ],
  "timestamp": "2026-04-27T10:00:00Z"
}
```

### 2. Lấy gợi ý sân

**GET** `/api/v1/ai/recommendations`

**Query Parameters:**
- `query` (optional): Yêu cầu cụ thể của user
- `latitude` (optional): Vị trí hiện tại
- `longitude` (optional): Vị trí hiện tại

**Example:**
```
GET /api/v1/ai/recommendations?query=sân bóng đá&latitude=10.7769&longitude=106.7009
```

**Response:**
```json
{
  "recommendations": [
    {
      "pitchId": "guid",
      "pitchName": "Sân Bóng Trung Tâm Q1",
      "score": 95,
      "reasons": ["Gần vị trí hiện tại", "Phù hợp với thói quen"],
      "estimatedPrice": 200000,
      "distanceKm": 2.5
    }
  ],
  "explanation": "Tôi gợi ý Sân Bóng Trung Tâm Q1 vì gần vị trí hiện tại, phù hợp với thói quen.",
  "conversationalResponse": "Tôi đã tìm được 3 sân phù hợp với bạn! Bạn có muốn xem chi tiết không?"
}
```

### 3. Lấy chỉ đường

**GET** `/api/v1/ai/directions`

**Query Parameters:**
- `fromLatitude`: Vị trí xuất phát (latitude)
- `fromLongitude`: Vị trí xuất phát (longitude)
- `toPitchId`: ID của sân đích
- `travelMode` (optional): driving, walking, bicycling, transit (default: driving)

**Example:**
```
GET /api/v1/ai/directions?fromLatitude=10.7769&fromLongitude=106.7009&toPitchId=guid&travelMode=driving
```

**Response:**
```json
{
  "distanceMeters": 2500,
  "durationSeconds": 600,
  "distanceText": "2.5 km",
  "durationText": "10 phút",
  "steps": [
    {
      "instruction": "Đi về hướng đông trên Đường Lê Lợi",
      "distanceMeters": 500,
      "durationSeconds": 120,
      "travelMode": "DRIVING"
    }
  ],
  "polylineEncoded": "encoded_polyline_string_for_map"
}
```

---

## 🧪 Testing

### Test Chat API

```powershell
# PowerShell script
$token = "your_jwt_token"
$body = @{
    message = "Tôi muốn đặt sân bóng đá vào tối thứ 6"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5164/api/v1/ai/chat" `
    -Method Post `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $body `
    -ContentType "application/json"
```

### Test Recommendations API

```powershell
$token = "your_jwt_token"

Invoke-RestMethod -Uri "http://localhost:5164/api/v1/ai/recommendations?latitude=10.7769&longitude=106.7009" `
    -Method Get `
    -Headers @{ Authorization = "Bearer $token" }
```

### Test Directions API

```powershell
$token = "your_jwt_token"
$pitchId = "your_pitch_guid"

Invoke-RestMethod -Uri "http://localhost:5164/api/v1/ai/directions?fromLatitude=10.7769&fromLongitude=106.7009&toPitchId=$pitchId" `
    -Method Get `
    -Headers @{ Authorization = "Bearer $token" }
```

---

## 🎯 Use Cases

### 1. Conversational Booking
```
User: "Tôi muốn đặt sân bóng đá vào cuối tuần"
AI: "Bạn thường đặt sân vào tối thứ 6 và sáng chủ nhật. Tôi gợi ý Sân Bóng Q1 
     vào 18:00 thứ 6 này, giá 200k/giờ, cách nhà bạn 2km."
User: "Có sân nào gần hơn không?"
AI: "Có, Sân Bóng Q3 chỉ cách 1.5km, giá 180k/giờ. Bạn muốn đặt sân này không?"
```

### 2. Smart Recommendations
- Dựa trên lịch sử đặt sân
- Dựa trên preferences (loại sân, giá, vị trí)
- Dựa trên thời gian thường đặt
- Dựa trên vị trí hiện tại

### 3. Navigation
- Chỉ đường từ vị trí hiện tại đến sân
- Tính thời gian di chuyển
- Hỗ trợ nhiều phương tiện: xe hơi, đi bộ, xe đạp, phương tiện công cộng

---

## 🔧 Configuration

### appsettings.json

```json
{
  "GeminiAI": {
    "ApiKey": "YOUR_GEMINI_API_KEY",
    "Model": "gemini-pro"
  },
  "GoogleMaps": {
    "ApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
  }
}
```

### User Secrets (Recommended for Development)

```bash
dotnet user-secrets set "GeminiAI:ApiKey" "your_key"
dotnet user-secrets set "GoogleMaps:ApiKey" "your_key"
```

### Environment Variables (Production)

```bash
export GeminiAI__ApiKey="your_key"
export GoogleMaps__ApiKey="your_key"
```

---

## 💡 AI Prompt Engineering

### System Prompt
AI được config với system prompt:
- Vai trò: Trợ lý thông minh của SmartSport
- Nhiệm vụ: Gợi ý sân, trả lời câu hỏi, hỗ trợ tìm kiếm
- Phong cách: Thân thiện, ngắn gọn, tiếng Việt tự nhiên

### Context Building
AI nhận context từ:
- User preferences (loại sân, giá, vị trí ưa thích)
- Booking history (thói quen đặt sân)
- Current conversation (lịch sử chat)
- Available pitches (danh sách sân hiện có)

---

## 📊 User Preference Tracking

Hệ thống tự động học preferences từ:
- Loại sân thường đặt
- Khung giờ ưa thích
- Địa điểm thường đặt
- Ngân sách trung bình
- Tần suất đặt sân

---

## 🚨 Error Handling

### Gemini AI Errors
- API key invalid → Fallback to simple recommendations
- Rate limit exceeded → Return cached recommendations
- Network error → Retry with exponential backoff

### Google Maps Errors
- API key invalid → Use Haversine formula for distance
- No routes found → Return straight-line distance
- Geocoding failed → Return coordinates as string

---

## 🔐 Security

### API Keys
- **NEVER** commit API keys to git
- Use User Secrets for development
- Use Azure Key Vault / AWS Secrets Manager for production

### Rate Limiting
- Implement rate limiting for AI endpoints
- Prevent abuse and control costs

### Data Privacy
- Don't log sensitive user data
- Anonymize data sent to AI
- Comply with GDPR/privacy regulations

---

## 💰 Cost Optimization

### Gemini AI
- Free tier: 60 requests/minute
- Cache AI responses when possible
- Use shorter prompts to reduce tokens

### Google Maps
- Free tier: $200 credit/month
- Cache directions and geocoding results
- Use Haversine formula for simple distance calculations

---

## 📈 Future Enhancements

- [ ] Voice input/output
- [ ] Image recognition (sân bóng từ ảnh)
- [ ] Predictive booking (AI suggest before user asks)
- [ ] Group booking recommendations
- [ ] Weather-based suggestions
- [ ] Traffic-aware directions
- [ ] Multi-language support

---

## 🐛 Troubleshooting

### AI không trả lời
- Check API key configuration
- Check internet connection
- Check Gemini AI service status
- Review logs for errors

### Directions không hoạt động
- Check Google Maps API key
- Verify APIs are enabled in Google Cloud Console
- Check API key restrictions
- Verify pitch has valid coordinates

### Recommendations không chính xác
- Check user has booking history
- Verify preferences are set
- Review AI prompt engineering
- Check pitch data quality

---

**Created:** 2026-04-27
**Version:** 1.0
**Status:** Ready for testing

**Next Steps:**
1. Get API keys
2. Run migrations
3. Test endpoints
4. Integrate with frontend
