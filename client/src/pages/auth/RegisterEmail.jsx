import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import API from '../../utils/api.jsx';
import './AuthStyles.css';
import { isValidEmail, passwordRequirements, isStrongPassword } from '../../utils/validation.js';

export default function RegisterEmail() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

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

    // Inline validation
    setErrors((prev) => {
      const copy = { ...prev };
      if (name === 'email') copy.email = isValidEmail(value) ? '' : 'Enter a valid email';
      if (name === 'password') {
        const reqs = passwordRequirements(value);
        copy.password = reqs.length ? reqs[0] : '';
      }
      if (name === 'confirmPassword') copy.confirmPassword = value === formData.password ? '' : 'Passwords do not match';
      if (name === 'name') copy.name = value.trim() ? '' : 'Name is required';
      return copy;
    });

    if (name === 'password') {
      checkPasswordStrength(value);
    }

    // Real-time password match check
    if (name === 'password' || name === 'confirmPassword') {
      const newPassword = name === 'password' ? value : formData.password;
      const newConfirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword;
      setPasswordMatch(newPassword === newConfirmPassword || newConfirmPassword === '');
    }
  };

  const validateForm = () => {
    // Name
    if (!formData.name.trim()) return false;
    // Email
    if (!isValidEmail(formData.email)) return false;
    // Password
    if (!isStrongPassword(formData.password)) return false;
    // Confirm
    if (formData.password !== formData.confirmPassword) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    // Final validation check
    if (!validateForm()) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    // Prevent multiple submissions
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Registering user');
      const response = await API.post('/auth/email/register', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      console.log('✅ Registration response:', response.data);

      // Check if registration was successful
      if (response.data && (response.data.success || response.status === 201)) {
        toast.success('Registration successful! Check your email to verify.');
        // Store email for reference on verification page
        localStorage.setItem('verificationEmail', formData.email.trim().toLowerCase());
        console.log('📧 Stored email:', formData.email.trim().toLowerCase());
        console.log('🔄 Redirecting to /verify-email...');
        // Small delay to ensure localStorage is set before navigation
        setTimeout(() => {
          navigate('/verify-email');
        }, 500);
      } else {
        toast.error(response.data?.message || 'Registration failed. Please try again.');
        console.error('❌ Unexpected response:', response.data);
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || error.message || 'Registration failed';

      if (errorData?.requiresVerificationResend) {
        toast.info(errorMessage);
        localStorage.setItem('verificationEmail', formData.email.trim().toLowerCase());
        navigate('/verify-email');
        return;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Sign up with your email</p>

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Field */}
                <div className="form-group">
                  <label htmlFor="password">
                    Password
                    {passwordStrength && (
                      <span className={`strength-indicator strength-${passwordStrength}`}>
                        {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                      </span>
                    )}
                  </label>
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password (8-64 chars)"
                      required
                    />
                    <button
                      type="button"
                      className="show-password-btn"
                      onClick={() => setShowPassword((s) => !s)}
                    >{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                  <p className="password-hint">
                    Must contain: uppercase, lowercase, number, and special character (!@#$%)
                  </p>
                </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className={!passwordMatch && formData.confirmPassword ? 'input-error' : ''}
                required
              />
              <button
                type="button"
                className="show-password-btn"
                onClick={() => setShowConfirm((s) => !s)}
              >{showConfirm ? 'Hide' : 'Show'}</button>
            </div>
            {!passwordMatch && formData.confirmPassword && (
              <p className="error-message">❌ Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !passwordMatch && formData.confirmPassword}
            className="auth-button"
          >
            {loading ? '⏳ Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in here</Link>
        </p>

        <p className="auth-footer">
          Forgot password?{' '}
          <Link to="/forgot-password" className="auth-link">Reset here</Link>
        </p>

        {/* Safety Info */}
        <div className="auth-info">
          <p>We'll send a verification link to your email. You must verify your email before you can log in.</p>
        </div>
      </div>
    </div>
  );
}
