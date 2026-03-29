import mongoose from "mongoose";

/**
 * COURSE SCHEMA (Refactored)
 * 
 * Changes from old schema:
 * - REMOVED: studentsEnrolled array (antipattern)
 * - ADDED: enrollmentCount (denormalized)
 * - ADDED: metadata for payment, refunds, certificates
 * - IMPROVED: indexing strategy
 * 
 * Use Enrollment collection to manage student-course relationships
 */

const courseSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    default: 0
  },
  discountPrice: {
    type: Number,
    default: null
  },
  currency: {
    type: String,
    default: "INR"
  },
  
  // Duration & Content
  duration: String,
  totalLectures: {
    type: Number,
    default: 0
  },
  
  // Creator (Teacher)
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Course Structure
  category: {
    type: String,
    index: true
  },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner"
  },
  
  subjects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject"
    }
  ],
  
  units: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit"
    }
  ],
  
  // Media
  thumbnail: String,
  banner: String,
  
  // DENORMALIZED: Course Metadata (for performance without joins)
  // Updated via triggers when Enrollment records are modified
  enrollmentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  reviews: {
    type: Number,
    default: 0
  },
  
  // Course Status
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft",
    index: true
  },
  
  // SEO & Visibility
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  
  visibility: {
    type: String,
    enum: ["public", "private", "restricted"],
    default: "public"
  },
  
  // Additional Metadata
  language: {
    type: String,
    default: "English"
  },
  
  certificateAvailable: {
    type: Boolean,
    default: true
  },
  
  // Refund Policy
  refundDays: {
    type: Number,
    default: 30 // Days within which refund is allowed
  },
  
}, { timestamps: true });

// ========================
// INDEXES
// ========================

courseSchema.index({ teacher: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ rating: -1 });

// Text search index for title and description
courseSchema.index({ title: "text", description: "text" });

// Composite indexes for common queries
courseSchema.index({ teacher: 1, status: 1 });
courseSchema.index({ category: 1, isPublished: 1 });

export default mongoose.model("Course", courseSchema);
