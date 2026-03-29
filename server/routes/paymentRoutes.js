import express from "express";
import {
  createOrder,
  verifyPayment,
  getPaymentStatus,
  refundPayment,
} from "../controllers/paymentController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create order (public)
router.post("/create-order", createOrder);

// Verify payment and enroll (protected)
router.post("/verify", protect, verifyPayment);

// Get payment status (protected)
router.get("/status/:paymentId", protect, getPaymentStatus);

// Refund payment (admin only)
router.post("/refund/:paymentId", protect, adminOnly, refundPayment);

export default router;
