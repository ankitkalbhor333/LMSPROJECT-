import Enquiry from "../models/Enquiry.js";
import User from "../models/User.js";
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

/**
 * ========================================
 * POST /api/enquiry/initial-submission
 * Submit initial enquiry form for newly registered users (Authenticated)
 * Required only on first login after registration
 * ========================================
 */
export const submitInitialEnquiry = async (req, res) => {
  try {
    const { name, phoneNumber, course, city, message } = req.body;
    const userId = req.user?.id;

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate all required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Normalize and validate phone
    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    if (!/(^(\+91|0)?[6-9]\d{9}$)|(^[6-9]\d{9}$)/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    if (city.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "City must be at least 2 characters",
      });
    }

    if (!course || !course.trim()) {
      return res.status(400).json({
        success: false,
        message: "Course selection is required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 10 characters",
      });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 500 characters",
      });
    }

    // Check if user has already submitted initial enquiry
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.enquirySubmitted) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted your initial enquiry form",
      });
    }

    // Update user with initial enquiry info
    const submissionDate = new Date();
    user.enquirySubmitted = true;
    user.initialEnquiryInfo = {
      name: name.trim(),
      phoneNumber: normalizedPhone,
      course: course.trim(),
      city: city.trim(),
      message: message.trim(),
      submittedAt: submissionDate,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Thank you! Your enquiry has been recorded",
      data: {
        enquirySubmitted: true,
        submittedAt: submissionDate,
      },
    });
  } catch (error) {
    console.error("Error submitting initial enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit enquiry. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * GET /api/enquiry/initial-status
 * Check if authenticated user has completed initial enquiry
 * ========================================
 */
export const getInitialEnquiryStatus = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        enquirySubmitted: user.enquirySubmitted || false,
      },
    });
  } catch (error) {
    console.error("Error fetching initial enquiry status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiry status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * GET /api/enquiry/initial-list
 * Get all initial enquiries from newly registered users (Admin only)
 * ========================================
 */
export const getInitialEnquiries = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sort = "-createdAt" } = req.query;

    // Build filter for users who have submitted initial enquiry
    const filter = { enquirySubmitted: true };

    if (search) {
      filter.$or = [
        { "initialEnquiryInfo.name": { $regex: search, $options: "i" } },
        { "initialEnquiryInfo.phoneNumber": { $regex: search, $options: "i" } },
        { "initialEnquiryInfo.city": { $regex: search, $options: "i" } },
        { "initialEnquiryInfo.course": { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await User.countDocuments(filter);

    // Get paginated results with only necessary fields
    const enquiries = await User.find(filter)
      .select("_id email name initialEnquiryInfo createdAt updatedAt")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Format response
    const formattedEnquiries = enquiries.map((user) => ({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      ...user.initialEnquiryInfo,
      submittedAt: user.initialEnquiryInfo?.submittedAt || user.createdAt,
    }));

    res.json({
      success: true,
      data: formattedEnquiries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching initial enquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch initial enquiries",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * GET /api/enquiry/initial-stats
 * Get statistics for initial enquiries (Admin only)
 * ========================================
 */
export const getInitialEnquiryStats = async (req, res) => {
  try {
    // Count users with initial enquiry
    const totalSubmitted = await User.countDocuments({ enquirySubmitted: true });

    // Get course breakdown
    const courseStats = await User.aggregate([
      { $match: { enquirySubmitted: true } },
      {
        $group: {
          _id: "$initialEnquiryInfo.course",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get city breakdown (top 10)
    const cityStats = await User.aggregate([
      { $match: { enquirySubmitted: true } },
      {
        $group: {
          _id: "$initialEnquiryInfo.city",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalSubmitted,
        courseBreakdown: courseStats,
        cityBreakdown: cityStats,
      },
    });
  } catch (error) {
    console.error("Error fetching initial enquiry stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * GET /api/enquiry/initial-list/export/excel
 * Export initial enquiries as Excel (Admin only)
 * ========================================
 */
export const exportInitialEnquiriesToExcel = async (req, res) => {
  try {
    const { search } = req.query;

    // Build filter
    const filter = { enquirySubmitted: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "initialEnquiryInfo.phoneNumber": { $regex: search, $options: "i" } },
        { "initialEnquiryInfo.city": { $regex: search, $options: "i" } },
        { "initialEnquiryInfo.course": { $regex: search, $options: "i" } },
      ];
    }

    // Fetch all matching enquiries
    const enquiries = await User.find(filter).lean();

    // Map to Excel format
    const data = enquiries.map((user) => ({
      Name: user.initialEnquiryInfo?.name || "",
      Email: user.email || "",
      Phone: user.initialEnquiryInfo?.phoneNumber || "",
      City: user.initialEnquiryInfo?.city || "",
      Course: user.initialEnquiryInfo?.course || "",
      Message: user.initialEnquiryInfo?.message || "",
      SubmittedAt: user.initialEnquiryInfo?.submittedAt
        ? new Date(user.initialEnquiryInfo.submittedAt).toLocaleString("en-IN")
        : "",
    }));

    // Create Excel file using dynamic import
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Initial Enquiries");

    // Add headers
    worksheet.columns = [
      { header: "Name", key: "Name", width: 20 },
      { header: "Email", key: "Email", width: 25 },
      { header: "Phone", key: "Phone", width: 15 },
      { header: "City", key: "City", width: 15 },
      { header: "Course", key: "Course", width: 20 },
      { header: "Message", key: "Message", width: 40 },
      { header: "Submitted At", key: "SubmittedAt", width: 20 },
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF667eea" },
    };

    // Add data rows
    worksheet.addRows(data);

    // Auto-fit columns
    worksheet.columns.forEach((col) => {
      col.alignment = { wrapText: true };
    });

    // Generate file
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="initial-enquiries-${Date.now()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export Excel file",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
