# Registration Not Redirecting - Diagnostic Guide

## 🔍 How to Check What's Wrong

### Step 1: Open Browser Console
1. Go to your registration page
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab

### Step 2: Fill & Submit Form
Watch the console. You should see logs like:
```
🚀 Registering user at: https://lmsproject1-cuzs.onrender.com/api/auth/email/register
✅ Registration response: {success: true, message: '...', email: '...'}
📧 Stored email: ankitkalbhor3@gmail.com
🔄 Redirecting to /verify-email...
```

### Step 3: Check for Errors
If instead you see:
```
❌ Registration error: ...
```

**Copy the full error message** and check against these common issues:

---

## 🆘 Common Issues & Fixes

### **Issue #1: "Backend URL not responding"**
**Error:** `Error: Network Error` or `Cannot connect to server`

**Causes:**
- Render backend still deploying
- Wrong API URL

**Fix:**
1. Check your `.env` has `VITE_API_URL=https://lmsproject1-cuzs.onrender.com`
2. Check browser console shows correct URL
3. Wait 5 minutes for Render to fully deploy
4. Try again

---

### **Issue #2: "Invalid email or password"**
**Error:** `Message: 'Password must be 8-64 characters with uppercase, lowercase, number, and special character'`

**Cause:** Your password doesn't meet requirements

**Requirements:**
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&*)

**Example valid password:** `Test@123password`

---

### **Issue #3: "Email already registered"**
**Error:** `Message: 'Email already registered. Please log in or use another email.'`

**Cause:** That email already has a verified account

**Fix:**
- Use a different email
- Or go to Login and use your password

---

### **Issue #4: Registration succeeds but no redirect**
**Console shows:** `✅ Registration response: {success: true...}` but page stays on register form

**Causes:**
1. localStorage might be blocked
2. Navigation might fail
3. Redirect happens but too fast to notice

**Fix:**
Check browser console for this error:
```javascript
// Open console and type:
localStorage.getItem('verificationEmail')
// Should show your email, not null
```

If it shows `null`:
- Your browser might have localStorage disabled
- Try in Incognito/Private window
- Check browser privacy settings

---

### **Issue #5: Email not in localStorage**
**Console shows:** After registration, `localStorage.getItem('verificationEmail')` returns `null`

**Cause:** localStorage not accessible or disabled

**Fix:**
1. Try Incognito window
2. Clear browser cache: Ctrl+Shift+Delete
3. Try different browser
4. Check if localStorage is enabled in browser settings

---

## ✅ Expected Flow After Fix

1. **Fill form** with valid data
2. **Click Create Account**
3. **Console should show:**
   ```
   🚀 Registering user at: https://...
   ✅ Registration response: {success: true, ...}
   📧 Stored email: your@email.com
   🔄 Redirecting to /verify-email...
   ```
4. **Page redirects** to Verify Email page (shows "Check Your Email" screen)
5. **See message:** "Check your email inbox for verification link"
6. **Go to email inbox**
7. **Click verification link** in email from `ankitkalbhor3@gmail.com`
8. **Auto-redirect to login** page
9. **Login with your credentials**

---

## 🧪 Testing Steps

### Test Local Backend (if available):
```bash
# In terminal, test registration endpoint
curl -X POST http://localhost:5000/api/auth/email/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Should return:
# {"success": true, "message": "...", "email": "test@example.com"}
```

### Test Render Backend:
```bash
curl -X POST https://lmsproject1-cuzs.onrender.com/api/auth/email/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

---

## 📋 Debug Checklist

- [ ] Opened browser Console (F12)
- [ ] Can see console logs when filling form
- [ ] Password meets all requirements
- [ ] API URL shows correct URL (`https://lmsproject1-cuzs.onrender.com`)
- [ ] No error messages in console
- [ ] `localStorage.getItem('verificationEmail')` returns email
- [ ] Page actually redirects to `/verify-email`
- [ ] Email verification page shows "Check Your Email"

---

## 🚨 If Still Not Working

Provide these details:
1. **Full console error message** (copy & paste everything)
2. **Password you're using** (tell me what it contains)
3. **Email address** (obfuscated is fine: an...@gmail.com)
4. **What happens after clicking Create Account** (error? stays on form? redirects somewhere else?)
5. **Whether Render backend is fully deployed** (check Render dashboard)

**Then I can help you debug directly!** 🛠️
