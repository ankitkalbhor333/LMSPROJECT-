import express from "express";
import {
  getLiveClasses,
  getUpcomingLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  startLiveClass,
  endLiveClass,
  getLiveClassAttendance,
  getLiveClassRecording,
  getLiveClassAttendanceSummary,
  toggleLiveClassRecording,
  getClassJoinToken,
  joinLiveClass,
  leaveLiveClass,
} from "../controllers/liveClassController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/upcoming", protect, getUpcomingLiveClasses);

router.get("/", protect, getLiveClasses);
router.post("/", protect, createLiveClass);

router.get("/:id", protect, getLiveClassById);
router.put("/:id", protect, updateLiveClass);
router.delete("/:id", protect, deleteLiveClass);

router.post("/:id/start", protect, startLiveClass);
router.post("/:id/end", protect, endLiveClass);
router.post("/:id/join", protect, joinLiveClass);
router.post("/:id/leave", protect, leaveLiveClass);
router.post("/:id/token", protect, getClassJoinToken);
router.get("/:id/attendance", protect, getLiveClassAttendance);
router.get("/:id/attendance-summary", protect, getLiveClassAttendanceSummary);
router.get("/:id/recording", protect, getLiveClassRecording);
router.post("/:id/recording", protect, toggleLiveClassRecording);

export default router;
