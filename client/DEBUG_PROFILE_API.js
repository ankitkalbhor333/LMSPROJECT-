/**
 * Debug script to test UserProfile API endpoint
 * Run this in browser console to see what data is being returned
 */

async function testUserProfileAPI() {
  try {
    const token = localStorage.getItem("token");
    console.log("🔍 Testing /auth/me endpoint...");
    console.log("📌 Using token:", token?.substring(0, 20) + "...");

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://lmsproject-8suc.onrender.com'}/api/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📊 Response status:", response.status);
    const data = await response.json();
    console.log("📦 Response data:", data);
    
    return data;
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the test
console.log("🚀 Running UserProfile API test...");
testUserProfileAPI();
