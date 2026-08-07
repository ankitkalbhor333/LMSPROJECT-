import nodemailer from "nodemailer";

/**
 * Email Service
 * Sends emails using SMTP/nodemailer only.
 */

export const getEmailUser = () =>
  process.env.SMTP_USER || process.env.EMAIL_USER || process.env.ADMIN_EMAIL;

export const getEmailPass = () =>
  process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

export const getFromAddress = () =>
  process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.ADMIN_EMAIL || getEmailUser();

const isSmtpConfigured = () => Boolean(getEmailUser() && getEmailPass());

const createSmtpTransporter = () => {
  const transportConfig = {
    auth: {
      user: getEmailUser(),
      pass: getEmailPass(),
    },
  };

  const useGmail = process.env.EMAIL_SERVICE === "gmail" || (process.env.EMAIL_HOST || "").includes("gmail");
  if (useGmail) {
    transportConfig.service = "gmail";
  } else {
    transportConfig.host = process.env.EMAIL_HOST || "smtp.gmail.com";
    transportConfig.port = Number(process.env.EMAIL_PORT || 587);
    transportConfig.secure = String(process.env.EMAIL_SECURE).toLowerCase() === "true";
  }

  return nodemailer.createTransport(transportConfig);
};

const sendEmailWithSmtp = async (to, subject, html) => {
  const fromAddress = getFromAddress();
  if (!fromAddress) {
    throw new Error("No sender address configured for SMTP email delivery.");
  }

  console.log("📨 Sending email via SMTP:", { from: fromAddress, to, subject });
  const transporter = createSmtpTransporter();

  const mailOptions = {
    from: `"Coaching Platform" <${fromAddress}>`,
    to,
    subject,
    html,
    text: html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("✅ SMTP email delivered successfully to:", to, "messageId:", info.messageId);
  return { success: true, message: "Email sent successfully via SMTP", messageId: info.messageId };
};

export const sendEmail = async (to, subject, html) => {
  if (isSmtpConfigured()) {
    return sendEmailWithSmtp(to, subject, html);
  }

  throw new Error("No SMTP email provider configured. Set EMAIL_USER/EMAIL_PASSWORD for SMTP.");
};