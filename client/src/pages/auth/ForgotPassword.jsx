import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';
import './AuthStyles.css';
import { isValidEmail } from '../../utils/validation.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    console.log('ForgotPassword submit clicked', { email });

    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('ForgotPassword calling API URL:', `${apiUrl}/api/auth/email/forgot-password`);
      const response = await axios.post(
        `${apiUrl}/api/auth/email/forgot-password`,
        {
          email: email.trim().toLowerCase(),
        }
      );
      console.log('ForgotPassword API response:', response);

      if (response.data.success) {
        toast.success('Password reset link sent to your email!');
        setSubmitted(true);
      } else {
        const message = response.data?.message || 'Reset request did not succeed';
        console.error('ForgotPassword unexpected API response:', response.data);
        toast.error(message);
      }
    } catch (error) {
      console.error('ForgotPassword API error:', error);
      console.error('ForgotPassword response error data:', error.response?.data);
      console.error('ForgotPassword response error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset email';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="success-message">
            <h1>Check Your Email</h1>
            <p>We've sent a password reset link to:</p>
            <p className="email-display">{email}</p>

            <div className="reset-steps">
              <h3>What's next?</h3>
              <ol>
                <li>Open your email inbox</li>
                <li>Find the email from us with subject "Reset Your Password"</li>
                <li>Click the reset link in the email</li>
                <li>Create your new password</li>
                <li>Log in with your new password</li>
              </ol>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="auth-button"
            >
              Back to Login
            </button>

            <p className="reset-info">
              💡 <strong>Tip:</strong> Check your spam/junk folder<br/>
              🔒 Reset links expire in 1 hour
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Forgot Password</h1>
        <p className="auth-subtitle">We'll help you reset your password</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter the email associated with your account"
              required
            />
            <p className="help-text">
              Enter the email address you used to create your account
            </p>
          </div>

          <button
            type="submit"
            
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password?{' '}
          <Link to="/login" className="auth-link">
            Sign in here
          </Link>
        </p>

        <div className="auth-info">
          <p>We'll send you a secure link to reset your password. The link will expire in 1 hour.</p>
        </div>
      </div>
    </div>
  );
}
