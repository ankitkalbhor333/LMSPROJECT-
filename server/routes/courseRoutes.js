import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getCourseBuilder,
  getCoursePlayer
} from "../controllers/courseController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { uploadCourseThumbnail } from "../middleware/multer.js";

const router = express.Router();

// Admin only
router.post("/create", protect, adminOnly, uploadCourseThumbnail.single("thumbnail"), createCourse);

router.put("/:id", protect, adminOnly, uploadCourseThumbnail.single("thumbnail"), updateCourse);
router.delete("/:id", protect, adminOnly, deleteCourse);

// Public
router.post("/enroll/:id", protect, enrollCourse);
router.get("/", getCourses);
router.get("/builder/:courseId", getCourseBuilder);
router.get("/player/:courseId", getCoursePlayer);
router.get("/:id", getCourseById);

export default router;