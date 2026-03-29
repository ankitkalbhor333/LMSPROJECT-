import express from "express";
import {
  getMyEnrolledCourses,
  getMyEnrollments,
  checkCourseAccess,
  getEnrollmentDetails,
  getCourseProgress,
  getStudentEnrollments,
  getAllEnrollments,
  getEnrollmentStats,
  markLectureComplete,
  updateLectureProgress,
  getCompletedLectures
} from "../controllers/enrollmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================================
// ADMIN ROUTES (Must come before generic :id routes)
// ============================================================

// Get all enrollments (admin)
router.get("/admin/all", protect, getAllEnrollments);

// Get enrollment statistics (admin)
router.get("/admin/stats", protect, getEnrollmentStats);

// Get enrollments for a specific student (admin)
router.get("/admin/student/:userId", protect, getStudentEnrollments);

// ============================================================
// PROGRESS ROUTES (CRUD for course progress)
// ============================================================

// Mark lecture as complete
router.post("/progress/:courseId/complete-lecture", protect, markLectureComplete);

// Update lecture watch progress (and auto-complete at 90%)
router.patch("/progress/:courseId/lecture-progress/:lectureId", protect, updateLectureProgress);

// Get all completed lectures for a course
router.get("/progress/:courseId/completed", protect, getCompletedLectures);

// Get course progress (existing endpoint - kept for compatibility)
router.get("/progress/:courseId", protect, getCourseProgress);

// ============================================================
// PUBLIC ROUTES (Authenticated Users)
// ============================================================

// Get current user's enrolled courses
router.get("/my-courses", protect, getMyEnrolledCourses);

// Get all enrollments for current user
router.get("/my-enrollments", protect, getMyEnrollments);

// Check if user has access to a course
router.get("/check-access/:courseId", protect, checkCourseAccess);

// Get enrollment details for a course (MUST BE LAST)
router.get("/:courseId", protect, getEnrollmentDetails);

export default router;
