import express from "express";
import {
  uploadMaterial,
  createMaterial,
  getMaterialsByLecture,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  downloadMaterial,
  getAllMaterials,
  addVimeoVideo,
} from "../controllers/materialController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { uploadMaterial as uploadMaterialMiddleware } from "../middleware/multer.js";

const router = express.Router();

// Admin only routes
router.post("/create", protect, adminOnly, createMaterial);
router.post(
  "/upload",
  protect,
  adminOnly,
  uploadMaterialMiddleware.single("file"),
  uploadMaterial
);
router.post(
  "/add-vimeo",
  protect,
  adminOnly,
  addVimeoVideo
);
router.put("/:id", protect, adminOnly, updateMaterial);
router.delete("/:id", protect, adminOnly, deleteMaterial);

// Public routes
router.get("/", getAllMaterials);
router.get("/lecture/:lectureId", getMaterialsByLecture);
router.get("/:id", getMaterialById);
router.put("/:id/download", downloadMaterial);

export default router;
