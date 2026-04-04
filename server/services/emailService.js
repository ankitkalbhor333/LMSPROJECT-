import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Log email configuration for debugging
console.log('📧 Email Configuration:');
console.log(`   - Service: SendGrid`);
console.log(`   - API Key: ${process.env.SENDGRID_API_KEY ? '✓ Set' : '✗ Missing'}`);
console.log(`   - From Email: ${process.env.SENDGRID_FROM_EMAIL || 'noreply@coachingwebsite.com'}`);

// Test email connection on startup
if (process.env.SENDGRID_API_KEY) {
  console.log('✅ SendGrid email service initialized');
} else {
  console.error('❌ SendGrid API key is missing!');
}

// Send verification email
export const sendVerificationEmail = async (email, verificationLink) => {
  try {
    console.log(`📨 Sending verification email to: ${email}`);
    
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@coachingwebsite.com',
      subject: 'Email Verification - Coaching Website',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Coaching Website!</h2>
          <p style="font-size: 16px; color: #555;">Thank you for signing up. Please verify your email address to complete your registration.</p>
          
          <div style="margin: 30px 0;">
            <a href="${verificationLink}" 
               style="display: inline-block; padding: 12px 30px; background-color: #007bff; 
                      color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          
          <p style="font-size: 14px; color: #888;">
            Or copy and paste this link in your browser:
            <br/>
            <small>${verificationLink}</small>
          </p>
          
          <p style="font-size: 12px; color: #bbb; margin-top: 30px;">
            This link will expire in 24 hours.
            <br/>
            If you didn't sign up for this account, please ignore this email.
          </p>
        </div>
      `,
    };

    console.log(`   From: ${msg.from}`);
    console.log(`   To: ${msg.to}`);
    console.log(`   Subject: ${msg.subject}`);

    await sgMail.send(msg);
    console.log('✅ Verification email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    console.error('   Full error:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    console.log(`📨 Sending password reset email to: ${email}`);
    
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@coachingwebsite.com',
      subject: 'Password Reset - Coaching Website',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p style="font-size: 16px; color: #555;">You requested a password reset. Click the link below to create a new password.</p>
          
          <div style="margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; padding: 12px 30px; background-color: #28a745; 
                      color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #888;">
            Or copy and paste this link: <br/><small>${resetLink}</small>
          </p>
          
          <p style="font-size: 12px; color: #bbb; margin-top: 30px;">
            This link will expire in 1 hour.
            <br/>
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    };

    console.log(`   From: ${msg.from}`);
    console.log(`   To: ${msg.to}`);
    console.log(`   Subject: ${msg.subject}`);

    await sgMail.send(msg);
    console.log('✅ Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    console.error('   Full error:', error);
    throw new Error('Failed to send password reset email');
  }
};
