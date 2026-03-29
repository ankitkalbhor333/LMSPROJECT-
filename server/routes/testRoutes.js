import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  createTest,
  getTestById,
  submitTest,
  getMyResults,
  getAllResults,
  getAllTests,
  updateTest,
  deleteTest,
} from "../controllers/testController.js";

const router = express.Router();

// Specific routes FIRST
router.post("/create", protect, adminOnly, createTest);
router.get("/list", protect, getAllTests);
router.get("/my-results", protect, getMyResults);
router.get("/all-results", protect, adminOnly, getAllResults);

// Generic routes LAST
router.get("/:id", protect, getTestById);
router.put("/:id", protect, adminOnly, updateTest);
router.delete("/:id", protect, adminOnly, deleteTest);
router.post("/submit/:id", protect, submitTest);

export default router;