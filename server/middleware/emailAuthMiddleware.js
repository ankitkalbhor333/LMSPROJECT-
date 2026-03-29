import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to verify JWT token and attach user to request
 * Usage: app.use(protect) or router.use(protect)
 */
export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

/**
 * Middleware to verify email before accessing certain features
 * Applied to routes that require email verification
 * Usage: router.post('/protected-route', emailVerified, controller)
 */
export const emailVerified = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login first'
      });
    }

    if (!req.user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified',
        requiresVerification: true,
        email: req.user.email
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking email verification',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user is admin
 * Usage: router.delete('/admin-route', protect, adminOnly, controller)
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  res.status(403).json({
    success: false,
    message: 'Access denied. Admin only.'
  });
};

/**
 * Middleware to check if user is teacher
 * Usage: router.post('/create-course', protect, teacherOnly, controller)
 */
export const teacherOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    return next();
  }

  res.status(403).json({
    success: false,
    message: 'Access denied. Teacher only.'
  });
};

/**
 * Middleware for optional authentication
 * Attaches user to request if token is valid, but doesn't fail if no token
 * Usage: router.get('/public-with-optional-auth', optionalAuth, controller)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};
