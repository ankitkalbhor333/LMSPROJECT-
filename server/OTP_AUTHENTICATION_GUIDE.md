# OTP-Based Mobile Authentication System - Implementation Guide

## 📋 Overview
Your Node.js LMS now has a complete OTP-based authentication system for mobile numbers alongside the existing email+password auth. Both authentication methods coexist seamlessly.

---

## 🎯 What's Been Implemented

### ✅ Step 1: User Model Enhanced
**File:** `models/User.js`

**New Fields:**
```javascript
phone: String (unique, sparse, optional)
isPhoneVerified: Boolean (default: false)
```

**Changes:**
- Email is now optional (sparse: true) for phone-only users
- Password is now optional (default: null) for OTP users
- One user can have both email and phone linked to the same account

---

### ✅ Step 2: OTP Model Created  
**File:** `models/OTP.js`

**Features:**
- Hashes OTP before storage (SHA-256) - never stores plain text
- Tracks verification attempts (max 5 attempts before lockout)
- TTL (Time To Live) index: auto-deletes expired OTPs after 5 minutes
- Helper methods:
  - `verifyOTP(plainOTP)` - Verify plain OTP against hash
  - `isExpired()` - Check if OTP is expired
  - `isMaxAttemptsExceeded()` - Check if locked out

---

### ✅ Step 3: OTP Utilities Created
**File:** `utils/otpUtil.js`

**Functions:**
```javascript
generateOTP()                    // Returns 6-digit OTP as string
isValidOTPFormat(otp)            // Validates format (6 digits)
isValidPhoneFormat(phone)        // Validates Indian mobile (10 digits)
normalizePhone(phone)            // Converts to 10-digit format
maskPhone(phone)                 // Masks for display: 98****3210
```

---

### ✅ Step 4: SMS Service Created
**File:** `services/smsService.js`

**Features:**
- **Dual Provider Support:**
  - **Fast2SMS** (primary, configured by default)
  - **MSG91** (alternative, can be switched via env)
  
- **Functions:**
  - `sendOTPSMS(phone, otp)` - Send OTP via SMS
  - `sendSMS(phone, message)` - Send generic SMS
  - Development mode: Uses mock SMS logger if no API key provided

**Configuration via Environment Variables:**
```
SMS_PROVIDER=fast2sms                   # or msg91
FAST2SMS_API_KEY=your_key              # Fast2SMS API key
SMS_API_KEY=your_msg91_key             # MSG91 API key (if using MSG91)
MSG91_FLOW_ID=your_flow_id             # MSG91 flow ID
SMS_BASE_URL=https://api.msg91.com/    # SMS provider endpoint
```

---

### ✅ Step 5 & 6: OTP Controllers Implemented
**File:** `controllers/authController.js`

#### **1. Send OTP**
```
POST /api/auth/send-otp
Body: { phone: "9876543210" }

Logic:
✓ Validates phone format
✓ Checks if active OTP exists (prevents spam)
✓ Generates new OTP with 5-minute expiry
✓ Sends via SMS service
✓ Returns masked phone for security

Response:
{
  "msg": "OTP sent successfully",
  "maskedPhone": "98****3210",
  "expiresIn": "5 minutes"
}
```

#### **2. Verify OTP**
```
POST /api/auth/verify-otp
Body: {
  "phone": "9876543210",
  "otp": "123456",
  "name": "John Doe"  // Required only for new users
}

Logic:
✓ Validates OTP format
✓ Checks OTP existence and expiry
✓ Enforces max 5 verification attempts
✓ Creates new user if not exists (with phone-only account)
✓ Or updates existing user with phone verification
✓ Generates JWT token
✓ Auto-deletes OTP after successful verification

Response:
{
  "msg": "Phone verified successfully",
  "token": "jwt_token_here...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "phone": "98****3210",
    "role": "student",
    "email": null,
    "isPhoneVerified": true,
    "avatar": ""
  }
}
```

#### **3. Resend OTP (Bonus)**
```
POST /api/auth/resend-otp
Body: { phone: "9876543210" }

Logic:
✓ Prevents resending if current OTP still valid
✓ Checks if user exceeded resend limit (max 3 per hour)
✓ Generates new OTP with 5-minute expiry
✓ Sends via SMS

Response: Same as Send OTP
```

#### **4. Link Email (Bonus)**
```
POST /api/auth/link-email
Headers: Authorization: Bearer {jwt_token}
Body: {
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Logic:
✓ Only phone-verified users can use this
✓ Validates email uniqueness
✓ Validates password strength (8-64 chars, mixed case, number, special char)
✓ Sets email as unverified (requires verification)
✓ Sends email verification link
✓ Returns generic success message

Response:
{
  "msg": "Email linked. Please verify by clicking the link in your email"
}
```

---

### ✅ Step 7: OTP Rate Limiting
**File:** `middleware/rateLimit.js`

**Rate Limits Implemented:**

| Action | Limit | Window | Purpose |
|--------|-------|--------|---------|
| Send OTP | 3 | 1 minute | Prevent SMS spam |
| Verify OTP | 20 | 15 minutes | Allow multiple attempts |
| Resend OTP | 3 | 1 hour | Prevent abuse |

**Configurable via Environment:**
```
RATE_LIMIT_SEND_OTP_MAX=3
RATE_LIMIT_VERIFY_OTP_MAX=20
RATE_LIMIT_RESEND_OTP_MAX=3
```

---

### ✅ Step 8: Auth Routes Updated
**File:** `routes/authRoutes.js`

**All OTP Routes:**
```javascript
POST   /api/auth/send-otp      - Send OTP to phone
POST   /api/auth/verify-otp    - Verify OTP & login/create user
POST   /api/auth/resend-otp    - Request new OTP
POST   /api/auth/link-email    - Link email to phone account (Protected)

// Existing routes still work:
POST   /api/auth/register      - Email signup
POST   /api/auth/login         - Email + password login
GET    /api/auth/verify/:token - Verify email
POST   /api/auth/forgot-password - Reset password
GET    /api/auth/me            - Get current user (Protected)
```

---

### ✅ Step 9: Environment Variables Updated
**File:** `.env`

**New Variables Added:**
```
# JWT Configuration
JWT_EXPIRES_IN=7d

# Authentication Rate Limiting
AUTH_MAX_LOGIN_ATTEMPTS=5
AUTH_LOCK_MINUTES=15
RATE_LIMIT_LOGIN_MAX=10
RATE_LIMIT_REGISTER_MAX=5
RATE_LIMIT_FORGOT_PASSWORD_MAX=5
RATE_LIMIT_VERIFY_MAX=20

# OTP Rate Limiting
RATE_LIMIT_SEND_OTP_MAX=3
RATE_LIMIT_VERIFY_OTP_MAX=20
RATE_LIMIT_RESEND_OTP_MAX=3

# SMS Provider Configuration  
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_key_here

# Alternative providers
# SMS_PROVIDER=msg91
# SMS_API_KEY=your_msg91_key
# MSG91_FLOW_ID=flow_id
# SMS_BASE_URL=https://api.msg91.com/apiv5/flow

# Bcrypt Configuration
BCRYPT_ROUNDS=12

# Application Environment
NODE_ENV=development
```

---

## 🔐 Security Features Implemented

### Password-like Security for OTP
- **Hashed Storage**: OTPs are hashed with SHA-256 before database storage
- **Time-Limited**: 5-minute expiry enforced at OTP creation
- **Attempt Lockout**: Maximum 5 verification attempts, then locked
- **Auto-Deletion**: Expired OTPs automatically deleted via MongoDB TTL index

### Rate Limiting
- **Send OTP**: 3 per minute per phone (prevents SMS bomb attacks)
- **Verify OTP**: 20 per 15 minutes per IP (prevents brute-force)
- **Resend OTP**: 3 per hour per phone (prevents abuse)

### User Privacy
- **Phone Masking**: Displayed as `98****3210` in API responses
- **Generic Error Messages**: Prevents account enumeration
- **No Token Leaking**: OTP never returned in API responses

### Account Linking Security
- **One Account Connection**: Phone + email can be linked to single user
- **Email Verification**: Required when linking email to phone account
- **Password Strength**: Enforced when linking email (8-64 chars, mixed case, numbers, special chars)

---

## 📱 Frontend Integration Flow

### Flow 1: Phone-Only Registration
```
1. User enters phone number
   → Call POST /api/auth/send-otp
   
2. User receives SMS with 6-digit OTP
   
3. User enters OTP + name
   → Call POST /api/auth/verify-otp
   
4. Backend returns JWT token
   → Store in localStorage/sessionStorage
   
5. User can now access the app
   → Use token in Authorization header: Bearer {token}
```

### Flow 2: Email + Password Registration (Existing)
```
1. User registers with email
   → Call POST /api/auth/register
   
2. User verifies email from link in inbox
   → Call GET /api/auth/verify/:token
   
3. User logs with email + password
   → Call POST /api/auth/login
   
4. Backend returns JWT token
```

### Flow 3: Link Email to Phone Account
```
(User is already logged in via OTP)

1. User navigates to "Link Email"
   
2. User enters email + password
   → Call POST /api/auth/link-email
   → Headers: Authorization: Bearer {jwt_token}
   
3. User receives email verification link
   
4. User verifies email
   → Call GET /api/auth/verify/:token
   
5. Account now has both phone + email
```

---

## 🚀 Testing the Implementation

### Test Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

### Test Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "otp": "123456",
    "name": "John Doe"
  }'
```

### Test Resend OTP
```bash
curl -X POST http://localhost:5000/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

### Test Link Email
```bash
curl -X POST http://localhost:5000/api/auth/link-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {jwt_token}" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

---

## 📁 File Structure

```
server/
├── models/
│   ├── User.js                 [UPDATED] - Added phone fields
│   └── OTP.js                  [NEW] - OTP storage with TTL
├── controllers/
│   └── authController.js       [UPDATED] - Added OTP functions
├── routes/
│   └── authRoutes.js           [UPDATED] - Added OTP routes
├── middleware/
│   ├── rateLimit.js            [UPDATED] - Added OTP rate limiters
│   └── authMiddleware.js       [EXISTING] - JWT verification
├── services/
│   └── smsService.js           [NEW] - SMS provider abstraction
├── utils/
│   ├── otpUtil.js              [NEW] - OTP utilities
│   └── sendEmail.js            [EXISTING] - Email service
├── .env                        [UPDATED] - Added SMS config
└── package.json                [EXISTING]
```

---

## 🔧 Configuration for Production

### 1. Update SMS Provider
**For Fast2SMS:**
```
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_actual_api_key
NODE_ENV=production
```

**For MSG91:**
```
SMS_PROVIDER=msg91
SMS_API_KEY=your_msg91_key
MSG91_FLOW_ID=your_flow_id
SMS_BASE_URL=https://api.msg91.com/apiv5/flow
NODE_ENV=production
```

### 2. Update JWT Secret
```
JWT_SECRET=very-long-random-string-at-least-32-chars
JWT_EXPIRES_IN=7d
```

### 3. Adjust Rate Limits as Needed
```
RATE_LIMIT_SEND_OTP_MAX=3         # Max OTP per minute per phone
RATE_LIMIT_VERIFY_OTP_MAX=20      # Max attempts per 15 min per IP
RATE_LIMIT_RESEND_OTP_MAX=3       # Max resends per hour per phone
```

### 4. Set Production Environment
```
NODE_ENV=production
```

---

## ⚠️ Important Notes

### Backward Compatibility ✅
- All existing email+password authentication remains unchanged
- Old email-only users can still login with email
- Phone users can link email anytime

### Database Migrations
If you have existing users, no migration needed:
- `phone` field is optional and defaults to null
- `isPhoneVerified` defaults to false
- Indexes are automatically created by Mongoose

### OTP Expiry
- OTPs expire in 5 minutes
- MongoDB TTL index automatically deletes expired records
- User can request new OTP anytime

### SMS Cost Considerations
- Fast2SMS: ~₹0.5 per SMS in India
- MSG91: Similar pricing (~₹0.5 per SMS)
- Rate limiting helps control costs

---

## 🐛 Troubleshooting

### "OTP not found" Error
- User didn't request OTP first
- OTP expired (request new one)
- Wrong phone number format

### "Too many attempts" Error
- Hit rate limit on OTP requests
- Solution: Wait for the specified duration

### SMS not received
- Check `FAST2SMS_API_KEY` is valid
- Verify phone number is correct 10-digit format
- Check phone carrier SMS reception

### User can't login after verifying phone
- Ensure JWT_SECRET is configured
- Check token expiry not exceeded
- Verify user exists in database

---

## 📞 Support & Extensions

You can extend this system with:

1. **WhatsApp OTP** - Use WhatsApp Business API instead of SMS
2. **Multi-factor Authentication** - Require both email + phone verification
3. **OTP History** - Track all OTP requests for audit
4. **Admin Dashboard** - View OTP verification attempts
5. **SMS Templates** - Customize OTP message text

---

**Implementation Complete! ✅**

Your LMS now has production-ready OTP authentication for mobile numbers, fully integrated with existing email authentication. Both methods work seamlessly with the same JWT token system.
