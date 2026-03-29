/**
 * Enrollment Context
 * 
 * Global state management for enrolled courses
 * - Stores user's enrolled courses
 * - Manages loading and error states
 * - Provides methods to refresh enrollments
 */

import React, { createContext, useState, useEffect, useCallback } from "react";
import { enrollmentAPI } from "../utils/enrollmentAPI";

export const EnrollmentContext = createContext();

export const EnrollmentProvider = ({ children }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrollmentMap, setEnrollmentMap] = useState({}); // For O(1) access checks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Fetch enrolled courses from API
   */
  const fetchEnrolledCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔄 Fetching enrolled courses...");
      // Fetch both 'active' and 'completed' enrollments
      const data = await enrollmentAPI.getMyEnrolledCourses({ status: "all" });
      
      console.log("✅ Enrolled courses fetched:", data);
      setEnrolledCourses(data);
      
      // Build a map for O(1) access checking
      const map = {};
      data.forEach(enrollment => {
        const courseId = enrollment.courseId?._id || enrollment.courseId;
        if (courseId) {
          map[courseId] = enrollment;
        }
      });
      setEnrollmentMap(map);
      
      return data;
    } catch (err) {
      console.error("❌ Failed to fetch enrolled courses:", err);
      setError(err.message || "Failed to load enrollments");
      return [];
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  /**
   * Initialize enrollments on mount
   */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isInitialized) {
      fetchEnrolledCourses();
    }
  }, [fetchEnrolledCourses, isInitialized]);

  /**
   * Check if user has access to a course
   * @param {string} courseId - The course ID to check
   * @returns {boolean} True if user is enrolled in the course
   */
  const hasAccessToCourse = useCallback((courseId) => {
    return courseId in enrollmentMap;
  }, [enrollmentMap]);

  /**
   * Get enrollment details for a course
   * @param {string} courseId - The course ID
   * @returns {Object|null} Enrollment object or null
   */
  const getEnrollment = useCallback((courseId) => {
    return enrollmentMap[courseId] || null;
  }, [enrollmentMap]);

  /**
   * Get just the course IDs for quick access checks
   * @returns {Array} Array of enrolled course IDs
   */
  const getCourseIds = useCallback(() => {
    return Object.keys(enrollmentMap);
  }, [enrollmentMap]);

  /**
   * Refresh enrollments (useful after purchase)
   */
  const refreshEnrollments = useCallback(() => {
    return fetchEnrolledCourses();
  }, [fetchEnrolledCourses]);

  /**
   * Add a newly enrolled course to local state
   * (Useful for optimistic updates after purchase)
   */
  const addEnrollment = useCallback((enrollment) => {
    setEnrolledCourses(prev => [...prev, enrollment]);
    if (enrollment.courseId) {
      const courseId = enrollment.courseId._id || enrollment.courseId;
      setEnrollmentMap(prev => ({
        ...prev,
        [courseId]: enrollment
      }));
    }
  }, []);

  /**
   * Remove enrollment from local state
   * (Useful when refunding)
   */
  const removeEnrollment = useCallback((courseId) => {
    setEnrolledCourses(prev => 
      prev.filter(e => (e.courseId?._id || e.courseId) !== courseId)
    );
    setEnrollmentMap(prev => {
      const newMap = { ...prev };
      delete newMap[courseId];
      return newMap;
    });
  }, []);

  const value = {
    // State
    enrolledCourses,
    enrollmentMap,
    loading,
    error,
    isInitialized,
    
    // Methods
    hasAccessToCourse,
    getEnrollment,
    getCourseIds,
    refreshEnrollments,
    addEnrollment,
    removeEnrollment,
    fetchEnrolledCourses
  };

  return (
    <EnrollmentContext.Provider value={value}>
      {children}
    </EnrollmentContext.Provider>
  );
};

export default EnrollmentContext;
