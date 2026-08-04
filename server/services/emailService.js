import { sendEmail, getEmailPass } from '../utils/sendEmail.js';

const EMAIL_USER = process.env.EMAIL_USER || process.env.ADMIN_EMAIL;

console.log('📧 Email Configuration:');
console.log('   - Service: Nodemailer (SMTP)');
console.log(`   - SMTP User: ${EMAIL_USER ? '✓ Set' : '✗ Missing'}`);
console.log(`   - SMTP Password: ${getEmailPass() ? '✓ Set' : '✗ Missing'}`);

if (EMAIL_USER && getEmailPass()) {
  console.log('✅ Nodemailer email service is configured');
} else {
  console.error('❌ Nodemailer email service is not fully configured. Set EMAIL_USER and EMAIL_PASS (or EMAIL_PASSWORD) in .env.');
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

    const fromEmail = EMAIL_USER || process.env.ADMIN_EMAIL;
    if (!fromEmail || !getEmailPass()) {
      throw new Error('SMTP email configuration is missing. Set EMAIL_USER and EMAIL_PASS (or EMAIL_PASSWORD) in the environment.');
    }

    const subject = 'Email Verification - Coaching Website';
    const html = buildHtmlEmail(
      'Welcome to Coaching Website!',
      'Thank you for signing up. Please verify your email address to complete your registration.',
      'Verify Email',
      verificationLink,
      'This link will expire in 24 hours. If you didn\'t sign up for this account, please ignore this email.'
    );

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

    const fromEmail = EMAIL_USER || process.env.ADMIN_EMAIL;
    if (!fromEmail || !getEmailPass()) {
      throw new Error('SMTP email configuration is missing. Set EMAIL_USER and EMAIL_PASS (or EMAIL_PASSWORD) in the environment.');
    }

    const subject = 'Password Reset - Coaching Website';
    const html = buildHtmlEmail(
      'Reset Your Password',
      'You requested a password reset. Click the link below to create a new password.',
      'Reset Password',
      resetLink,
      'This link will expire in 1 hour. If you didn\'t request this, please ignore this email.'
    );

    await sendEmail(email, subject, html);
    console.log('✅ Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    console.error('   Full error:', error);
    throw error;
  }
};