import nodemailer from "nodemailer";

/**
 * Email Service
 * Sends emails using Gmail SMTP service
 */

let transporter;

/**
 * Initialize email transporter
 * Must have EMAIL_USER and EMAIL_PASS in .env
 */
const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email credentials not configured in .env");
    }

    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
};

/**
 * Send Email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @returns {Promise<Object>} - Success message
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const mailer = getTransporter();
    
    const mailOptions = {
      from: `"Coaching Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await mailer.sendMail(mailOptions);
    console.log("✅ Email sent to:", to);
    return { success: true, message: "Email sent successfully" };

  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw err;
  }
};