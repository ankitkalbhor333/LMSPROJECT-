import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Authentication & Profile
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  
  // Email Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpiry: {
    type: Date,
    default: null
  },
  
  // Password Reset
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  },
  
  // User Role & Metadata
  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student",
    required: true
  },
  
  // Student Profile (only for students)
  studentProfile: {
    class: String,
    goals: String,
    learningStyle: String,
    preferredLanguage: {
      type: String,
      default: "English"
    }
  },
  
  // Teacher Profile (only for teachers)
  teacherProfile: {
    qualification: String,
    experience: Number,
    bio: String,
    avatar: String,
    coursesCreated: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  
  // Account Status
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active"
  },
  
  lastLogin: Date,
  
}, { timestamps: true });

// Indexes for authentication
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);
