import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

/**
 * Email Service
 * Sends emails using either SendGrid API or SMTP provider credentials.
 */

let transporter;

const parseBool = (value) => String(value).toLowerCase() === "true";

export const getEmailUser = () =>
  process.env.SMTP_USER || process.env.EMAIL_USER || process.env.ADMIN_EMAIL;

export const getEmailPass = () =>
  process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

export const getFromAddress = () =>
  process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.ADMIN_EMAIL || getEmailUser();

const getPreferredProvider = () => {
  const provider = String(process.env.EMAIL_PROVIDER || process.env.MAIL_PROVIDER || "").toLowerCase();
  if (provider === "sendgrid") return "sendgrid";
  if (provider === "smtp") return "smtp";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  return "smtp";
};

const getSendGridFromAddress = () =>
  process.env.SENDGRID_FROM_EMAIL || getFromAddress();

const buildSmtpTransportOptions = (smtpHost, smtpPort, smtpSecure, smtpRequireTls, smtpRejectUnauthorized, emailUser, emailPass) => ({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  requireTLS: smtpRequireTls,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  tls: {
    rejectUnauthorized: smtpRejectUnauthorized,
  },
});

/**
 * Initialize email transporter
 * Must have EMAIL_USER or SMTP_USER, and EMAIL_PASS or SMTP_PASS in .env
 */
const getTransporter = async () => {
  if (!transporter) {
    const emailUser = getEmailUser();
    const emailPass = getEmailPass();
    const smtpHost = process.env.SMTP_HOST || (() => {
      const domain = emailUser?.split("@")[1];
      if (!domain) return "smtp.gmail.com";
      if (domain === "gmail.com") return "smtp.gmail.com";
      if (domain.startsWith("smtp.")) return domain;
      return `smtp.${domain}`;
    })();
    const configuredPort = Number(process.env.SMTP_PORT || 2525);
    const smtpSecure = parseBool(process.env.SMTP_SECURE || "false");
    const smtpRequireTls = parseBool(process.env.SMTP_REQUIRE_TLS || "true");
    const smtpRejectUnauthorized = parseBool(process.env.SMTP_REJECT_UNAUTHORIZED || "true");

    const authSource = process.env.SMTP_USER
      ? "SMTP_USER"
      : process.env.EMAIL_USER
      ? "EMAIL_USER"
      : process.env.ADMIN_EMAIL
      ? "ADMIN_EMAIL"
      : "none";

    if (!emailUser || !emailPass) {
      throw new Error(
        "Missing SMTP credentials. Set SMTP_USER and SMTP_PASS (or EMAIL_USER and EMAIL_PASS / EMAIL_PASSWORD) in the environment."
      );
    }

    if (process.env.SMTP_HOST && !process.env.SMTP_USER && process.env.EMAIL_USER) {
      console.warn(
        "⚠️ SMTP_HOST is set but SMTP_USER is missing. Falling back to EMAIL_USER. For Brevo SMTP, set SMTP_USER and SMTP_PASS."
      );
    }

    const candidatePorts = [configuredPort, 587, 2525, 465].filter((port, index, values) => values.indexOf(port) === index);

    console.log("📧 Nodemailer SMTP configuration:");
    console.log(`   - host: ${smtpHost}`);
    console.log(`   - configured port: ${configuredPort}`);
    console.log(`   - secure: ${smtpSecure}`);
    console.log(`   - requireTLS: ${smtpRequireTls}`);
    console.log(`   - rejectUnauthorized: ${smtpRejectUnauthorized}`);
    console.log(`   - auth source: ${authSource}`);
    console.log(`   - user: ${emailUser ? "✓ Set" : "✗ Missing"}`);
    console.log(`   - pass: ${emailPass ? "✓ Set" : "✗ Missing"}`);

    const errors = [];

    for (const smtpPort of candidatePorts) {
      const secure = smtpPort === 465;
      const transport = nodemailer.createTransport(
        buildSmtpTransportOptions(smtpHost, smtpPort, secure, smtpRequireTls, smtpRejectUnauthorized, emailUser, emailPass)
      );

      try {
        await new Promise((resolve, reject) => {
          transport.verify((error) => {
            if (error) return reject(error);
            resolve();
          });
        });

        transporter = transport;
        console.log(`✅ SMTP transporter verified successfully on ${smtpHost}:${smtpPort}`);
        return transporter;
      } catch (error) {
        errors.push(error);
        console.warn(`⚠️ SMTP attempt failed on ${smtpHost}:${smtpPort}: ${error.message}`);
      }
    }

    throw new Error(`SMTP connection failed after trying ${candidatePorts.join(", ")}. Last error: ${errors.at(-1)?.message || "unknown"}`);
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
    const provider = getPreferredProvider();
    const fromAddress = provider === "sendgrid"
      ? getSendGridFromAddress()
      : getFromAddress();

    if (!fromAddress) {
      throw new Error("No sender address configured for email delivery.");
    }

    if (provider === "sendgrid" && process.env.SENDGRID_API_KEY) {
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
    }

    const mailer = await getTransporter();
    const mailOptions = {
      from: `"Coaching Platform" <${fromAddress}>`,
      replyTo: fromAddress,
      to,
      subject,
      html,
    };

    console.log("📨 Sending SMTP message with:", {
      from: mailOptions.from,
      replyTo: mailOptions.replyTo,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const info = await mailer.sendMail(mailOptions);
    console.log("✅ Email send attempt to:", to);
    console.log("   messageId:", info.messageId || info.response);
    console.log("   accepted:", info.accepted);
    console.log("   rejected:", info.rejected);
    console.log("   pending:", info.pending);

    if (!info.accepted || info.accepted.length === 0) {
      const failure = new Error(`SMTP provider accepted no recipients. rejected=${JSON.stringify(info.rejected)}`);
      console.error("❌ Email not accepted by SMTP provider:", failure.message);
      throw failure;
    }

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