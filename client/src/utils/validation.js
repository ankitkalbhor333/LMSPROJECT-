export function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function passwordRequirements(password) {
  const errors = [];
  if (!password || password.length < 8 || password.length > 64) errors.push('Password must be 8-64 characters long');
  if (!/[A-Z]/.test(password)) errors.push('Include at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Include at least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Include at least one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Include at least one special character');
  return errors;
}

export function isStrongPassword(password) {
  return passwordRequirements(password).length === 0;
}
