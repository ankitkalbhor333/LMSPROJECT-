import express from "express";
import {
  uploadNotes,
  getAllNotes,
  getNotesBySubject,
  getNoteById,
  updateNotes,
  deleteNotes,
  downloadNotes,
} from "../controllers/notesController.js";
import { uploadNotes as uploadNotesMiddleware } from "../middleware/multer.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/notes
 * @desc    Upload new notes (Admin only)
 * @access  Private
 */
router.post("/", protect, uploadNotesMiddleware.single("file"), uploadNotes);

/**
 * @route   GET /api/notes/subject/:subject
 * @desc    Get notes by subject
 * @access  Public
 */
router.get("/subject/:subject", getNotesBySubject);

/**
 * @route   GET /api/notes
 * @desc    Get all notes with optional filters
 * @access  Public
 */
router.get("/", getAllNotes);

/**
 * @route   PUT /api/notes/:id/download
 * @desc    Increment download count
 * @access  Public
 */
router.put("/:id/download", downloadNotes);

/**
 * @route   GET /api/notes/:id
 * @desc    Get single note by ID
 * @access  Public
 */
router.get("/:id", getNoteById);

/**
 * @route   PUT /api/notes/:id
 * @desc    Update note (Admin only)
 * @access  Private
 */
router.put("/:id", protect, uploadNotesMiddleware.single("file"), updateNotes);

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete note (Admin only)
 * @access  Private
 */
router.delete("/:id", protect, deleteNotes);

export default router;
