# Hướng dẫn cấu hình Facebook Authentication

## Vấn đề phổ biến

Nếu bạn gặp lỗi **"Facebook Login chưa được cấu hình"** khi đăng ký/đăng nhập, điều này có nghĩa là `VITE_FACEBOOK_APP_ID` chưa được thiết lập trong file `.env`.

## Các bước cấu hình Facebook Login

### 1. Tạo Facebook App

1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Đăng nhập với tài khoản Facebook của bạn
3. Click vào **"My Apps"** → **"Create App"**
4. Chọn **"Consumer"** hoặc **"Business"** (tùy mục đích)
5. Điền thông tin:
   - **App Display Name**: SmartSport (hoặc tên bạn muốn)
   - **App Contact Email**: Email của bạn
   - Click **"Create App"**

### 2. Cấu hình Facebook Login

1. Trong dashboard của App, tìm **"Add Product"** → chọn **"Facebook Login"**
2. Chọn **"Web"** platform
3. Trong **"Settings"** → **"Basic"**:
   - Copy **App ID** 
   - Thêm **App Domains**: 
     - `localhost` (cho development)
     - Domain production của bạn (ví dụ: `smartsport.com`)
4. Trong **"Facebook Login"** → **"Settings"**:
   - **Valid OAuth Redirect URIs**: 
     ```
     http://localhost:5173/
     http://localhost:5173/login
     http://localhost:5173/register
     https://your-production-domain.com/
     https://your-production-domain.com/login
     https://your-production-domain.com/register
     ```

### 3. Lấy App ID và cấu hình trong project

1. Copy **App ID** từ **Settings** → **Basic**
2. Mở file `.env` trong thư mục `client/`:
   ```env
   VITE_FACEBOOK_APP_ID=YOUR_COPIED_APP_ID_HERE
   ```
3. Mở file `.env.production` trong thư mục `client/`:
   ```env
   VITE_FACEBOOK_APP_ID=YOUR_COPIED_APP_ID_HERE
   ```
4. **Quan trọng**: Thay `YOUR_COPIED_APP_ID_HERE` bằng App ID thực tế từ Facebook

### 4. Cấu hình quyền truy cập (Permissions)

Facebook Login cần các quyền sau:
- ✅ `public_profile` (mặc định)
- ✅ `email` (được yêu cầu trong code)

Nếu App chưa được phê duyệt, chỉ tài khoản Developer/Tester/Admin mới đăng nhập được.

### 5. Thêm Test Users (Optional - cho Development)

1. Trong App Dashboard → **"Roles"** → **"Test Users"**
2. Click **"Add"** để tạo test user
3. Sử dụng test user này để test Facebook Login trong môi trường development

### 6. Chuyển App sang chế độ Live (Production)

**Lưu ý**: Mặc định App ở chế độ **Development Mode**. Để người dùng thật có thể đăng nhập:

1. Hoàn tất **Data Deletion Instructions** trong Settings → Basic
2. Thêm **Privacy Policy URL** 
3. Thêm **Terms of Service URL** (optional)
4. Trong dashboard, chuyển toggle từ **"Development"** sang **"Live"**

### 7. Kiểm tra cấu hình

Sau khi cấu hình xong:

1. Restart development server:
   ```bash
   cd client
   npm run dev
   ```

2. Thử đăng nhập/đăng ký bằng Facebook
3. Nếu gặp lỗi, kiểm tra:
   - ✅ App ID đã được copy đúng
   - ✅ Redirect URIs đã được thêm đầy đủ
   - ✅ App đang ở chế độ Live (nếu dùng tài khoản thật)
   - ✅ Browser console có log lỗi gì không

## Xử lý lỗi thường gặp

### Lỗi: "Given URL is not allowed by the Application configuration"
**Nguyên nhân**: Redirect URI chưa được thêm vào whitelist
**Giải pháp**: Thêm URL vào **Valid OAuth Redirect URIs** trong Facebook Login Settings

### Lỗi: "App Not Setup: This app is still in development mode"
**Nguyên nhân**: App chưa chuyển sang Live mode
**Giải pháp**: 
- Thêm tài khoản vào Test Users (cho development)
- Hoặc chuyển App sang Live mode (cho production)

### Lỗi: "Can't Load URL: The domain of this URL isn't included in the app's domains"
**Nguyên nhân**: Domain chưa được thêm vào App Domains
**Giải pháp**: Thêm domain vào **App Domains** trong Settings → Basic

### Lỗi: "Facebook Login chưa được cấu hình"
**Nguyên nhân**: `VITE_FACEBOOK_APP_ID` chưa được set hoặc bằng giá trị placeholder
**Giải pháp**: Cấu hình App ID theo hướng dẫn bước 3

## Tài liệu tham khảo

- [Facebook Login for the Web](https://developers.facebook.com/docs/facebook-login/web)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [App Review](https://developers.facebook.com/docs/app-review)
