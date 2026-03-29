import express from "express";
import {
  createLecture,
  getLecturesByUnit,
  getLectureById,
  updateLecture,
  deleteLecture,
  addYoutubeToLecture,
  uploadLectureVideo
} from "../controllers/lectureController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { uploadVideos } from "../middleware/multer.js";

const router = express.Router();

// Admin only routes
router.post("/create", protect, adminOnly, createLecture);
router.put("/:id", protect, adminOnly, updateLecture);
router.post("/:id/youtube", protect, adminOnly, addYoutubeToLecture);
router.post("/:id/video", protect, adminOnly, uploadVideos.single("file"), uploadLectureVideo);
router.delete("/:id", protect, adminOnly, deleteLecture);

// Public routes
router.get("/unit/:unitId", getLecturesByUnit);
router.get("/:id", getLectureById);

export default router;
