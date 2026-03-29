import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // ========================
    // REFERENCES
    // ========================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment"
      // ❌ no unique here (handled below)
    },

    // ========================
    // PAYMENT DETAILS
    // ========================
    amount: {
      type: Number,
      required: true
    },

    discountAmount: {
      type: Number,
      default: 0
    },

    finalAmount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    // ========================
    // GATEWAY INFO
    // ========================
    gatewayName: {
      type: String,
      enum: ["razorpay", "stripe", "paypal"],
      required: true
    },

    paymentId: {
      type: String // gateway transaction id
    },

    orderId: String,
    signature: String,

    // ========================
    // STATUS
    // ========================
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending"
    },

    paymentDate: Date,

    // ========================
    // REFUND
    // ========================
    refundStatus: {
      type: String,
      enum: ["none", "processed", "failed"],
      default: "none"
    },

    refundAmount: {
      type: Number,
      default: 0
    },

    refundReason: String,
    refundDate: Date,
    refundGatewayId: String,

    // ========================
    // META
    // ========================
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "wallet", "bank_transfer", null],
      default: null
    },

    notes: String,
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

// ========================
// INDEXES (ONLY HERE)
// ========================

// Unique payment (gateway safe)
paymentSchema.index(
  { paymentId: 1 },
  { unique: true, sparse: true }
);

// One payment per enrollment
paymentSchema.index(
  { enrollmentId: 1 },
  { unique: true, sparse: true }
);

// Query optimization
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ courseId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ refundStatus: 1 });

// Time-based queries
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ paymentDate: -1 });

export default mongoose.model("Payment", paymentSchema);