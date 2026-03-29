import express from "express";
import {
  submitEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats,
} from "../controllers/enquiryController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

/**
 * Rate limiter for enquiry submission (10 per hour per IP)
 */
const enquiryRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyPrefix: "enquiry:submit",
  message: "Too many enquiries submitted. Please try again later.",
});

/**
 * PUBLIC ROUTES
 */

// Submit enquiry - POST /api/enquiry
router.post("/", enquiryRateLimiter, submitEnquiry);

/**
 * ADMIN ROUTES (Protected)
 */

// Get all enquiries - GET /api/enquiry
router.get("/", protect, adminOnly, getAllEnquiries);

// Get enquiry statistics - GET /api/enquiry/stats
router.get("/stats", protect, adminOnly, getEnquiryStats);

// Get single enquiry - GET /api/enquiry/:id
router.get("/:id", protect, adminOnly, getEnquiryById);

// Update enquiry status and notes - PATCH /api/enquiry/:id
router.patch("/:id", protect, adminOnly, updateEnquiry);

// Delete enquiry - DELETE /api/enquiry/:id
router.delete("/:id", protect, adminOnly, deleteEnquiry);

export default router;
