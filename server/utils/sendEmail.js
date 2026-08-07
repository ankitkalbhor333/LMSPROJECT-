// Resend-only email utility

/**
 * Email Service
 * Sends emails using SMTP/nodemailer only.
 */

export const getEmailUser = () => process.env.EMAIL_USER || process.env.ADMIN_EMAIL || '';

export const getEmailPass = () => process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || '';

export const getFromAddress = () => process.env.RESEND_FROM || process.env.EMAIL_FROM || process.env.ADMIN_EMAIL || '';

export const sendEmail = async (to, subject, html) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('No Resend API key configured. Set RESEND_API_KEY in env');
  }

  const from = getFromAddress();
  const payload = { from, to, subject, html };

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const bodyText = await resp.text().catch(() => '');
    const err = new Error(`Resend API error ${resp.status}: ${bodyText}`);
    console.error('❌ Resend send error:', err);
    throw err;
  }

  const data = await resp.json().catch(() => ({}));
  console.log('✅ Resend email sent:', data);
  return { success: true, message: 'Email sent via Resend', info: data };
};