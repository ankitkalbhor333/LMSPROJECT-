import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';
import { getApiUrl } from '../../utils/api.jsx';
import './AuthStyles.css';

export default function Login({ isModal = false, onClose = null }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      const missingMessage = 'Please enter both email and password.';
      setFormError(missingMessage);
      toast.error(missingMessage);
      return;
    }

    setFormError('');
    setLoading(true);

    try {
      const response = await axios.post(`${getApiUrl()}/api/auth/email/login`, {
        email: trimmedEmail.toLowerCase(),
        password,
      });

      if (response.data && response.data.token) {
        const token = response.data.token;
        const user = response.data.user || {};

        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('role', user.role || 'student');
        localStorage.setItem('name', user.name || '');

        window.dispatchEvent(new Event('auth-changed'));

        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectPath);
          return;
        }

        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'teacher') navigate('/teacher/dashboard');
        else navigate('/mybatches');
      } else {
        const message = response.data?.message || 'Login failed';
        setFormError(message);
        toast.error(message);
      }
    } catch (error) {
      const backendMessage = error.response?.data?.message || '';
      const isWrongPassword = /password/i.test(backendMessage) || /password.*wrong|incorrect password|invalid email or password/i.test(error.message || '');
      const errorMessage = isWrongPassword
        ? 'Password is wrong. Please try again.'
        : backendMessage || error.message || 'Login failed';

      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <div className="auth-box">
      <h1>Sign in</h1>
      <p className="auth-subtitle">Sign in with your email and password</p>

      {formError && (
        <div className="auth-error" role="alert" aria-live="polite">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className={formError ? 'input-error' : ''}
          />
        </div>

        <div className="form-group password-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="Enter your password"
              required
              className={formError ? 'input-error' : ''}
            />
            <button
              type="button"
              className="show-password-btn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="auth-footer-row">
        <div className="remember-me">
          <label>
            <input type="checkbox" /> Remember me
          </label>
        </div>
        <div>
          <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
        </div>
      </div>

      <p className="auth-footer">
        Don't have an account?{' '}
        <Link to="/register" className="auth-link">Create one</Link>
      </p>
    </div>
  );

  if (isModal) {
    return (
      <div className="auth-modal-overlay" onClick={onClose || undefined}>
        <div className="auth-modal-panel" onClick={(e) => e.stopPropagation()}>
          {onClose && (
            <button
              type="button"
              className="auth-modal-close"
              onClick={onClose}
              aria-label="Close login"
            >
              ×
            </button>
          )}
          {loginForm}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {loginForm}
    </div>
  );
}