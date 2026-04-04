/**
 * Custom Hook: useEnrollment
 * 
 * Provides easy access to enrollment functionality
 * Usage: const { hasAccessToCourse, enrolledCourses } = useEnrollment();
 */

import { useContext } from "react";
import EnrollmentContext from "../contexts/EnrollmentContext";

export const useEnrollment = () => {
  const context = useContext(EnrollmentContext);
  
  if (!context) {
    throw new Error("useEnrollment must be used within EnrollmentProvider");
  }
  
  return context;
};

export default useEnrollment;
