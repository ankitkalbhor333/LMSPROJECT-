import sgMail from "@sendgrid/mail";

/**
 * Email Service
 * Sends emails using SendGrid API for production delivery.
 */

export const getEmailUser = () =>
  process.env.SMTP_USER || process.env.EMAIL_USER || process.env.ADMIN_EMAIL;

export const getEmailPass = () =>
  process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

export const getFromAddress = () =>
  process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.ADMIN_EMAIL || getEmailUser();

const getPreferredProvider = () => "sendgrid";

/**
 * Send Email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @returns {Promise<Object>} - Success message
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const fromAddress = getFromAddress();

    if (!fromAddress) {
      throw new Error("No sender address configured for email delivery.");
    }

    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("Missing SENDGRID_API_KEY in environment.");
    }

    console.log("📨 Sending message via SendGrid API:", {
      from: fromAddress,
      to,
      subject,
    });

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to,
      from: fromAddress,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    };

    await sgMail.send(msg);
    console.log("✅ SendGrid email delivered successfully to:", to);
    return { success: true, message: "Email sent successfully via SendGrid" };
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    console.error("   Full error:", err);
    throw err;
  }
};