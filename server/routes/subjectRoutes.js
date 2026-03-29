import express from "express";
import {
  createSubject,
  getSubjectsByCourse,
  getSubjectById,
  updateSubject,
  deleteSubject
} from "../controllers/subjectController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin only routes
router.post("/create", protect, adminOnly, createSubject);
router.put("/:id", protect, adminOnly, updateSubject);
router.delete("/:id", protect, adminOnly, deleteSubject);

// Public routes
router.get("/course/:courseId", getSubjectsByCourse);
router.get("/:id", getSubjectById);

export default router;
