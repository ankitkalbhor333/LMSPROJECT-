import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true
    },

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

    completedLectures: [
      {
        lectureId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        completedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    lastWatchedLecture: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
);

// ========================
// INDEXES (CENTRALIZED)
// ========================

// One progress per enrollment (CRITICAL)
courseProgressSchema.index(
  { enrollmentId: 1 },
  { unique: true }
);

// Fast user-course lookup (used in player)
courseProgressSchema.index({ userId: 1, courseId: 1 });

// Optional: faster recent activity queries
courseProgressSchema.index({ updatedAt: -1 });

export default mongoose.model("CourseProgress", courseProgressSchema);