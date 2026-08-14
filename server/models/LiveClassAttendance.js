import mongoose from "mongoose";

const liveClassAttendanceSchema = new mongoose.Schema(
  {
    liveClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveClass",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    leftAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused", "in_progress"],
      default: "in_progress",
      index: true,
    },
  },
  { timestamps: true }
);

liveClassAttendanceSchema.index(
  { liveClassId: 1, studentId: 1 },
  { unique: true }
);

liveClassAttendanceSchema.index({ liveClassId: 1, status: 1 });
liveClassAttendanceSchema.index({ studentId: 1, courseId: 1, joinedAt: -1 });

export default mongoose.model("LiveClassAttendance", liveClassAttendanceSchema);
