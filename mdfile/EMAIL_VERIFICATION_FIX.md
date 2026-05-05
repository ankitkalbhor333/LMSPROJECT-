# Email Verification Troubleshooting & Quick Fixes

## 🎯 Current Issue
- ✅ Accounts are being created in MongoDB
- ❌ Verification emails are NOT being sent
- ❌ Users cannot verify and login

## 🔧 Quick Fixes to Try (In Order)

### **FIX #1: Gmail App Password (Most Common Cause)**

Your Gmail account may have revoked the app password. **Do this NOW:**

1. Go to: https://myaccount.google.com/apppasswords
2. Select:
   - **App:** Mail
   - **Device:** Windows Computer (or your device)
3. Copy the **16-character password**
4. Update in your `.env`:
   ```
   EMAIL_PASSWORD=<paste-new-16-char-password-here>
   ```
5. Redeploy to Render

**Why this happens:** Google revokes app passwords after:
- Email password change
- Security warning
- 30+ days of inactivity
- Account breach detection

---

### **FIX #2: Test Email Service (Development)**

I've added a test endpoint to verify email works locally.

#### On Your Local Machine:
```bash
# Test the email service
curl -X POST http://localhost:5000/api/auth/email/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

#### Expected Response (Success):
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "details": {
    "recipient": "your-test-email@gmail.com",
    "service": "gmail",
    "user": "ankitkalbhor3@gmail.com"
  }
}
```

#### Expected Response (Failure):
```json
{
  "success": false,
  "message": "Failed to send test email",
  "error": "Invalid login: ...",
  "details": {
    "service": "gmail",
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "ankitkalbhor3@gmail.com"
  }
}
```

---

### **FIX #3: Manual Email Verification (For Testing)**

I've added a manual verification endpoint for development/testing:

#### Manually Verify a User's Email:
```bash
curl -X POST http://localhost:5000/api/auth/email/manual-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"ankitkalbhor3@gmail.com"}'
```

#### Expected Success Response:
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "user": {
    "id": "69d0f5aaf17f788ab7100977",
    "name": "ankit",
    "email": "ankitkalbhor3@gmail.com",
    "emailVerified": true
  }
}
```

**Then the user can login immediately!**

---

## 🔍 How to Diagnose

### Step 1: Check Your Email Configuration
```bash
# Check if passwords are set
echo $EMAIL_USER
echo $EMAIL_PASSWORD

# Should output your Gmail and app password (not blank)
```

### Step 2: Check Backend Logs Locally
Run backend in development and watch logs:
```bash
npm run dev  # or node server.js
```

**Look for these messages when registering:**
- ✅ "Verification email sent successfully"
- ❌ "Email sending failed: Invalid login"
- ❌ "Email transporter error"

### Step 3: Check Render Backend Logs
Go to Render Dashboard → Backend Service → Logs

Look for:
```
📧 Email Configuration:
   - Service: gmail
   - Host: smtp.gmail.com
   - Port: 587
   - Secure: false
   - User: ankitkalbhor3@gmail.com
   - Password: ✓ Set

✅ Email transporter ready
```

If you see: `❌ Email transporter error: Invalid login`

**This means your Gmail app password is wrong or expired!**

---

## 🚀 Testing Workflow

### Test #1: Local Email Test
```bash
# Make sure your backend is running on localhost:5000
curl -X POST http://localhost:5000/api/auth/email/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"youremail@gmail.com"}'
```

Check your email inbox for the test email.

### Test #2: Local Registration & Manual Verification
```bash
# Register a test account
curl -X POST http://localhost:5000/api/auth/email/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "password":"TestPass123!"
  }'

# Manually verify (development only)
curl -X POST http://localhost:5000/api/auth/email/manual-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Try to login
curl -X POST http://localhost:5000/api/auth/email/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPass123!"
  }'
```

### Test #3: Render Deployment
1. Update Gmail app password in Render environment
2. Redeploy backend: `git push origin main`
3. Wait for deployment to complete
4. Test from frontend: https://lmsprojectfrontend.onrender.com/register
5. Fill form and submit
6. **Watch the backend logs in Render**

---

## 📋 Configuration Checklist

- [ ] Gmail App Password is current and valid (generated in last 30 days)
- [ ] `.env` file has EMAIL_PASSWORD set
- [ ] EMAIL_USER is `ankitkalbhor3@gmail.com`
- [ ] EMAIL_PORT is `587`
- [ ] EMAIL_SECURE is `false`
- [ ] NODE_ENV is `production` on Render
- [ ] Backend is redeployed after env variable changes
- [ ] Frontend environment variable VITE_API_URL is correct

---

## 🆘 If Email Still Doesn't Work

### Common Causes & Solutions:

#### Error: "Invalid login"
- **Cause:** Gmail app password expired or wrong
- **Fix:** Generate new password from https://myaccount.google.com/apppasswords

#### Error: "connect ECONNREFUSED"
- **Cause:** Cannot connect to Gmail SMTP
- **Fix:** Enable "Less secure app access" in Gmail (if not using app password)
- **OR:** Use the 16-character app password, not your Gmail password

#### Error: "Socket timeout"
- **Cause:** Render outbound SMTP might be blocked
- **Fix:** Check if your Render plan allows outbound connections
- **OR:** Use alternative email service (SendGrid, AWS SES, Mailgun)

#### Email arrives but verification link doesn't work
- **Cause:** FRONTEND_URL in backend .env might be wrong
- **Fix:** Verify it's set to `https://lmsprojectfrontend.onrender.com`

---

## 💾 Permanent Fix Steps

1. **Get new Google App Password:**
   - Sign in: https://myaccount.google.com/apppasswords
   - Select Mail + your device
   - Copy 16-character password

2. **Update Render environment:**
   - Go to Render Dashboard
   - Backend service → Settings → Environment
   - Update: `EMAIL_PASSWORD=<new-16-char-password>`
   - Click Save

3. **Redeploy:**
   ```bash
   git push origin main
   # Render auto-redeploys
   ```

4. **Test from deployed site:**
   - https://lmsprojectfrontend.onrender.com/register
   - Create account
   - Check email inbox (wait 30 seconds)
   - Click verification link
   - Login should work

---

## 📞 Need More Help?

Provide these details:
1. Error message from browser console (F12 → Console)
2. Last 30 lines from Render backend logs
3. Whether `EMAIL_PASSWORD` is set in Render environment
4. Whether you've updated the Gmail app password recently
