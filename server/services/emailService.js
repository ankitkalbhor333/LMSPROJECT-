import { sendEmail, getEmailUser, getEmailPass, getFromAddress } from '../utils/sendEmail.js';
import { renderEmailHtml } from '../emailTemplates/EmailTemplate.js';

const provider = process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : 'smtp');
const fromAddress = getFromAddress();

console.log('📧 Email Configuration:');
console.log(`   - Service: ${provider.toUpperCase()}`);
console.log(`   - Sender: ${fromAddress ? '✓ Set' : '✗ Missing'}`);

if (provider === 'resend') {
  const hasKey = !!process.env.RESEND_API_KEY;
  console.log(`   - Resend API Key: ${hasKey ? '✓ Set' : '✗ Missing'}`);
  if (hasKey && fromAddress) {
    console.log('✅ Resend email service is configured');
  } else {
    console.error('❌ Resend email service is not fully configured. Set RESEND_API_KEY and RESEND_FROM/EMAIL_FROM in .env.');
  }
} else {
  const SMTP_USER = getEmailUser();
  console.log(`   - SMTP user: ${SMTP_USER ? '✓ Set' : '✗ Missing'}`);
  console.log(`   - SMTP password: ${getEmailPass() ? '✓ Set' : '✗ Missing'}`);
  if (SMTP_USER && getEmailPass() && fromAddress) {
    console.log('✅ SMTP email service is configured');
  } else {
    console.error('❌ SMTP email service is not fully configured. Set EMAIL_USER and EMAIL_PASSWORD in .env.');
  }
}

const buildHtmlEmail = (title, description, buttonText, actionLink, footerText) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">${title}</h2>
    <p style="font-size: 16px; color: #555;">${description}</p>

    <div style="margin: 30px 0;">
      <a href="${actionLink}" 
         style="display: inline-block; padding: 12px 30px; background-color: #007bff; 
                color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
        ${buttonText}
      </a>
    </div>

    <p style="font-size: 14px; color: #888;">
      Or copy and paste this link in your browser:
      <br/>
      <small>${actionLink}</small>
    </p>

    <p style="font-size: 12px; color: #bbb; margin-top: 30px;">
      ${footerText}
    </p>
  </div>
`;

export const sendVerificationEmail = async (email, verificationLink) => {
  try {
    console.log(`📨 Sending verification email to: ${email}`);

    const fromEmail = getFromAddress();
    if (!fromEmail) {
      throw new Error('Email sender address is missing. Set EMAIL_FROM, SENDGRID_FROM_EMAIL, SMTP_FROM, or ADMIN_EMAIL in the environment.');
    }

    const subject = 'Email Verification - Coaching Website';
    const html = renderEmailHtml({
      title: 'Welcome to Coaching Website!',
      description: 'Thank you for signing up. Please verify your email address to complete your registration.',
      buttonText: 'Verify Email',
      actionLink: verificationLink,
      footerText: "This link will expire in 24 hours. If you didn't sign up for this account, please ignore this email.",
      firstName: ''
    });

    await sendEmail(email, subject, html);
    console.log('✅ Verification email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    console.error('   Full error:', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    console.log(`📨 Sending password reset email to: ${email}`);

    const fromEmail = getFromAddress();
    if (!fromEmail) {
      throw new Error('Email sender address is missing. Set EMAIL_FROM, SENDGRID_FROM_EMAIL, SMTP_FROM, or ADMIN_EMAIL in the environment.');
    }

    const subject = 'Password Reset - Coaching Website';
    const html = renderEmailHtml({
      title: 'Reset Your Password',
      description: 'You requested a password reset. Click the link below to create a new password.',
      buttonText: 'Reset Password',
      actionLink: resetLink,
      footerText: "This link will expire in 1 hour. If you didn't request this, please ignore this email.",
      firstName: ''
    });

    await sendEmail(email, subject, html);
    console.log('✅ Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    console.error('   Full error:', error);
    throw error;
  }
};