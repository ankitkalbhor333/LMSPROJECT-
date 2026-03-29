import crypto from "crypto";

/**
 * Generate or validate device ID from client-sent data
 * Device ID format: {userAgent}_{timestamp}_{random}
 */
export const generateDeviceId = (userAgent = "", timestamp = Date.now()) => {
  if (!userAgent) {
    return null;
  }

  const hash = crypto
    .createHash("sha256")
    .update(`${userAgent}-${timestamp}`)
    .digest("hex")
    .substring(0, 16);

  return hash;
};

/**
 * Check if device ID matches (validates client's device ID)
 * Returns true if device IDs are the same (same browser/device)
 */
export const isDeviceIdMatch = (storedDeviceId, clientDeviceId) => {
  if (!storedDeviceId || !clientDeviceId) {
    return false;
  }
  return storedDeviceId === clientDeviceId;
};

/**
 * Create a device identifier from request
 * This is used to generate a unique device ID for the client
 */
export const createDeviceIdentifier = (req) => {
  const userAgent = req.headers["user-agent"] || "unknown";
  const timestamp = Date.now();
  return { userAgent, timestamp };
};
