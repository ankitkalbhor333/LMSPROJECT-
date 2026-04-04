/**
 * Client-side Device ID Management
 * Generates a unique device identifier and manages it in localStorage
 */

const DEVICE_ID_KEY = "device_id";
const DEVICE_CREATED_KEY = "device_id_created_at";

/**
 * Generate a simple device ID based on navigator properties
 * Falls back to random string if crypto not available
 */
export const generateClientDeviceId = () => {
  try {
    // Create a fingerprint from browser/device properties
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width + "x" + screen.height,
      navigator.hardwareConcurrency || "unknown"
    ].join("|");

    // Create a simple hash from the fingerprint
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Generate timestamp-based ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const deviceId = `${timestamp}-${random}-${Math.abs(hash).toString(36)}`;

    return deviceId;
  } catch (error) {
    console.error("Failed to generate device ID:", error);
    // Fallback: random string
    return `dev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
};

/**
 * Get or create device ID from localStorage
 * Returns existing device ID or generates a new one
 */
export const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = generateClientDeviceId();
    const createdAt = new Date().toISOString();

    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    localStorage.setItem(DEVICE_CREATED_KEY, createdAt);

    console.log("New device ID created:", deviceId);
  }

  return deviceId;
};

/**
 * Clear device ID (use when user logs out)
 */
export const clearDeviceId = () => {
  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(DEVICE_CREATED_KEY);
};

/**
 * Get device creation timestamp
 */
export const getDeviceCreatedAt = () => {
  return localStorage.getItem(DEVICE_CREATED_KEY);
};

/**
 * Reset device ID (forces new device on next login)
 * Useful if user wants to clear session from this device
 */
export const resetDeviceId = () => {
  clearDeviceId();
  return getOrCreateDeviceId();
};
