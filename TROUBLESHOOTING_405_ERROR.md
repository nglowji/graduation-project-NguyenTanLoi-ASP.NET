# Troubleshooting: 405 Method Not Allowed Error

## Error Description
User gets "Request failed with status code 405" when clicking "Xác nhận và thanh toán" (Confirm & Pay) button.

## HTTP 405 Error
- **Status**: 405 Method Not Allowed
- **Meaning**: The endpoint exists but doesn't support the HTTP method used (GET, POST, PUT, etc.)

## Debugging Steps

### 1. Check Console Logs
Added console.log statements to track the flow:

```typescript
console.log('[Booking] Creating booking:', { isMultiSlot, slotCount: timeSlotIds.length });
console.log('[Booking] Request payload:', requestPayload);
console.log('[Booking] Response:', bookingResponse);
console.error('[Booking] Error:', paymentError);
console.error('[Booking] Error response:', paymentError.response);
```

**Action**: Open browser DevTools → Console tab → Click "Xác nhận và thanh toán" → Check logs

### 2. Check Network Request
**Action**: Open browser DevTools → Network tab → Click button → Find failed request

**Look for:**
- Request URL (should be `/api/v1/bookings/multi-slot` or `/api/v1/bookings`)
- Request Method (should be POST)
- Request Payload (JSON body)
- Response Status (405)
- Response Body (may contain error details)

### 3. Verify Backend Endpoint

**Single-slot endpoint:**
```csharp
[HttpPost] // ✅ POST method
[Route("api/v1/bookings")] // URL from controller route
public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
```

**Multi-slot endpoint:**
```csharp
[HttpPost("multi-slot")] // ✅ POST method
[Route("api/v1/bookings/multi-slot")] // Full URL
public async Task<IActionResult> CreateMultiSlot([FromBody] CreateMultiSlotBookingRequest request)
```

### 4. Common Causes of 405 Error

#### A. Wrong HTTP Method
❌ Frontend sends: `GET /bookings/multi-slot`
✅ Should be: `POST /bookings/multi-slot`

**Check**: Network tab → Request method

#### B. Wrong URL
❌ Frontend sends: `POST /booking/multi-slot` (missing 's')
✅ Should be: `POST /bookings/multi-slot`

**Check**: Network tab → Request URL

#### C. Missing Route Attribute
❌ Backend missing `[HttpPost("multi-slot")]`
✅ We have this - so not the issue

#### D. CORS Policy (if API on different domain)
- Would give CORS error, not 405
- Not applicable if API on same domain

#### E. Authorization Issue
❌ Endpoint requires auth but token missing/invalid
✅ We have `[Authorize]` on controller - check token

### 5. Check Backend is Running
```bash
# Check if backend API is running
curl http://localhost:5164/api/v1/bookings
# or
curl https://smartsport-api.onrender.com/api/v1/bookings
```

### 6. Verify Request Payload Structure

**Expected by backend:**
```json
{
  "timeSlots": [
    {
      "timeSlotId": "guid-here",
      "bookingDate": "2024-12-25"
    }
  ],
  "selectedServices": []
}
```

**Frontend sends:**
```typescript
{
  timeSlots: timeSlotIds.map((slotId: string) => ({
    timeSlotId: slotId,
    bookingDate: draft.bookingDate,
  })),
  selectedServices: selectedSuggestedServices.map((service) => ({ 
    serviceId: service.serviceId, 
    quantity: service.quantity 
  })),
}
```

**Issues to check:**
- ✅ Field names match (camelCase)
- ✅ Date format correct
- ✅ GUIDs are valid strings
- ✅ Array structures correct

### 7. Test with Single Slot First
If multi-slot fails but single-slot works → Issue specific to multi-slot endpoint

**Test:**
1. Select only 1 time slot
2. Click "Xác nhận và thanh toán"
3. Should use single-slot endpoint (`/bookings`)
4. If this works → multi-slot endpoint has issue

### 8. Backend Routing Order
If single endpoint `[HttpPost]` comes BEFORE `[HttpPost("multi-slot")]` in code:
- `/bookings/multi-slot` might match `/bookings` instead
- But ASP.NET Core is smart enough to handle this

**Current order in BookingsController:**
1. `[HttpPost]` Create (line ~110)
2. `[HttpPost("multi-slot")]` CreateMultiSlot (line ~130)

✅ Order is fine

## Quick Fix Attempts

### Fix 1: Ensure API Base URL is Correct
```typescript
// In api.ts
const api = axios.create({
  baseURL: API_URL, // Should be http://localhost:5164/api/v1
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Fix 2: Add Explicit Content-Type
```typescript
const bookingResponse = await api.post('/bookings/multi-slot', requestPayload, {
  headers: {
    'Content-Type': 'application/json',
  }
});
```

### Fix 3: Check Authentication
```typescript
// Check if token exists
const token = localStorage.getItem('token');
console.log('[Auth] Token:', token ? 'Present' : 'Missing');
```

### Fix 4: Test Endpoint Directly with curl
```bash
# Get a valid token first (from browser localStorage)
TOKEN="your-token-here"

# Test multi-slot endpoint
curl -X POST http://localhost:5164/api/v1/bookings/multi-slot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "timeSlots": [
      {
        "timeSlotId": "some-guid",
        "bookingDate": "2024-12-25"
      }
    ],
    "selectedServices": []
  }'
```

## Most Likely Causes (Ranked)

1. **Backend not running** - Check if API is up
2. **Wrong API URL** - Check `VITE_API_URL` environment variable
3. **Missing/invalid token** - Check localStorage token
4. **Endpoint not deployed** - If using production, ensure new endpoint is deployed
5. **Request payload mismatch** - Check exact structure matches backend expectations

## Resolution Checklist

- [ ] Backend API is running (check terminal/logs)
- [ ] API URL is correct (check .env file)
- [ ] Token is valid (check localStorage)
- [ ] Request URL is correct (check Network tab)
- [ ] Request method is POST (check Network tab)
- [ ] Request payload structure matches backend (check Payload tab)
- [ ] Endpoint exists in backend code
- [ ] Backend has been recompiled/restarted after adding new endpoint
- [ ] CORS is configured (if API on different domain)

## Next Steps

1. **Enable debug mode** - Check console logs we added
2. **Check Network tab** - See exact request/response
3. **Test with Postman/curl** - Isolate frontend vs backend issue
4. **Check backend logs** - See if request reaches backend
5. **Verify deployment** - Ensure new code is deployed

## If Still Not Working

Share the following info:
- Console logs output
- Network tab screenshot (request + response)
- Backend terminal logs
- API URL being used (dev vs production)
- Single-slot vs multi-slot behavior
