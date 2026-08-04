import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';
import { getApiUrl } from '../../utils/api.jsx';
import './AuthStyles.css';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('enter-email'); // 'enter-email' or 'verify'

  useEffect(() => {
    // Check if verification link was clicked
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (token && emailParam) {
      // Auto-verify with token from email link
      verifyEmailWithToken(emailParam, token);
    } else {
      // Get email from localStorage or ask user to enter
      const storedEmail = localStorage.getItem('verificationEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        setStep('verify');
      }
    }
  }, [searchParams]);

  const verifyEmailWithToken = async (userEmail, token) => {
    setVerifying(true);
    try {
      const response = await axios.post(
        `${getApiUrl()}/api/auth/email/verify`,
        {
          email: userEmail,
          token: token,
        }
      );

      if (response.data.success) {
        toast.success('Email verified successfully!');
        localStorage.removeItem('verificationEmail');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Verification failed';
      toast.error(errorMessage);
      setEmail(userEmail);
      setStep('verify');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${getApiUrl()}/api/auth/email/resend-verification`,
        {
          email: email.trim().toLowerCase(),
        }
      );

      if (response.data.success) {
        toast.success('Verification email sent! Check your inbox.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend email';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="verification-spinner">
            <div className="spinner"></div>
            <h2>Verifying your email...</h2>
            <p>Please wait while we confirm your email address.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Verify Your Email</h1>
        <p className="auth-subtitle">Confirm your email address to complete registration</p>

        {step === 'enter-email' ? (
          // Step 1: Enter Email
          <div className="verify-section">
            <div className="info-box">
              <h3>Enter Your Email</h3>
              <p>We need your email address to send the verification link</p>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <button
              onClick={() => {
                if (!email.trim()) {
                  toast.error('Please enter your email');
                  return;
                }
                setStep('verify');
              }}
              className="auth-button"
            >
              Continue
            </button>
          </div>
        ) : (
          // Step 2: Verify Email
          <div className="verify-section">
            <div className="info-box">
              <h3>Check Your Email</h3>
              <p>We've sent a verification link to:</p>
              <p className="email-display">{email}</p>
            </div>

            <div className="verification-steps">
              <ol>
                <li>Open your email inbox</li>
                <li>Find the email from us with subject "Verify Your Email"</li>
                <li>Click the verification link in the email</li>
                <li>You'll be redirected to login automatically</li>
              </ol>
            </div>

            <div className="resend-section">
              <p>Didn't receive the email?</p>
              <button
                onClick={handleResendEmail}
                disabled={loading}
                className="resend-button"
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>

            <div className="verification-info">
              <p>💡 <strong>Tip:</strong> Check your spam/junk folder if you don't see the email</p>
              <p>🔒 Verification links expire in 24 hours</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
