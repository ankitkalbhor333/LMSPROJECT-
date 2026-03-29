import React, { useState, useCallback, useRef } from 'react';
import './Toast.css';

const Toast = React.forwardRef((props, ref) => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = toastIdRef.current++;
    const toast = { id, message, type };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  React.useImperativeHandle(ref, () => ({
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    info: (message, duration) => showToast(message, 'info', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    show: showToast,
    remove: removeToast,
  }), [showToast, removeToast]);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
          title="Click to dismiss"
        >
          <div className="toast-content">
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
          <div className="toast-progress"></div>
        </div>
      ))}
    </div>
  );
});

Toast.displayName = 'Toast';
export default Toast;
