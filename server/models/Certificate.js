import mongoose from "mongoose";

/**
 * CERTIFICATE SCHEMA
 * 
 * Manages course completion certificates
 * - Certificate generation and tracking
 * - Digital signatures and validation
 * - Public shareable URLs
 * - Revocation support
 */

const certificateSchema = new mongoose.Schema({
  // References
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Enrollment",
    required: true,
    unique: true,
    index: true
  },
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
  
  // Certificate Details
  certificateNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  studentName: String,
  courseName: String,
  teacherName: String,
  
  // Completion Details
  completionDate: {
    type: Date,
    required: true
  },
  
  issueDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  expiryDate: {
    type: Date,
    default: null // null = no expiry
  },
  
  // Performance
  finalScore: Number,
  grade: {
    type: String,
    enum: ["A", "A+", "B", "B+", "C", "C+", "D", "E", "F", null],
    default: null
  },
  
  // Certificate URL & Accessibility
  certificateUrl: String,  // Stored certificate file path
  publicUrl: String,       // Shareable public URL (with slug)
  
  // Digital Signature & Validation
  isValid: {
    type: Boolean,
    default: true,
    index: true
  },
  
  revocationReason: String,
  revokedDate: Date,
  
  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  
  lastDownloadDate: Date,
  
}, { timestamps: true });

// ========================
// INDEXES
// ========================

certificateSchema.index({ userId: 1 });
certificateSchema.index({ courseId: 1 });
certificateSchema.index({ certificateNumber: 1 }, { unique: true });
certificateSchema.index({ isValid: 1 });
certificateSchema.index({ issueDate: -1 });
certificateSchema.index({ enrollmentId: 1 }, { unique: true });

export default mongoose.model("Certificate", certificateSchema);
