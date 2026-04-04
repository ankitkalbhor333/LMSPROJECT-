/**
 * Updated ProtectedRoute with Course Access Control
 * 
 * Checks if user is authenticated AND has access to the course
 */

import { Navigate } from "react-router-dom";
import { useEnrollment } from "../hooks/useEnrollment";
import { useEffect, useState } from "react";
import { enrollmentAPI } from "../utils/enrollmentAPI";

const normalizeRole = (value) => (value || "").trim().toLowerCase();

const normalizeRoles = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeRole).filter(Boolean);
  }

  const single = normalizeRole(value);
  return single ? [single] : [];
};

const getRoleFromToken = (token) => {
  if (!token) {
    return "";
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return "";
    }

    const decodedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(decodedPayload));
    return normalizeRole(parsed?.role);
  } catch {
    return "";
  }
};

function ProtectedRoute({ children, courseId, role }) {
  const token = localStorage.getItem("token");
  const userRole =
    normalizeRole(localStorage.getItem("role")) || getRoleFromToken(token);
  const expectedRoles = normalizeRoles(role);
  const { hasAccessToCourse, isInitialized } = useEnrollment();
  const [accessVerified, setAccessVerified] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based protection
  if (expectedRoles.length > 0 && !expectedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // Check course access if courseId is provided
  useEffect(() => {
    if (courseId && isInitialized) {
      // First check local context
      const hasLocalAccess = hasAccessToCourse(courseId);
      
      if (hasLocalAccess) {
        setHasAccess(true);
        setAccessVerified(true);
        setLoading(false);
      } else {
        // If not in context, verify with API
        verifyAccess();
      }
    } else if (!courseId) {
      // No course check needed
      setAccessVerified(true);
      setLoading(false);
    }
  }, [courseId, isInitialized, hasAccessToCourse]);

  const verifyAccess = async () => {
    try {
      setLoading(true);
      const result = await enrollmentAPI.checkCourseAccess(courseId);
      
      if (result.hasAccess) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
      setAccessVerified(true);
    } catch (error) {
      console.error("Error verifying course access:", error);
      setHasAccess(false);
      setAccessVerified(true);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading || (courseId && !accessVerified)) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{
            fontSize: '24px',
            marginBottom: '10px'
          }}>⏳</div>
          <p>Verifying access...</p>
        </div>
      </div>
    );
  }

  // If course access is required but user doesn't have access
  if (courseId && !hasAccess) {
    return (
      <Navigate to={`/course/${courseId}/purchase`} replace />
    );
  }

  return children;
}

export default ProtectedRoute;