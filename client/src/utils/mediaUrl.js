/**
 * Utility functions for constructing media URLs using the backend base URL
 */

const BACKEND_URL = import.meta.env.VITE_API_URL || "https://lmsproject-8suc.onrender.com";

/**
 * Resolves a media path to a full URL
 * @param {string} path - The relative path or full URL from the backend
 * @returns {string} - The complete media URL
 */
export const resolveMediaUrl = (path) => {
  if (!path) {
    return "";
  }

  const normalizedPath = String(path).replace(/\\/g, "/").replace(/^\/+/, "");

  // If it's already a full URL, return as-is
  if (normalizedPath.startsWith("http://") || normalizedPath.startsWith("https://")) {
    return normalizedPath;
  }

  // Construct full URL from relative path
  return `${BACKEND_URL}/${normalizedPath}`;
};

/**
 * Resolves a thumbnail/image path to a full URL
 * @param {string} thumbnail - The thumbnail path from the course object
 * @returns {string} - The complete thumbnail URL
 */
export const resolveThumbnailUrl = (thumbnail) => {
  return resolveMediaUrl(thumbnail);
};

/**
 * Resolves an avatar/user image path to a full URL
 * @param {string} avatar - The avatar path from the user object
 * @returns {string} - The complete avatar URL
 */
export const resolveAvatarUrl = (avatar) => {
  return resolveMediaUrl(avatar);
};

/**
 * Resolves a video URL
 * @param {string} videoUrl - The video URL path
 * @returns {string} - The complete video URL
 */
export const resolveVideoUrl = (videoUrl) => {
  return resolveMediaUrl(videoUrl);
};

export default {
  resolveMediaUrl,
  resolveThumbnailUrl,
  resolveAvatarUrl,
  resolveVideoUrl,
};
