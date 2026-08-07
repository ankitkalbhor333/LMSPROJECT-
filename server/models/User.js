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
    sparse: true,
    trim: true,
    lowercase: true,
    required: false
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    required: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneOTP: {
    type: String,
    default: null
  },
  phoneOTPExpiry: {
    type: Date,
    default: null
  },
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
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetTokenExpiry: {
    type: Date,
    default: null
  },
  emailLoginAttempts: {
    type: Number,
    default: 0
  },
  emailLockUntil: {
    type: Date,
    default: null
  },
  password: {
    type: String,
    required: false
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

userSchema.pre('validate', function() {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'Either email or phone is required.');
    this.invalidate('phone', 'Either email or phone is required.');
  }
});

// Indexes for authentication
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ phoneOTPExpiry: 1 });
userSchema.index({ phoneOTP: 1 });

export default mongoose.model("User", userSchema);
