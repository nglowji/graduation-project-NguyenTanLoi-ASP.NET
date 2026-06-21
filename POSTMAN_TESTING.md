# Huong dan kiem thu API bang Postman

## 1. Cau hinh Environment

Tao Environment trong Postman, vi du `SmartSport Local`, gom cac bien:

| Bien | Gia tri mau |
| --- | --- |
| `baseUrl` | `http://localhost:5164` |
| `token` | de trong, tu dong gan sau khi login |
| `pitchId` | de trong |
| `timeSlotId` | de trong |
| `bookingId` | de trong |
| `transactionId` | de trong |
| `serviceId` | de trong |
| `reviewId` | de trong |

Voi request can dang nhap, them header:

```http
Authorization: Bearer {{token}}
Content-Type: application/json
```

Trong request `POST /api/v1/auth/login`, vao tab **Tests** va them script nay de tu luu token:

```javascript
const json = pm.response.json();
const token = json?.data?.token || json?.data?.accessToken;

if (token) {
  pm.environment.set("token", token);
}

if (json?.data?.userId) {
  pm.environment.set("userId", json.data.userId);
}
```

Voi cac request tao moi co tra ve `data` la Guid, co the dung Tests:

```javascript
const json = pm.response.json();
if (json?.data) {
  pm.environment.set("pitchId", json.data);
}
```

Thay ten bien `pitchId` thanh `bookingId`, `serviceId`, `transactionId` tuy request.

## 2. Auth

### Dang ky khach hang

`POST {{baseUrl}}/api/v1/auth/register`

```json
{
  "email": "customer1@gmail.com",
  "password": "Password123!",
  "fullName": "Nguyen Van Khach",
  "phoneNumber": "0900000001",
  "address": "Quan 1, TP HCM",
  "role": 1
}
```

### Dang ky chu san

`POST {{baseUrl}}/api/v1/auth/register`

```json
{
  "email": "owner1@gmail.com",
  "password": "Password123!",
  "fullName": "Nguyen Van Owner",
  "phoneNumber": "0900000002",
  "address": "Quan Binh Thanh, TP HCM",
  "businessName": "San Bong SmartSport",
  "ward": "Phuong 25",
  "district": "Binh Thanh",
  "city": "TP HCM",
  "role": 2
}
```

### Dang nhap

`POST {{baseUrl}}/api/v1/auth/login`

```json
{
  "email": "customer1@gmail.com",
  "password": "Password123!"
}
```

### Lay profile

`GET {{baseUrl}}/api/v1/auth/profile`

## 3. San bong

### Tim kiem san

`GET {{baseUrl}}/api/v1/pitches/search?searchTerm=Smart&pageNumber=1&pageSize=10`

Co the them query:

```text
type=1
sportType=Football
minPrice=100000
maxPrice=500000
province=TP HCM
district=Binh Thanh
sortBy=price_asc
```

Gia tri `PitchType`:

| So | Loai san |
| --- | --- |
| 1 | Football5 |
| 2 | Football7 |
| 3 | Football11 |
| 4 | Tennis |
| 5 | Badminton |
| 6 | Pickleball |
| 7 | Basketball |
| 8 | Volleyball |
| 9 | TableTennis |

### Tao san moi

Can token role `PitchOwner` hoac `Admin`.

`POST {{baseUrl}}/api/v1/pitches`

```json
{
  "name": "San Bong SmartSport 5A",
  "address": "123 Dien Bien Phu, Binh Thanh, TP HCM",
  "mapLink": "https://maps.google.com/?q=10.8010,106.7140",
  "latitude": 10.801,
  "longitude": 106.714,
  "description": "San co nhan tao, co den chieu sang",
  "pitchType": 1,
  "isIndoor": false,
  "images": [
    "https://example.com/pitch-1.jpg"
  ],
  "timeSlots": [
    {
      "startTime": "06:00:00",
      "endTime": "07:00:00",
      "price": 200000
    },
    {
      "startTime": "18:00:00",
      "endTime": "19:00:00",
      "price": 350000
    }
  ]
}
```

### Lay chi tiet san

`GET {{baseUrl}}/api/v1/pitches/{{pitchId}}`

### Lay khung gio trong

`GET {{baseUrl}}/api/v1/pitches/{{pitchId}}/available-slots?date=2026-06-20`

Sau request nay, lay `id` cua slot trong response va gan vao bien `timeSlotId`.

### Cap nhat trang thai san

`PATCH {{baseUrl}}/api/v1/pitches/{{pitchId}}/status`

```json
{
  "isActive": true
}
```

## 4. Dat san

### Khoa khung gio

Can token khach hang.

`POST {{baseUrl}}/api/v1/bookings/lock`

```json
{
  "timeSlotId": "{{timeSlotId}}",
  "bookingDate": "2026-06-20",
  "lockDurationMinutes": 10
}
```

### Tao booking

`POST {{baseUrl}}/api/v1/bookings`

```json
{
  "timeSlotId": "{{timeSlotId}}",
  "bookingDate": "2026-06-20",
  "selectedServices": []
}
```

### Xem booking cua toi

`GET {{baseUrl}}/api/v1/bookings/my-bookings?pageNumber=1&pageSize=10`

### Huy booking

`PATCH {{baseUrl}}/api/v1/bookings/{{bookingId}}/cancel`

```json
{
  "reason": "Khach hang thay doi lich"
}
```

### Owner xac nhan booking

Can token `PitchOwner` hoac `PitchStaff`.

`PATCH {{baseUrl}}/api/v1/bookings/{{bookingId}}/confirm`

### Owner xem booking

`GET {{baseUrl}}/api/v1/bookings/owner?pageNumber=1&pageSize=20`

### Hoan thanh booking

`PATCH {{baseUrl}}/api/v1/bookings/{{bookingId}}/complete`

## 5. Dich vu them

### Tao dich vu

Can token `PitchOwner`.

`POST {{baseUrl}}/api/v1/additional-services`

```json
{
  "name": "Nuoc suoi",
  "price": 10000,
  "icon": "water",
  "stockQuantity": 100,
  "imageUrl": "https://example.com/water.jpg",
  "isActive": true
}
```

### Lay dich vu cua chu san

`GET {{baseUrl}}/api/v1/additional-services/my`

### Lay dich vu theo san

`GET {{baseUrl}}/api/v1/additional-services/pitch/{{pitchId}}`

### Them dich vu vao booking

Booking phai o trang thai confirmed.

`POST {{baseUrl}}/api/v1/bookings/{{bookingId}}/services`

```json
[
  {
    "serviceId": "{{serviceId}}",
    "quantity": 2
  }
]
```

## 6. Thanh toan

### Tao link thanh toan VNPAY

`POST {{baseUrl}}/api/v1/payments/create`

```json
{
  "bookingId": "{{bookingId}}",
  "returnUrl": "http://localhost:5173/payment-result",
  "provider": "VNPAY"
}
```

### Tao link thanh toan ZaloPay

`POST {{baseUrl}}/api/v1/payments/create`

```json
{
  "bookingId": "{{bookingId}}",
  "returnUrl": "http://localhost:5173/payment-result",
  "provider": "ZALOPAY"
}
```

### Lay chi tiet giao dich

`GET {{baseUrl}}/api/v1/payments/transactions/{{transactionId}}`

### Lich su thanh toan cua toi

`GET {{baseUrl}}/api/v1/payments/my-history?pageNumber=1&pageSize=10`

## 7. Danh gia

### Lay danh gia theo san

`GET {{baseUrl}}/api/v1/pitches/{{pitchId}}/reviews?pageNumber=1&pageSize=10`

### Tao danh gia cho booking

Booking nen da hoan thanh.

`POST {{baseUrl}}/api/v1/bookings/{{bookingId}}/reviews`

```json
{
  "rating": 5,
  "comment": "San dep, dich vu tot"
}
```

### Cap nhat danh gia

`PUT {{baseUrl}}/api/v1/bookings/{{bookingId}}/reviews`

```json
{
  "rating": 4,
  "comment": "San tot, se quay lai"
}
```

### Chu san phan hoi danh gia

`POST {{baseUrl}}/api/v1/owner/reviews/{{reviewId}}/reply`

```json
{
  "content": "Cam on ban da danh gia. Hen gap lai ban!"
}
```

## 8. Admin

Can token role `Admin`.

### Danh sach user

`GET {{baseUrl}}/api/v1/admin/users?pageNumber=1&pageSize=20`

### Tao user

`POST {{baseUrl}}/api/v1/admin/users`

```json
{
  "fullName": "Nhan Vien San",
  "email": "staff1@gmail.com",
  "phoneNumber": "0900000003",
  "password": "Password123!",
  "role": 4,
  "address": "TP HCM"
}
```

Role:

| So | Role |
| --- | --- |
| 1 | Customer |
| 2 | PitchOwner |
| 3 | Admin |
| 4 | PitchStaff |

### Duyet san

`GET {{baseUrl}}/api/v1/admin/pitch-approvals?status=pending`

`PATCH {{baseUrl}}/api/v1/admin/pitch-approvals/{{pitchId}}/approve`

### Duyet dich vu

`GET {{baseUrl}}/api/v1/admin/service-approvals?status=pending`

`PATCH {{baseUrl}}/api/v1/admin/service-approvals/{{serviceId}}/approve`

### Cau hinh hoa hong

`GET {{baseUrl}}/api/v1/admin/system/commission`

`PATCH {{baseUrl}}/api/v1/admin/system/commission`

```json
{
  "percentage": 10
}
```

## 9. Luong test de demo nhanh

1. `POST /auth/register` tao customer.
2. `POST /auth/register` tao owner.
3. Login owner, luu `token`.
4. `POST /pitches` tao san, luu `pitchId`.
5. Login admin, duyet san neu he thong yeu cau.
6. `GET /pitches/{pitchId}/available-slots?date=2026-06-20`, luu `timeSlotId`.
7. Login customer, luu `token`.
8. `POST /bookings/lock`.
9. `POST /bookings`, luu `bookingId`.
10. Login owner, `PATCH /bookings/{bookingId}/confirm`.
11. Login customer, `POST /payments/create`.
12. Login owner, `PATCH /bookings/{bookingId}/complete`.
13. Login customer, `POST /bookings/{bookingId}/reviews`.

## 10. Loi thuong gap

| Loi | Cach xu ly |
| --- | --- |
| `401 Unauthorized` | Kiem tra da login va header `Authorization: Bearer {{token}}`. |
| `403 Forbidden` | Token dung user nhung sai role. Vi du endpoint owner can `PitchOwner`/`PitchStaff`. |
| `400 Bad Request` khi tao booking | `timeSlotId` sai, ngay da qua, slot da bi dat hoac chua lay slot theo dung `pitchId`. |
| Khong tao duoc payment | Booking khong ton tai, khong thuoc user hien tai, hoac da thanh toan. |
| Khong danh gia duoc | Booking chua hoan thanh hoac user khong phai chu booking. |

