import mongoose from "mongoose";
import Course from "./Course.js";
import User from "./User.js";

const recordingSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["not_started", "recording", "processed", "failed", "disabled"],
      default: "not_started",
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const liveClassSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 480,
    },
    roomName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended", "cancelled"],
      default: "scheduled",
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    recording: {
      type: recordingSchema,
      default: () => ({
        enabled: false,
        status: "not_started",
        url: "",
        duration: 0,
      }),
    },
  },
  {
    timestamps: true,
  }
);

liveClassSchema.pre("validate", async function () {
  if (!this.courseId) {
    throw new Error("Course is required");
  }

  if (!this.teacherId) {
    throw new Error("Teacher is required");
  }

  if (!this.scheduledAt || Number.isNaN(new Date(this.scheduledAt).getTime())) {
    throw new Error("Scheduled time is invalid");
  }

  if (!this.duration || this.duration <= 0) {
    throw new Error("Duration must be greater than 0");
  }

  const [course, teacher] = await Promise.all([
    mongoose.model("Course").findById(this.courseId).lean(),
    mongoose.model("User").findById(this.teacherId).lean(),
  ]);

  if (!course) {
    throw new Error("Course does not exist");
  }

  if (!teacher) {
    throw new Error("Teacher does not exist");
  }

  if (teacher.role !== "teacher") {
    throw new Error("Only teachers can create a live class");
  }
});

liveClassSchema.index({ courseId: 1, scheduledAt: -1 });
liveClassSchema.index({ teacherId: 1, status: 1 });
liveClassSchema.index({ scheduledAt: 1, status: 1 });

export default mongoose.model("LiveClass", liveClassSchema);
