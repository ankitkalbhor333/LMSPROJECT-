import mongoose from "mongoose";

/**
 * ENROLLMENT SCHEMA - Central to the system
 */

const enrollmentSchema = new mongoose.Schema(
  {
    // Core References
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

    // Enrollment Metadata
    enrollmentDate: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: ["active", "completed", "dropped", "refunded"],
      default: "active"
    },

    // Access Control
    accessEndDate: {
      type: Date,
      default: null
    },

    // References
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null
    },

    progressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseProgress",
      default: null
    },

    certificateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate",
      default: null
    },

    // Denormalized UI Data
    courseThumbnail: String,
    courseTitle: String,

    // Progress Summary
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    lastAccessedDate: Date
  },
  { timestamps: true }
);

// ========================
// INDEXES (CENTRALIZED)
// ========================

// Prevent duplicate enrollment (using userId, not studentId)
enrollmentSchema.index(
  { userId: 1, courseId: 1 },
  { unique: true }
);

// Optimized query indexes
enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });

// Pagination & sorting
enrollmentSchema.index({ createdAt: -1 });
enrollmentSchema.index({ userId: 1, createdAt: -1 });

// Reference lookups
enrollmentSchema.index({ paymentId: 1 });
enrollmentSchema.index({ progressId: 1 });

// Activity tracking
enrollmentSchema.index({ lastAccessedDate: -1 });

// Clean up any old indexes on startup
enrollmentSchema.on('open', async function() {
  try {
    const collection = this.collection;
    const existingIndexes = await collection.getIndexes();
    
    // Drop old studentId index if it exists
    for (const [indexName, indexSpec] of Object.entries(existingIndexes)) {
      if (indexName.includes('studentId')) {
        console.log("🗑️ Dropping old index:", indexName);
        await collection.dropIndex(indexName);
      }
    }
  } catch (err) {
    console.warn("⚠️ Could not clean old index:", err.message);
  }
});

export default mongoose.model("Enrollment", enrollmentSchema);