import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://lmsproject-8suc.onrender.com";
const API_BASE_URL = `${API_URL}/api`;

console.log("🔧 API Configuration:");
console.log("  - VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("  - API_URL (fallback):", API_URL);
console.log("  - API Base URL:", API_BASE_URL);

const API = axios.create({
  baseURL: API_BASE_URL,
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