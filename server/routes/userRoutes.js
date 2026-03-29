import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  removeProfileAvatar,
  getAllStudents,
  // getMyCourses,
  // getStudentById,
} from "../controllers/userController.js";
import { uploadAvatar } from "../middleware/multer.js";

const router = express.Router();

// ✅ Specific routes FIRST (before /:id)
router.get("/profile", protect, getProfile);
// router.get("/my-courses", protect, getMyCourses);
router.get("/all", protect, adminOnly, getAllStudents);

// ⚠️ Generic routes LAST
router.put("/profile", protect, updateProfile);
router.put("/profile/avatar", protect, uploadAvatar.single("avatar"), uploadProfileAvatar);
router.delete("/profile/avatar", protect, removeProfileAvatar);
// router.get("/:id", protect, adminOnly, getStudentById);

export default router;

