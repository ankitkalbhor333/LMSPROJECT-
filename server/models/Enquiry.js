import mongoose from "mongoose";

/**
 * Enquiry Schema for lead generation from homepage
 * Stores enquiry information for admin follow-up
 */
const enquirySchema = new mongoose.Schema(
  {
    // Full name of the enquirer
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [50, "Full name cannot exceed 50 characters"],
      match: [/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"],
    },

    // Phone number with Indian format validation
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^(?:\+91|0)?[8-9]\d{9}$/, "Invalid Indian phone number format"],
      index: true, // Indexed for fast lookups and duplicate checks
    },

    // Course interest
    course: {
      type: String,
      enum: {
        values: ["NEET", "JEE", "Class 10", "Class 11", "Class 12", "Other"],
        message: "Invalid course selection",
      },
      default: "Other",
    },

    // City (optional)
    city: {
      type: String,
      trim: true,
      maxlength: [50, "City name cannot exceed 50 characters"],
    },

    // Lead status for admin tracking
    status: {
      type: String,
      enum: {
        values: ["new", "contacted", "converted", "not-interested"],
        message: "Invalid status",
      },
      default: "new",
      index: true,
    },

    // Notes from admin
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // Last contact attempt timestamp (for rate limiting verification)
    lastContactedAt: {
      type: Date,
      default: null,
    },

    // Metadata
    ipAddress: String,
    userAgent: String,

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We're handling timestamps manually
  }
);

// Update updatedAt before save
enquirySchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// Compound index for spam detection (same phone within 5 minutes)
enquirySchema.index({
  phoneNumber: 1,
  createdAt: -1,
});

// Compound index for admin dashboard queries
enquirySchema.index({
  status: 1,
  createdAt: -1,
});

const Enquiry = mongoose.model("Enquiry", enquirySchema);

export default Enquiry;
