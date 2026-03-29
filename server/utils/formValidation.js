/**
 * Validation utilities for enquiry and contact forms
 * Handles phone number, email, and other validations
 */

// Indian phone number regex (10 digits, starting with 8-9, with optional +91 or 0 prefix)
const PHONE_REGEX = /^(?:\+91|0)?[8-9]\d{9}$/;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Name validation (letters and spaces only)
const NAME_REGEX = /^[a-zA-Z\s]+$/;

/**
 * Normalize Indian phone numbers to 10-digit format
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone number (10 digits)
 */
export const normalizePhone = (phone = "") => {
  const cleaned = String(phone).replace(/\D/g, "");
  
  // Handle "+91" prefix
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  
  // Handle "0" prefix
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.slice(1);
  }
  
  return cleaned;
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidPhone = (phone = "") => {
  const normalized = normalizePhone(phone);
  return PHONE_REGEX.test(`${normalized}`);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidEmail = (email = "") => {
  return EMAIL_REGEX.test(String(email).trim());
};

/**
 * Validate name format
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidName = (name = "") => {
  const trimmed = String(name).trim();
  return trimmed.length >= 2 && trimmed.length <= 50 && NAME_REGEX.test(trimmed);
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input = "") => {
  return String(input)
    .trim()
    .replace(/[<>\"']/g, "") // Remove potential HTML/script tags
    .substring(0, 2000); // Limit length
};

/**
 * Validate enquiry form data
 * @param {Object} data - Form data to validate
 * @returns {Object} { isValid, errors }
 */
export const validateEnquiry = (data) => {
  const errors = {};

  // Validate full name
  if (!data.fullName || !isValidName(data.fullName)) {
    errors.fullName = "Full name is required and must be valid (2-50 characters, letters only)";
  }

  // Validate phone number
  if (!data.phoneNumber || !isValidPhone(data.phoneNumber)) {
    errors.phoneNumber = "Valid Indian phone number is required";
  }

  // Validate course
  const validCourses = ["NEET", "JEE", "Class 10", "Class 11", "Class 12", "Other"];
  if (data.course && !validCourses.includes(data.course)) {
    errors.course = "Invalid course selection";
  }

  // Validate city (optional)
  if (data.city && (String(data.city).length > 50 || String(data.city).trim().length === 0)) {
    errors.city = "City name is invalid";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate contact form data
 * @param {Object} data - Form data to validate
 * @returns {Object} { isValid, errors }
 */
export const validateContact = (data) => {
  const errors = {};

  // Validate full name
  if (!data.fullName || !isValidName(data.fullName)) {
    errors.fullName = "Full name is required and must be valid (2-50 characters, letters only)";
  }

  // Validate email
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = "Valid email address is required";
  }

  // Validate phone number (optional)
  if (data.phoneNumber && !isValidPhone(data.phoneNumber)) {
    errors.phoneNumber = "Invalid Indian phone number format";
  }

  // Validate subject
  if (!data.subject || String(data.subject).trim().length < 5 || String(data.subject).trim().length > 100) {
    errors.subject = "Subject must be between 5 and 100 characters";
  }

  // Validate message
  if (!data.message || String(data.message).trim().length < 10 || String(data.message).trim().length > 2000) {
    errors.message = "Message must be between 10 and 2000 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Check if enquiry is spam based on phone number (same number within 5 minutes)
 * @param {number} recentCount - Count of recent enquiries from same phone
 * @returns {boolean} True if likely spam, false otherwise
 */
export const isSpamEnquiry = (recentCount) => {
  // Allow up to 2 enquiries within 5 minutes as legitimate retries
  return recentCount > 2;
};

export default {
  normalizePhone,
  isValidPhone,
  isValidEmail,
  isValidName,
  sanitizeInput,
  validateEnquiry,
  validateContact,
  isSpamEnquiry,
};
