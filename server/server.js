import "dotenv/config";
import axios from "axios";
import jwt from "jsonwebtoken";
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

app.post("/api/verify-msg91", async (req, res) => {
  const { token } = req.body || {};

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Missing MSG91 token"
    });
  }

  try {
    const response = await axios.post(
      process.env.MSG91_VERIFY_URL || "https://control.msg91.com/api/v5/widget/verifyAccessToken",
      {
        authkey: process.env.MSG91_AUTH_KEY || "557297Ty0N3SHEj6a71ebccP1",
        "access-token": token,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const msg91Data = response.data || {};
    const phoneCandidate =
      msg91Data.mobile ||
      msg91Data.phone ||
      msg91Data.phoneNumber ||
      msg91Data.user?.phone ||
      msg91Data.user?.mobile ||
      msg91Data.data?.phone ||
      msg91Data.data?.mobile ||
      msg91Data.phone_number;

    if (!phoneCandidate) {
      return res.status(400).json({
        success: false,
        message: "MSG91 verification succeeded but no phone number was returned",
      });
    }

    const normalizedPhone = String(phoneCandidate).replace(/\D/g, "");

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number from MSG91",
      });
    }

    let user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      user = await User.create({
        phone: normalizedPhone,
        name: `User ${normalizedPhone.slice(-4)}`,
        role: "student",
        email: `${normalizedPhone}@msg91.local`,
        password: "msg91-auto-generated",
      });
    }

    const jwtToken = jwt.sign(
      {
        id: user._id,
        role: user.role || "student",
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    console.log("✅ MSG91 verification success:", { phone: normalizedPhone, userId: user._id });

    return res.json({
      success: true,
      message: "OTP verified successfully",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role || "student",
        avatar: user.avatar || "",
      },
    });
  } catch (error) {
    console.error(
      "❌ MSG91 verification error:",
      error.response?.data || error.message
    );

    return res.status(400).json({
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || "OTP verification failed",
    });
  }
});

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

