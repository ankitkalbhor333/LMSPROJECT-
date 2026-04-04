import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase client configuration for phone OTP auth.
const firebaseConfig = {
  apiKey: "AIzaSyDn24JGcFSsNmwXjA3ryfXlaSDAyekf2rY",
  authDomain: "coachingauthi.firebaseapp.com",
  projectId: "coachingauthi",
  storageBucket: "coachingauthi.firebasestorage.app",
  messagingSenderId: "1080488983205",
  appId: "1:1080488983205:web:660642187008d3d650eb4c",
  measurementId: "G-2PCWJKH93M",
};

const app = initializeApp(firebaseConfig);

// Export auth instance for OTP operations.
export const auth = getAuth(app);
