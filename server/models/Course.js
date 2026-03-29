import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: String,
      trim: true,
      default: "",
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const unitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    lectures: {
      type: [lectureSchema],
      default: [],
    },
  },
  { _id: true }
);

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

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
  subtitle: {
    type: String,
    trim: true,
    default: "",
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

  learningPoints: {
    type: [String],
    default: [],
  },

  units: {
    type: [unitSchema],
    default: [],
  },

  testimonials: {
    type: [testimonialSchema],
    default: [],
  },

  features: {
    type: [String],
    default: [],
  },
  
  // Media
  thumbnail: String,
  banner: String,
  previewVideo: {
    type: String,
    trim: true,
    default: "",
  },
  
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
// Note: teacher, category, status, isPublished have 'index: true' in field definitions
// So we only add additional/composite indexes here

courseSchema.index({ createdAt: -1 });
courseSchema.index({ rating: -1 });

// Text search index for title and description
courseSchema.index({ title: "text", description: "text" });

// Composite indexes for common queries
courseSchema.index({ teacher: 1, status: 1 });
courseSchema.index({ category: 1, isPublished: 1 });

export default mongoose.model("Course", courseSchema);
