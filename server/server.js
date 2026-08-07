import "dotenv/config";
import dns from "dns";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";
import emailAuthRoutes from "./routes/emailAuthRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";  
import notesRoutes from "./routes/notesRoutes.js";
import freetestRoutes from "./routes/freetestRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import lectureRoutes from "./routes/lectureRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import registerRoutes from "./routes/registerRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import { protect, adminOnly } from "./middleware/authMiddleware.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import cleanupEnrollmentIndexes from "./migrations/cleanupEnrollmentIndexes.js";
import { razorpayWebhook } from "./controllers/paymentController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer IPv4 for DNS resolution to avoid IPv6 routing issues on some hosts.
try {
  dns.setDefaultResultOrder("ipv4first");
  console.log("🔧 DNS default result order set to ipv4first");
} catch (e) {
  console.warn("⚠️ Could not set DNS result order:", e.message || e);
}

// Ensure upload directories exist
const uploadDirs = [
  "uploads",
  "uploads/avatars",
  "uploads/materials",
  "uploads/notes",
  "uploads/videos",
  "uploads/course-thumbnails",
];
uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

const app = express();

const configuredOrigins = [
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : []),
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.BACKEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]
  .map((origin) => String(origin || "").trim())
  .filter(Boolean);

const allowedOrigins = [...new Set(configuredOrigins)];

console.log("🔐 CORS Configuration:");
console.log("   Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    console.log(`🔍 CORS Check for origin: ${origin || "no-origin (same-site)"}`);
    if (!origin || allowedOrigins.includes(origin)) {
      console.log("   ✅ Origin allowed");
      return callback(null, true);
    }
    console.log("   ❌ Origin NOT allowed");
    return callback(new Error("CORS origin not allowed"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(securityHeaders);

// Razorpay webhook needs raw body for signature verification.
app.post("/api/payment/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));


app.use("/uploads", express.static("uploads")); // Serve uploaded files.
app.use("/api", registerRoutes);
app.use("/api/auth/email", emailAuthRoutes);
app.use("/api/user", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/freetests", freetestRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/enrollment", protect, enrollmentRoutes);
app.use("/api/subjects", protect, adminOnly, subjectRoutes);
app.use("/api/units", protect, adminOnly, unitRoutes);
app.use("/api/lectures", protect, adminOnly, lectureRoutes);
app.use("/api/materials", protect, adminOnly, materialRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/contact", contactRoutes);

// Routes
app.get("/", (req, res) => {
  res.send("Navodaya Coaching API Running...");
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    
    // Run cleanup migration
    try {
      await cleanupEnrollmentIndexes();
    } catch (error) {
      console.warn("⚠️  Cleanup migration error (non-blocking):", error.message);
    }
  })
  .catch((err) => console.log("❌ MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

