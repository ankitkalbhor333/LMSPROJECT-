/**
 * Bottom Navigation Component
 * 
 * Sticky bottom navigation with 4 main routes:
 * - Home (public)
 * - Courses (public)
 * - My Batches (protected - redirects to login if not authenticated)
 * - Profile (protected - redirects to login if not authenticated)
 * 
 * Shows/hides on specific pages and handles authentication checks
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNavigation.css';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuth();
    };
    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  // Hide navigation on certain pages (auth pages, admin pages)
  useEffect(() => {
    const hiddenPages = [
      '/login',
      '/register',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/admin',
      '/checkout',
      '/payment-success',
    ];

    const isHidden = hiddenPages.some(page =>
      location.pathname.startsWith(page)
    );

    setIsVisible(!isHidden);
  }, [location.pathname]);

  const handleNavigation = (path, requiresAuth = false) => {
    if (requiresAuth && !isAuthenticated) {
      // Save the intended destination
      sessionStorage.setItem('redirectAfterLogin', path);
      navigate('/login');
      return;
    }
    navigate(path);
  };

  if (!isVisible) {
    return null;
  }

  const navItems = [
    {
      id: 'home',
      icon: '🏠',
      label: 'Home',
      path: '/',
      requiresAuth: false,
    },
    {
      id: 'courses',
      icon: '📚',
      label: 'Courses',
      path: '/courses',
      requiresAuth: false,
    },
    {
      id: 'batches',
      icon: '🎯',
      label: 'My Batches',
      path: '/mybatches',
      requiresAuth: true,
    },
    {
      id: 'profile',
      icon: '👤',
      label: 'Profile',
      path: '/profile',
      requiresAuth: true,
    },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-navigation">
      <div className="bottom-nav-container">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path, item.requiresAuth)}
            title={item.label}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
