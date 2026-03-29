import mongoose from "mongoose";

/**
 * ATTENDANCE SCHEMA
 * 
 * Tracks attendance for live classes
 * - Check-in/check-out times
 * - Attendance status (present, absent, late, excused)
 * - Duration present
 * 
 * Requires LiveClass schema (not included here)
 */

const attendanceSchema = new mongoose.Schema({
  // References
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Enrollment",
    required: true,
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
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LiveClass",
    required: true,
    index: true
  },
  
  // Attendance Status
  status: {
    type: String,
    enum: ["present", "absent", "late", "excused"],
    default: "absent",
    index: true
  },
  
  // Timing
  classDate: {
    type: Date,
    required: true,
    index: true
  },
  
  checkInTime: Date,
  checkOutTime: Date,
  
  // Duration Present (in minutes)
  durationPresent: {
    type: Number,
    default: 0
  },
  
  // Notes/Reason for absence
  notes: String,
  
}, { timestamps: true });

// ========================
// INDEXES
// ========================

/**
 * Unique compound index ensures one attendance record per enrollment per class
 */
attendanceSchema.index(
  { enrollmentId: 1, classId: 1 },
  { unique: true }
);

attendanceSchema.index({ userId: 1, courseId: 1, classDate: 1 });
attendanceSchema.index({ classDate: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ courseId: 1, classDate: 1 });

export default mongoose.model("Attendance", attendanceSchema);
