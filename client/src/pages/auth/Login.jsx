import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';
import './AuthStyles.css';

export default function Login() {
  return <EmailLogin />;
}

function EmailLogin() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (!formData.password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    setShowResendOption(false);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://lmsproject1-cuzs.onrender.com'}/api/auth/email/login`,
        {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }
      );

      if (response.data.success) {
        toast.success('Login successful!');
        
        // Store JWT token and user data
        const token = response.data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token); // Also store as authToken for consistency
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('role', response.data.user?.role || 'student');
        localStorage.setItem('name', response.data.user?.name || '');
        
        // Dispatch auth event for navbar sync
        window.dispatchEvent(new Event('auth-changed'));
        
        // Check if user has completed initial enquiry (for new users)
        // Admin users skip this requirement
        const userRole = response.data.user?.role;
        if (userRole !== 'admin') {
          try {
            const enquiryCheckResponse = await axios.get(
              `${import.meta.env.VITE_API_URL || 'https://lmsproject1-cuzs.onrender.com'}/api/enquiry/initial-status`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (enquiryCheckResponse.data?.success && !enquiryCheckResponse.data.data.enquirySubmitted) {
              // User hasn't submitted initial enquiry, redirect to form
              navigate('/initial-enquiry');
              return;
            }
          } catch (enquiryError) {
            console.warn('Error checking enquiry status:', enquiryError);
            // Continue with normal flow if check fails
          }
        }
        
        // Navigate based on user role
        if (userRole === 'admin') {
          navigate('/admin');
        } else {
          navigate('/mybatches');
        }
      }
    } catch (error) {
      const errorStatus = error.response?.status;
      const errorMessage = error.response?.data?.message || 'Login failed';

      // If email not verified (403)
      if (errorStatus === 403) {
        toast.warning(errorMessage);
        setShowResendOption(true);
        setResendEmail(formData.email.trim().toLowerCase());
      }
      // Account locked (429)
      else if (errorStatus === 429) {
        toast.error('Too many failed attempts. Please try again later.');
      }
      // Standard error
      else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) {
      toast.error('Email address not found');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://lmsproject1-cuzs.onrender.com'}/api/auth/email/resend-verification`,
        {
          email: resendEmail,
        }
      );

      if (response.data.success) {
        toast.success('Verification email sent! Check your inbox.');
        localStorage.setItem('verificationEmail', resendEmail);
        navigate('/verify-email');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend email';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in with your email</p>

        <form onSubmit={handleSubmit}>
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
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Email Not Verified Alert */}
        {showResendOption && (
          <div className="auth-info" style={{ marginTop: '20px' }}>
            <p><strong>⚠️ Email Not Verified</strong></p>
            <p>You need to verify your email before you can log in.</p>
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="resend-button"
              style={{ marginTop: '10px' }}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        {/* Links and Options */}
        <div style={{ marginTop: '25px' }}>
          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up here
            </Link>
          </p>

          <p className="auth-footer">
            <Link to="/forgot-password" className="auth-link">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}