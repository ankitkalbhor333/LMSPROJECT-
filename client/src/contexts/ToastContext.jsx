import React, { createContext, useContext, useRef } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children, toastRef: externalToastRef }) => {
  const internalToastRef = useRef();
  const toastRef = externalToastRef || internalToastRef;

  const value = {
    success: (message, duration) => toastRef.current?.success(message, duration),
    error: (message, duration) => toastRef.current?.error(message, duration),
    info: (message, duration) => toastRef.current?.info(message, duration),
    warning: (message, duration) => toastRef.current?.warning(message, duration),
    show: (message, type, duration) => toastRef.current?.show(message, type, duration),
    toastRef,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
