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
  // Defaults and env overrides
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || (port === 465 ? "true" : "false")).toLowerCase() === "true";
  const family = Number(process.env.SMTP_FAMILY || 4);
  const connectionTimeout = Number(process.env.SMTP_CONN_TIMEOUT || 10000); // ms
  const greetingTimeout = Number(process.env.SMTP_GREETING_TIMEOUT || 10000); // ms
  const socketTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT || 10000); // ms

  const transportConfig = {
    host,
    port,
    secure,
    auth: {
      user: getEmailUser(),
      pass: getEmailPass(),
    },
    // Prefer IPv4 to avoid ENETUNREACH IPv6 issues on some hosts/networks
    family,
    // Timeouts to fail fast when SMTP is unreachable
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
  };

  // If explicitly using Gmail service, nodemailer can accept `service: 'gmail'`,
  // but specifying host/port/family/timeouts is more reliable on restricted hosts.
  if (process.env.EMAIL_SERVICE === "gmail") {
    transportConfig.service = "gmail";
  }

  console.log("📧 SMTP transport config:", {
    host: transportConfig.host,
    port: transportConfig.port,
    secure: transportConfig.secure,
    family: transportConfig.family,
    connectionTimeout: transportConfig.connectionTimeout,
  });

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