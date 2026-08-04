import axios from "axios";

// Determine API URL - prioritize environment variable, then use intelligent fallback
export const getApiUrl = () => {
  // Check environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (deployed on Render), detect from current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isProduction = hostname && !hostname.includes('localhost') && !hostname.includes('127.0.0.1');
    
    if (isProduction) {
      console.log(`🌍 Detected production environment: ${hostname}`);
      return "https://lmsproject1-cuzs.onrender.com";
    }
  }
  
  // Fallback for local development
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }

  return 'https://lmsproject1-cuzs.onrender.com';
};

const API_URL = getApiUrl();
const API_BASE_URL = `${API_URL}/api`;

console.log("🔧 API Configuration:");
console.log("  - VITE_API_URL:", import.meta.env.VITE_API_URL || "(not set)");
console.log("  - API_URL (resolved):", API_URL);
console.log("  - API Base URL:", API_BASE_URL);
console.log("  - Environment:", import.meta.env.MODE);

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  console.log(`📤 ${req.method?.toUpperCase()} ${req.url} (Token: ${token ? "✓" : "✗"})`);
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(`❌ Error from ${error.config?.url}:`, error.message);
    console.error("  - Status:", error.response?.status);
    console.error("  - Data:", error.response?.data);
    return Promise.reject(error);
  }
);

export default API;