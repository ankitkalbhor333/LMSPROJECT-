# Frontend Integration Guide - OTP Authentication

## 📱 Complete Frontend Implementation Examples

This guide shows how to implement OTP authentication in your React frontend for the LMS app.

---

## 🎯 Overview

Your React app needs to support both:
1. **Email + Password** login (existing)
2. **Phone + OTP** login (new)

Both return the same JWT token, so token handling is identical.

---

## 📦 Component Structure Recommended

```
src/
├── pages/
│   ├── AuthPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── OTPPage.jsx                    [NEW]
│   └── LinkEmailPage.jsx              [NEW]
├── components/
│   ├── OTPInput.jsx                   [NEW]
│   ├── PhoneInput.jsx                 [NEW]
│   └── ProtectedRoute.jsx
├── services/
│   ├── authService.js                 [NEW]
│   └── apiClient.js                   [UPDATED]
├── hooks/
│   ├── useAuth.js                     [NEW]
│   └── useOTP.js                      [NEW]
├── context/
│   └── AuthContext.jsx                [UPDATED]
└── utils/
    └── validation.js                  [NEW]
```

---

## 🔧 Setup: API Client

**File: `src/services/apiClient.js`**

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 🔑 Service: Authentication

**File: `src/services/authService.js`**

```javascript
import apiClient from './apiClient';

const authService = {
  // ============= EMAIL AUTHENTICATION =============
  
  /**
   * Register with email and password
   */
  registerWithEmail: async (name, email, password) => {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  /**
   * Login with email and password
   */
  loginWithEmail: async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token) => {
    const response = await apiClient.get(`/auth/verify/${token}`);
    return response.data;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token, newPassword) => {
    const response = await apiClient.post(`/auth/reset-password/${token}`, {
      newPassword,
    });
    return response.data;
  },

  // ============= OTP AUTHENTICATION (NEW) =============

  /**
   * Send OTP to phone number
   */
  sendOTP: async (phone) => {
    const response = await apiClient.post('/auth/send-otp', { phone });
    return response.data;
  },

  /**
   * Verify OTP and login/register
   */
  verifyOTP: async (phone, otp, name = null) => {
    const payload = { phone, otp };
    if (name) {
      payload.name = name;
    }
    
    const response = await apiClient.post('/auth/verify-otp', payload);
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Resend OTP to phone
   */
  resendOTP: async (phone) => {
    const response = await apiClient.post('/auth/resend-otp', { phone });
    return response.data;
  },

  /**
   * Link email to existing phone account
   */
  linkEmail: async (email, password) => {
    const response = await apiClient.post('/auth/link-email', {
      email,
      password,
    });
    return response.data;
  },

  // ============= USER UTILITIES =============

  /**
   * Get current logged-in user
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Get stored user data
   */
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default authService;
```

---

## 🎨 Utility: Validation

**File: `src/utils/validation.js`**

```javascript
/**
 * Validate phone number (10-digit Indian format)
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Should be exactly 10 digits
  if (cleaned.length !== 10) return false;
  
  // Should start with 6-9 (valid Indian mobile)
  return /^[6-9]/.test(cleaned);
};

/**
 * Validate OTP (6 digits)
 */
export const isValidOTP = (otp) => {
  return /^\d{6}$/.test(String(otp).trim());
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password) => {
  // 8-64 chars, uppercase, lowercase, number, special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
  return regex.test(password);
};

/**
 * Get password strength feedback
 */
export const getPasswordFeedback = (password) => {
  const checks = {
    length: password.length >= 8 && password.length <= 64,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z\d]/.test(password),
  };

  const missing = [];
  if (!checks.uppercase) missing.push('uppercase letter');
  if (!checks.lowercase) missing.push('lowercase letter');
  if (!checks.number) missing.push('number');
  if (!checks.special) missing.push('special character');
  if (!checks.length) missing.push('8-64 characters');

  return {
    isValid: Object.values(checks).every(Boolean),
    missing,
    strength: Object.values(checks).filter(Boolean).length / 5,
  };
};

/**
 * Format phone for display (mask digits)
 */
export const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  return `${cleaned.slice(0, 2)}****${cleaned.slice(-4)}`;
};

/**
 * Normalize phone (remove +91, spaces, hyphens)
 */
export const normalizePhone = (phone) => {
  let normalized = String(phone).trim();
  
  // Remove +91 or 91 prefix
  if (normalized.startsWith('+91')) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith('91')) {
    normalized = normalized.slice(2);
  }
  
  // Remove spaces and hyphens
  normalized = normalized.replace(/[\s-]/g, '');
  
  return normalized;
};
```

---

## 🪝 Custom Hooks

### Hook 1: useAuth

**File: `src/hooks/useAuth.js`**

```javascript
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default useAuth;
```

### Hook 2: useOTP

**File: `src/hooks/useOTP.js`**

```javascript
import { useState, useCallback } from 'react';
import authService from '../services/authService';

const useOTP = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [lastOTPTime, setLastOTPTime] = useState(null);
  const [otpExpiry, setOtpExpiry] = useState(null);

  const sendOTP = useCallback(async (phoneNumber) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await authService.sendOTP(phoneNumber);
      setMessage(result.msg);
      setPhone(phoneNumber);
      setLastOTPTime(Date.now());
      
      // Set OTP expiry (5 minutes)
      setOtpExpiry(Date.now() + 5 * 60 * 1000);
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (phoneNumber, otpValue, name = null) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await authService.verifyOTP(phoneNumber, otpValue, name);
      setMessage(result.msg);
      setPhone('');
      setOTP('');
      setOtpExpiry(null);
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async (phoneNumber) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.resendOTP(phoneNumber);
      setMessage(result.msg);
      setLastOTPTime(Date.now());
      setOtpExpiry(Date.now() + 5 * 60 * 1000);
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const canResend = useCallback(() => {
    if (!lastOTPTime) return true;
    
    // Can resend if more than 30 seconds have passed
    return Date.now() - lastOTPTime > 30 * 1000;
  }, [lastOTPTime]);

  const getResendCountdown = useCallback(() => {
    if (!lastOTPTime) return 0;
    
    const remaining = 30 * 1000 - (Date.now() - lastOTPTime);
    return Math.max(0, Math.ceil(remaining / 1000));
  }, [lastOTPTime]);

  return {
    phone,
    setPhone,
    otp,
    setOTP,
    loading,
    error,
    message,
    otpExpiry,
    sendOTP,
    verifyOTP,
    resendOTP,
    canResend,
    getResendCountdown,
  };
};

export default useOTP;
```

---

## 🔐 Context: Authentication

**File: `src/context/AuthContext.jsx`**

```javascript
import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }

    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
```

---

## 📄 Components

### Component 1: Phone Input

**File: `src/components/PhoneInput.jsx`**

```javascript
import React, { useState } from 'react';
import { isValidPhone, normalizePhone, maskPhone } from '../utils/validation';

const PhoneInput = ({ value, onChange, error, disabled = false }) => {
  const [displayValue, setDisplayValue] = useState(value);

  const handleChange = (e) => {
    const input = e.target.value;
    setDisplayValue(input);

    // Only numbers
    const normalized = normalizePhone(input);
    onChange(normalized);
  };

  const isEmpty = !displayValue;
  const isValid = !isEmpty && isValidPhone(displayValue);

  return (
    <div className="phone-input">
      <input
        type="tel"
        placeholder="Enter mobile number (10 digits)"
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        maxLength="13"
        pattern="[0-9+\-]{10,13}"
        className={`input ${error ? 'error' : ''} ${isValid ? 'valid' : ''}`}
      />

      {!isEmpty && !isValid && (
        <small className="error-text">Please enter valid 10-digit mobile number</small>
      )}

      {isValid && (
        <small className="success-text">
          Formatted as: {maskPhone(displayValue)}
        </small>
      )}

      {error && <small className="error-text">{error}</small>}
    </div>
  );
};

export default PhoneInput;
```

### Component 2: OTP Input

**File: `src/components/OTPInput.jsx`**

```javascript
import React, { useRef, useEffect } from 'react';
import { isValidOTP } from '../utils/validation';

const OTPInput = ({ value, onChange, error, disabled = false }) => {
  const inputRefs = useRef([]);

  const handleChange = (index, e) => {
    const val = e.target.value;

    // Only allow single digit
    if (!/^\d?$/.test(val)) return;

    const newOTP = value.split('');
    newOTP[index] = val;
    const otpValue = newOTP.join('');

    onChange(otpValue);

    // Move to next input if filled
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index, e) => {
    if (e.key === 'Backspace' && !value[index]) {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const digits = paste.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
      onChange(digits);

      // Focus last input
      const lastIndex = Math.min(digits.length - 1, 5);
      setTimeout(() => {
        inputRefs.current[lastIndex]?.focus();
      }, 0);
    }
  };

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="otp-input-container">
      <div className="otp-inputs" onPaste={handlePaste}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleBackspace(index, e)}
            disabled={disabled}
            className={`otp-input ${error ? 'error' : ''}`}
          />
        ))}
      </div>

      {error && <small className="error-text">{error}</small>}

      {isValidOTP(value) && (
        <small className="success-text">✓ OTP is valid</small>
      )}
    </div>
  );
};

export default OTPInput;
```

---

## 📄 Pages

### Page 1: OTP Login/Register

**File: `src/pages/OTPPage.jsx`**

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from '../components/PhoneInput';
import OTPInput from '../components/OTPInput';
import useOTP from '../hooks/useOTP';
import useAuth from '../hooks/useAuth';
import { normalizePhone, isValidPhone, isValidOTP } from '../utils/validation';

const OTPPage = () => {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp' or 'name'
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    phone,
    setPhone,
    otp,
    setOTP,
    loading,
    error,
    message,
    sendOTP,
    verifyOTP,
    resendOTP,
    canResend,
    getResendCountdown,
  } = useOTP();

  // ============= STEP 1: SEND OTP =============
  const handleSendOTP = async (e) => {
    e.preventDefault();

    const normalizedPhone = normalizePhone(phone);

    if (!isValidPhone(normalizedPhone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const result = await sendOTP(normalizedPhone);
      setPhone(normalizedPhone);
      setStep('otp');
    } catch (err) {
      // Error is already set in useOTP hook
      console.error('Send OTP failed:', err);
    }
  };

  // ============= STEP 2: VERIFY OTP (NEW USER) =============
  const handleVerifyOTPNewUser = async (e) => {
    e.preventDefault();

    if (!isValidOTP(otp)) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    // Ask for name if new user
    if (!name.trim()) {
      setStep('name');
      return;
    }

    try {
      const result = await verifyOTP(phone, otp, name.trim());
      
      // Store auth data and redirect
      login(result.user, result.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Verify OTP failed:', err);
    }
  };

  // ============= STEP 2: VERIFY OTP (EXISTING USER) =============
  const handleVerifyOTPExisting = async (e) => {
    e.preventDefault();

    if (!isValidOTP(otp)) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const result = await verifyOTP(phone, otp);
      
      login(result.user, result.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Verify OTP failed:', err);
    }
  };

  // ============= RESEND OTP =============
  const handleResendOTP = async () => {
    if (!canResend()) {
      alert(`Please wait ${getResendCountdown()} seconds`);
      return;
    }

    try {
      await resendOTP(phone);
    } catch (err) {
      console.error('Resend OTP failed:', err);
    }
  };

  // ============= STEP 3: ENTER NAME (NEW USER) =============
  if (step === 'name') {
    return (
      <div className="auth-page otp-page">
        <div className="auth-card">
          <h2>Create Your Account</h2>
          <p>Enter your name to complete registration</p>

          <form onSubmit={handleVerifyOTPNewUser}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
                autoFocus
              />
              {name.trim().length < 2 && name.length > 0 && (
                <small className="error-text">Name must be at least 2 characters</small>
              )}
            </div>

            <button type="submit" disabled={loading || name.trim().length < 2}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <button
            type="button"
            className="link-button"
            onClick={() => setStep('otp')}
            disabled={loading}
          >
            Back to OTP verification
          </button>
        </div>
      </div>
    );
  }

  // ============= STEP 2: VERIFY OTP =============
  if (step === 'otp') {
    return (
      <div className="auth-page otp-page">
        <div className="auth-card">
          <h2>Enter OTP</h2>
          <p>We sent a 6-digit code to {phone}</p>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleVerifyOTPNewUser}>
            <div className="form-group">
              <OTPInput value={otp} onChange={setOTP} error={error} disabled={loading} />
            </div>

            <button type="submit" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="otp-actions">
            <button
              type="button"
              className="link-button"
              onClick={handleResendOTP}
              disabled={!canResend() || loading}
            >
              {canResend() ? 'Resend OTP' : `Resend in ${getResendCountdown()}s`}
            </button>

            <button
              type="button"
              className="link-button"
              onClick={() => {
                setStep('phone');
                setOTP('');
              }}
              disabled={loading}
            >
              Change Phone Number
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============= STEP 1: SEND OTP =============
  return (
    <div className="auth-page otp-page">
      <div className="auth-card">
        <h2>Login with OTP</h2>
        <p>Enter your mobile number to receive a one-time password</p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSendOTP}>
          <div className="form-group">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              error={error}
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading || !isValidPhone(phone)}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

        <p className="divider">OR</p>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate('/login')}
        >
          Login with Email
        </button>
      </div>
    </div>
  );
};

export default OTPPage;
```

### Page 2: Link Email

**File: `src/pages/LinkEmailPage.jsx`**

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import { isValidEmail, isStrongPassword, getPasswordFeedback } from '../utils/validation';

const LinkEmailPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  const passwordFeedback = getPasswordFeedback(password);

  const handleLinkEmail = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!isStrongPassword(password)) {
      setError('Password does not meet requirements');
      setLoading(false);
      return;
    }

    try {
      const result = await authService.linkEmail(email, password);
      setSuccess(true);
      setEmail('');
      setPassword('');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to link email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card success">
          <h2>✓ Email Linked Successfully</h2>
          <p>Please verify your email by clicking the link sent to your inbox.</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Link Email to Your Account</h2>
        <p>You can add email for additional security</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLinkEmail}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            {email && !isValidEmail(email) && (
              <small className="error-text">Invalid email format</small>
            )}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            {password && (
              <div className="password-feedback">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{ width: `${passwordFeedback.strength * 100}%` }}
                  />
                </div>

                {!passwordFeedback.isValid && (
                  <ul className="requirements">
                    {passwordFeedback.missing.map((req) => (
                      <li key={req}>✗ Add {req}</li>
                    ))}
                  </ul>
                )}

                {passwordFeedback.isValid && (
                  <small className="success-text">✓ Password is strong</small>
                )}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading || !isValidEmail(email) || !isStrongPassword(password)}>
            {loading ? 'Linking Email...' : 'Link Email'}
          </button>
        </form>

        <button
          type="button"
          className="link-button"
          onClick={() => navigate('/dashboard')}
          disabled={loading}
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};

export default LinkEmailPage;
```

---

## 🛣️ Router Setup

**File: `src/App.jsx`**

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPPage from './pages/OTPPage';
import LinkEmailPage from './pages/LinkEmailPage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/otp-login" element={<OTPPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/link-email"
            element={
              <ProtectedRoute>
                <LinkEmailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

---

## 🔒 Protected Route Component

**File: `src/components/ProtectedRoute.jsx`**

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

---

## 🎨 Styling Example (CSS)

**File: `src/styles/auth.css`**

```css
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.auth-card h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
}

.auth-card p {
  color: #666;
  margin-bottom: 25px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input.error {
  border-color: #e74c3c;
}

.form-group input.valid {
  border-color: #27ae60;
}

.error-text {
  display: block;
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

.success-text {
  display: block;
  color: #27ae60;
  font-size: 12px;
  margin-top: 5px;
}

button {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 10px;
}

button:hover:not(:disabled) {
  background: #5568d3;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.link-button {
  background: transparent;
  color: #667eea;
  text-decoration: underline;
}

.link-button:hover {
  background: transparent;
}

.divider {
  text-align: center;
  color: #999;
  margin: 20px 0;
  font-size: 14px;
}

/* OTP Input Styles */
.otp-inputs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.otp-input {
  width: 50px;
  height: 50px;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  border: 2px solid #ddd;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.otp-input:focus {
  outline: none;
  border-color: #667eea;
}

.otp-input.error {
  border-color: #e74c3c;
}

/* Success/Error Messages */
.success-message,
.error-message {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 14px;
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
```

---

## 📱 .env Configuration

**File: `.env` (Frontend)**

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_JWT_EXPIRY=7d
```

---

## ✅ Integration Checklist

- [ ] Set up API client with axios and token interceptors
- [ ] Create authentication service with all OTP functions
- [ ] Create validation utilities for phone, OTP, email, password
- [ ] Create useAuth and useOTP custom hooks
- [ ] Set up AuthContext for state management
- [ ] Create PhoneInput component with validation
- [ ] Create OTPInput component with paste support
- [ ] Create OTPPage for login/register flow
- [ ] Create LinkEmailPage for email linking
- [ ] Set up protected routes
- [ ] Add styling for authentication pages
- [ ] Update router with new routes
- [ ] Test all OTP flows end-to-end
- [ ] Test error handling and edge cases
- [ ] Test rate limiting behavior

---

**Happy Coding! 🚀**

Your frontend is now ready to integrate with the backend OTP authentication system!
