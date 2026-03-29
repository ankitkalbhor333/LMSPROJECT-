import mongoose from "mongoose";

/**
 * Contact Schema for contact form submissions
 * Stores contact form data for admin review and customer communication
 */
const contactSchema = new mongoose.Schema(
  {
    // Full name of the person contacting
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [50, "Full name cannot exceed 50 characters"],
      match: [/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"],
    },

    // Email address
    email: {
      type: String,
      required: [true, "Email address is required"],
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
      index: true,
    },

    // Phone number (optional but recommended)
    phoneNumber: {
      type: String,
      sparse: true, // Allow null but ensure uniqueness only for non-null values
      match: [/^(?:\+91|0)?[8-9]\d{9}$/, "Invalid Indian phone number format"],
    },

    // Subject of the message
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [5, "Subject must be at least 5 characters"],
      maxlength: [100, "Subject cannot exceed 100 characters"],
    },

    // Message content
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },

    // Contact status for admin
    status: {
      type: String,
      enum: {
        values: ["new", "read", "responded", "archived"],
        message: "Invalid status",
      },
      default: "new",
      index: true,
    },

    // Admin response (if any)
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [2000, "Response cannot exceed 2000 characters"],
    },

    // Response date
    respondedAt: {
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
    timestamps: false,
  }
);

// Update updatedAt before save
contactSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// Compound index for admin dashboard queries
contactSchema.index({
  status: 1,
  createdAt: -1,
});

// Index for finding messages from specific email
contactSchema.index({
  email: 1,
  createdAt: -1,
});

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
