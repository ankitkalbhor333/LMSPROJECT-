import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Log email configuration for debugging
console.log('📧 Email Configuration:');
console.log(`   - Service: ${process.env.EMAIL_SERVICE}`);
console.log(`   - Host: ${process.env.EMAIL_HOST}`);
console.log(`   - Port: ${process.env.EMAIL_PORT}`);
console.log(`   - Secure: ${process.env.EMAIL_SECURE}`);
console.log(`   - User: ${process.env.EMAIL_USER}`);
console.log(`   - Password: ${process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ Missing'}`);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Test transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email transporter ready');
  }
});

// Send verification email
export const sendVerificationEmail = async (email, verificationLink) => {
  try {
    console.log(`📨 Sending verification email to: ${email}`);
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@coachingwebsite.com',
      to: email,
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

    console.log(`   From: ${mailOptions.from}`);
    console.log(`   To: ${mailOptions.to}`);
    console.log(`   Subject: ${mailOptions.subject}`);

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
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
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@coachingwebsite.com',
      to: email,
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
            Or copy and paste this link: <small>${resetLink}</small>
          </p>
          
          <p style="font-size: 12px; color: #bbb; margin-top: 30px;">
            This link will expire in 1 hour.
            <br/>
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Test email connection (optional, for debugging)
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✓ Email service connected successfully');
    return true;
  } catch (error) {
    console.error('✗ Email service connection failed:', error);
    return false;
  }
};

export default transporter;
