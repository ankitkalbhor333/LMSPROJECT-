/**
 * Enrollment API Service
 * 
 * Handles all enrollment-related API calls
 * - Fetch user's enrolled courses
 * - Check course access
 * - Fetch enrollment details with progress
 */

import API from "./api";

// ============================================================
// FETCH ENROLLED COURSES FOR CURRENT USER
// ============================================================

export const enrollmentAPI = {
  /**
   * Get all courses enrolled by current user
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of enrollment objects with course details
   */
  getMyEnrolledCourses: async (options = {}) => {
    try {
      const { status = "active" } = options;
      const response = await API.get("/enrollment/my-courses", {
        params: { status }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      throw error;
    }
  },

  /**
   * Get all courses with status (active, completed, dropped)
   * @returns {Promise<Array>}
   */
  getAllMyEnrollments: async () => {
    try {
      const response = await API.get("/enrollment/my-enrollments");
      return response.data;
    } catch (error) {
      console.error("Error fetching all enrollments:", error);
      throw error;
    }
  },

  /**
   * Check if user has access to a specific course
   * @param {string} courseId - The course ID to check
   * @returns {Promise<Object>} Access details { hasAccess, enrollmentId, progressId }
   */
  checkCourseAccess: async (courseId) => {
    try {
      const response = await API.get(`/enrollment/check-access/${courseId}`);
      return response.data;
    } catch (error) {
      // If API fails, return false access
      console.error("Error checking course access:", error);
      return { hasAccess: false, reason: error.message };
    }
  },

  /**
   * Get enrollment details for a course
   * @param {string} courseId - The course ID
   * @returns {Promise<Object>} Enrollment with progress details
   */
  getEnrollmentDetails: async (courseId) => {
    try {
      const response = await API.get(`/enrollment/${courseId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching enrollment details:", error);
      throw error;
    }
  },

  /**
   * Get progress for a specific course
   * @param {string} courseId - The course ID
   * @returns {Promise<Object>} Progress object
   */
  getCourseProgress: async (courseId) => {
    try {
      const response = await API.get(`/enrollment/progress/${courseId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching course progress:", error);
      throw error;
    }
  },

  /**
   * Get enrollments for a specific student (Admin only)
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of enrollments with course details
   */
  getStudentEnrollments: async (userId) => {
    try {
      const response = await API.get(`/enrollment/admin/student/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching student enrollments:", error);
      throw error;
    }
  },

  /**
   * Get all enrollments for admin dashboard
   * @param {Object} options - Filter options
   * @returns {Promise<Array>}
   */
  getAllEnrollments: async (options = {}) => {
    try {
      const response = await API.get(`/enrollment/admin/all`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all enrollments:", error);
      throw error;
    }
  },

  /**
   * Try to fallback to old user.purchasedCourses if enrollment API fails
   * (Temporary for migration)
   * @param {Object} user - User object from context
   * @returns {Promise<Array>} Fallback courses array
   */
  getFallbackCourses: async (user) => {
    try {
      if (user?.purchasedCourses && Array.isArray(user.purchasedCourses)) {
        return user.purchasedCourses;
      }
      return [];
    } catch (error) {
      console.warn("Fallback to purchasedCourses failed:", error);
      return [];
    }
  },

  /**
   * Mark a lecture as complete
   * @param {string} courseId - The course ID
   * @param {string} lectureId - The lecture ID to mark complete
   * @returns {Promise<Object>} Response with updated progress
   */
  markLectureComplete: async (courseId, lectureId) => {
    try {
      const response = await API.post(
        `/enrollment/progress/${courseId}/complete-lecture`,
        { lectureId }
      );
      console.log("✅ Lecture marked complete:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error marking lecture complete:", error);
      throw error;
    }
  },

  /**
   * Update lecture watch progress (and auto-complete at 90%)
   * @param {string} courseId - The course ID
   * @param {string} lectureId - The lecture ID
   * @param {number} watchedPercentage - Percentage of lecture watched (0-100)
   * @returns {Promise<Object>} Response with updated progress
   */
  updateLectureProgress: async (courseId, lectureId, watchedPercentage) => {
    try {
      const response = await API.patch(
        `/enrollment/progress/${courseId}/lecture-progress/${lectureId}`,
        { watchedPercentage }
      );
      console.log(`📊 Lecture ${lectureId} progress updated: ${watchedPercentage}%`);
      return response.data;
    } catch (error) {
      console.error("Error updating lecture progress:", error);
      throw error;
    }
  },

  /**
   * Get all completed lectures for a course
   * @param {string} courseId - The course ID
   * @returns {Promise<Object>} Object with completedLectures array and details
   */
  getCompletedLectures: async (courseId) => {
    try {
      const response = await API.get(`/enrollment/progress/${courseId}/completed`);
      console.log("📚 Completed lectures loaded:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching completed lectures:", error);
      // Return empty progress on error
      return {
        completedLectures: [],
        completionDetails: [],
        lastWatchedLecture: null,
        progressPercentage: 0
      };
    }
  }
};

export default enrollmentAPI;
