import Contact from "../models/Contact.js";
import { validateContact } from "../utils/formValidation.js";
import nodemailer from "nodemailer";

/**
 * Initialize Nodemailer transporter for sending emails
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email notification to admin
 * @param {Object} contactData - Contact form data
 */
const sendAdminEmailNotification = async (contactData) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "ankitkalbhor3@gmail.com";
    
    // HTML email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; color: #666;">
              <strong style="color: #333;">Full Name:</strong> ${contactData.fullName}
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; color: #666;">
              <strong style="color: #333;">Email:</strong> <a href="mailto:${contactData.email}" style="color: #667eea;">${contactData.email}</a>
            </p>
          </div>
          
          ${
            contactData.phoneNumber
              ? `
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; color: #666;">
              <strong style="color: #333;">Phone:</strong> ${contactData.phoneNumber}
            </p>
          </div>
          `
              : ""
          }
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; color: #666;">
              <strong style="color: #333;">Subject:</strong> ${contactData.subject}
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; color: #666;">
              <strong style="color: #333;">Message:</strong>
            </p>
            <div style="background: white; padding: 15px; border-left: 4px solid #667eea; color: #333; line-height: 1.6;">
              ${contactData.message.replace(/\n/g, "<br>")}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
            <p style="margin: 5px 0;">Submitted at: ${new Date(contactData.createdAt).toLocaleString()}</p>
            <p style="margin: 5px 0;">IP Address: ${contactData.ipAddress || "Not available"}</p>
          </div>
        </div>
        
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
          <p style="margin: 0;">This is an automated message. Please respond directly to the sender's email address.</p>
        </div>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `New Contact Form: ${contactData.subject}`,
      html: htmlContent,
      text: `From: ${contactData.fullName}\nEmail: ${contactData.email}\nPhone: ${contactData.phoneNumber || "Not provided"}\nSubject: ${contactData.subject}\n\nMessage:\n${contactData.message}`,
      replyTo: contactData.email,
    });

    console.log("✅ Admin notification email sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Error sending admin email:", error);
    // Don't throw error - email failure shouldn't block form submission
    return false;
  }
};

/**
 * ========================================
 * POST /api/contact
 * Submit a contact form
 * ========================================
 */
export const submitContact = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, subject, message } = req.body;

    // Validate input
    const { isValid, errors } = validateContact(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Create new contact record
    const newContact = new Contact({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber ? phoneNumber.replace(/\D/g, "") : null,
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Save to database
    await newContact.save();

    // Send email notification to admin (async, don't wait for it)
    sendAdminEmailNotification(newContact).catch((error) => {
      console.error("Email notification failed:", error);
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
      contactId: newContact._id,
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit contact form. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * GET /api/contact
 * Get all contact messages (Admin only)
 * ========================================
 */
export const getAllContacts = async (req, res) => {
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
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Contact.countDocuments(filter);

    // Get paginated results
    const contacts = await Contact.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * GET /api/contact/:id
 * Get single contact message by ID
 * ========================================
 */
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    // Mark as read
    contact.status = "read";
    await contact.save();

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * PATCH /api/contact/:id
 * Update contact status and admin response (Admin only)
 * ========================================
 */
export const updateContact = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    // Validate status
    const validStatuses = ["new", "read", "responded", "archived"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Update contact
    const updateData = {};
    if (status) updateData.status = status;
    if (adminResponse) {
      updateData.adminResponse = adminResponse;
      updateData.respondedAt = new Date();
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    // TODO: Send reply email to customer
    // sendCustomerReplyEmail(contact);

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * DELETE /api/contact/:id
 * Delete contact message (Admin only)
 * ========================================
 */
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ========================================
 * GET /api/contact/stats
 * Get contact statistics (Admin only)
 * ========================================
 */
export const getContactStats = async (req, res) => {
  try {
    const stats = await Contact.aggregate([
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

    // Get unread count
    const unreadCount = await Contact.countDocuments({
      status: "new",
    });

    res.json({
      success: true,
      data: {
        statusBreakdown: formattedStats,
        unreadCount,
        totalMessages: Object.values(formattedStats).reduce((a, b) => a + b, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching contact stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
