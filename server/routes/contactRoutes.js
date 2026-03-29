import express from "express";
import {
  submitContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats,
} from "../controllers/contactController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

/**
 * Rate limiter for contact form submission (5 per hour per IP)
 */
const contactRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyPrefix: "contact:submit",
  message: "Too many contact submissions. Please try again later.",
});

/**
 * PUBLIC ROUTES
 */

// Submit contact form - POST /api/contact
router.post("/", contactRateLimiter, submitContact);

/**
 * ADMIN ROUTES (Protected)
 */

// Get all contact messages - GET /api/contact
router.get("/", protect, adminOnly, getAllContacts);

// Get contact statistics - GET /api/contact/stats
router.get("/stats", protect, adminOnly, getContactStats);

// Get single contact message - GET /api/contact/:id
router.get("/:id", protect, adminOnly, getContactById);

// Update contact status and response - PATCH /api/contact/:id
router.patch("/:id", protect, adminOnly, updateContact);

// Delete contact message - DELETE /api/contact/:id
router.delete("/:id", protect, adminOnly, deleteContact);

export default router;
