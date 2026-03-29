import express from "express";
import {
  getMyResults,
  getAllResults,
  getLeaderboard,
  submitResult,
} from "../controllers/resultController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my", protect, getMyResults);
router.get("/all", protect, adminOnly, getAllResults);
router.post("/submit", protect, submitResult);
router.get("/leaderboard/:testId", protect, getLeaderboard);

export default router;