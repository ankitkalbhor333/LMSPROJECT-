import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Authentication & Profile
  name: {
    type: String,
    required: true,
    default: "New User",
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,  // Allows multiple null values
    trim: true,
    lowercase: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },

  // Email Verification (NEW)
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationTokenExpiry: {
    type: Date,
    default: null
  },

  // Email Login Attempts Protection
  emailLoginAttempts: {
    type: Number,
    default: 0
  },
  emailLockUntil: {
    type: Date,
    default: null
  },
  
  // Password Reset (for email auth)
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetTokenExpiry: {
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

  avatar: {
    type: String,
    default: ""
  },
  
  // Student Profile (only for students)
  studentProfile: {
    class: String,
    goals: String,
    learningStyle: String,
    state: String,
    district: String,
    preferredLanguage: {
      type: String,
      default: "English"
    }
  },
  
  // Teacher Profile (only for teachers)
  teacherProfile: {
    qualification: String,
    experience: {
      type: Number,
      default: 0
    },
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

  // Initial Enquiry Form (NEW) - Required for first-time users after registration
  enquirySubmitted: {
    type: Boolean,
    default: false
  },
  
  initialEnquiryInfo: {
    name: String,
    phoneNumber: String,
    course: String,
    city: String,
    message: String,
    submittedAt: Date
  },
  
}, { timestamps: true });

// Indexes for authentication
// Email field has 'unique: true' which creates unique index automatically
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ resetToken: 1 });
userSchema.index({ passwordResetToken: 1 });

export default mongoose.model("User", userSchema);
