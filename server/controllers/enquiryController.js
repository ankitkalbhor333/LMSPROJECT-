import Enquiry from "../models/Enquiry.js";
import {
  normalizePhone,
  validateEnquiry,
  isSpamEnquiry,
} from "../utils/formValidation.js";

/**
 * ========================================
 * POST /api/enquiry
 * Submit a new enquiry from homepage
 * ========================================
 */
export const submitEnquiry = async (req, res) => {
  try {
    const { fullName, phoneNumber, course, city } = req.body;

    // Validate input
    const { isValid, errors } = validateEnquiry(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phoneNumber);

    // Check for spam - same number within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentEnquiries = await Enquiry.countDocuments({
      phoneNumber: normalizedPhone,
      createdAt: { $gte: fiveMinutesAgo },
    });

    if (isSpamEnquiry(recentEnquiries)) {
      return res.status(429).json({
        success: false,
        message: "Too many enquiries from this number. Please try again later.",
      });
    }

    // Create new enquiry
    const newEnquiry = new Enquiry({
      fullName: fullName.trim(),
      phoneNumber: normalizedPhone,
      course: course || "Other",
      city: city ? city.trim() : null,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Save to database
    await newEnquiry.save();

    // TODO: Send SMS/WhatsApp notification to admin
    // sendAdminNotificationSMS(newEnquiry);

    // Return success response
    res.status(201).json({
      success: true,
      message: "Our team will contact you shortly!",
      enquiryId: newEnquiry._id,
    });
  } catch (error) {
    console.error("Error submitting enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit enquiry. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * GET /api/enquiry
 * Get all enquiries (Admin only)
 * ========================================
 */
export const getAllEnquiries = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, sort = "-createdAt" } = req.query;

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Enquiry.countDocuments(filter);

    // Get paginated results
    const enquiries = await Enquiry.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: enquiries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * GET /api/enquiry/:id
 * Get single enquiry by ID
 * ========================================
 */
export const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    console.error("Error fetching enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiry",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * PATCH /api/enquiry/:id
 * Update enquiry status and notes (Admin only)
 * ========================================
 */
export const updateEnquiry = async (req, res) => {
  try {
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ["new", "contacted", "converted", "not-interested"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Update enquiry
    const updateData = {};
    if (status) updateData.status = status;
    if (status === "contacted") updateData.lastContactedAt = new Date();
    if (notes) updateData.notes = notes;

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.json({
      success: true,
      message: "Enquiry updated successfully",
      data: enquiry,
    });
  } catch (error) {
    console.error("Error updating enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update enquiry",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * DELETE /api/enquiry/:id
 * Delete enquiry (Admin only)
 * ========================================
 */
export const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete enquiry",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * GET /api/enquiry/stats
 * Get enquiry statistics (Admin only)
 * ========================================
 */
export const getEnquiryStats = async (req, res) => {
  try {
    const stats = await Enquiry.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {};
    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
    });

    // Get course-wise statistics
    const courseStats = await Enquiry.aggregate([
      {
        $group: {
          _id: "$course",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: formattedStats,
        courseBreakdown: courseStats,
        totalEnquiries: Object.values(formattedStats).reduce((a, b) => a + b, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching enquiry stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
