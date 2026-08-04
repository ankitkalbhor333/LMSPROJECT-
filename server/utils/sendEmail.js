import nodemailer from "nodemailer";

/**
 * Email Service
 * Sends emails using Gmail SMTP service
 */

let transporter;

const parseBool = (value) => String(value).toLowerCase() === "true";

export const getEmailUser = () =>
  process.env.EMAIL_USER || process.env.SMTP_USER || process.env.ADMIN_EMAIL;

export const getEmailPass = () =>
  process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

/**
 * Initialize email transporter
 * Must have EMAIL_USER or SMTP_USER, and EMAIL_PASS or SMTP_PASS in .env
 */
const getTransporter = () => {
  if (!transporter) {
    const emailUser = getEmailUser();
    const emailPass = getEmailPass();
    const smtpHost = process.env.SMTP_HOST || (() => {
      const domain = emailUser?.split("@")[1];
      if (!domain) return "smtp.gmail.com";
      return domain === "gmail.com" ? "smtp.gmail.com" : `smtp.${domain}`;
    })();
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = parseBool(process.env.SMTP_SECURE || "false");

    if (!emailUser || !emailPass) {
      console.warn("⚠️ Email credentials not configured in .env");
    }

    console.log("📧 Nodemailer SMTP configuration:");
    console.log(`   - host: ${smtpHost}`);
    console.log(`   - port: ${smtpPort}`);
    console.log(`   - secure: ${smtpSecure}`);
    console.log(`   - user: ${emailUser ? "✓ Set" : "✗ Missing"}`);
    console.log(`   - pass: ${emailPass ? "✓ Set" : "✗ Missing"}`);

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: parseBool(process.env.SMTP_REJECT_UNAUTHORIZED || "true"),
      },
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ SMTP verification failed:", error);
      } else {
        console.log("✅ SMTP transporter verified successfully");
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
      from: `"Coaching Platform" <${process.env.EMAIL_USER || process.env.ADMIN_EMAIL}>`,
      to,
      subject,
      html,
    };

    console.log("📨 Sending SMTP message with:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const info = await mailer.sendMail(mailOptions);
    console.log("✅ Email sent to:", to);
    console.log("   messageId:", info.messageId || info.response);
    return { success: true, message: "Email sent successfully" };

  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    console.error("   Full error:", err);
    if (err.response) {
      console.error("   SMTP response:", err.response);
    }
    throw err;
  }
};