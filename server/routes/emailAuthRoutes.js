import express from 'express';
import {
  registerWithEmail,
  verifyEmail,
  resendVerificationEmail,
  loginWithEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  testEmailService,
  manualVerifyEmail
} from '../controllers/emailAuthController.js';
import { protect } from '../middleware/emailAuthMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/email/register
 * @desc    Register a new user with email
 * @access  Public
 */
router.post('/register', registerWithEmail);

/**
 * @route   POST /api/auth/email/verify
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify', verifyEmail);

/**
 * @route   POST /api/auth/email/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', resendVerificationEmail);

/**
 * @route   POST /api/auth/email/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post('/login', loginWithEmail);

/**
 * @route   POST /api/auth/email/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/email/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (requires JWT token)
 */
router.get('/me', protect, getCurrentUser);

/**
 * @route   POST /api/auth/email/test-email
 * @desc    Test email service (Development only)
 * @access  Public
 */
router.post('/test-email', testEmailService);

/**
 * @route   POST /api/auth/email/manual-verify
 * @desc    Manually verify user email (Development only)
 * @access  Public
 */
router.post('/manual-verify', manualVerifyEmail);

export default router;
