import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';
import { getApiUrl } from '../../utils/api.jsx';
import './AuthStyles.css';
import { passwordRequirements, isStrongPassword } from '../../utils/validation.js';

export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Validate token on mount
  useEffect(() => {
    if (!token || !email) {
      toast.error('Invalid reset link. Please request a new one.');
      setTimeout(() => navigate('/forgot-password'), 2000);
      return;
    }

    // Token is typically validated when user submits the form
    // For security, we don't validate on the frontend
    setIsValidToken(true);
    setValidating(false);
  }, [token, email, navigate, toast]);

  // Password strength indicator
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough].filter(Boolean).length;

    if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 3) setPasswordStrength('fair');
    else if (strength <= 4) setPasswordStrength('good');
    else setPasswordStrength('strong');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      const reqs = passwordRequirements(value);
      setErrors((p) => ({ ...p, password: reqs.length ? reqs[0] : '' }));
    }
    if (name === 'confirmPassword') {
      setErrors((p) => ({ ...p, confirmPassword: value === formData.password ? '' : 'Passwords do not match' }));
    }

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const validateForm = () => {
    if (!formData.password) {
      toast.error('Please enter a new password');
      return false;
    }

    // Password strength requirements
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
    const isLongEnough = formData.password.length >= 8 && formData.password.length <= 64;

    if (!isLongEnough) {
      toast.error('Password must be 8-64 characters long');
      return false;
    }

    if (!hasUpperCase) {
      toast.error('Password must contain at least one uppercase letter');
      return false;
    }

    if (!hasLowerCase) {
      toast.error('Password must contain at least one lowercase letter');
      return false;
    }

    if (!hasNumber) {
      toast.error('Password must contain at least one number');
      return false;
    }

    if (!hasSpecialChar) {
      toast.error('Password must contain at least one special character (!@#$%^&*)');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const apiUrl = getApiUrl();
      const response = await axios.post(
        `${apiUrl}/api/auth/email/reset-password`,
        {
          email: email.trim().toLowerCase(),
          token,
          newPassword: formData.password,
          confirmPassword: formData.confirmPassword,
        }
      );

      if (response.data.success) {
        toast.success('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      toast.error(errorMessage);

      // If token is invalid/expired, redirect to forgot password
      if (error.response?.status === 400 || error.response?.status === 404) {
        setTimeout(() => {
          navigate('/forgot-password');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="verification-spinner">
            <div className="spinner"></div>
            <h2>Validating reset link...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Invalid Reset Link</h1>
          <p>This password reset link is invalid or has expired.</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="auth-button"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Reset Your Password</h1>
        <p className="auth-subtitle">Create a new password for your account</p>

        <form onSubmit={handleSubmit}>
          {/* New Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              New Password
              {passwordStrength && (
                <span className={`strength-indicator strength-${passwordStrength}`}>
                  {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                </span>
              )}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password (8-64 chars)"
              required
            />
            <p className="password-hint">
              Must contain: uppercase, lowercase, number, and special character (!@#$%)
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-info">
          <p>Make sure your new password is strong and different from your previous one.</p>
          <p>You will be redirected to the login page after resetting your password.</p>
        </div>
      </div>
    </div>
  );
}