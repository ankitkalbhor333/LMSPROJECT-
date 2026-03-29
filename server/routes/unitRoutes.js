import express from "express";
import {
  createUnit,
  getUnitsByCourse,
  getUnitById,
  updateUnit,
  deleteUnit
} from "../controllers/unitController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin only routes
router.post("/create", protect, adminOnly, createUnit);
router.put("/:id", protect, adminOnly, updateUnit);
router.delete("/:id", protect, adminOnly, deleteUnit);

// Public routes
router.get("/course/:courseId", getUnitsByCourse);
router.get("/:id", getUnitById);

export default router;
