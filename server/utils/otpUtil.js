/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP as string
 */
export const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return String(otp);
};

/**
 * Validate OTP format (6 digits)
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid format
 */
export const isValidOTPFormat = (otp) => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(String(otp).trim());
};

/**
 * Validate phone number format (basic - Indian format support)
 * Supports: 10-digit mobile numbers, can have +91 prefix or country code
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid format
 */
export const isValidPhoneFormat = (phone) => {
  if (!phone) return false;
  
  let normalizedPhone = String(phone).trim();
  
  // Remove +91 or 91 prefix if present
  if (normalizedPhone.startsWith("+91")) {
    normalizedPhone = normalizedPhone.slice(3);
  } else if (normalizedPhone.startsWith("91")) {
    normalizedPhone = normalizedPhone.slice(2);
  }
  
  // Check if it's exactly 10 digits starting with 6-9 (valid Indian mobile)
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(normalizedPhone);
};

/**
 * Normalize phone number to 10-digit format
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized 10-digit phone number
 */
export const normalizePhone = (phone) => {
  if (!phone) return "";
  
  let normalized = String(phone).trim();
  
  // Remove +91 or 91 prefix
  if (normalized.startsWith("+91")) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith("91")) {
    normalized = normalized.slice(2);
  }
  
  // Remove any spaces or hyphens
  normalized = normalized.replace(/[\s-]/g, "");
  
  return normalized;
};

/**
 * Mask phone number for display (security)
 * Example: 9876543210 -> 98****3210
 * @param {string} phone - Phone number to mask
 * @returns {string} Masked phone number
 */
export const maskPhone = (phone) => {
  if (!phone) return "";
  
  const phoneStr = String(phone);
  if (phoneStr.length < 4) return phoneStr;
  
  const first = phoneStr.slice(0, 2);
  const last = phoneStr.slice(-4);
  return `${first}****${last}`;
};
