import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";
import { getEmailUser, getEmailPass } from "../utils/sendEmail.js";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

const getFrontendUrl = () =>
  process.env.FRONTEND_URL || 'https://brsaina.in';

// Generate secure token for email verification
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash token for storage
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate JWT token
const generateJWT = (userId) => {
  return jwt.sign(
    { id: userId, type: 'access' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

/**
 * @desc    Register user with email
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerWithEmail = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate password strength
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8-64 characters with uppercase, lowercase, number, and special character',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered. Please log in or use another email.',
        });
      }

      const verificationToken = generateVerificationToken();
      const hashedToken = hashToken(verificationToken);
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      existingUser.emailVerificationToken = hashedToken;
      existingUser.emailVerificationTokenExpiry = tokenExpiry;
      await existingUser.save();

      const frontendURL = getFrontendUrl();
      const verificationLink = `${frontendURL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
        email.toLowerCase()
      )}`;

      try {
        await sendVerificationEmail(email.toLowerCase(), verificationLink);
      } catch (emailError) {
        console.error('❌ Resend verification email failed:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again later.',
          error: emailError.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'This email is already registered but not verified. A new verification email has been sent.',
        email: email.toLowerCase(),
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const hashedToken = hashToken(verificationToken);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      emailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: tokenExpiry,
    });

    // Generate verification link
    const frontendURL = getFrontendUrl();
    const verificationLink = `${frontendURL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      email.toLowerCase()
    )}`;

    // Send verification email
    try {
      await sendVerificationEmail(email.toLowerCase(), verificationLink);
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Verification email sending failed:', emailError);
      await User.deleteOne({ _id: user._id }).catch((deleteErr) => {
        console.error('❌ Failed to delete user after email send failure:', deleteErr);
      });
      return res.status(500).json({
        success: false,
        message: 'Registration failed because the verification email could not be sent. Please try again later.',
        error: emailError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      email: email.toLowerCase(),
      verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined, // Only expose in dev
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify email with token
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Token and email are required',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. You can now log in.',
      });
    }

    // Verify token
    const hashedToken = hashToken(token);
    if (user.emailVerificationToken !== hashedToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token',
      });
    }

    // Check token expiry
    if (new Date() > user.emailVerificationTokenExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new one.',
        requiresResend: true,
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiry = null;
    await user.save();

    const token = generateJWT(user._id);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You are now logged in.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message,
    });
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const hashedToken = hashToken(verificationToken);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = tokenExpiry;
    await user.save();

    // Send new verification email
    const frontendURL = getFrontendUrl();
    const verificationLink = `${frontendURL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      email.toLowerCase()
    )}`;

    try {
      await sendVerificationEmail(email.toLowerCase(), verificationLink);
    } catch (emailError) {
      console.error('❌ Resend verification email failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to resend verification email. Please try again later.',
        error: emailError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message,
    });
  }
};

/**
 * @desc    Login with email and password
 * @route   POST /api/auth/login-email
 * @access  Public
 */
export const loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        requiresVerification: true,
        email: email.toLowerCase(),
      });
    }

    if (user.emailLockUntil && new Date() < user.emailLockUntil) {
      const remainingTime = Math.ceil((user.emailLockUntil - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      user.emailLoginAttempts = (user.emailLoginAttempts || 0) + 1;

      if (user.emailLoginAttempts >= 5) {
        user.emailLockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${Math.max(0, 5 - user.emailLoginAttempts)} attempts remaining.`,
      });
    }

    user.emailLoginAttempts = 0;
    user.emailLockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateJWT(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.',
      });
    }

    // Allow password reset regardless of email verification status.
    // Some users may lose access before verifying; send reset link anyway.
    if (!user.emailVerified) {
      console.warn(`User ${email.toLowerCase()} requested password reset but email is not verified. Sending reset link anyway.`);
    }

    // Generate reset token
    const resetToken = generateVerificationToken();
    const hashedToken = hashToken(resetToken);
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = hashedToken;
    user.passwordResetTokenExpiry = tokenExpiry;
    await user.save();

    // Send reset email
    const frontendURL = getFrontendUrl();
    const resetLink = `${frontendURL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email.toLowerCase()
    )}`;

    try {
      await sendPasswordResetEmail(email.toLowerCase(), resetLink);
    } catch (emailError) {
      console.error('❌ Password reset email sending failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
        error: emailError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, resetToken, email, newPassword, confirmPassword } = req.body || {};
    const effectiveToken = token || resetToken;

    if (!effectiveToken || !email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8-64 characters with uppercase, lowercase, number, and special character',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify token
    const hashedToken = hashToken(effectiveToken);
    if (user.passwordResetToken !== hashedToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token',
      });
    }

    // Check token expiry
    if (new Date() > user.passwordResetTokenExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = null;
    user.passwordResetTokenExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (requires JWT token)
 */
export const getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by protect middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    // Fetch fresh user data from database
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Test email service (Development only)
 * @route   POST /api/auth/test-email
 * @access  Public (Development only)
 */
export const testEmailService = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is not available in production',
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    console.log(`\n🔧 Testing email service for: ${email}`);
    console.log(`📧 Email Configuration:`);
    console.log(`   - Service: Nodemailer (SMTP)`);
    console.log(`   - SMTP User: ${getEmailUser() || '✗ Missing'}`);
    console.log(`   - SMTP Password: ${getEmailPass() ? '✓ Set' : '✗ Missing'}`);

    const testLink = `${getFrontendUrl()}/verify-email?token=test&email=${encodeURIComponent(email)}`;
    await sendVerificationEmail(email, testLink);

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully!',
      details: {
        recipient: email,
        service: process.env.EMAIL_SERVICE,
        user: getEmailUser(),
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
      },
    });
  } catch (error) {
    console.error('❌ Email test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      details: {
        service: process.env.EMAIL_SERVICE,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: getEmailUser(),
      },
    });
  }
};

/**
 * @desc    Manually verify user email (Development/Admin only)
 * @route   POST /api/auth/manual-verify
 * @access  Public (Development only)
 */
export const manualVerifyEmail = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is not available in production',
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiry = null;
    await user.save();

    console.log(`✅ Manually verified email for: ${email}`);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Manual verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message,
    });
  }
};
