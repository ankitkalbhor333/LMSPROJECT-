import express from "express";
import {
  createTest,
  getAllTests,
  getTestsBySubject,
  getTestById,
  updateTest,
  deleteTest,
  getTestForAttempt,
  submitFreeTest,
} from "../controllers/freetestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/freetests
 * @desc    Create/Upload new test (Admin only)
 * @access  Private
 */
router.post("/", protect, createTest);

/**
 * @route   GET /api/freetests/subject/:subject
 * @desc    Get tests by subject
 * @access  Public
 */
router.get("/subject/:subject", getTestsBySubject);

/**
 * @route   GET /api/freetests
 * @desc    Get all tests with optional filters
 * @access  Public
 */
router.get("/", getAllTests);

/**
 * @route   GET /api/freetests/:id/attempt
 * @desc    Get test for attempt (without answers)
 * @access  Public
 */
router.get("/:id/attempt", getTestForAttempt);

/**
 * @route   POST /api/freetests/:id/submit
 * @desc    Submit free test answers and get score
 * @access  Public
 */
router.post("/:id/submit", submitFreeTest);

/**
 * @route   GET /api/freetests/:id
 * @desc    Get single test by ID
 * @access  Public
 */
router.get("/:id", getTestById);

/**
 * @route   PUT /api/freetests/:id
 * @desc    Update test (Admin only)
 * @access  Private
 */
router.put("/:id", protect, updateTest);

/**
 * @route   DELETE /api/freetests/:id
 * @desc    Delete test (Admin only)
 * @access  Private
 */
router.delete("/:id", protect, deleteTest);

export default router;
