import express from "express";
import {
  submitEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats,
  submitInitialEnquiry,
  getInitialEnquiryStatus,
  getInitialEnquiries,
  getInitialEnquiryStats,
  exportInitialEnquiriesToExcel,
  exportInitialEnquiriesToPDF,
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
 * AUTHENTICATED USER ROUTES (For initial enquiry after registration/login)
 */

// Check if user has completed initial enquiry - GET /api/enquiry/initial-status
router.get("/initial-status", protect, getInitialEnquiryStatus);

// Submit initial enquiry form - POST /api/enquiry/initial-submission
router.post("/initial-submission", protect, submitInitialEnquiry);

/**
 * ADMIN ROUTES (Protected)
 */

// Get all homepage enquiries - GET /api/enquiry
router.get("/", protect, adminOnly, getAllEnquiries);

// Get initial enquiries (from registration form) - GET /api/enquiry/initial-list
router.get("/initial-list", protect, adminOnly, getInitialEnquiries);

// Get initial enquiries statistics - GET /api/enquiry/initial-stats
router.get("/initial-stats", protect, adminOnly, getInitialEnquiryStats);

// Export initial enquiries to Excel - GET /api/enquiry/initial-list/export/excel
router.get("/initial-list/export/excel", protect, adminOnly, exportInitialEnquiriesToExcel);

// Export initial enquiries to PDF - GET /api/enquiry/initial-list/export/pdf
router.get("/initial-list/export/pdf", protect, adminOnly, exportInitialEnquiriesToPDF);

// Get enquiry statistics - GET /api/enquiry/stats
router.get("/stats", protect, adminOnly, getEnquiryStats);

// Get single enquiry - GET /api/enquiry/:id
router.get("/:id", protect, adminOnly, getEnquiryById);

// Update enquiry status and notes - PATCH /api/enquiry/:id
router.patch("/:id", protect, adminOnly, updateEnquiry);

// Delete enquiry - DELETE /api/enquiry/:id
router.delete("/:id", protect, adminOnly, deleteEnquiry);

export default router;
