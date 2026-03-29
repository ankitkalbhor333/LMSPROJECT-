# OTP Authentication API Reference

## API Endpoints Overview

### Base URL
```
http://localhost:5000/api/auth
```

---

## Authentication Methods

### Method 1: Email + Password (Existing)
- **Register**: `POST /register`
- **Login**: `POST /login`
- **Verify Email**: `GET /verify/:token`
- **Forgot Password**: `POST /forgot-password`
- **Reset Password**: `POST /reset-password/:token`

### Method 2: Phone + OTP (New)
- **Send OTP**: `POST /send-otp`
- **Verify OTP**: `POST /verify-otp`
- **Resend OTP**: `POST /resend-otp`
- **Link Email**: `POST /link-email` (Protected)

### Utility
- **Get Current User**: `GET /me` (Protected)

---

## Endpoint Details

## 📱 OTP: Send OTP

```
POST /api/auth/send-otp
```

**Request:**
```json
{
  "phone": "9876543210"
}
```

**Success Response (200):**
```json
{
  "msg": "OTP sent successfully to your phone",
  "maskedPhone": "98****3210",
  "expiresIn": "5 minutes"
}
```

**Error Responses:**
```json
// Invalid phone format
{
  "msg": "Invalid phone format. Enter 10-digit mobile number"
}

// OTP already sent (not expired)
{
  "msg": "OTP already sent. Please check your SMS. Try again after 5 minutes.",
  "maskedPhone": "98****3210"
}

// Rate limit exceeded
{
  "msg": "Too many OTP requests. Please try again in a few minutes."
}

// SMS sending failed
{
  "msg": "Failed to send OTP. Please try again."
}
```

**Rate Limit:** 3 per minute per phone

---

## 🔑 OTP: Verify OTP (Login/Register)

```
POST /api/auth/verify-otp
```

**Request (New User):**
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "name": "John Doe"
}
```

**Request (Existing User):**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "msg": "Phone verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "650a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Doe",
    "phone": "98****3210",
    "role": "student",
    "email": null,
    "isPhoneVerified": true,
    "avatar": ""
  }
}
```

**Error Responses:**
```json
// OTP not found
{
  "msg": "OTP not found. Request new OTP."
}

// OTP expired
{
  "msg": "OTP expired. Request new OTP."
}

// Invalid OTP (first 4 attempts)
{
  "msg": "Invalid OTP. 4 attempts remaining."
}

// Max attempts exceeded
{
  "msg": "Max OTP verification attempts exceeded. Request new OTP."
}

// Missing name for new user
{
  "msg": "Name required for new account (minimum 2 characters)"
}
```

**Rate Limit:** 20 per 15 minutes per IP

---

## 🔄 OTP: Resend OTP

```
POST /api/auth/resend-otp
```

**Request:**
```json
{
  "phone": "9876543210"
}
```

**Success Response (200):**
```json
{
  "msg": "New OTP sent successfully",
  "maskedPhone": "98****3210",
  "expiresIn": "5 minutes"
}
```

**Error Responses:**
```json
// OTP still valid
{
  "msg": "OTP still valid. Please wait 3 minutes before requesting new OTP."
}

// Rate limit exceeded
{
  "msg": "Too many OTP resend requests. Please try again later."
}
```

**Rate Limit:** 3 per hour per phone

---

## 📧 Link Email to Phone Account

```
POST /api/auth/link-email
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "msg": "Email linked successfully. Please verify your email by clicking the link sent to your inbox."
}
```

**Error Responses:**
```json
// Not authenticated
{
  "msg": "Not authenticated"
}

// Not a phone-verified user
{
  "msg": "Only phone-verified users can link email"
}

// Email already in use
{
  "msg": "Email already in use"
}

// Weak password
{
  "msg": "Password must be 8-64 chars and include uppercase, lowercase, number, and special character"
}

// Invalid email format
{
  "msg": "Invalid email format"
}
```

---

## 👤 Get Current User

```
GET /api/auth/me
Authorization: Bearer {jwt_token}
```

**Success Response (200):**
```json
{
  "_id": "650a1b2c3d4e5f6g7h8i9j0k",
  "id": "650a1b2c3d4e5f6g7h8i9j0k",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "",
  "role": "student",
  "isVerified": true,
  "isPhoneVerified": true,
  "phone": "98****3210",
  "status": "active",
  "createdAt": "2024-03-25T10:30:00.000Z",
  "studentProfile": {
    "class": "Class 10",
    "goals": "Learn programming"
  },
  "teacherProfile": null
}
```

**Error Response:**
```json
{
  "msg": "Not authenticated"
}
```

---

## 🔐 Common JWT Header

For all protected endpoints (`/me`, `/link-email`), include:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 3           # Total requests allowed
X-RateLimit-Remaining: 2       # Requests remaining
X-RateLimit-Reset: 1711353000  # Unix timestamp when limit resets
Retry-After: 45                # Seconds to wait (only when rate limited)
```

---

## 🧪 Example Requests

### Using cURL

**Send OTP:**
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210"
  }'
```

**Verify OTP:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "otp": "123456",
    "name": "John Doe"
  }'
```

**Link Email:**
```bash
curl -X POST http://localhost:5000/api/auth/link-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "email": "newemail@example.com",
    "password": "SecurePass123!"
  }'
```

### Using JavaScript/Fetch

**Send OTP:**
```javascript
const response = await fetch('http://localhost:5000/api/auth/send-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '9876543210'
  })
});

const data = await response.json();
console.log(data);
```

**Verify OTP:**
```javascript
const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '9876543210',
    otp: '123456',
    name: 'John Doe'
  })
});

const data = await response.json();
if (data.token) {
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}
```

**Link Email (With Token):**
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:5000/api/auth/link-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    email: 'newemail@example.com',
    password: 'SecurePass123!'
  })
});

const data = await response.json();
console.log(data);
```

### Using Postman

1. Create a new request
2. Set method to `POST`
3. Enter URL: `http://localhost:5000/api/auth/send-otp`
4. Go to **Body** tab
5. Select **raw** and **JSON**
6. Paste JSON data:
```json
{
  "phone": "9876543210"
}
```
7. Click **Send**

For protected endpoints, add Authorization header:
1. Go to **Headers** tab
2. Add `Authorization: Bearer {token}`

---

## 🔄 Complete Authentication Flow

### Flow: Register & Login with Phone OTP

**1. Send OTP**
```
POST /api/auth/send-otp
{"phone": "9876543210"}
↓
Response: "OTP sent successfully"
```

**2. User receives SMS with OTP**

**3. Verify OTP (creates account)**
```
POST /api/auth/verify-otp
{
  "phone": "9876543210",
  "otp": "123456",
  "name": "John Doe"
}
↓
Response: {
  "token": "jwt_token",
  "user": {...}
}
```

**4. Save token & use for authenticated requests**
```
GET /api/auth/me
Authorization: Bearer {token}
↓
Response: User data
```

**5. (Optional) Link email later**
```
POST /api/auth/link-email
Authorization: Bearer {token}
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
↓
Response: "Email linked. Verify via email link"
```

---

## 📝 Important Notes

- **Phone Format**: 10-digit Indian mobile (e.g., 9876543210)
- **OTP Format**: 6 digits (e.g., 123456)
- **OTP Validity**: 5 minutes from sending
- **Max OTP Attempts**: 5 wrong attempts before lockout
- **Password Rules**: 8-64 chars, uppercase, lowercase, number, special char
- **Token Expiry**: 7 days (configurable via `JWT_EXPIRES_IN`)

---

## ✅ Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (invalid token) |
| 404 | Not found |
| 429 | Too many requests (rate limited) |
| 500 | Server error |

---

## 🔒 Security Best Practices

1. **Always use HTTPS** in production
2. **Never log OTPs** in production
3. **Store token securely** (httpOnly cookies recommended)
4. **Validate all inputs** on frontend before sending
5. **Handle rate limits** gracefully (show cooldown timer)
6. **Expire sessions** after 7 days (refresh token recommended)

---

**Last Updated:** March 25, 2024
**Version:** 1.0
