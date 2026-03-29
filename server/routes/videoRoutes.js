import express from "express";
import {
  uploadVideo,
  getAllVideos,
  getVideosByClass,
  getVideosByExam,
  getVideosBySubject,
  getVideoById,
  updateVideo,
  deleteVideo,
  searchVideos,
  addYoutubeToVideo,
  createYoutubeVideo,
} from "../controllers/videoController.js";
import { uploadVideos } from "../middleware/multer.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/videos
 * @desc    Upload new video (Admin only)
 * @access  Private
 */
router.post("/", protect, uploadVideos.single("file"), uploadVideo);

/**
 * @route   POST /api/videos/create-youtube
 * @desc    Create free material video with YouTube link
 * @access  Private
 */
router.post("/create-youtube", protect, createYoutubeVideo);

/**
 * @route   POST /api/videos/:id/youtube
 * @desc    Add YouTube video to free material
 * @access  Private
 */
router.post("/:id/youtube", protect, addYoutubeToVideo);

/**
 * @route   GET /api/videos/search/:query
 * @desc    Search videos by title, subject, or teacher
 * @access  Public
 */
router.get("/search/:query", searchVideos);

/**
 * @route   GET /api/videos/class/:className
 * @desc    Get videos by class
 * @access  Public
 */
router.get("/class/:className", getVideosByClass);

/**
 * @route   GET /api/videos/exam/:exam
 * @desc    Get videos by exam
 * @access  Public
 */
router.get("/exam/:exam", getVideosByExam);

/**
 * @route   GET /api/videos/subject/:subject
 * @desc    Get videos by subject
 * @access  Public
 */
router.get("/subject/:subject", getVideosBySubject);

/**
 * @route   GET /api/videos
 * @desc    Get all videos with optional filters
 * @access  Public
 */
router.get("/", getAllVideos);

/**
 * @route   GET /api/videos/:id
 * @desc    Get single video by ID
 * @access  Public
 */
router.get("/:id", getVideoById);

/**
 * @route   PUT /api/videos/:id
 * @desc    Update video (Admin only)
 * @access  Private
 */
router.put("/:id", protect, uploadVideos.single("file"), updateVideo);

/**
 * @route   DELETE /api/videos/:id
 * @desc    Delete video (Admin only)
 * @access  Private
 */
router.delete("/:id", protect, deleteVideo);

export default router;