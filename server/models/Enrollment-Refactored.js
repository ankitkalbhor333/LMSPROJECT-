import mongoose from "mongoose";

/**
 * ENROLLMENT SCHEMA - Central to the system
 * 
 * This schema replaces the anti-pattern of:
 * - Storing purchasedCourses array in User
 * - Storing studentsEnrolled array in Course
 * 
 * Benefits:
 * - No data duplication
 * - Unique compound index prevents duplicate enrollments
 * - Links to Payment, Progress, and Certificate tracking
 * - Supports future features like access expiry, refunds, etc.
 */

const enrollmentSchema = new mongoose.Schema({
  // Core References (normalized with ObjectId)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true
  },
  
  // Enrollment Metadata
  enrollmentDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  status: {
    type: String,
    enum: ["active", "completed", "dropped", "refunded"],
    default: "active",
    index: true
  },
  
  // Access Control
  accessEndDate: {
    type: Date,
    default: null
    // When null = lifetime access (most common)
    // When set = time-limited access (e.g., bootcamps)
  },
  
  // Payment Reference (link to Payment collection)
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    default: null,
    index: true
  },
  
  // Progress Reference (link to CourseProgress collection)
  progressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourseProgress",
    default: null,
    index: true
  },
  
  // Certificate Reference
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Certificate",
    default: null
  },
  
  // Denormalized data for UI (for performance - avoids extra joins)
  courseThumbnail: String,
  courseTitle: String,
  
  // Progress Summary (denormalized for quick display)
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  lastAccessedDate: Date,
  
}, { timestamps: true });

// ========================
// CRITICAL INDEXES
// ========================

/**
 * UNIQUE COMPOUND INDEX
 * Prevents a student from enrolling multiple times in the same course
 * This is crucial for data integrity
 */
enrollmentSchema.index(
  { userId: 1, courseId: 1 },
  { 
    unique: true,
    sparse: false // Ensure both fields must exist
  }
);

// Other important indexes
enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ createdAt: -1 });
enrollmentSchema.index({ paymentId: 1 });
enrollmentSchema.index({ progressId: 1 });
enrollmentSchema.index({ lastAccessedDate: -1 });

export default mongoose.model("Enrollment", enrollmentSchema);
